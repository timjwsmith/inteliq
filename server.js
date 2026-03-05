const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ANTHROPIC_API_KEY   = process.env.ANTHROPIC_API_KEY;
const COINBASE_API_KEY    = process.env.COINBASE_API_KEY    || "";
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET || "";
const COINSPOT_API_KEY    = process.env.COINSPOT_API_KEY    || "";
const COINSPOT_API_SECRET = process.env.COINSPOT_API_SECRET || "";
const FINNHUB_API_KEY     = process.env.FINNHUB_API_KEY     || "";
const FMP_API_KEY         = process.env.FMP_API_KEY         || "";

if (!ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

// ── Anthropic proxy ────────────────────────────────────────────────────────
app.post("/api/analyse", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// ── Live AUD/USD FX rate ───────────────────────────────────────────────────
let fxCache = { rate: 0.635, ts: 0 };

async function getLiveAUDUSD() {
  const now = Date.now();
  if (fxCache.rate && now - fxCache.ts < 15 * 60 * 1000) return fxCache.rate;
  try {
    const r = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/AUDUSD=X?interval=1d&range=1d", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const d = await r.json();
    const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price && price > 0) {
      fxCache = { rate: price, ts: now };
      console.log(`FX: AUD/USD = ${price}`);
      return price;
    }
  } catch (e) {
    console.error("FX fetch error:", e.message);
  }
  return fxCache.rate;
}

app.get("/api/fx/audusd", async (req, res) => {
  const rate = await getLiveAUDUSD();
  res.json({ rate, pair: "AUDUSD", ts: fxCache.ts });
});

// ── Coinbase Advanced Trade API ────────────────────────────────────────────
function coinbaseJWT(method, path) {
  const keySecret = COINBASE_API_SECRET.replace(/\\n/g, "\n");
  const host = "api.coinbase.com";
  const uri = `${method} ${host}${path}`;
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg:"ES256", kid:COINBASE_API_KEY, nonce })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub:COINBASE_API_KEY, iss:"cdp", nbf:timestamp, exp:timestamp+120, uri })).toString("base64url");
  const signingInput = `${header}.${payload}`;
  try {
    const sign = crypto.createSign("SHA256");
    sign.update(signingInput);
    return `${signingInput}.${sign.sign({ key: keySecret, dsaEncoding: "ieee-p1363" }, "base64url")}`;
  } catch (e) {
    console.error("Coinbase JWT sign error:", e.message);
    return null;
  }
}

app.get("/api/coinbase/balances", async (req, res) => {
  if (!COINBASE_API_KEY || !COINBASE_API_SECRET) {
    return res.status(503).json({ error: "Coinbase API keys not configured — add COINBASE_API_KEY and COINBASE_API_SECRET to .env" });
  }
  try {
    const portfoliosPath = "/api/v3/brokerage/portfolios";
    const jwt1 = coinbaseJWT("GET", portfoliosPath);
    if (!jwt1) return res.status(500).json({ error: "Failed to sign Coinbase request — check API key/secret format" });

    const pr = await fetch(`https://api.coinbase.com${portfoliosPath}`, {
      headers: { "Authorization": `Bearer ${jwt1}`, "Content-Type": "application/json" },
    });
    const portfoliosData = await pr.json();
    const portfolios = portfoliosData.portfolios || [];
    const defaultPortfolio = portfolios.find(p => p.type === "DEFAULT") || portfolios[0];
    if (!defaultPortfolio) return res.status(404).json({ error: "No Coinbase portfolio found" });

    const breakdownPath = `/api/v3/brokerage/portfolios/${defaultPortfolio.uuid}`;
    const jwt2 = coinbaseJWT("GET", breakdownPath);
    const br = await fetch(`https://api.coinbase.com${breakdownPath}`, {
      headers: { "Authorization": `Bearer ${jwt2}`, "Content-Type": "application/json" },
    });
    const breakdown = await br.json();
    const spotPositions = breakdown?.breakdown?.spot_positions || [];

    const stablecoins = ["USD", "USDC", "USDT", "DAI", "BUSD"];
    const holdings = spotPositions
      .filter(p => parseFloat(p.total_balance_crypto) > 0 && !stablecoins.includes(p.asset))
      .map(p => {
        const qty = parseFloat(p.total_balance_crypto);
        const costBasis = parseFloat(p.cost_basis?.value || 0);
        return {
          sym: p.asset, name: p.asset, qty,
          avg: qty > 0 ? costBasis / qty : 0,
          avgCurrency: "USD",
          sector: "Crypto", horizon: "Medium", priceType: "crypto", source: "coinbase",
        };
      });

    res.json({ holdings, lastSync: new Date().toISOString() });
  } catch (err) {
    console.error("Coinbase error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/coinbase/diag', async (req, res) => {
  try {
    // Check v3 AT accounts
    const p1 = '/api/v3/brokerage/accounts';
    const j1 = coinbaseJWT('GET', p1);
    const r1 = await fetch(`https://api.coinbase.com${p1}`, { headers: { Authorization: `Bearer ${j1}` } });
    const d1 = await r1.json();
    // Check portfolios
    const p2 = '/api/v3/brokerage/portfolios';
    const j2 = coinbaseJWT('GET', p2);
    const r2 = await fetch(`https://api.coinbase.com${p2}`, { headers: { Authorization: `Bearer ${j2}` } });
    const d2 = await r2.json();
    // Check a specific product
    async function checkProduct(pid) {
      const p = `/api/v3/brokerage/products/${pid}`;
      const j = coinbaseJWT('GET', p);
      const r = await fetch(`https://api.coinbase.com${p}`, { headers: { Authorization: `Bearer ${j}` } });
      const d = r.ok ? await r.json() : {};
      return { status: r.status, trading_disabled: d.trading_disabled, product_id: d.product_id };
    }
    res.json({
      at_accounts: (d1.accounts || []).filter(a => ['USD','AUD','USDC','USDT'].includes(a.currency)).map(a => ({ id:a.uuid, currency:a.currency, available:a.available_balance?.value, type:a.type })),
      portfolios: d2.portfolios || d2,
      'SOL-AUD': await checkProduct('SOL-AUD'),
      'SOL-USD': await checkProduct('SOL-USD'),
      'BTC-AUD': await checkProduct('BTC-AUD'),
      'BTC-USD': await checkProduct('BTC-USD'),
      'ETH-AUD': await checkProduct('ETH-AUD'),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/coinbase/usd-balance', async (req, res) => {
  try {
    // Use v3 brokerage accounts for fiat balances
    const path = '/api/v3/brokerage/accounts';
    const jwt = coinbaseJWT('GET', path);
    const r = await fetch(`https://api.coinbase.com${path}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    const data = await r.json();
    const accounts = data.accounts || [];
    let available = 0, availableAUD = 0, availableUSDC = 0;
    for (const acc of accounts) {
      if (acc.currency === 'USD')  available     += parseFloat(acc.available_balance?.value || 0);
      if (acc.currency === 'USDC') { available += parseFloat(acc.available_balance?.value || 0); availableUSDC += parseFloat(acc.available_balance?.value || 0); }
      if (acc.currency === 'AUD')  availableAUD  += parseFloat(acc.available_balance?.value || 0);
    }
    res.json({ available, availableAUD, availableUSDC });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/coinbase/order', async (req, res) => {
  const { sym: rawSym, side, quoteSize, baseSize, limitPrice, orderType, tradeCcy, audUsd } = req.body;
  // Strip any trailing currency code so "BTC-AUD" → "BTC", "BTC" stays "BTC"
  const sym = rawSym.replace(/-(?:AUD|USD|USDC|USDT|EUR|GBP|DAI|BUSD)$/i, '').toUpperCase();
  try {
    // Query the full product list to find available pairs for this symbol
    // (individual GET /products/{id} can 404 even when the pair is accessible via list)
    // NOTE: JWT must be signed with path only (no query string)
    const prodBasePath = `/api/v3/brokerage/products`;
    const prodR = await fetch(`https://api.coinbase.com${prodBasePath}?product_type=SPOT&limit=250`, {
      headers: { Authorization: `Bearer ${coinbaseJWT('GET', prodBasePath)}` }
    });
    const prodData = await prodR.json();
    const allProducts = prodData.products || [];
    console.log(`Products fetched: ${allProducts.length}, looking for ${sym}-AUD and ${sym}-USD`);

    const audProduct  = allProducts.find(p => p.product_id === `${sym}-AUD`  && !p.trading_disabled);
    const usdProduct  = allProducts.find(p => p.product_id === `${sym}-USD`  && !p.trading_disabled);
    const usdcProduct = allProducts.find(p => p.product_id === `${sym}-USDC` && !p.trading_disabled);

    // Fetch account balances to pick the right pair based on what funds are available
    const accPath = '/api/v3/brokerage/accounts';
    const accR = await fetch(`https://api.coinbase.com${accPath}`, {
      headers: { Authorization: `Bearer ${coinbaseJWT('GET', accPath)}` }
    });
    const accData = await accR.json();
    const accounts = accData.accounts || [];
    const usdBal  = accounts.filter(a => a.currency === 'USD') .reduce((s,a) => s + parseFloat(a.available_balance?.value || 0), 0);
    const usdcBal = accounts.filter(a => a.currency === 'USDC').reduce((s,a) => s + parseFloat(a.available_balance?.value || 0), 0);
    const audBal  = accounts.filter(a => a.currency === 'AUD') .reduce((s,a) => s + parseFloat(a.available_balance?.value || 0), 0);
    console.log(`Balances — USD: ${usdBal}, USDC: ${usdcBal}, AUD: ${audBal}`);
    console.log(`AUD pair: ${audProduct?.product_id ?? 'none'}, USD pair: ${usdProduct?.product_id ?? 'none'}, USDC pair: ${usdcProduct?.product_id ?? 'none'}`);

    // Pick the best product based on available pairs AND available balance
    let productId, effectiveQuoteSize;
    if (audProduct && audBal > 0) {
      // Native AUD pair with AUD funds — ideal for Australian accounts
      productId = audProduct.product_id;
      effectiveQuoteSize = side === 'BUY' ? quoteSize : null;
    } else if (usdProduct && usdBal > 0) {
      // USD pair funded by USD
      productId = usdProduct.product_id;
      effectiveQuoteSize = (tradeCcy === 'AUD' && side === 'BUY' && quoteSize && audUsd)
        ? String(parseFloat(quoteSize) * parseFloat(audUsd))
        : quoteSize;
    } else if (usdcProduct && usdcBal > 0) {
      // USDC pair — USDC acts as USD equivalent
      productId = usdcProduct.product_id;
      effectiveQuoteSize = (tradeCcy === 'AUD' && side === 'BUY' && quoteSize && audUsd)
        ? String(parseFloat(quoteSize) * parseFloat(audUsd))
        : quoteSize;
    } else if (usdProduct) {
      // Fallback: try USD pair even with no confirmed USD balance (in case balance fetch was stale)
      productId = usdProduct.product_id;
      effectiveQuoteSize = (tradeCcy === 'AUD' && side === 'BUY' && quoteSize && audUsd)
        ? String(parseFloat(quoteSize) * parseFloat(audUsd))
        : quoteSize;
    } else {
      return res.status(400).json({ error_response: { message: `${sym} is not available for trading on Coinbase Advanced Trade.` } });
    }
    console.log(`Selected product: ${productId}, quote size: ${effectiveQuoteSize}`);

    const path = '/api/v3/brokerage/orders';
    const jwt = coinbaseJWT('POST', path);

    let order_configuration;
    if (!orderType || orderType === 'market') {
      order_configuration = {
        market_market_ioc: side === 'BUY'
          ? { quote_size: String(effectiveQuoteSize) }
          : { base_size: String(baseSize) }
      };
    } else {
      order_configuration = {
        limit_limit_gtc: {
          base_size: String(baseSize),
          limit_price: String(limitPrice),
          post_only: false
        }
      };
    }

    const orderPayload = {
      client_order_id: `inteliq-${Date.now()}`,
      product_id: productId,
      side,
      order_configuration
    };
    console.log('Placing order:', JSON.stringify(orderPayload));

    const r = await fetch(`https://api.coinbase.com${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Coinbase order error:', JSON.stringify(data, null, 2));
      return res.status(r.status).json(data);
    }
    res.json({ ...data, _productId: productId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CoinSpot Read-Only API ─────────────────────────────────────────────────
app.get("/api/coinspot/balances", async (req, res) => {
  if (!COINSPOT_API_KEY || !COINSPOT_API_SECRET) {
    return res.status(503).json({ error: "CoinSpot API keys not configured — add COINSPOT_API_KEY and COINSPOT_API_SECRET to .env" });
  }
  try {
    const nonce = Date.now();
    const postData = JSON.stringify({ nonce });
    const sign = crypto.createHmac("sha512", COINSPOT_API_SECRET).update(postData).digest("hex");

    const r = await fetch("https://www.coinspot.com.au/api/ro/my/balances", {
      method: "POST",
      headers: { "Content-Type": "application/json", "key": COINSPOT_API_KEY, "sign": sign },
      body: postData,
    });
    const data = await r.json();
    if (data.status !== "ok") {
      return res.status(400).json({ error: data.message || "CoinSpot API error" });
    }

    const holdings = [];
    for (const entry of (data.balances || [])) {
      for (const [sym, details] of Object.entries(entry)) {
        const qty = parseFloat(details.balance);
        if (qty <= 0) continue;
        const audRate = parseFloat(details.rate || 0);
        holdings.push({
          sym: sym.toUpperCase(), name: sym.toUpperCase(), qty,
          avg: audRate,
          avgCurrency: "AUD",
          sector: "Crypto", horizon: "Medium", priceType: "crypto", source: "coinspot",
        });
      }
    }
    res.json({ holdings, lastSync: new Date().toISOString() });
  } catch (err) {
    console.error("CoinSpot error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Price helpers ──────────────────────────────────────────────────────────
const COINGECKO_IDS = {
  BTC:"bitcoin", ETH:"ethereum", SOL:"solana", BNB:"binancecoin",
  XRP:"ripple", ADA:"cardano", AVAX:"avalanche-2", DOGE:"dogecoin",
  DOT:"polkadot", MATIC:"matic-network", LINK:"chainlink", UNI:"uniswap",
  LTC:"litecoin", BCH:"bitcoin-cash", ATOM:"cosmos", SHIB:"shiba-inu",
  TRX:"tron", TON:"the-open-network", OP:"optimism", ARB:"arbitrum",
  NEAR:"near", ICP:"internet-computer", FTM:"fantom", INJ:"injective-protocol",
  HBAR:"hedera-hashgraph", ALGO:"algorand", VET:"vechain",
};

async function fetchCryptoPrice(sym) {
  const id = COINGECKO_IDS[sym.toUpperCase()] || sym.toLowerCase();
  const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`);
  const d = await r.json();
  if (!d[id]) return null;
  const price = d[id].usd;
  const change = d[id].usd_24h_change || 0;
  return {
    sym: sym.toUpperCase(), price, priceUSD: price,
    change: parseFloat(change.toFixed(2)),
    changeStr: (change >= 0 ? "+" : "") + change.toFixed(2) + "%",
    up: change >= 0, currency: "USD", source: "coingecko",
  };
}

async function fetchStockPrice(sym) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${sym.toUpperCase()}?interval=1d&range=1d`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  const d = await r.json();
  const quote = d?.chart?.result?.[0];
  if (!quote) return null;
  const meta = quote.meta;
  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose;
  const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  return {
    sym: sym.toUpperCase(), price, priceUSD: null,
    change: parseFloat(change.toFixed(2)),
    changeStr: (change >= 0 ? "+" : "") + change.toFixed(2) + "%",
    up: change >= 0, currency: meta.currency || "USD",
    source: "yahoo", marketState: meta.marketState,
  };
}

// ── Live price — single ────────────────────────────────────────────────────
app.get("/api/price", async (req, res) => {
  const { sym, type } = req.query;
  if (!sym) return res.status(400).json({ error: "sym required" });
  try {
    const result = type === "crypto" ? await fetchCryptoPrice(sym) : await fetchStockPrice(sym);
    if (!result) return res.status(404).json({ error: "Symbol not found" });
    res.json(result);
  } catch (err) {
    console.error("Price fetch error:", err);
    res.status(500).json({ error: "Price fetch failed" });
  }
});

// ── Batch prices ───────────────────────────────────────────────────────────
app.post("/api/prices", async (req, res) => {
  const { symbols } = req.body;
  if (!symbols || !Array.isArray(symbols)) return res.status(400).json({ error: "symbols array required" });

  const prices = {};
  const cryptoSyms = symbols.filter(s => s.type === "crypto");
  const stockSyms  = symbols.filter(s => s.type !== "crypto");

  // Batch all cryptos into a single CoinGecko call
  if (cryptoSyms.length > 0) {
    try {
      const idMap = cryptoSyms.map(s => ({
        sym: s.sym,
        id: COINGECKO_IDS[s.sym.toUpperCase()] || s.sym.toLowerCase(),
      }));
      const ids = idMap.map(x => x.id).join(",");
      const r = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const d = await r.json();
      for (const { sym, id } of idMap) {
        if (d[id]) {
          const price  = d[id].usd;
          const change = d[id].usd_24h_change || 0;
          prices[sym] = {
            sym: sym.toUpperCase(), price, priceUSD: price,
            change: parseFloat(change.toFixed(2)),
            changeStr: (change >= 0 ? "+" : "") + change.toFixed(2) + "%",
            up: change >= 0, currency: "USD", source: "coingecko",
          };
        }
      }
    } catch (e) {
      console.error("CoinGecko batch error:", e.message);
    }
  }

  // Individual Yahoo Finance calls for stocks/ETFs
  const stockResults = await Promise.allSettled(
    stockSyms.map(async ({ sym }) => {
      try { return await fetchStockPrice(sym); } catch { return { sym, error: "fetch failed" }; }
    })
  );
  stockResults.forEach((r, i) => {
    if (r.status === "fulfilled" && !r.value?.error) prices[stockSyms[i].sym] = r.value;
  });

  res.json(prices);
});

// ── Technical Indicator Math ───────────────────────────────────────────────
function computeEMA(closes, period) {
  const k = 2 / (period + 1);
  const result = new Array(closes.length).fill(null);
  if (closes.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  result[period - 1] = sum / period;
  for (let i = period; i < closes.length; i++) {
    result[i] = closes[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function computeRSI(closes, period = 14) {
  const result = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period; avgLoss /= period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0,  diff)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -diff)) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

function computeEMAOfSeries(series, period) {
  const k = 2 / (period + 1);
  const result = new Array(series.length).fill(null);
  let count = 0, sum = 0, seedEnd = -1;
  for (let i = 0; i < series.length; i++) {
    if (series[i] == null) continue;
    sum += series[i]; count++;
    if (count === period) { seedEnd = i; break; }
  }
  if (seedEnd === -1) return result;
  result[seedEnd] = sum / period;
  for (let i = seedEnd + 1; i < series.length; i++) {
    if (series[i] != null && result[i - 1] != null) {
      result[i] = series[i] * k + result[i - 1] * (1 - k);
    }
  }
  return result;
}

function computeMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = computeEMA(closes, fast);
  const emaSlow = computeEMA(closes, slow);
  const macd = closes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null
  );
  const signalArr = computeEMAOfSeries(macd, signal);
  const histogram = macd.map((v, i) =>
    v != null && signalArr[i] != null ? v - signalArr[i] : null
  );
  return { macd, signal: signalArr, histogram };
}

function computeBollingerBands(closes, period = 20, mult = 2) {
  const upper = new Array(closes.length).fill(null);
  const middle = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(slice.reduce((a, v) => a + Math.pow(v - sma, 2), 0) / period);
    middle[i] = sma; upper[i] = sma + mult * sd; lower[i] = sma - mult * sd;
  }
  return { upper, middle, lower };
}

// ── Chart OHLCV data ───────────────────────────────────────────────────────
const RANGE_CFG = {
  "1d":  { interval:"5m",  range:"1d"  },
  "7d":  { interval:"1h",  range:"7d"  },
  "1mo": { interval:"1d",  range:"1mo" },
  "3mo": { interval:"1d",  range:"3mo" },
  "1y":  { interval:"1wk", range:"1y"  },
};

app.get("/api/chart/:sym", async (req, res) => {
  const { sym } = req.params;
  const range = req.query.range || "1mo";
  const cfg = RANGE_CFG[range] || RANGE_CFG["1mo"];
  // Crypto symbols need currency suffix for Yahoo Finance (e.g. BTC → BTC-USD or BTC-AUD)
  const ccy = (req.query.currency || "USD").toUpperCase();
  const yahooSym = COINGECKO_IDS[sym.toUpperCase()] ? `${sym.toUpperCase()}-${ccy}` : sym;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=${cfg.interval}&range=${cfg.range}&includePrePost=false`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const result = d?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "Symbol not found" });
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};
    const candles = timestamps
      .map((ts, i) => ({ t: ts * 1000, o: q.open?.[i], h: q.high?.[i], l: q.low?.[i], c: q.close?.[i], v: q.volume?.[i] }))
      .filter(c => c.o != null && c.h != null && c.l != null && c.c != null);
    const closes = candles.map(c => c.c);
    const indicators = {
      ema50:  computeEMA(closes, 50),
      ema200: computeEMA(closes, 200),
      rsi:    computeRSI(closes, 14),
      macd:   computeMACD(closes, 12, 26, 9),
      bb:     computeBollingerBands(closes, 20, 2),
    };
    res.json({
      sym: sym.toUpperCase(),
      name: meta.longName || meta.shortName || sym,
      currency: meta.currency || "USD",
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose || meta.previousClose,
      candles, range, indicators,
    });
  } catch (err) {
    console.error("Chart error:", err.message);
    res.status(500).json({ error: "Chart fetch failed" });
  }
});

// ── FMP Fundamentals ───────────────────────────────────────────────────────
app.get("/api/fundamentals/:sym", async (req, res) => {
  const { sym } = req.params;
  // Skip crypto — FMP has no reliable crypto data
  if (COINGECKO_IDS[sym.toUpperCase()]) return res.json(null);
  if (!FMP_API_KEY) return res.json(null);
  const base = "https://financialmodelingprep.com/stable";
  const key  = `apikey=${FMP_API_KEY}`;
  try {
    const [profileRes, metricsRes, ratiosRes, earningsRes] = await Promise.allSettled([
      fetch(`${base}/profile?symbol=${sym}&${key}`).then(r => r.json()),
      fetch(`${base}/key-metrics?symbol=${sym}&period=TTM&${key}`).then(r => r.json()),
      fetch(`${base}/ratios?symbol=${sym}&period=TTM&${key}`).then(r => r.json()),
      fetch(`${base}/earnings-surprises?symbol=${sym}&${key}`).then(r => r.json()),
    ]);
    const profile  = profileRes.status  === "fulfilled" ? profileRes.value?.[0]  : null;
    const metrics  = metricsRes.status  === "fulfilled" ? metricsRes.value?.[0]  : null;
    const ratios   = ratiosRes.status   === "fulfilled" ? ratiosRes.value?.[0]   : null;
    const earnings = earningsRes.status === "fulfilled" ? earningsRes.value       : null;
    if (!profile && !metrics && !ratios) return res.json(null);
    const mc = profile?.marketCap || metrics?.marketCap;
    const marketCap = mc
      ? mc >= 1e12 ? `$${(mc/1e12).toFixed(2)}T`
      : mc >= 1e9  ? `$${(mc/1e9).toFixed(1)}B`
      : mc >= 1e6  ? `$${(mc/1e6).toFixed(0)}M` : null
      : null;
    const fcfYield = ratios?.priceToFreeCashFlowRatio > 0
      ? (1 / ratios.priceToFreeCashFlowRatio) * 100 : null;
    const earningsSurprises = Array.isArray(earnings) && earnings.length > 0
      ? earnings.slice(0, 4).map(e => {
          const pct = e.epsEstimated ? (e.epsActual - e.epsEstimated) / Math.abs(e.epsEstimated) * 100 : null;
          return { date: e.date, epsActual: e.epsActual, epsEstimated: e.epsEstimated,
            surprise: pct != null ? (pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`) : null };
        })
      : [];
    res.json({
      pe:         ratios?.priceToEarningsRatio  || null,
      evEbitda:   metrics?.evToEBITDA            || null,
      fcfYield,
      debtEquity: ratios?.debtToEquityRatio      || null,
      roe:        metrics?.returnOnEquity        || null,
      marketCap,
      sector:     profile?.industry              || null,
      earningsSurprises,
      analystConsensus: null,
    });
  } catch (err) {
    console.error("FMP fundamentals error:", err.message);
    res.json(null);
  }
});

// ── Detailed technical analysis with chart annotations ─────────────────────
app.post("/api/analyse/detail", async (req, res) => {
  const { sym, name, candles, range, currentPrice, currency, indicators, fundamentals } = req.body;
  if (!sym || !candles?.length) return res.status(400).json({ error: "sym and candles required" });

  const recent = candles.slice(-40);
  const minP = Math.min(...recent.map(c => c.l).filter(Boolean));
  const maxP = Math.max(...recent.map(c => c.h).filter(Boolean));
  const firstC = recent[0]?.c, lastC = recent[recent.length - 1]?.c;
  const chgPct = firstC ? ((lastC - firstC) / firstC * 100).toFixed(1) : 0;
  const avgVol = recent.reduce((s, c) => s + (c.v || 0), 0) / recent.length;

  const summary = recent.map((c, i) => ({
    i,
    o: c.o?.toFixed(2), h: c.h?.toFixed(2), l: c.l?.toFixed(2), c: c.c?.toFixed(2),
    vR: c.v && avgVol ? (c.v / avgVol).toFixed(1) : "—",
  }));

  // Build fundamentals context block
  let fundamentalsBlock = "";
  if (fundamentals && typeof fundamentals === "object") {
    const lines = [];
    if (fundamentals.pe        != null) lines.push(`- P/E Ratio (TTM): ${Number(fundamentals.pe).toFixed(1)}x`);
    if (fundamentals.evEbitda  != null) lines.push(`- EV/EBITDA: ${Number(fundamentals.evEbitda).toFixed(1)}x`);
    if (fundamentals.fcfYield  != null) lines.push(`- FCF Yield: ${Number(fundamentals.fcfYield).toFixed(1)}%`);
    if (fundamentals.debtEquity!= null) lines.push(`- Debt/Equity: ${Number(fundamentals.debtEquity).toFixed(2)}`);
    if (fundamentals.roe       != null) lines.push(`- ROE: ${(Number(fundamentals.roe) * 100).toFixed(1)}%`);
    if (fundamentals.marketCap)         lines.push(`- Market Cap: ${fundamentals.marketCap}`);
    if (fundamentals.analystConsensus) {
      const c = fundamentals.analystConsensus;
      lines.push(`- Analyst Consensus: ${c.strongBuy} Strong Buy, ${c.buy} Buy, ${c.hold} Hold, ${c.sell} Sell`);
    }
    if (fundamentals.earningsSurprises?.length) {
      const surprises = fundamentals.earningsSurprises.map(e => e.surprise).filter(Boolean).join(", ");
      if (surprises) lines.push(`- Earnings Surprises (last ${fundamentals.earningsSurprises.length} quarters): ${surprises}`);
    }
    if (lines.length) fundamentalsBlock = `\n\nLIVE FUNDAMENTAL DATA (sourced from Financial Modeling Prep, current as of today):\n${lines.join("\n")}\nUse this live data (not training-data estimates) for your fundamental analysis section.`;
  }

  // Build indicators context block
  let indicatorsBlock = "";
  if (indicators && typeof indicators === "object") {
    const lastVal = arr => { if (!Array.isArray(arr)) return null; for (let i = arr.length-1; i>=0; i--) if (arr[i]!=null) return arr[i]; return null; };
    const lastPrice = candles[candles.length - 1]?.c ?? currentPrice;
    const rsiVal   = lastVal(indicators.rsi);
    const macdVal  = lastVal(indicators.macd?.macd);
    const sigVal   = lastVal(indicators.macd?.signal);
    const histVal  = lastVal(indicators.macd?.histogram);
    const bbUpper  = lastVal(indicators.bb?.upper);
    const bbMiddle = lastVal(indicators.bb?.middle);
    const bbLower  = lastVal(indicators.bb?.lower);
    const ema50    = lastVal(indicators.ema50);
    const ema200   = lastVal(indicators.ema200);
    const f = v => v == null ? null : (Math.abs(v) >= 10 ? v.toFixed(2) : Math.abs(v) >= 0.01 ? v.toFixed(4) : v.toFixed(6));
    const lines = [];
    if (rsiVal != null) {
      const note = rsiVal > 70 ? "overbought" : rsiVal < 30 ? "oversold" : rsiVal > 60 ? "approaching overbought" : rsiVal < 40 ? "approaching oversold" : "neutral";
      lines.push(`- RSI(14): ${rsiVal.toFixed(1)} (${note})`);
    }
    if (macdVal != null && sigVal != null && histVal != null) {
      lines.push(`- MACD: ${f(macdVal)} / Signal: ${f(sigVal)} / Histogram: ${histVal>=0?"+":""}${f(histVal)} (${histVal>=0?"bullish momentum":"bearish momentum"})`);
    }
    if (bbUpper != null && bbMiddle != null && bbLower != null && lastPrice) {
      const bw = bbUpper - bbLower;
      const pctB = bw > 0 ? ((lastPrice - bbLower) / bw * 100).toFixed(0) : null;
      lines.push(`- Bollinger Bands: Upper ${bbUpper.toFixed(2)} / Middle ${bbMiddle.toFixed(2)} / Lower ${bbLower.toFixed(2)}${pctB!=null?` → Price at ${pctB}% of band width`:""}`);
    }
    if (ema50 != null && ema200 != null) {
      const cross = ema50 > ema200 ? "Golden Cross (EMA50 > EMA200, bullish)" : "Death Cross (EMA50 < EMA200, bearish)";
      const pct = ((lastPrice - ema50) / ema50 * 100).toFixed(1);
      lines.push(`- EMA50: ${ema50.toFixed(2)} / EMA200: ${ema200.toFixed(2)} → ${cross} / Price ${pct>0?"+":""}${pct}% vs EMA50`);
    } else if (ema50 != null) {
      const pct = ((lastPrice - ema50) / ema50 * 100).toFixed(1);
      lines.push(`- EMA50: ${ema50.toFixed(2)} → Price ${pct>0?"+":""}${pct}% vs EMA50`);
    }
    if (lines.length) indicatorsBlock = `\n\nCOMPUTED TECHNICAL INDICATORS (calculated from the live OHLCV data above):\n${lines.join("\n")}\nReference these computed values in your technical analysis section.`;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: `You are a senior investment analyst. Today is ${new Date().toLocaleDateString("en-AU",{year:"numeric",month:"long",day:"numeric"})}. You have been given live OHLCV chart data for this asset. Using this chart data AND your knowledge of the asset's fundamentals, sector dynamics, macro environment, and market conditions as of today, produce a single unified investment analysis with ONE verdict. Integrate technical signals from the chart with fundamental and macro factors — do not treat them as separate signals. The current live price is the closing price of the most recent candle. Return ONLY valid JSON (no markdown fences):
{"verdict":"BUY|WATCH|AVOID|HOLD","conviction":"HIGH|MEDIUM|LOW","horizon":"Short|Medium|Long","target":"$X","stopLoss":"$X","summary":"2-3 sentences combining all factors","macro":"2-3 sentences","fundamental":"2-3 sentences","technical":"2-3 sentences based on the chart data","sentiment":"2-3 sentences","portfolio":"2-3 sentences","support":[{"price":0.0,"label":"Label","strength":"STRONG|MEDIUM|WEAK"}],"resistance":[{"price":0.0,"label":"Label","strength":"STRONG|MEDIUM|WEAK"}],"pattern":{"name":"Pattern name or null","bullish":true,"note":"1 sentence"},"momentum":"1-2 sentences","volume":"1 sentence"}
Horizon definitions: Short = up to 3 months; Medium = 3 months to 1 year; Long = 1 year or more.
Provide 1-3 support and 1-3 resistance levels using actual prices from the data.${fundamentalsBlock}${indicatorsBlock}`,
        messages: [{ role: "user", content: `Symbol: ${sym} (${name})\nCurrent: ${currentPrice} ${currency} | Range: ${range} | Change: ${chgPct}%\nPrice range: ${minP?.toFixed(2)} – ${maxP?.toFixed(2)}\n\nOHLCV (i=candle index, vR=vol vs avg):\n${JSON.stringify(summary)}` }],
      })
    });
    const d = await response.json();
    const text = d.content?.find(b => b.type === "text")?.text || "";
    const start = text.indexOf("{"); const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object in response");
    const parsed = JSON.parse(text.slice(start, end + 1));
    res.json(parsed);
  } catch (err) {
    console.error("Detail analysis error:", err.message);
    res.status(500).json({ error: "Detail analysis failed" });
  }
});

// ── IPO Calendar (Finnhub) ─────────────────────────────────────────────────
let ipoCache = { items: [], ts: 0 };

app.get("/api/ipo", async (req, res) => {
  const now = Date.now();
  if (ipoCache.items.length && now - ipoCache.ts < 4 * 60 * 60 * 1000) {
    return res.json(ipoCache.items);
  }
  if (!FINNHUB_API_KEY) return res.json([]);

  const pad = n => String(n).padStart(2, "0");
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const from = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const to   = new Date(now + 90 * 24 * 60 * 60 * 1000);

  try {
    const url = `https://finnhub.io/api/v1/calendar/ipo?from=${fmt(from)}&to=${fmt(to)}&token=${FINNHUB_API_KEY}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const allowed = ["NASDAQ", "NYSE", "ASX", "CBOE"];
    const items = (d.ipoCalendar || [])
      .filter(ipo => ipo.exchange && allowed.some(ex => ipo.exchange.toUpperCase().includes(ex)))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    ipoCache = { items, ts: now };
    console.log(`IPO: fetched ${items.length} items`);
    res.json(items);
  } catch (err) {
    console.error("IPO fetch error:", err.message);
    res.status(500).json({ error: "IPO fetch failed" });
  }
});

// ── Live News (Yahoo Finance RSS) ──────────────────────────────────────────
let newsCache = { items: [], ts: 0 };

app.get("/api/news", async (req, res) => {
  const now = Date.now();
  if (newsCache.items.length && now - newsCache.ts < 15 * 60 * 1000) {
    return res.json(newsCache.items);
  }
  try {
    const feeds = [
      "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,NVDA,MSFT,AAPL,AMD&region=US&lang=en-US",
      "https://feeds.finance.yahoo.com/rss/2.0/headline?s=BTC-USD,ETH-USD,SOL-USD&region=US&lang=en-US",
      "https://feeds.finance.yahoo.com/rss/2.0/headline?s=BHP.AX,RIO.AX,PLS.AX,FMG.AX&region=AU&lang=en-AU",
    ];

    const results = await Promise.allSettled(
      feeds.map(url => fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 8000 }).then(r => r.text()))
    );

    const allItems = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const xml = r.value;
      const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      for (const m of matches) {
        const c = m[1];
        const title = (c.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || c.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
        const link  = (c.match(/<link>(.*?)<\/link>/))?.[1]?.trim() || "";
        const pubDate = (c.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() || "";
        if (title && !allItems.find(i => i.title === title)) {
          allItems.push({ title, link, pubDate });
        }
      }
    }

    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const mapped = allItems.slice(0, 16).map(item => {
      const age = item.pubDate ? Math.round((now - new Date(item.pubDate).getTime()) / 3600000) : 0;
      const ageStr = age < 1 ? "< 1h ago" : age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`;

      const h = item.title.toLowerCase();
      let tag = "MARKETS";
      if (/bitcoin|crypto|eth\b|bnb|solana|ripple|xrp|coin|defi|nft/i.test(h)) tag = "CRYPTO";
      else if (/asx|bhp|rio|fortescue|fmg|lithium|australia|pilbara|mining|ore/i.test(h)) tag = "ASX MINING";
      else if (/nvidia|apple|microsoft|google|amazon|meta|tesla|tech|ai\b|chip|semiconductor|palantir|amd/i.test(h)) tag = "US TECH";

      let sentiment = "NEUTRAL";
      if (/surge|rally|soar|jump|gain|beat|boom|bull|rise|climb|record|strong|high/i.test(h)) sentiment = "BULLISH";
      if (/fall|drop|crash|plunge|miss|bear|decline|weak|concern|fear|tumble|sell.off|warning/i.test(h)) sentiment = "BEARISH";

      let impact = "MEDIUM";
      if (/fed|rate|inflation|earnings|gdp|historic|record high|crisis|major|crash/i.test(h)) impact = "HIGH";
      if (/minor|slight|small|brief|marginal/i.test(h)) impact = "LOW";

      // Extract likely affected tickers
      const affected = [];
      if (/nvidia|nvda/i.test(h)) affected.push("NVDA");
      if (/apple|aapl/i.test(h)) affected.push("AAPL");
      if (/microsoft|msft/i.test(h)) affected.push("MSFT");
      if (/bitcoin|btc/i.test(h)) affected.push("BTC");
      if (/ethereum|eth\b/i.test(h)) affected.push("ETH");
      if (/bhp/i.test(h)) affected.push("BHP.AX");
      if (/rio tinto|rio\.ax/i.test(h)) affected.push("RIO.AX");
      if (/pilbara|pls/i.test(h)) affected.push("PLS.AX");

      return { time: ageStr, tag, headline: item.title, sentiment, impact, affected, commentary: "", link: item.link, live: true };
    });

    if (mapped.length > 0) {
      newsCache = { items: mapped, ts: now };
      console.log(`News: fetched ${mapped.length} items`);
      res.json(mapped);
    } else {
      res.status(503).json({ error: "No news items fetched" });
    }
  } catch (err) {
    console.error("News error:", err.message);
    res.status(500).json({ error: "News fetch failed" });
  }
});

// ── Dashboard Picks (Claude-powered, cached 4h) ────────────────────────────
let dashCache = { picks: null, ts: 0 };

app.get("/api/dashboard/picks", async (req, res) => {
  const now = Date.now();
  const force = req.query.force === "1";
  if (!force && dashCache.picks && now - dashCache.ts < 4 * 60 * 60 * 1000) {
    return res.json(dashCache.picks);
  }
  try {
    const today = new Date().toLocaleDateString("en-AU", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system: `You are a senior investment analyst generating today's top picks. Today is ${today}.
Generate 3 high-conviction investment picks — aim for variety across asset classes (e.g. US large-cap stock, ASX stock or ETF, crypto). Pick what is genuinely interesting given current market conditions as of today's date.
Respond ONLY with a valid JSON array, no markdown fences. Each pick must use this exact structure:
[{"sym":"TICKER","name":"Full Company Name","sector":"Sector","verdict":"BUY|WATCH|AVOID|HOLD","conviction":"HIGH|MEDIUM|LOW","horizon":"Short|Medium|Long","priceStatic":0.00,"target":"$X","upside":"+X%","up":true,"priceType":"stock or crypto","priceCurrency":"USD or AUD","avgCurrency":"USD or AUD","summary":"2-3 sentences on the core thesis.","macro":"2-3 sentences on macro tailwinds or headwinds.","fundamental":"2-3 sentences on key fundamental metrics.","technical":"2-3 sentences on technical setup.","sentiment":"2-3 sentences on analyst and market sentiment.","insider":"2-3 sentences on insider activity or institutional flows.","portfolio":"1-2 sentences on portfolio fit and sizing."}]
Rules: ASX tickers must end in .AX. Use standard crypto symbols (BTC, ETH, SOL etc). For priceStatic use your best estimate of the current price. Be direct and specific — avoid generic statements.
Horizon definitions: Short = up to 3 months; Medium = 3 months to 1 year; Long = 1 year or more.`,
        messages: [{ role: "user", content: "Generate today's 3 top investment picks with full analysis." }],
      }),
    });
    const d = await response.json();
    const text = d.content?.find(b => b.type === "text")?.text || "";
    const start = text.indexOf("[");
    const end   = text.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array found in response");
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid response format");
    // Fetch live prices and replace Claude's priceStatic estimates
    await Promise.allSettled(parsed.map(async pick => {
      try {
        const result = pick.priceType === "crypto"
          ? await fetchCryptoPrice(pick.sym)
          : await fetchStockPrice(pick.sym);
        if (result?.price) pick.priceStatic = result.price;
      } catch {}
    }));
    dashCache = { picks: parsed, ts: now };
    console.log(`Dashboard: generated ${parsed.length} picks`);
    res.json(parsed);
  } catch (err) {
    console.error("Dashboard picks error:", err.message);
    res.status(500).json({ error: "Could not generate picks — " + err.message });
  }
});


// ── Glossary term extraction ────────────────────────────────────────────────
app.post("/api/glossary/extract", async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== "string") return res.json([]);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        system: `You are a financial glossary extractor. Given investment analysis text, identify technical terms related to stocks, crypto, finance, economics, or trading that a retail investor might not know. Return ONLY a valid JSON array (no markdown) of new terms not in common knowledge. Each item: {"term":"Term","definition":"Clear 1-2 sentence definition for a retail investor."}. Return [] if no new terms found. Limit to 8 terms maximum.`,
        messages: [{ role: "user", content: `Extract financial/investment terms from this text:\n\n${text.slice(0, 3000)}` }],
      }),
    });
    const d = await response.json();
    const raw = d.content?.find(b => b.type === "text")?.text || "[]";
    const start = raw.indexOf("[");
    const end   = raw.lastIndexOf("]");
    if (start === -1 || end === -1) return res.json([]);
    const parsed = JSON.parse(raw.slice(start, end + 1));
    res.json(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.error("Glossary extract error:", err.message);
    res.json([]);
  }
});


// ── Trade Journal Pattern Analysis ────────────────────────────────────────
app.post("/api/journal/analyse", async (req, res) => {
  const { entries } = req.body;
  if (!entries?.length) return res.status(400).json({ error: "entries required" });
  const today = new Date().toLocaleDateString("en-AU", { year:"numeric", month:"long", day:"numeric" });
  const lines = entries.map(e =>
    `- ${e.date} | ${e.action} | ${e.sym} | qty:${e.qty} | price:${e.price} ${e.currency||"USD"} | thesis:"${e.thesis||"none"}"${e.exitDate?` | exited:${e.exitDate} @ ${e.exitPrice}`:""}`
  );
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key":ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1500,
        system: `You are a trading coach specialising in behavioural finance. Today is ${today}. Analyse this trade journal for patterns and provide honest, direct coaching. Focus on behavioural patterns not just performance. Return ONLY valid JSON:
{"summary":"2-3 sentences overall assessment","patterns":[{"pattern":"Name of behavioural pattern","description":"1-2 sentences explaining the pattern with specific examples from the journal","severity":"HIGH|MEDIUM|LOW","advice":"Specific actionable advice to address this"}],"strengths":["short string"],"weaknesses":["short string"],"winRate":"X% (N/N trades)" or null,"avgHoldDays":number or null,"topMistake":"1 sentence on the single biggest mistake","keyAdvice":"The most important piece of advice in 1-2 sentences"}`,
        messages: [{ role:"user", content: `Analyse my trade journal (${entries.length} entries):\n\n${lines.join("\n")}` }],
      }),
    });
    const d = await response.json();
    const text = d.content?.find(b => b.type === "text")?.text || "";
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("No JSON");
    res.json(JSON.parse(text.slice(s, e + 1)));
  } catch (err) {
    console.error("Journal analyse error:", err.message);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// ── Macro Event Calendar ───────────────────────────────────────────────────
let macroCache = { events: null, ts: 0 };

app.post("/api/macro", async (req, res) => {
  const { holdingSyms } = req.body || {};
  const now = Date.now();
  // Cache macro events for 4h
  if (macroCache.events && now - macroCache.ts < 4 * 60 * 60 * 1000) {
    return res.json(macroCache.events);
  }
  const today = new Date().toLocaleDateString("en-AU", { year:"numeric", month:"long", day:"numeric" });
  const holdings = Array.isArray(holdingSyms) && holdingSyms.length > 0
    ? holdingSyms.slice(0, 20).join(", ")
    : "no specific holdings provided";
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key":ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 2500,
        system: `You are a macro economist. Today is ${today}. Generate the upcoming macro events for the next 6 weeks that matter to investors. Include central bank meetings, major economic data releases (CPI, jobs, GDP, PMI), and any known scheduled events. For each event, assess the portfolio impact for these holdings: ${holdings}. Return ONLY valid JSON array (no markdown):
[{"date":"YYYY-MM-DD","event":"Event name","category":"FED|RBA|ECB|INFLATION|EMPLOYMENT|GROWTH|TRADE|OTHER","country":"US|AU|EU|CN|GLOBAL","importance":"HIGH|MEDIUM|LOW","preview":"1 sentence on what to expect","portfolioImpact":"1-2 sentences on how this affects the specific holdings listed — be specific about which holdings are most affected","bullCase":"If outcome beats expectations: 1 sentence","bearCase":"If outcome misses: 1 sentence","affectedHoldings":["SYM1","SYM2"]}]
Return 8–14 events. Sort by date ascending. Only include events you are confident will occur around this time — do not invent speculative events.`,
        messages: [{ role:"user", content: `Today is ${today}. Generate the macro calendar for the next 6 weeks.` }],
      }),
    });
    const d = await response.json();
    const text = d.content?.find(b => b.type === "text")?.text || "";
    const start = text.indexOf("["), end = text.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array");
    const parsed = JSON.parse(text.slice(start, end + 1));
    macroCache = { events: parsed, ts: now };
    console.log(`Macro: generated ${parsed.length} events`);
    res.json(parsed);
  } catch (err) {
    console.error("Macro error:", err.message);
    res.status(500).json({ error: "Macro calendar failed" });
  }
});

// ── Natural Language Screener ──────────────────────────────────────────────
app.post("/api/screener", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });
  const today = new Date().toLocaleDateString("en-AU", { year:"numeric", month:"long", day:"numeric" });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key":ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 2000,
        system: `You are a senior investment analyst running a stock screener. Today is ${today}. The user has described what they are looking for in plain English. Return 5–7 stocks that best match their criteria as of today. Be specific and current — pick stocks that genuinely fit right now, not generic examples. ASX tickers must end in .AX. Return ONLY a valid JSON array with no markdown, no preamble, no explanation — just the raw JSON array:
[{"sym":"TICKER","name":"Full Company Name","sector":"Sector","verdict":"BUY|WATCH|AVOID|HOLD","conviction":"HIGH|MEDIUM|LOW","horizon":"Short|Medium|Long","priceStatic":0.00,"target":"$X","upside":"+X%","up":true,"priceType":"stock or crypto","priceCurrency":"USD or AUD","avgCurrency":"USD or AUD","matchReason":"2-3 sentences on exactly why this matches the screen criteria","summary":"2-3 sentences on the investment thesis"}]
Horizon definitions: Short = up to 3 months; Medium = 3 months to 1 year; Long = 1 year or more.`,
        messages: [
          { role:"user", content: `Screen for: ${query}` },
          { role:"assistant", content: "[" },
        ],
      }),
    });
    const d = await response.json();
    if (d.error) console.error("Screener API error:", JSON.stringify(d.error));
    const raw = d.content?.find(b => b.type === "text")?.text || "";
    // Prepend the prefilled "[" that we seeded in the assistant message
    const text = "[" + raw;
    const start = text.indexOf("["), end = text.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array in response");
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) throw new Error("Invalid response");
    res.json(parsed);
  } catch (err) {
    console.error("Screener error:", err.message);
    res.status(500).json({ error: "Screener failed: " + err.message });
  }
});

// ── Earnings Calendar ──────────────────────────────────────────────────────
let earningsCache = {};  // keyed by sym, { data, ts }

app.post("/api/earnings", async (req, res) => {
  const { symbols } = req.body;
  if (!symbols?.length) return res.json({});
  if (!FMP_API_KEY) return res.json({});
  const base = "https://financialmodelingprep.com/stable";
  const key  = `apikey=${FMP_API_KEY}`;
  const now  = Date.now();
  const TTL  = 6 * 60 * 60 * 1000; // 6h cache per symbol
  const stockSyms = symbols.map(s => s.sym || s).filter(s => !COINGECKO_IDS[s.toUpperCase()]);
  const toFetch   = stockSyms.filter(s => !earningsCache[s] || now - earningsCache[s].ts > TTL);

  if (toFetch.length) {
    const results = await Promise.allSettled(
      toFetch.map(sym => fetch(`${base}/earnings?symbol=${sym}&limit=5&${key}`).then(r => r.json()))
    );
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        earningsCache[toFetch[i]] = { data: r.value, ts: now };
      }
    });
  }

  const out = {};
  stockSyms.forEach(s => { if (earningsCache[s]?.data) out[s] = earningsCache[s].data; });
  res.json(out);
});

// ── Portfolio Performance History ──────────────────────────────────────────
app.post("/api/portfolio/history", async (req, res) => {
  const { holdings, range } = req.body;
  if (!holdings?.length) return res.json({ series: [] });

  const audUsd = await getLiveAUDUSD();
  const YAHOO_RANGE = { "1m":"1mo", "3m":"3mo", "1y":"1y" };
  const yahooRange = YAHOO_RANGE[range] || "1mo";

  // Fetch daily OHLCV for every symbol in parallel
  const results = await Promise.allSettled(
    holdings.map(async h => {
      try {
        const isCrypto = !!COINGECKO_IDS[h.sym.toUpperCase()];
        const yahooSym = isCrypto ? `${h.sym.toUpperCase()}-USD` : h.sym;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=${yahooRange}&includePrePost=false`;
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const d = await r.json();
        const result = d?.chart?.result?.[0];
        if (!result) return null;
        const timestamps = result.timestamp || [];
        const closes    = result.indicators?.quote?.[0]?.close || [];
        const priceCcy  = result.meta?.currency || h.priceCurrency || "USD";
        // Map date string → close price
        const priceByDate = {};
        timestamps.forEach((ts, i) => {
          if (closes[i] == null) return;
          const date = new Date(ts * 1000).toISOString().slice(0, 10);
          priceByDate[date] = closes[i];
        });
        return { sym: h.sym, qty: h.qty, priceCcy, priceByDate };
      } catch (e) { return null; }
    })
  );

  const valid = results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
  if (!valid.length) return res.json({ series: [] });

  // Find latest "first date" so we only include days when all symbols have data
  const firstDatePerSym = valid.map(s => Object.keys(s.priceByDate).sort()[0]).filter(Boolean);
  const startDate = firstDatePerSym.length ? firstDatePerSym.reduce((a, b) => a > b ? a : b) : null;

  // Collect all dates, filtered to common start
  const allDates = new Set();
  valid.forEach(s => Object.keys(s.priceByDate).forEach(d => { if (!startDate || d >= startDate) allDates.add(d); }));
  const sortedDates = [...allDates].sort();

  // Build series: forward-fill each symbol's price, sum across portfolio
  const series = [];
  const lastKnown = {}; // sym → priceUSD
  for (const date of sortedDates) {
    for (const s of valid) {
      const price = s.priceByDate[date];
      if (price != null) {
        lastKnown[s.sym] = s.priceCcy === "AUD" ? price * audUsd : price;
      }
    }
    const dayVal = valid.reduce((acc, s) => acc + (lastKnown[s.sym] || 0) * s.qty, 0);
    if (dayVal > 0) series.push({ t: new Date(date + "T00:00:00Z").getTime(), v: dayVal });
  }

  if (series.length < 2) return res.json({ series: [] });
  const first = series[0].v, last = series[series.length - 1].v;
  res.json({ series, changePct: (last - first) / first * 100, first, last });
});

// ── Portfolio Risk Metrics ─────────────────────────────────────────────────
app.post("/api/portfolio/risk", async (req, res) => {
  const { holdings } = req.body;
  if (!holdings?.length) return res.json(null);

  const audUsd = await getLiveAUDUSD();

  // Fetch 1Y daily OHLCV for all holdings + S&P 500 benchmark in parallel
  const fetchTargets = [
    ...holdings.map(h => ({ ...h, isMarket: false })),
    { sym: "^GSPC", qty: 1, priceCurrency: "USD", isMarket: true },
  ];

  const results = await Promise.allSettled(
    fetchTargets.map(async h => {
      try {
        const isCrypto = !h.isMarket && !!COINGECKO_IDS[h.sym.toUpperCase()];
        const yahooSym = isCrypto ? `${h.sym.toUpperCase()}-USD` : h.sym;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=1y&includePrePost=false`;
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const d = await r.json();
        const result = d?.chart?.result?.[0];
        if (!result) return null;
        const timestamps = result.timestamp || [];
        const closes    = result.indicators?.quote?.[0]?.close || [];
        const priceCcy  = result.meta?.currency || h.priceCurrency || "USD";
        const priceByDate = {};
        timestamps.forEach((ts, i) => {
          if (closes[i] == null) return;
          priceByDate[new Date(ts * 1000).toISOString().slice(0, 10)] = closes[i];
        });
        return { ...h, priceCcy, priceByDate };
      } catch { return null; }
    })
  );

  const valid       = results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
  const portSyms    = valid.filter(s => !s.isMarket);
  const marketData  = valid.find(s => s.isMarket);
  if (!portSyms.length || !marketData) return res.json(null);

  // Build parallel portfolio + market value series (forward-fill)
  const allDates = new Set();
  portSyms.forEach(s => Object.keys(s.priceByDate).forEach(d => allDates.add(d)));
  Object.keys(marketData.priceByDate).forEach(d => allDates.add(d));

  const lastKnown = {};
  const portVals = [], mktVals = [];

  for (const date of [...allDates].sort()) {
    for (const s of portSyms) {
      if (s.priceByDate[date] != null)
        lastKnown[s.sym] = s.priceCcy === "AUD" ? s.priceByDate[date] * audUsd : s.priceByDate[date];
    }
    if (marketData.priceByDate[date] != null) lastKnown["__mkt"] = marketData.priceByDate[date];
    const pv = portSyms.reduce((a, s) => a + (lastKnown[s.sym] || 0) * s.qty, 0);
    if (pv > 0 && lastKnown["__mkt"]) { portVals.push(pv); mktVals.push(lastKnown["__mkt"]); }
  }

  if (portVals.length < 30) return res.json(null);

  // Daily returns
  const pRet = [], mRet = [];
  for (let i = 1; i < portVals.length; i++) {
    pRet.push((portVals[i] - portVals[i - 1]) / portVals[i - 1]);
    mRet.push((mktVals[i]  - mktVals[i - 1])  / mktVals[i - 1]);
  }

  const n     = pRet.length;
  const meanP = pRet.reduce((a, b) => a + b, 0) / n;
  const meanM = mRet.reduce((a, b) => a + b, 0) / n;
  const cov   = pRet.reduce((a, r, i) => a + (r - meanP) * (mRet[i] - meanM), 0) / (n - 1);
  const varM  = mRet.reduce((a, r)    => a + (r - meanM) ** 2,               0) / (n - 1);
  const beta  = varM > 0 ? cov / varM : null;

  const stdP       = Math.sqrt(pRet.reduce((a, r) => a + (r - meanP) ** 2, 0) / (n - 1));
  const volatility = stdP * Math.sqrt(252) * 100; // annualised %

  // Annualised return
  const annReturn = (Math.pow(portVals[portVals.length - 1] / portVals[0], 252 / portVals.length) - 1) * 100;

  // Sharpe (4.5% risk-free)
  const sharpe = volatility > 0 ? (annReturn / 100 - 0.045) / (volatility / 100) : null;

  // Max drawdown over the period
  let peak = portVals[0], maxDD = 0;
  for (const v of portVals) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  res.json({
    beta:        beta        != null ? Math.round(beta        * 100) / 100 : null,
    volatility:  Math.round(volatility  * 10) / 10,
    sharpe:      sharpe      != null ? Math.round(sharpe      * 100) / 100 : null,
    maxDrawdown: Math.round(maxDD * 1000) / 10, // negative %
    annReturn:   Math.round(annReturn   * 10)  / 10,
    nDays: portVals.length,
  });
});

// ── Benchmark comparison (^GSPC, ^AXJO) ───────────────────────────────────
let benchmarkCache = { data: null, ts: 0 };

app.get("/api/benchmarks", async (req, res) => {
  const now = Date.now();
  if (benchmarkCache.data && now - benchmarkCache.ts < 15 * 60 * 1000) {
    return res.json(benchmarkCache.data);
  }
  const fetchIndex = async (sym, name) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1y&includePrePost=false`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const d = await r.json();
      const result = d?.chart?.result?.[0];
      if (!result) return null;
      const closes = (result.indicators?.quote?.[0]?.close || []).filter(c => c != null);
      if (closes.length < 2) return null;
      const last = closes[closes.length - 1];
      const at = n => closes[Math.max(0, closes.length - 1 - n)];
      return {
        name,
        change1d:  last / at(1)   - 1,
        change1w:  last / at(5)   - 1,
        change1m:  last / at(21)  - 1,
        change3m:  last / at(63)  - 1,
        change1y:  last / at(251) - 1,
        price: last,
      };
    } catch (e) { return null; }
  };
  const [sp500, asx200] = await Promise.all([
    fetchIndex("^GSPC", "S&P 500"),
    fetchIndex("^AXJO", "ASX 200"),
  ]);
  const data = { sp500, asx200 };
  if (sp500 || asx200) benchmarkCache = { data, ts: now };
  res.json(data);
});

// ── Portfolio Dividends ────────────────────────────────────────────────────
let dividendCache = {};  // keyed by sym, { data, ts }

app.post("/api/portfolio/dividends", async (req, res) => {
  if (!FMP_API_KEY) return res.json({});
  const { symbols } = req.body;
  if (!symbols?.length) return res.json({});
  const base = "https://financialmodelingprep.com/stable";
  const key  = `apikey=${FMP_API_KEY}`;
  const now  = Date.now();
  const TTL  = 24 * 60 * 60 * 1000; // 24h — dividends change rarely

  // Skip crypto symbols
  const stockSyms = symbols.filter(s => !COINGECKO_IDS[s.toUpperCase()]);
  const toFetch   = stockSyms.filter(s => !dividendCache[s] || now - dividendCache[s].ts > TTL);

  if (toFetch.length) {
    // Process in chunks of 5 to stay within FMP free tier rate limits
    const chunks = [];
    for (let i = 0; i < toFetch.length; i += 5) chunks.push(toFetch.slice(i, i + 5));
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async sym => {
          try {
            const [kmData, divData] = await Promise.all([
              fetch(`${base}/key-metrics?symbol=${sym}&period=TTM&limit=1&${key}`).then(r => r.json()),
              fetch(`${base}/historical-dividends?symbol=${sym}&limit=4&${key}`).then(r => r.json()),
            ]);
            const km      = Array.isArray(kmData) ? kmData[0] : null;
            const lastDiv = divData?.historical?.[0] || null;
            dividendCache[sym] = {
              data: {
                yield:             km?.dividendYield    || 0,
                annualDivPerShare: km?.dividendPerShare || 0,
                exDivDate:         lastDiv?.date        || null,
                paymentDate:       lastDiv?.paymentDate || null,
              },
              ts: now,
            };
          } catch (e) {
            dividendCache[sym] = { data: { yield: 0, annualDivPerShare: 0, exDivDate: null, paymentDate: null }, ts: now };
          }
        })
      );
    }
  }

  const out = {};
  stockSyms.forEach(s => { if (dividendCache[s]?.data) out[s] = dividendCache[s].data; });
  res.json(out);
});

// ── Portfolio Coach ────────────────────────────────────────────────────────
app.post("/api/portfolio/coach", async (req, res) => {
  const { snapshot } = req.body;
  if (!snapshot || !snapshot.holdings?.length)
    return res.status(400).json({ error: "Portfolio snapshot required" });
  try {
    const today = new Date().toLocaleDateString("en-AU", { year:"numeric", month:"long", day:"numeric" });
    const lines = [
      `Total portfolio value: $${snapshot.totalValueUSD.toFixed(0)} USD`,
      `Positions: ${snapshot.holdings.length}`,
      `Asset split: ${snapshot.cryptoPct.toFixed(1)}% crypto / ${snapshot.stocksPct.toFixed(1)}% stocks/ETFs`,
      "", "HOLDINGS (sorted by weight):",
      ...snapshot.holdings.map(p =>
        `- ${p.sym} (${p.name}): ${p.pct.toFixed(1)}% = $${p.valueUSD.toFixed(0)} | type:${p.priceType} | sector:${p.sector} | unrealised:${p.unrealisedPct != null ? (p.unrealisedPct >= 0 ? "+" : "") + p.unrealisedPct.toFixed(1) + "%" : "n/a"}`
      ),
      "", "SECTOR BREAKDOWN:",
      ...Object.entries(snapshot.sectorBreakdown).sort((a,b) => b[1]-a[1]).map(([s,pct]) => `- ${s}: ${pct.toFixed(1)}%`),
    ];
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key":ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 2000,
        system: `You are a senior portfolio strategist. Today is ${today}. Analyse this portfolio and provide honest, actionable coaching. Be specific — name actual positions. Return ONLY valid JSON (no markdown fences):
{"grade":"A|B|C|D|F","gradeNote":"One sentence justifying the grade","summary":"2-3 sentences overall portfolio assessment","concentration":"2-3 sentences naming specific over-weight positions","diversification":"2-3 sentences on diversification quality","riskProfile":"AGGRESSIVE|BALANCED|CONSERVATIVE","riskNote":"1-2 sentences","strengths":["up to 3 short strength strings"],"weaknesses":["up to 3 short weakness strings"],"actions":[{"priority":"HIGH|MEDIUM|LOW","action":"Specific action to take","reason":"Why this matters"}],"sectorComment":"1-2 sentences on sector allocation","cryptoComment":"1-2 sentences on crypto allocation — omit key if no crypto","outlook":"1-2 sentences on portfolio outlook given current market conditions"}
Provide 2-4 specific, concrete actions.`,
        messages: [{ role:"user", content: lines.join("\n") }],
      }),
    });
    const d = await response.json();
    const text = d.content?.find(b => b.type === "text")?.text || "";
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("No JSON in response");
    res.json(JSON.parse(text.slice(s, e + 1)));
  } catch (err) {
    console.error("Portfolio coach error:", err.message);
    res.status(500).json({ error: "Coach analysis failed" });
  }
});

// ── Health ─────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({
  status: "ok",
  anthropic: !!ANTHROPIC_API_KEY,
  coinbase:  !!(COINBASE_API_KEY && COINBASE_API_SECRET),
  coinspot:  !!(COINSPOT_API_KEY && COINSPOT_API_SECRET),
  finnhub:   !!FINNHUB_API_KEY,
  fmp:       !!FMP_API_KEY,
  ipo:       !!FINNHUB_API_KEY,
}));

app.listen(PORT, () => {
  console.log(`✅ IntelIQ server running on port ${PORT}`);
  console.log(`   Anthropic: ${ANTHROPIC_API_KEY ? "✓" : "✗ missing"}`);
  console.log(`   Coinbase:  ${COINBASE_API_KEY  ? "✓" : "✗ not configured"}`);
  console.log(`   CoinSpot:  ${COINSPOT_API_KEY  ? "✓" : "✗ not configured"}`);
  console.log(`   Finnhub:   ${FINNHUB_API_KEY   ? "✓" : "✗ optional"}`);
  console.log(`   FMP:       ${FMP_API_KEY        ? "✓" : "✗ not configured (fundamentals disabled)"}`);
});
