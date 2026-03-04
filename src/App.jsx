import { useState, useEffect, useRef, createContext, useContext } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&display=swap";
document.head.appendChild(fontLink);

const css = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:      #120f1e;
    --sidebar: #1a1630;
    --surface: #1e1a2e;
    --card:    #252040;
    --card2:   #2a2545;
    --border:  #332e50;
    --border2: #3d3760;
    --green:   #00e676;
    --red:     #ff5252;
    --amber:   #ffab40;
    --blue:    #448aff;
    --purple:  #e040fb;
    --text:    #e8e4f0;
    --text2:   #ffffff;
    --muted:   #7b7599;
    --muted2:  #a89ec0;
    --ff-head: 'Outfit', sans-serif;
    --ff-body: 'DM Sans', sans-serif;
    --ff-mono: 'DM Mono', monospace;
  }
  html,body,#root { height:100%; }
  body { background:var(--bg); color:var(--text); font-family:var(--ff-body); -webkit-font-smoothing:antialiased; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:4px; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .fu  { animation:fadeUp .3s ease both; }
  .fu2 { animation:fadeUp .3s .06s ease both; }
  .fu3 { animation:fadeUp .3s .12s ease both; }
  .fi  { animation:fadeIn .25s ease both; }
  .shimmer-el {
    background:linear-gradient(90deg,var(--card) 25%,var(--card2) 50%,var(--card) 75%);
    background-size:400px 100%; animation:shimmer 1.5s infinite; border-radius:6px;
  }
  button { font-family:var(--ff-body); cursor:pointer; transition:all .15s; }
  input { font-family:var(--ff-body); }
  input::placeholder { color:var(--muted); }
  input:focus { outline:none; }
  .nav-item {
    display:flex; align-items:center; gap:10px; padding:10px 16px;
    border-radius:10px; cursor:pointer; color:var(--muted2); font-size:13px;
    font-weight:500; border:none; background:none; width:100%; text-align:left;
  }
  .nav-item:hover { background:#ffffff08; color:var(--text2); }
  .nav-item.active { background:linear-gradient(135deg,#00e67620,#00e67608); color:var(--green); border:1px solid #00e67625; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:14px; }
  .badge { display:inline-flex; align-items:center; justify-content:center; border-radius:6px; padding:3px 8px; font-size:10px; font-family:var(--ff-mono); font-weight:600; letter-spacing:0.06em; }
  .drop-zone { border:2px dashed var(--border2); border-radius:12px; padding:36px; text-align:center; cursor:pointer; transition:all .2s; }
  .drop-zone:hover,.drop-zone.drag { border-color:var(--green); background:#00e67608; }
  .pill-toggle { display:inline-flex; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:3px; gap:2px; }
  .pill-toggle button { border:none; border-radius:6px; padding:5px 14px; font-size:11px; font-family:var(--ff-mono); letter-spacing:0.04em; color:var(--muted); background:none; }
  .pill-toggle button.active { background:var(--green); color:#0a0a14; font-weight:700; }
  .section-label { font-size:10px; font-family:var(--ff-mono); color:var(--muted); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:14px; }
  .holding-row { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:16px 20px; cursor:pointer; transition:all .15s; }
  .holding-row:hover { border-color:var(--border2); background:var(--card2); }
  .stat-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:20px; }
  .filter-btn { border-radius:8px; padding:7px 16px; font-size:11px; font-family:var(--ff-mono); letter-spacing:0.06em; border:1px solid var(--border); background:none; color:var(--muted2); }
  .filter-btn.active { background:#00e67618; border-color:#00e67640; color:var(--green); }
  .epl-form-bar { display:flex; gap:4; justify-content:center; }
  .epl-prob { border-radius:6px; padding:4px 10px; font-size:11px; font-family:var(--ff-mono); font-weight:600; border:1px solid; }
`;

// ── Static data ────────────────────────────────────────────────────────────
// Dashboard picks are now generated live by Claude — see /api/dashboard/picks

const NEWS_MOCK = [
  { time:"2h ago",  tag:"US TECH",    headline:"Fed minutes signal two rate cuts possible — growth stocks begin re-rating",          sentiment:"BULLISH", impact:"HIGH",   affected:["NVDA","MSFT","AAPL"],        commentary:"Rate-sensitive growth stocks are the primary beneficiary. Confirms macro tailwind underpinning our NVDA BUY thesis." },
  { time:"4h ago",  tag:"ASX MINING", headline:"China PMI beats expectations — iron ore +3.2%, copper surges to 3-month high",       sentiment:"BULLISH", impact:"MEDIUM", affected:["BHP.AX","RIO.AX","FMG.AX"],  commentary:"Short-term positive for ASX majors. Boosts sentiment across resources broadly." },
  { time:"6h ago",  tag:"CRYPTO",     headline:"BlackRock Bitcoin ETF crosses $15B AUM — fastest ETF growth in history",             sentiment:"BULLISH", impact:"HIGH",   affected:["BTC","ETH"],                 commentary:"Structural, not speculative. Institutional allocation now systematic." },
  { time:"9h ago",  tag:"ASX MINING", headline:"Lithium spot price stabilises for second consecutive week — floor forming?",         sentiment:"NEUTRAL", impact:"MEDIUM", affected:["PLS.AX","LTR.AX","AKE.AX"],  commentary:"Rate of decline has slowed. Supports WATCH on PLS.AX." },
];

// ── Glossary ───────────────────────────────────────────────────────────────
const GLOSSARY = [
  { term:"Double Bottom",              def:"A bullish reversal chart pattern forming a 'W' shape, where price hits the same low twice before reversing upward. Signals seller exhaustion and a potential trend change to the upside." },
  { term:"Double Top",                 def:"A bearish reversal chart pattern forming an 'M' shape, where price hits the same high twice before reversing downward. Signals buyer exhaustion and a potential trend change to the downside." },
  { term:"Head and Shoulders",         def:"A bearish reversal pattern with three peaks: a higher middle peak (the head) flanked by two lower peaks (the shoulders). A decisive break below the neckline confirms the reversal." },
  { term:"Inverse Head and Shoulders", def:"The bullish mirror of Head and Shoulders: three troughs with the middle deepest. A break above the neckline signals upward momentum and a potential trend reversal." },
  { term:"Bull Flag",                  def:"A bullish continuation pattern: a sharp surge (the flagpole) followed by a brief downward consolidation (the flag). A breakout above the flag typically resumes the uptrend." },
  { term:"Bear Flag",                  def:"A bearish continuation pattern: a sharp decline followed by a brief upward consolidation. A breakdown below the flag typically resumes the downtrend." },
  { term:"Cup and Handle",             def:"A bullish continuation pattern resembling a teacup: a rounded bottom (cup) followed by a short consolidation (handle). A breakout above the handle is the buy signal." },
  { term:"Ascending Triangle",         def:"A bullish pattern with a flat resistance line and a rising support trendline. Price coils upward — a breakout above resistance signals continued strength." },
  { term:"Descending Triangle",        def:"A bearish pattern with a flat support line and a falling resistance trendline. A breakdown below support signals continued weakness." },
  { term:"Symmetrical Triangle",       def:"A neutral consolidation pattern with converging trendlines, reflecting indecision. The breakout direction determines the next significant move." },
  { term:"Falling Wedge",              def:"A bullish pattern where price consolidates between two downward-sloping, converging trendlines. A breakout above the upper line signals a reversal or continuation upward." },
  { term:"Rising Wedge",               def:"A bearish pattern where price consolidates between two upward-sloping, converging trendlines. Despite rising price, weakening momentum often precedes a breakdown." },
  { term:"Pennant",                    def:"A short-term continuation pattern following a strong move: price consolidates in a small symmetrical triangle before typically continuing in the original direction." },
  { term:"Hammer",                     def:"A bullish reversal candlestick with a small body and long lower wick. Signals that sellers pushed price down intraday but buyers recovered strongly by the close." },
  { term:"Shooting Star",              def:"A bearish reversal candlestick with a small body and long upper wick. Signals that buyers pushed price up intraday but sellers overwhelmed them by the close." },
  { term:"Doji",                       def:"A candlestick where open and close are nearly equal, leaving a very small body. Signals market indecision — a Doji after a strong trend may indicate a reversal is near." },
  { term:"Engulfing",                  def:"A two-candle reversal pattern. Bullish Engulfing: a large green candle fully covers the prior red candle. Bearish Engulfing: the reverse. Both signal potential trend reversals." },
  { term:"Support",                    def:"A price level where buying interest has historically been strong enough to halt a decline. Acts as a floor — the more times price bounces off it, the stronger the level." },
  { term:"Resistance",                 def:"A price level where selling pressure has historically been strong enough to halt an advance. Acts as a ceiling — once broken, resistance often flips to become support." },
  { term:"Breakout",                   def:"When price moves decisively above a key resistance level, often on elevated volume. Signals that buyers have overcome supply and a new upward move is likely." },
  { term:"Breakdown",                  def:"When price moves decisively below a key support level, often on elevated volume. Signals that sellers have overcome demand and a new downward move is likely." },
  { term:"Consolidation",              def:"A period of sideways price movement within a defined range, reflecting a balance between buyers and sellers. Often precedes a significant breakout or breakdown." },
  { term:"Moving Average",             def:"The average closing price over a set number of periods (e.g. 50-day or 200-day MA). Smooths price noise and identifies trend direction. Price above a moving average is generally bullish." },
  { term:"RSI",                        def:"Relative Strength Index. A momentum oscillator scaled 0–100 measuring the speed of price changes. Above 70 suggests overbought conditions; below 30 suggests oversold." },
  { term:"MACD",                       def:"Moving Average Convergence Divergence. A momentum indicator using two moving averages. A bullish crossover (MACD above signal line) suggests upward momentum; a bearish crossover suggests the reverse." },
  { term:"Momentum",                   def:"The rate of acceleration in price movement. Strong momentum confirms a trend; fading momentum often precedes a reversal. Measured by RSI, MACD, and rate of change." },
  { term:"Overbought",                 def:"A condition where a security has risen sharply and may be due for a pullback. Typically indicated by RSI above 70. Overbought assets can remain overbought in strong trends." },
  { term:"Oversold",                   def:"A condition where a security has fallen sharply and may be due for a bounce. Typically indicated by RSI below 30. Oversold assets can remain oversold in strong downtrends." },
  { term:"Retracement",                def:"A temporary price reversal against the prevailing trend before it resumes. Fibonacci retracement levels (38.2%, 50%, 61.8%) are common areas where price finds support during a pullback." },
  { term:"Neckline",                   def:"In Head and Shoulders patterns, the trendline connecting the reaction lows (or highs). A decisive break of the neckline confirms the pattern and sets a price target." },
  { term:"Higher High",                def:"When the most recent price peak exceeds the prior peak. A series of higher highs (and higher lows) defines an uptrend." },
  { term:"Lower Low",                  def:"When the most recent trough falls below the prior trough. A series of lower lows (and lower highs) defines a downtrend." },
  { term:"Stop Loss",                  def:"A pre-defined price at which a position is closed to cap losses. Critical risk management — prevents a small loss from becoming a large one if the trade moves against you." },
  { term:"Volatility",                 def:"The degree of price variation over time. High volatility means larger swings and higher uncertainty; low volatility means more stable, predictable price action." },
  { term:"Volume",                     def:"The total number of shares or coins traded in a given period. Volume confirms price moves — a breakout on high volume is more reliable than one on low volume." },
  { term:"Candlestick",                def:"A chart bar showing the open, high, low, and close for a time period. Green candles close higher than they opened; red close lower. Patterns signal reversals or continuations." },
  { term:"OHLCV",                      def:"Open, High, Low, Close, Volume — the five data points that make up each candlestick. The foundation of all technical chart analysis." },
  { term:"Market Cap",                 def:"Total market capitalisation: share price × total shares outstanding. Used to classify companies — large-cap (>$10B), mid-cap ($2–10B), small-cap (<$2B)." },
  { term:"Dollar Cost Averaging",      def:"Investing a fixed amount at regular intervals regardless of price. Reduces timing risk — you buy more units when cheap and fewer when expensive." },
  { term:"P&L",                        def:"Profit and Loss. Unrealised P&L exists while the position is open; realised P&L is locked in when closed. Calculated as (current price − average cost) / average cost × 100%." },
];

const TABS = [
  { id:"dashboard", label:"Dashboard", icon:"◈" },
  { id:"explorer",  label:"Explorer",  icon:"◎" },
  { id:"screener",  label:"Screener",  icon:"◰" },
  { id:"portfolio", label:"Portfolio", icon:"◑" },
  { id:"coach",     label:"Coach",     icon:"◭" },
  { id:"news",      label:"News",      icon:"◉" },
  { id:"macro",     label:"Macro",     icon:"◮" },
  { id:"watchlist", label:"Watchlist", icon:"◇" },
  { id:"earnings",  label:"Earnings",  icon:"◬" },
  { id:"ipo",       label:"IPO",       icon:"◆" },
  { id:"calls",     label:"Calls",     icon:"◐" },
  { id:"journal",   label:"Journal",   icon:"◫" },
];

const PORT_TABS = [
  { id:"all",      label:"All",        color:"var(--text2)" },
  { id:"coinbase", label:"Coinbase",   color:"var(--amber)" },
  { id:"coinspot", label:"CoinSpot",   color:"var(--green)" },
  { id:"cmc",      label:"CMC Invest", color:"var(--blue)"  },
];

// ── CMC CSV parser ─────────────────────────────────────────────────────────
function parseCMCcsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("Empty CSV");
  const headers = lines[0].replace(/^\uFEFF/, "").split(",").map(h => h.replace(/"/g, "").trim());
  const idx = n => headers.findIndex(h => h === n);
  const iCode = idx("Security Code"), iSector = idx("Sector"), iName = idx("Company Name");
  const iQty  = idx("Quantity"),       iAvg    = idx("Average Cost $");
  if (iCode === -1 || iQty === -1 || iAvg === -1)
    throw new Error("Unrecognised format — expected CMC Invest Portfolio Report CSV");

  const holdings = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim(); if (!line) continue;
    const cols = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());

    const rawCode  = cols[iCode] || "";
    const qty      = parseFloat(cols[iQty]);
    const avgAUD   = parseFloat(cols[iAvg]);

    if (!rawCode || isNaN(qty) || isNaN(avgAUD) || qty <= 0) continue;

    const isUS = /:\s*US$/i.test(rawCode);
    let sym = rawCode.replace(/:US$/i, "").trim();
    if (!isUS && !sym.endsWith(".AX")) sym += ".AX";

    holdings.push({
      sym, name: cols[iName] || sym, qty,
      avg: avgAUD, avgCurrency: "AUD",
      priceCurrency: isUS ? "USD" : "AUD",
      sector: cols[iSector] || "Unknown",
      horizon: "Medium", priceType: "stock", source: "cmc", rawCode,
    });
  }
  if (!holdings.length) throw new Error("No valid holdings found in CSV");
  return holdings;
}

// ── Currency helpers ───────────────────────────────────────────────────────
function toDisplay(amount, fromCcy, displayCcy, audUsd) {
  if (amount == null || isNaN(amount)) return null;
  if (fromCcy === displayCcy) return amount;
  if (fromCcy === "USD" && displayCcy === "AUD") return amount / audUsd;
  if (fromCcy === "AUD" && displayCcy === "USD") return amount * audUsd;
  return amount;
}

function fmtMoney(v, ccy) {
  if (v == null || isNaN(v)) return "—";
  const s = ccy === "AUD" ? "A$" : "$";
  if (Math.abs(v) >= 1_000_000) return `${s}${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `${s}${v.toLocaleString("en", { maximumFractionDigits: 0 })}`;
  if (Math.abs(v) >= 1)         return `${s}${v.toFixed(2)}`;
  return `${s}${v.toFixed(4)}`;
}

function calcPnl(holding, livePriceData, audUsd) {
  const livePrice = livePriceData?.price;
  if (!livePrice || !holding.avg) return { pct: "—", up: true, raw: 0, valid: false };
  const priceCcy = holding.priceCurrency || livePriceData?.currency || "USD";
  const priceUSD = toDisplay(livePrice, priceCcy, "USD", audUsd);
  const avgUSD   = toDisplay(holding.avg, holding.avgCurrency || "USD", "USD", audUsd);
  if (!priceUSD || !avgUSD) return { pct: "—", up: true, raw: 0, valid: false };
  const p = ((priceUSD - avgUSD) / avgUSD) * 100;
  return { pct: (p >= 0 ? "+" : "") + p.toFixed(1) + "%", up: p >= 0, raw: p, valid: true };
}

function parseTargetNum(targetStr) {
  if (!targetStr) return null;
  const s = targetStr.replace(/[$,\s]/g, "");
  if (/k$/i.test(s)) return parseFloat(s) * 1000;
  if (/m$/i.test(s)) return parseFloat(s) * 1_000_000;
  return parseFloat(s) || null;
}

const nowTime = () => new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

// ── Glossary context & linkifier ───────────────────────────────────────────
const GlossaryCtx = createContext({ allGlossary: GLOSSARY, openGlossary: () => {} });

function linkifyText(text, onTermClick, glossary) {
  if (!text || !onTermClick) return text;
  const gl = glossary || GLOSSARY;
  const sorted = [...gl].sort((a, b) => b.term.length - a.term.length);
  const escaped = sorted.map(g => g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const match = gl.find(g => g.term.toLowerCase() === part.toLowerCase());
    if (match) {
      return (
        <span key={i} onClick={() => onTermClick(match.term)}
          style={{ color:"var(--amber)", borderBottom:"1px dotted #ffab4070", cursor:"pointer" }}
          title={`Click to define: ${match.term}`}>
          {part}
        </span>
      );
    }
    return part;
  });
}

// Consume context — drop-in wrapper for any text that should have linked terms
function LinkedText({ children }) {
  const { allGlossary, openGlossary } = useContext(GlossaryCtx);
  if (!children) return null;
  return <>{linkifyText(String(children), openGlossary, allGlossary)}</>;
}

// ── Atoms ──────────────────────────────────────────────────────────────────
function VerdictBadge({ v }) {
  const m = { BUY:{bg:"#00e67620",c:"#00e676",b:"#00e67640"}, WATCH:{bg:"#ffab4020",c:"#ffab40",b:"#ffab4040"}, AVOID:{bg:"#ff525220",c:"#ff5252",b:"#ff525240"}, SELL:{bg:"#ff525220",c:"#ff5252",b:"#ff525240"}, HOLD:{bg:"#ffffff10",c:"#a89ec0",b:"#3d3760"} };
  const s = m[v] || m.HOLD;
  return <span className="badge" style={{ background:s.bg, color:s.c, border:`1px solid ${s.b}` }}>{v}</span>;
}

function ConvictionDots({ level }) {
  const n = { HIGH:3, MEDIUM:2, LOW:1 }[level] || 1;
  return (
    <span style={{ display:"flex", gap:4, alignItems:"center" }}>
      {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:i<n?"var(--green)":"var(--border2)" }}/>)}
      <span style={{ fontSize:10, color:"var(--muted2)", fontFamily:"var(--ff-mono)", marginLeft:2 }}>{level}</span>
    </span>
  );
}

function SourceBadge({ source }) {
  const m = { coinbase:{l:"CB",c:"var(--amber)"}, coinspot:{l:"CS",c:"var(--green)"}, cmc:{l:"CMC",c:"var(--blue)"} };
  const s = m[source] || { l:"?", c:"var(--muted)" };
  return <span className="badge" style={{ background:`${s.c}20`, color:s.c, border:`1px solid ${s.c}40` }}>{s.l}</span>;
}

function SectorBadge({ sector }) {
  const m = { "US Tech":"#448aff","Technology":"#448aff","ASX Mining":"#ffab40","Materials":"#ffab40","Crypto":"#e040fb","Energy":"#ff6e40","Health Care":"#00e5ff","Communications":"#69f0ae" };
  const c = m[sector] || "var(--muted2)";
  return <span className="badge" style={{ background:`${c}18`, color:c, border:`1px solid ${c}35` }}>{sector}</span>;
}

function CurrencyToggle({ value, onChange }) {
  return (
    <div className="pill-toggle">
      <button className={value==="USD"?"active":""} onClick={()=>onChange("USD")}>USD</button>
      <button className={value==="AUD"?"active":""} onClick={()=>onChange("AUD")}>AUD</button>
    </div>
  );
}

// ── Summary strip ──────────────────────────────────────────────────────────
function SummaryStrip({ holdings, livePrices, displayCcy, audUsd }) {
  let totalValueUSD = 0, totalCostUSD = 0;
  let cryptoValueUSD = 0, cryptoCostUSD = 0;
  let stocksValueUSD = 0, stocksCostUSD = 0;

  for (const h of holdings) {
    const lp = livePrices[h.sym];
    const priceCcy = h.priceCurrency || lp?.currency || "USD";
    const livePrice = lp?.price;
    const priceUSD = livePrice ? toDisplay(livePrice, priceCcy, "USD", audUsd) : null;
    const avgUSD   = toDisplay(h.avg, h.avgCurrency || "USD", "USD", audUsd);
    const valueUSD = priceUSD != null ? h.qty * priceUSD : h.qty * avgUSD;
    const costUSD  = h.qty * avgUSD;
    totalValueUSD += valueUSD; totalCostUSD += costUSD;
    if (h.priceType === "crypto") { cryptoValueUSD += valueUSD; cryptoCostUSD += costUSD; }
    else                          { stocksValueUSD += valueUSD; stocksCostUSD += costUSD; }
  }

  const totalPnl  = totalCostUSD  > 0 ? ((totalValueUSD  - totalCostUSD)  / totalCostUSD)  * 100 : 0;
  const cryptoPnl = cryptoCostUSD > 0 ? ((cryptoValueUSD - cryptoCostUSD) / cryptoCostUSD) * 100 : null;
  const stocksPnl = stocksCostUSD > 0 ? ((stocksValueUSD - stocksCostUSD) / stocksCostUSD) * 100 : null;
  const totalValue  = toDisplay(totalValueUSD,              "USD", displayCcy, audUsd);
  const pnlAbsolute = toDisplay(totalValueUSD - totalCostUSD, "USD", displayCcy, audUsd);

  const items = [
    { l:"TOTAL VALUE", v:fmtMoney(totalValue, displayCcy),                                             c:"var(--text2)",  sub:null },
    { l:"TOTAL P&L",   v:`${totalPnl>=0?"+":""}${totalPnl.toFixed(1)}%`,                              c:totalPnl>=0?"var(--green)":"var(--red)", sub:fmtMoney(Math.abs(pnlAbsolute), displayCcy) },
    { l:"CRYPTO P&L",  v:cryptoPnl!=null?`${cryptoPnl>=0?"+":""}${cryptoPnl.toFixed(1)}%`:"—",       c:cryptoPnl==null?"var(--muted)":cryptoPnl>=0?"var(--green)":"var(--red)", sub:null },
    { l:"STOCKS P&L",  v:stocksPnl!=null?`${stocksPnl>=0?"+":""}${stocksPnl.toFixed(1)}%`:"—",       c:stocksPnl==null?"var(--muted)":stocksPnl>=0?"var(--green)":"var(--red)", sub:null },
    { l:"POSITIONS",   v:`${holdings.length}`,                                                         c:"var(--text2)",  sub:null },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
      {items.map(m => (
        <div key={m.l} className="stat-card">
          <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--muted)", letterSpacing:"0.12em", marginBottom:10 }}>{m.l}</div>
          <div style={{ fontSize:22, fontFamily:"var(--ff-head)", fontWeight:800, color:m.c, lineHeight:1 }}>{m.v}</div>
          {m.sub && <div style={{ fontSize:11, color:"var(--muted2)", marginTop:5, fontFamily:"var(--ff-mono)" }}>{m.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Holding row ────────────────────────────────────────────────────────────
function HoldingRow({ holding, livePrice, expanded, onToggle, onRemove, onViewChart, displayCcy, audUsd }) {
  const priceCcy  = holding.priceCurrency || livePrice?.currency || "USD";
  const rawPrice  = livePrice?.price || null;
  const dispPrice = rawPrice ? toDisplay(rawPrice, priceCcy, displayCcy, audUsd) : null;
  const dispAvg   = toDisplay(holding.avg, holding.avgCurrency || "USD", displayCcy, audUsd);
  const dispValue = dispPrice != null ? holding.qty * dispPrice : null;
  const pnl = calcPnl(holding, livePrice, audUsd);
  const accent = pnl.raw > 5 ? "var(--green)" : pnl.raw < -5 ? "var(--red)" : "var(--amber)";

  return (
    <div className="holding-row" style={{ borderLeft:`3px solid ${rawPrice ? accent : "var(--border)"}` }} onClick={onToggle}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:14, alignItems:"center", minWidth:0 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`${accent}18`, border:`1px solid ${accent}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontFamily:"var(--ff-head)", fontSize:11, fontWeight:800, color:accent }}>{holding.sym.replace(".AX","").slice(0,3)}</span>
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"var(--ff-head)", fontSize:15, fontWeight:700, color:"var(--text2)" }}>{holding.sym}</span>
              <SourceBadge source={holding.source}/>
              <SectorBadge sector={holding.sector}/>
            </div>
            <div style={{ fontSize:12, color:"var(--muted2)" }}>{holding.name}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--muted)", letterSpacing:"0.1em", marginBottom:4 }}>VALUE ({displayCcy})</div>
            {dispValue != null
              ? <div style={{ fontFamily:"var(--ff-mono)", fontSize:15, fontWeight:500, color:"var(--text2)" }}>{fmtMoney(dispValue, displayCcy)}</div>
              : <div className="shimmer-el" style={{ width:72, height:15 }}/>}
            <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"var(--ff-mono)", marginTop:2 }}>
              {holding.qty % 1 === 0 ? holding.qty : holding.qty.toFixed(4)} × {dispAvg ? fmtMoney(dispAvg, displayCcy) : "—"}
            </div>
          </div>
          <div style={{ textAlign:"right", minWidth:70 }}>
            <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--muted)", letterSpacing:"0.1em", marginBottom:4 }}>P&L</div>
            <div style={{ fontFamily:"var(--ff-mono)", fontSize:15, fontWeight:600, color:pnl.up?"var(--green)":"var(--red)" }}>{pnl.pct}</div>
            {livePrice && <div style={{ fontSize:10, color:livePrice.up?"var(--green)":"var(--red)", marginTop:2, fontFamily:"var(--ff-mono)" }}>{livePrice.changeStr} today</div>}
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:12 }} onClick={e => e.stopPropagation()}>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[
              { l:"LIVE PRICE",   v:dispPrice ? fmtMoney(dispPrice, displayCcy) : "Loading…" },
              { l:"AVG COST",     v:dispAvg   ? fmtMoney(dispAvg, displayCcy)   : "—" },
              { l:"QUANTITY",     v:holding.qty % 1 === 0 ? `${holding.qty}` : holding.qty.toFixed(6) },
              { l:"MARKET VALUE", v:fmtMoney(dispValue, displayCcy) },
              { l:"TODAY",        v:livePrice?.changeStr || "—" },
              { l:"PRICE CCY",    v:priceCcy },
            ].map(f => (
              <div key={f.l}>
                <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--muted)", letterSpacing:"0.1em", marginBottom:4 }}>{f.l}</div>
                <div style={{ fontSize:13, fontFamily:"var(--ff-mono)", color:"var(--text2)", fontWeight:500 }}>{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            {onViewChart && (
              <button onClick={e=>{e.stopPropagation();onViewChart();}} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"7px 14px", color:"var(--muted2)", fontSize:11, fontFamily:"var(--ff-mono)", letterSpacing:"0.06em" }}>
                CHART
              </button>
            )}
            {onRemove && (
              <button onClick={e=>{e.stopPropagation();onRemove();}} style={{ background:"#ff525218", border:"1px solid #ff525240", borderRadius:8, padding:"7px 14px", color:"var(--red)", fontSize:11, fontFamily:"var(--ff-mono)", letterSpacing:"0.06em" }}>
                REMOVE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Source panel ───────────────────────────────────────────────────────────
function SourcePanel({ label, color, holdings, livePrices, syncing, lastSync, error, onSync, onRemove, onViewChart, displayCcy, audUsd }) {
  const [portExp, setPortExp] = useState(null);
  let totalValueUSD = 0, totalCostUSD = 0;
  for (const h of holdings) {
    const lp = livePrices[h.sym];
    const priceCcy = h.priceCurrency || lp?.currency || "USD";
    const priceUSD = lp?.price ? toDisplay(lp.price, priceCcy, "USD", audUsd) : null;
    const avgUSD   = toDisplay(h.avg, h.avgCurrency || "USD", "USD", audUsd);
    totalValueUSD += priceUSD != null ? h.qty * priceUSD : h.qty * avgUSD;
    totalCostUSD  += h.qty * avgUSD;
  }
  const pnl = totalCostUSD > 0 ? ((totalValueUSD - totalCostUSD) / totalCostUSD) * 100 : 0;
  const totalDisp = toDisplay(totalValueUSD, "USD", displayCcy, audUsd);

  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:color, boxShadow:`0 0 8px ${color}80` }}/>
          <span style={{ fontSize:13, fontFamily:"var(--ff-head)", fontWeight:700, color }}>{label}</span>
          {holdings.length > 0 && (
            <span style={{ fontSize:11, fontFamily:"var(--ff-mono)", color:"var(--muted2)" }}>
              {holdings.length} positions · {fmtMoney(totalDisp, displayCcy)} · <span style={{ color:pnl>=0?"var(--green)":"var(--red)" }}>{pnl>=0?"+":""}{pnl.toFixed(1)}%</span>
            </span>
          )}
          {lastSync && <span style={{ fontSize:10, fontFamily:"var(--ff-mono)", color:"var(--muted)" }}>synced {lastSync}</span>}
        </div>
        {onSync && (
          <button onClick={onSync} disabled={syncing} style={{ background:syncing?"none":"#00e67610", border:`1px solid ${syncing?"var(--border)":"#00e67640"}`, borderRadius:8, padding:"7px 16px", fontSize:10, color:syncing?"var(--muted)":"var(--green)", fontFamily:"var(--ff-mono)", letterSpacing:"0.06em", opacity:syncing?.5:1 }}>
            {syncing ? "↻ SYNCING…" : "↻ SYNC"}
          </button>
        )}
      </div>
      {error && (
        <div style={{ background:"#ff525212", border:"1px solid #ff525230", borderRadius:10, padding:"14px 18px", marginBottom:14 }}>
          <div style={{ fontSize:10, fontFamily:"var(--ff-mono)", color:"var(--red)", letterSpacing:"0.08em", marginBottom:5 }}>CONNECTION ERROR</div>
          <p style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>{error}</p>
        </div>
      )}
      {holdings.length > 0 ? (
        <div style={{ display:"grid", gap:8 }}>
          {holdings.map(h => (
            <HoldingRow key={h.sym} holding={h} livePrice={livePrices[h.sym]} expanded={portExp===h.sym} onToggle={()=>setPortExp(p=>p===h.sym?null:h.sym)} onRemove={()=>onRemove(h.sym)} onViewChart={onViewChart?()=>onViewChart(h):null} displayCcy={displayCcy} audUsd={audUsd}/>
          ))}
        </div>
      ) : !error && (
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:"32px", textAlign:"center" }}>
          <p style={{ color:"var(--muted2)", fontSize:13 }}>{syncing ? "Connecting…" : "No holdings found. Check your API keys in .env"}</p>
        </div>
      )}
    </div>
  );
}

// ── CMC import ─────────────────────────────────────────────────────────────
function CMCImport({ onImport }) {
  const [drag,setDrag]=useState(false), [error,setError]=useState(""), [busy,setBusy]=useState(false);
  const ref = useRef(null);
  function process(file) {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file"); return; }
    setBusy(true); setError("");
    const r = new FileReader();
    r.onload = e => { try { onImport(parseCMCcsv(e.target.result)); } catch(err) { setError(err.message); } setBusy(false); };
    r.readAsText(file);
  }
  return (
    <div>
      <div className={`drop-zone${drag?" drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);process(e.dataTransfer.files[0]);}} onClick={()=>ref.current?.click()}>
        <input ref={ref} type="file" accept=".csv" style={{display:"none"}} onChange={e=>process(e.target.files[0])}/>
        <div style={{fontSize:28,color:"var(--green)",marginBottom:10}}>↑</div>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text2)",fontFamily:"var(--ff-head)",marginBottom:5}}>{busy?"Importing…":"Drop your CMC Invest CSV here"}</div>
        <div style={{fontSize:12,color:"var(--muted2)"}}>Account → Reports → Portfolio Report → Download CSV</div>
      </div>
      {error && <div style={{marginTop:10,background:"#ff525212",border:"1px solid #ff525230",borderRadius:8,padding:"10px 14px",fontSize:12,color:"var(--red)"}}>{error}</div>}
    </div>
  );
}

// ── Reasoning chain ────────────────────────────────────────────────────────
function ReasoningChain({ stock }) {
  const [open,setOpen]=useState(null);
  const layers=[
    {key:"macro",       icon:"◎",label:"MACRO ENVIRONMENT"},
    {key:"fundamental", icon:"◈",label:"FUNDAMENTALS"},
    {key:"technical",   icon:"◇",label:"TECHNICAL ANALYSIS"},
    {key:"sentiment",   icon:"◉",label:"MARKET SENTIMENT"},
    {key:"insider",     icon:"◐",label:"INSIDER ACTIVITY"},
    {key:"portfolio",   icon:"◑",label:"PORTFOLIO FIT"},
  ];
  return (
    <div style={{marginTop:20,paddingTop:20,borderTop:"1px solid var(--border)"}}>
      <div className="section-label">REASONING CHAIN</div>
      {layers.map((l,i)=>(
        <div key={l.key} style={{marginBottom:4}}>
          {i>0&&<div style={{width:2,height:8,background:"var(--border2)",marginLeft:18,marginBottom:4}}/>}
          <button onClick={()=>setOpen(open===l.key?null:l.key)} style={{width:"100%",background:open===l.key?"#00e67608":"none",border:`1px solid ${open===l.key?"#00e67640":"var(--border)"}`,borderRadius:10,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:14,color:open===l.key?"var(--green)":"var(--muted2)"}}>{l.icon}</span>
              <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:open===l.key?"var(--green)":"var(--muted2)",letterSpacing:"0.08em"}}>{l.label}</span>
            </span>
            <span style={{fontSize:12,color:"var(--muted)",transform:open===l.key?"rotate(180deg)":"none",transition:"transform .2s",display:"inline-block"}}>▾</span>
          </button>
          {open===l.key&&(
            <div style={{background:"var(--surface)",border:"1px solid #00e67625",borderTop:"none",borderRadius:"0 0 10px 10px",padding:"14px 18px"}}>
              <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7}}><LinkedText>{stock[l.key]}</LinkedText></p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Stock card ─────────────────────────────────────────────────────────────
function StockCard({ stock, expanded, onToggle, livePrices, displayCcy, audUsd, onAddWatchlist, inWatchlist, onViewChart }) {
  const accent = {BUY:"var(--green)",WATCH:"var(--amber)",AVOID:"var(--red)",HOLD:"var(--border2)"}[stock.verdict]||"var(--border2)";
  const ld = livePrices?.[stock.sym];
  const priceCcy = stock.priceCurrency || ld?.currency || "USD";
  const rawPrice = ld?.price || stock.priceStatic;
  const dispPrice = toDisplay(rawPrice, priceCcy, displayCcy, audUsd);

  return (
    <div className="card" style={{borderLeft:`3px solid ${accent}`,padding:22,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
            <span style={{fontFamily:"var(--ff-head)",fontSize:20,fontWeight:800,color:"var(--text2)"}}>{stock.sym}</span>
            <span style={{fontSize:13,color:"var(--muted2)"}}>{stock.name}</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
            <SectorBadge sector={stock.sector}/>
            <ConvictionDots level={stock.conviction}/>
            <span className="badge" style={{background:"var(--surface)",color:"var(--muted2)",border:"1px solid var(--border)"}}>{stock.horizon} term</span>
          </div>
          <VerdictBadge v={stock.verdict}/>
        </div>
        <div style={{textAlign:"right",flexShrink:0,minWidth:100}}>
          <div style={{fontFamily:"var(--ff-mono)",fontSize:20,fontWeight:600,color:"var(--text2)",marginBottom:3}}>{fmtMoney(dispPrice,displayCcy)}</div>
          {ld && !ld.error
            ? <div style={{fontFamily:"var(--ff-mono)",fontSize:12,color:ld.up?"var(--green)":"var(--red)"}}>{ld.changeStr}</div>
            : <div style={{fontFamily:"var(--ff-mono)",fontSize:12,color:stock.up?"var(--green)":"var(--red)"}}>{stock.upside}</div>}
          <div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontFamily:"var(--ff-mono)"}}>tgt {stock.target}</div>
        </div>
      </div>
      <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7,marginTop:14}}><LinkedText>{stock.summary}</LinkedText></p>
      {expanded&&<ReasoningChain stock={stock}/>}
      <div style={{marginTop:14,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <button onClick={onToggle} style={{background:"none",border:"none",fontSize:10,color:"var(--green)",fontFamily:"var(--ff-mono)",padding:0,letterSpacing:"0.08em",display:"flex",alignItems:"center",gap:5}}>
          <span style={{transform:expanded?"rotate(180deg)":"none",transition:"transform .2s",display:"inline-block"}}>▾</span>
          {expanded?"COLLAPSE":"REASONING CHAIN"}
        </button>
        {onAddWatchlist && (
          <button onClick={onAddWatchlist} style={{background:inWatchlist?"#00e67612":"none",border:`1px solid ${inWatchlist?"#00e67640":"var(--border)"}`,borderRadius:7,padding:"5px 14px",fontSize:10,color:inWatchlist?"var(--green)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
            {inWatchlist ? "✓ WATCHLIST" : "+ WATCHLIST"}
          </button>
        )}
        {onViewChart && (
          <button onClick={onViewChart} style={{background:"none",border:"1px solid var(--border)",borderRadius:7,padding:"5px 14px",fontSize:10,color:"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
            CHART →
          </button>
        )}
      </div>
    </div>
  );
}

// ── News card ──────────────────────────────────────────────────────────────
function NewsCard({ item }) {
  const [open,setOpen]=useState(false);
  const tagC={"US TECH":"var(--blue)","ASX MINING":"var(--amber)","CRYPTO":"var(--purple)","MARKETS":"var(--muted2)"};
  const sentC={BULLISH:"var(--green)",BEARISH:"var(--red)",NEUTRAL:"var(--muted2)"};
  return (
    <div className="card" style={{padding:20,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
            <span className="badge" style={{background:`${tagC[item.tag]||"var(--muted)"}20`,color:tagC[item.tag]||"var(--muted2)",border:`1px solid ${tagC[item.tag]||"var(--border)"}40`}}>{item.tag}</span>
            <span className="badge" style={{background:`${sentC[item.sentiment]}15`,color:sentC[item.sentiment],border:`1px solid ${sentC[item.sentiment]}35`}}>{item.sentiment}</span>
            <span style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>{item.time}</span>
            {item.live && <span className="badge" style={{background:"#00e67612",color:"var(--green)",border:"1px solid #00e67630"}}>LIVE</span>}
          </div>
          <p style={{fontSize:14,fontWeight:600,fontFamily:"var(--ff-head)",lineHeight:1.45,color:"var(--text2)",marginBottom:10}}>{item.headline}</p>
          {item.affected.length > 0 && (
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{item.affected.map(s=><span key={s} className="badge" style={{background:"var(--surface)",color:"var(--muted2)",border:"1px solid var(--border)"}}>{s}</span>)}</div>
          )}
        </div>
        <span className="badge" style={{background:"var(--surface)",color:"var(--muted2)",border:"1px solid var(--border)",flexShrink:0}}>IMPACT {item.impact}</span>
      </div>
      {item.commentary && (
        <>
          {open&&<div style={{marginTop:16,paddingTop:16,borderTop:"1px solid var(--border)"}}><div className="section-label">AI ANALYSIS</div><p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7}}><LinkedText>{item.commentary}</LinkedText></p></div>}
          <button onClick={()=>setOpen(!open)} style={{marginTop:14,background:"none",border:"none",fontSize:10,color:"var(--green)",fontFamily:"var(--ff-mono)",padding:0,letterSpacing:"0.08em",display:"flex",alignItems:"center",gap:5}}>
            <span style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s",display:"inline-block"}}>▾</span>
            {open?"HIDE ANALYSIS":"AI ANALYSIS"}
          </button>
        </>
      )}
      {item.link && (
        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:item.commentary?8:14,fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)",textDecoration:"none",letterSpacing:"0.06em"}}>READ FULL STORY →</a>
      )}
    </div>
  );
}


// ── IPO Card ───────────────────────────────────────────────────────────────
function IpoCard({ ipo, onAnalyse }) {
  const statusColor = { expected:"var(--green)", priced:"var(--blue)", filed:"var(--amber)", withdrawn:"var(--red)" };
  const statusLabel = { expected:"EXPECTED", priced:"PRICED", filed:"FILED", withdrawn:"WITHDRAWN" };
  const sc = statusColor[ipo.status] || "var(--muted2)";
  const sl = statusLabel[ipo.status] || (ipo.status||"").toUpperCase();
  const isASX = ipo.exchange && ipo.exchange.toUpperCase().includes("ASX");
  const exchColor = isASX ? "var(--amber)" : "var(--blue)";
  const exchLabel = isASX ? "ASX" : "US";

  function relDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0 && diffDays <= 30) return `in ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`;
    return d.toLocaleDateString("en-AU", { day:"numeric", month:"short", year:"numeric" });
  }

  const shares = ipo.numberOfShares ? (ipo.numberOfShares / 1e6).toFixed(1) + "M shares" : null;
  const raise = ipo.totalSharesValue && ipo.totalSharesValue > 1e8
    ? "$" + (ipo.totalSharesValue / 1e9).toFixed(2) + "B raise"
    : null;

  return (
    <div className="card" style={{padding:20,marginBottom:10,borderLeft:`3px solid ${sc}`}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"var(--ff-head)",fontSize:15,fontWeight:700,color:"var(--text2)"}}>{ipo.name || ipo.symbol || "Unknown"}</span>
            {ipo.symbol && <span className="badge" style={{background:"var(--surface)",color:"var(--muted2)",border:"1px solid var(--border)",fontFamily:"var(--ff-mono)"}}>{ipo.symbol}</span>}
            <span className="badge" style={{background:`${sc}20`,color:sc,border:`1px solid ${sc}40`}}>{sl}</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span className="badge" style={{background:`${exchColor}20`,color:exchColor,border:`1px solid ${exchColor}40`}}>{exchLabel}</span>
            <span style={{fontSize:11,color:"var(--muted2)",fontFamily:"var(--ff-mono)"}}>{relDate(ipo.date)}</span>
            {ipo.price && <span style={{fontSize:11,color:"var(--muted2)",fontFamily:"var(--ff-mono)"}}>@ {ipo.price}</span>}
            {shares && <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>{shares}</span>}
            {raise  && <span style={{fontSize:11,color:"var(--green)",fontFamily:"var(--ff-mono)",fontWeight:600}}>{raise}</span>}
          </div>
        </div>
        {ipo.symbol && (
          <button onClick={()=>onAnalyse(ipo.symbol)} style={{background:"none",border:"1px solid var(--green)50",borderRadius:8,padding:"7px 14px",fontSize:10,color:"var(--green)",fontFamily:"var(--ff-mono)",letterSpacing:"0.08em",flexShrink:0,whiteSpace:"nowrap"}}>
            ANALYSE →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Call Card ──────────────────────────────────────────────────────────────
function CallCard({ record, currentPriceData, onAnalyse, priceFetching }) {
  const verdictAccent = { BUY:"var(--green)", WATCH:"var(--amber)", AVOID:"var(--red)", HOLD:"var(--muted2)", SELL:"var(--red)" };
  const accent = verdictAccent[record.verdict] || "var(--muted2)";
  const sourceColor = record.source === "explorer" ? "var(--blue)" : "var(--purple)";
  const sourceLabel = record.source === "explorer" ? "EXPLORER" : "DASHBOARD";

  const currentPrice = currentPriceData?.price ?? null;
  const priceAtCall  = record.priceAtCall;
  const returnPct    = (currentPrice != null && priceAtCall != null && priceAtCall > 0)
    ? ((currentPrice - priceAtCall) / priceAtCall) * 100
    : null;

  const isWin = returnPct != null && (
    (["BUY","HOLD"].includes(record.verdict) && returnPct > 0) ||
    (["AVOID","SELL"].includes(record.verdict) && returnPct < 0)
  );

  function ageSince(isoStr) {
    const ms = Date.now() - new Date(isoStr).getTime();
    const mins  = Math.floor(ms / 60000);
    const hours = Math.floor(ms / 3600000);
    const days  = Math.floor(ms / 86400000);
    if (mins  <  60) return `${mins}m ago`;
    if (hours <  24) return `${hours}h ago`;
    if (days  < 365) return `${days}d ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  function fmtP(p) {
    if (p == null) return "—";
    if (p >= 100000) return `$${(p/1000).toFixed(0)}k`;
    if (p >= 10000)  return `$${(p/1000).toFixed(1)}k`;
    if (p >= 1000)   return `$${p.toLocaleString("en",{maximumFractionDigits:0})}`;
    if (p >= 1)      return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  }

  return (
    <div className="card" style={{ padding:18, marginBottom:10, borderLeft:`3px solid ${accent}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        {/* Left */}
        <div style={{ display:"flex", gap:12, alignItems:"center", minWidth:0, flex:1 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`${accent}18`, border:`1px solid ${accent}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontFamily:"var(--ff-head)", fontSize:11, fontWeight:800, color:accent }}>{record.sym.replace(".AX","").slice(0,3)}</span>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"var(--ff-head)", fontSize:15, fontWeight:700, color:"var(--text2)" }}>{record.sym}</span>
              <VerdictBadge v={record.verdict}/>
              <ConvictionDots level={record.conviction}/>
              <span className="badge" style={{ background:"var(--surface)", color:"var(--muted2)", border:"1px solid var(--border)" }}>{record.horizon} term</span>
              <span className="badge" style={{ background:`${sourceColor}18`, color:sourceColor, border:`1px solid ${sourceColor}35` }}>{sourceLabel}</span>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:"var(--muted2)" }}>{record.name}</span>
              <span style={{ fontSize:10, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>{ageSince(record.calledAt)}</span>
              {record.target && <span style={{ fontSize:10, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>tgt {record.target}</span>}
            </div>
          </div>
        </div>
        {/* Right */}
        <div style={{ display:"flex", gap:20, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--muted)", letterSpacing:"0.1em", marginBottom:3 }}>CALLED AT</div>
            <div style={{ fontFamily:"var(--ff-mono)", fontSize:14, fontWeight:500, color:"var(--text2)" }}>{fmtP(priceAtCall)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--muted)", letterSpacing:"0.1em", marginBottom:3 }}>NOW</div>
            {priceFetching && currentPrice == null
              ? <div className="shimmer-el" style={{ width:60, height:14 }}/>
              : <div style={{ fontFamily:"var(--ff-mono)", fontSize:14, fontWeight:500, color:"var(--text2)" }}>{fmtP(currentPrice)}</div>
            }
          </div>
          <div style={{ textAlign:"right", minWidth:70 }}>
            <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--muted)", letterSpacing:"0.1em", marginBottom:3 }}>RETURN</div>
            {returnPct != null ? (
              <div>
                <div style={{ fontFamily:"var(--ff-mono)", fontSize:14, fontWeight:600, color:returnPct >= 0 ? "var(--green)" : "var(--red)" }}>
                  {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
                </div>
                {isWin && <div style={{ fontSize:9, fontFamily:"var(--ff-mono)", color:"var(--green)", letterSpacing:"0.06em", marginTop:2 }}>WIN</div>}
              </div>
            ) : (
              <div style={{ fontFamily:"var(--ff-mono)", fontSize:14, color:"var(--muted)" }}>—</div>
            )}
          </div>
          <button onClick={() => onAnalyse(record.sym)} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"7px 14px", fontSize:10, color:"var(--muted2)", fontFamily:"var(--ff-mono)", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>
            ANALYSE →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chart canvas ───────────────────────────────────────────────────────────
function ChartCanvas({ candles, analysis, range, currency, indicators }) {
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const [canvasW, setCanvasW] = useState(0);
  const [hovIdx, setHovIdx]   = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setCanvasW(el.clientWidth));
    obs.observe(el);
    setCanvasW(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { draw(hovIdx); }, [candles, analysis, canvasW, hovIdx, indicators]);

  function fmt(p) {
    if (!p && p !== 0) return "—";
    if (p >= 100000) return `${(p/1000).toFixed(0)}k`;
    if (p >= 10000)  return `${(p/1000).toFixed(1)}k`;
    if (p >= 1000)   return `${(p/1000).toFixed(2)}k`;
    if (p >= 100)    return p.toFixed(0);
    if (p >= 10)     return p.toFixed(1);
    if (p >= 1)      return p.toFixed(2);
    return p.toFixed(4);
  }

  function draw(hi) {
    const canvas = canvasRef.current;
    if (!canvas || !candles?.length || !canvasW) return;

    // Determine if we have meaningful indicator data to show sub-panels
    const hasIndicators = !!(indicators && (
      indicators.rsi?.some(v => v != null) ||
      indicators.macd?.macd?.some(v => v != null)
    ));

    const W = canvasW;
    const PL = 8, PR = 68, PT = 14, CHART_H = 290, VOL_H = 58, GAP = 12, PB = 28;
    const RSI_H = 90, MACD_H = 90, GAP2 = 10, GAP3 = 8;
    const H = hasIndicators
      ? PT + CHART_H + GAP + VOL_H + GAP2 + RSI_H + GAP3 + MACD_H + PB
      : 420;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const chartW  = W - PL - PR;
    const volTop  = PT + CHART_H + GAP;
    const rsiTop  = volTop + VOL_H + GAP2;
    const macdTop = rsiTop + RSI_H + GAP3;

    // data bounds
    const hs = candles.map(c=>c.h).filter(Boolean);
    const ls = candles.map(c=>c.l).filter(Boolean);
    if (!hs.length) return;
    const maxP = Math.max(...hs) * 1.003;
    const minP = Math.min(...ls) * 0.997;
    const pRange = maxP - minP;
    const maxVol = Math.max(...candles.map(c=>c.v||0));
    const n = candles.length;
    const toX = i => PL + (n > 1 ? (i / (n-1)) * chartW : chartW/2);
    const toY = p => PT + ((maxP - p) / pRange) * CHART_H;
    const cW  = Math.max(1.5, (chartW / n) * 0.65);

    // bg
    ctx.fillStyle = "#1a1630"; ctx.fillRect(0, 0, W, H);

    // sub-panel backgrounds
    if (hasIndicators) {
      ctx.fillStyle = "#13112600";
      ctx.fillRect(0, rsiTop - 1, W, RSI_H + 2);
      ctx.fillRect(0, macdTop - 1, W, MACD_H + 2);
      // Subtle border between panels
      ctx.strokeStyle = "#332e5045"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, rsiTop - 1); ctx.lineTo(W, rsiTop - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, macdTop - 1); ctx.lineTo(W, macdTop - 1); ctx.stroke();
    }

    // grid + price axis
    const GRID = 5;
    for (let i = 0; i <= GRID; i++) {
      const p = minP + pRange * (i / GRID);
      const y = toY(p);
      ctx.strokeStyle = "#332e5028"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      ctx.fillStyle = "#7b7599"; ctx.font = "9px DM Mono,monospace"; ctx.textAlign = "left";
      ctx.fillText(fmt(p), W - PR + 5, y + 3);
    }

    // ── BB + EMA overlays (drawn behind candles) ──
    if (hasIndicators) {
      ctx.save();
      ctx.beginPath(); ctx.rect(PL, PT, chartW, CHART_H); ctx.clip();

      const bb   = indicators.bb;
      const ema50  = indicators.ema50;
      const ema200 = indicators.ema200;

      // Bollinger Bands fill + lines
      if (bb?.upper?.some(v => v != null)) {
        const upperPts = [], lowerPts = [];
        for (let i = 0; i < n; i++) {
          if (bb.upper[i] != null && bb.lower[i] != null) {
            upperPts.push([toX(i), toY(bb.upper[i])]);
            lowerPts.push([toX(i), toY(bb.lower[i])]);
          }
        }
        if (upperPts.length >= 2) {
          // Fill
          ctx.beginPath();
          ctx.moveTo(upperPts[0][0], upperPts[0][1]);
          for (let i = 1; i < upperPts.length; i++) ctx.lineTo(upperPts[i][0], upperPts[i][1]);
          for (let i = lowerPts.length-1; i >= 0; i--) ctx.lineTo(lowerPts[i][0], lowerPts[i][1]);
          ctx.closePath(); ctx.fillStyle = "#448aff0c"; ctx.fill();
          // Upper line
          ctx.beginPath();
          ctx.moveTo(upperPts[0][0], upperPts[0][1]);
          for (let i = 1; i < upperPts.length; i++) ctx.lineTo(upperPts[i][0], upperPts[i][1]);
          ctx.strokeStyle = "#448aff50"; ctx.lineWidth = 1; ctx.setLineDash([]); ctx.stroke();
          // Lower line
          ctx.beginPath();
          ctx.moveTo(lowerPts[0][0], lowerPts[0][1]);
          for (let i = 1; i < lowerPts.length; i++) ctx.lineTo(lowerPts[i][0], lowerPts[i][1]);
          ctx.strokeStyle = "#448aff50"; ctx.lineWidth = 1; ctx.stroke();
          // Middle dashed
          ctx.setLineDash([4, 3]);
          ctx.beginPath(); let _s = false;
          for (let i = 0; i < n; i++) {
            if (bb.middle[i] == null) { _s = false; continue; }
            const x = toX(i), y = toY(bb.middle[i]);
            if (!_s) { ctx.moveTo(x, y); _s = true; } else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = "#448aff30"; ctx.lineWidth = 1; ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // EMA50
      if (ema50?.some(v => v != null)) {
        ctx.beginPath(); let _s = false;
        for (let i = 0; i < n; i++) {
          if (ema50[i] == null) { _s = false; continue; }
          const x = toX(i), y = toY(ema50[i]);
          if (!_s) { ctx.moveTo(x, y); _s = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#448aff99"; ctx.lineWidth = 1; ctx.stroke();
      }

      // EMA200
      if (ema200?.some(v => v != null)) {
        ctx.beginPath(); let _s = false;
        for (let i = 0; i < n; i++) {
          if (ema200[i] == null) { _s = false; continue; }
          const x = toX(i), y = toY(ema200[i]);
          if (!_s) { ctx.moveTo(x, y); _s = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#ffab4099"; ctx.lineWidth = 1; ctx.stroke();
      }

      ctx.restore();

      // Indicator legend (top-left of price chart)
      ctx.font = "7px DM Mono,monospace"; ctx.textAlign = "left";
      let lx = PL + 8;
      if (bb?.upper?.some(v => v != null)) {
        ctx.fillStyle = "#448aff70"; ctx.fillRect(lx, PT + 6, 8, 1.5);
        ctx.fillStyle = "#7b7599cc"; ctx.fillText("BB", lx + 11, PT + 12); lx += 30;
      }
      if (ema50?.some(v => v != null)) {
        ctx.fillStyle = "#448affcc"; ctx.fillRect(lx, PT + 6, 8, 1.5);
        ctx.fillStyle = "#7b7599cc"; ctx.fillText("EMA50", lx + 11, PT + 12); lx += 52;
      }
      if (ema200?.some(v => v != null)) {
        ctx.fillStyle = "#ffab40cc"; ctx.fillRect(lx, PT + 6, 8, 1.5);
        ctx.fillStyle = "#7b7599cc"; ctx.fillText("EMA200", lx + 11, PT + 12);
      }
    }

    // support lines
    ctx.setLineDash([5, 4]);
    (analysis?.support || []).forEach(s => {
      if (!s.price || s.price < minP || s.price > maxP) return;
      const y = toY(s.price);
      ctx.strokeStyle = s.strength === "STRONG" ? "#00e676aa" : "#00e67660";
      ctx.lineWidth = s.strength === "STRONG" ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#00e676bb"; ctx.font = "8px DM Mono,monospace"; ctx.textAlign = "right";
      ctx.fillText(`S ${fmt(s.price)}`, W - PR - 3, y - 2);
      ctx.setLineDash([5, 4]);
    });
    // resistance lines
    (analysis?.resistance || []).forEach(r => {
      if (!r.price || r.price < minP || r.price > maxP) return;
      const y = toY(r.price);
      ctx.strokeStyle = r.strength === "STRONG" ? "#ff5252aa" : "#ff525260";
      ctx.lineWidth = r.strength === "STRONG" ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ff5252bb"; ctx.font = "8px DM Mono,monospace"; ctx.textAlign = "right";
      ctx.fillText(`R ${fmt(r.price)}`, W - PR - 3, y - 2);
      ctx.setLineDash([5, 4]);
    });
    ctx.setLineDash([]);

    // volume bars
    for (let i = 0; i < n; i++) {
      const c = candles[i]; if (!c.v) continue;
      const x = toX(i), up = c.c >= c.o;
      const vH = (c.v / maxVol) * VOL_H;
      ctx.fillStyle = hi === i ? (up ? "#00e676aa" : "#ff5252aa") : (up ? "#00e67630" : "#ff525230");
      ctx.fillRect(x - cW/2, volTop + VOL_H - vH, cW, vH);
    }

    // candles
    for (let i = 0; i < n; i++) {
      const c = candles[i]; if (!c.o || !c.h || !c.l || !c.c) continue;
      const x = toX(i), up = c.c >= c.o;
      const isHov = hi === i;
      const color = up ? (isHov ? "#33ffaa" : "#00e676") : (isHov ? "#ff7070" : "#ff5252");
      ctx.strokeStyle = color + (isHov ? "" : "bb"); ctx.lineWidth = isHov ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(x, toY(c.h)); ctx.lineTo(x, toY(c.l)); ctx.stroke();
      const bT = toY(Math.max(c.o, c.c)), bB = toY(Math.min(c.o, c.c));
      ctx.fillStyle = color; ctx.fillRect(x - cW/2, bT, cW, Math.max(1, bB - bT));
    }

    // hover crosshair
    if (hi !== null && hi >= 0 && hi < n) {
      const x = toX(hi);
      ctx.strokeStyle = "#ffffff18"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + CHART_H); ctx.stroke();
    }

    // time axis
    const tCount = Math.min(6, n);
    ctx.fillStyle = "#7b7599"; ctx.font = "9px DM Mono,monospace"; ctx.textAlign = "center";
    for (let i = 0; i < tCount; i++) {
      const idx = Math.round(i / (tCount - 1) * (n - 1));
      const c = candles[idx]; if (!c) continue;
      const x = toX(idx), d = new Date(c.t);
      let label;
      if (range === "1d")  label = d.toLocaleTimeString("en-AU", {hour:"2-digit",minute:"2-digit"});
      else if (range === "7d") label = d.toLocaleDateString("en-AU", {weekday:"short",day:"numeric"});
      else label = d.toLocaleDateString("en-AU", {day:"numeric",month:"short"});
      ctx.fillText(label, x, H - PB + 14);
    }

    // pattern label
    if (analysis?.pattern?.name && analysis.pattern.name !== "null") {
      ctx.fillStyle = "#ffab40cc"; ctx.font = "bold 10px DM Mono,monospace"; ctx.textAlign = "left";
      ctx.fillText(`◈ ${analysis.pattern.name}`, PL + 10, PT + 18);
    }

    if (!hasIndicators) return;

    // ── RSI panel ──────────────────────────────────────────────────────────
    const rsi = indicators.rsi;
    if (rsi?.some(v => v != null)) {
      ctx.strokeStyle = "#332e5060"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, rsiTop); ctx.lineTo(W, rsiTop); ctx.stroke();

      ctx.fillStyle = "#7b7599"; ctx.font = "8px DM Mono,monospace"; ctx.textAlign = "left";
      ctx.fillText("RSI(14)", PL, rsiTop + 10);

      const rsiToY = v => rsiTop + ((100 - v) / 100) * RSI_H;

      // Reference lines
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#ff525265"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PL, rsiToY(70)); ctx.lineTo(W - PR, rsiToY(70)); ctx.stroke();
      ctx.fillStyle = "#ff5252cc"; ctx.font = "8px DM Mono,monospace"; ctx.textAlign = "left";
      ctx.fillText("70", W - PR + 3, rsiToY(70) + 3);

      ctx.strokeStyle = "#00e67665"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PL, rsiToY(30)); ctx.lineTo(W - PR, rsiToY(30)); ctx.stroke();
      ctx.fillStyle = "#00e676cc";
      ctx.fillText("30", W - PR + 3, rsiToY(30) + 3);
      ctx.setLineDash([]);

      // Per-bar fills for overbought/oversold zones
      const barW = Math.max(1, (chartW / n) * 0.9);
      for (let i = 0; i < n; i++) {
        if (rsi[i] == null) continue;
        const x = toX(i);
        if (rsi[i] > 70) {
          ctx.fillStyle = "#ff525235";
          ctx.fillRect(x - barW/2, rsiToY(Math.min(100, rsi[i])), barW, rsiToY(70) - rsiToY(Math.min(100, rsi[i])));
        } else if (rsi[i] < 30) {
          ctx.fillStyle = "#00e67635";
          ctx.fillRect(x - barW/2, rsiToY(30), barW, rsiToY(Math.max(0, rsi[i])) - rsiToY(30));
        }
      }

      // RSI line (clipped)
      ctx.save(); ctx.beginPath(); ctx.rect(PL, rsiTop, chartW, RSI_H); ctx.clip();
      ctx.beginPath(); let _s = false;
      for (let i = 0; i < n; i++) {
        if (rsi[i] == null) { _s = false; continue; }
        const x = toX(i), y = rsiToY(rsi[i]);
        if (!_s) { ctx.moveTo(x, y); _s = true; } else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#e8e4f0"; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      // Current RSI value label
      for (let i = n-1; i >= 0; i--) {
        if (rsi[i] != null) {
          const rsiVal = rsi[i];
          const labelColor = rsiVal > 70 ? "#ff5252" : rsiVal < 30 ? "#00e676" : "#e8e4f0";
          ctx.fillStyle = labelColor; ctx.font = "8px DM Mono,monospace"; ctx.textAlign = "left";
          ctx.fillText(rsiVal.toFixed(1), W - PR + 3, rsiToY(Math.max(0, Math.min(100, rsiVal))) + 3);
          break;
        }
      }
    }

    // ── MACD panel ─────────────────────────────────────────────────────────
    const macd = indicators.macd;
    if (macd?.macd?.some(v => v != null)) {
      ctx.strokeStyle = "#332e5060"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, macdTop); ctx.lineTo(W, macdTop); ctx.stroke();

      ctx.fillStyle = "#7b7599"; ctx.font = "8px DM Mono,monospace"; ctx.textAlign = "left";
      ctx.fillText("MACD", PL, macdTop + 10);

      const allVals = [...(macd.macd||[]), ...(macd.signal||[]), ...(macd.histogram||[])].filter(v => v != null);
      if (allVals.length > 0) {
        const mMax = Math.max(...allVals);
        const mMin = Math.min(...allVals);
        const mRange = mMax - mMin || 0.0001;
        const macdToY = v => macdTop + ((mMax - v) / mRange) * MACD_H;
        const zeroY = macdToY(0);

        // Zero line
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "#ffffff40"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PL, zeroY); ctx.lineTo(W - PR, zeroY); ctx.stroke();
        ctx.setLineDash([]);

        ctx.save(); ctx.beginPath(); ctx.rect(PL, macdTop, chartW, MACD_H); ctx.clip();

        // Histogram bars
        const bw2 = Math.max(1, (chartW / n) * 0.65);
        for (let i = 0; i < n; i++) {
          if (macd.histogram[i] == null) continue;
          const x = toX(i), y = macdToY(macd.histogram[i]);
          const h = Math.abs(y - zeroY);
          ctx.fillStyle = macd.histogram[i] >= 0 ? "#00e67675" : "#ff525275";
          ctx.fillRect(x - bw2/2, Math.min(y, zeroY), bw2, h);
        }

        // MACD line (blue)
        ctx.beginPath(); let _s = false;
        for (let i = 0; i < n; i++) {
          if (macd.macd[i] == null) { _s = false; continue; }
          const x = toX(i), y = macdToY(macd.macd[i]);
          if (!_s) { ctx.moveTo(x, y); _s = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#448aff"; ctx.lineWidth = 2; ctx.stroke();

        // Signal line (amber)
        ctx.beginPath(); _s = false;
        for (let i = 0; i < n; i++) {
          if (macd.signal[i] == null) { _s = false; continue; }
          const x = toX(i), y = macdToY(macd.signal[i]);
          if (!_s) { ctx.moveTo(x, y); _s = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#ffab40"; ctx.lineWidth = 2; ctx.stroke();

        ctx.restore();

        // MACD legend
        ctx.font = "8px DM Mono,monospace"; ctx.textAlign = "left";
        ctx.fillStyle = "#448aff"; ctx.fillRect(PL + 40, macdTop + 5, 10, 2);
        ctx.fillStyle = "#a89ec0"; ctx.fillText("MACD", PL + 53, macdTop + 10);
        ctx.fillStyle = "#ffab40"; ctx.fillRect(PL + 95, macdTop + 5, 10, 2);
        ctx.fillStyle = "#a89ec0"; ctx.fillText("Signal", PL + 108, macdTop + 10);
      }
    }
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current; if (!canvas || !candles?.length) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const PL = 8, PR = 68, n = candles.length;
    const chartW = canvasW - PL - PR;
    const idx = Math.round((mx - PL) / chartW * (n - 1));
    setHovIdx(Math.max(0, Math.min(n - 1, idx)));
  }

  const hov = hovIdx !== null ? candles[hovIdx] : null;

  return (
    <div ref={containerRef} style={{width:"100%",position:"relative",borderRadius:10,overflow:"hidden"}}>
      <canvas ref={canvasRef} style={{display:"block",cursor:"crosshair",width:"100%"}}
        onMouseMove={handleMouseMove} onMouseLeave={()=>setHovIdx(null)}/>
      {hov && (
        <div style={{position:"absolute",top:10,left:10,background:"#1e1a2eed",border:"1px solid var(--border2)",borderRadius:8,padding:"8px 12px",fontSize:11,fontFamily:"var(--ff-mono)",pointerEvents:"none",minWidth:120}}>
          <div style={{color:"var(--muted)",marginBottom:5,fontSize:9,letterSpacing:"0.08em"}}>
            {new Date(hov.t).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"2-digit"})}
            {range==="1d"&&" "+new Date(hov.t).toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"})}
          </div>
          {[{l:"O",v:hov.o,c:"var(--muted2)"},{l:"H",v:hov.h,c:"var(--green)"},{l:"L",v:hov.l,c:"var(--red)"},{l:"C",v:hov.c,c:hov.c>=hov.o?"var(--green)":"var(--red)"}].map(f=>(
            <div key={f.l} style={{display:"flex",gap:8,color:f.c,lineHeight:1.7}}>
              <span style={{color:"var(--muted)",width:10}}>{f.l}</span>
              <span>{fmt(f.v)}</span>
            </div>
          ))}
          {hov.v>0 && <div style={{color:"var(--muted)",marginTop:4,fontSize:9}}>Vol {hov.v>=1e6?(hov.v/1e6).toFixed(1)+"M":(hov.v/1e3).toFixed(0)+"K"}</div>}
        </div>
      )}
    </div>
  );
}

// ── Glossary modal ─────────────────────────────────────────────────────────
function GlossaryModal({ open, onClose, focusTerm, allGlossary }) {
  const termRefs = useRef({});
  useEffect(() => {
    if (open && focusTerm && termRefs.current[focusTerm]) {
      setTimeout(() => termRefs.current[focusTerm].scrollIntoView({ behavior:"smooth", block:"center" }), 120);
    }
  }, [open, focusTerm]);
  if (!open) return null;
  const gl = allGlossary || GLOSSARY;
  const sorted = [...gl].sort((a, b) => a.term.localeCompare(b.term));
  const builtInTerms = new Set(GLOSSARY.map(g => g.term));
  const customCount = gl.filter(g => !builtInTerms.has(g.term)).length;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#00000090", zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"5vh 20px", overflowY:"auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:16, padding:"28px 32px", maxWidth:660, width:"100%", marginBottom:40 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <h2 style={{ fontFamily:"var(--ff-head)", fontSize:22, fontWeight:800, color:"var(--text2)", letterSpacing:"-0.02em" }}>Glossary</h2>
            <p style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)", letterSpacing:"0.06em", marginTop:4 }}>
              {gl.length} TERMS{customCount > 0 ? ` · ${GLOSSARY.length} BUILT-IN · ${customCount} AI-EXTRACTED` : ""} · CLICK ANY HIGHLIGHTED TERM
            </p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"7px 16px", color:"var(--muted2)", fontSize:11, fontFamily:"var(--ff-mono)", letterSpacing:"0.06em", flexShrink:0 }}>CLOSE ✕</button>
        </div>
        <div style={{ maxHeight:"65vh", overflowY:"auto", paddingRight:4 }}>
          {sorted.map(g => {
            const isCustom = !builtInTerms.has(g.term);
            return (
              <div key={g.term} ref={el => { termRefs.current[g.term] = el; }}
                style={{ padding:"14px", borderRadius:10, marginBottom:4, background: focusTerm===g.term ? "#ffab4012" : "none", border:`1px solid ${focusTerm===g.term ? "#ffab4040" : "transparent"}`, transition:"background .25s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontFamily:"var(--ff-head)", fontSize:14, fontWeight:700, color: focusTerm===g.term ? "var(--amber)" : "var(--text2)" }}>{g.term}</span>
                  {isCustom && <span className="badge" style={{ background:"#448aff18", color:"var(--blue)", border:"1px solid #448aff35", fontSize:8 }}>AI</span>}
                </div>
                <p style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.7, margin:0 }}>{g.def || g.definition}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]           = useState("dashboard");
  const [portTab,setPortTab]   = useState("all");
  const [expanded,setExp]      = useState(null);
  const [portExp,setPortExp]   = useState(null);
  const [livePrices,setLP]     = useState({});
  const [displayCcy,setDisplayCcy] = useState("AUD");
  const [audUsd,setAudUsd]     = useState(0.635);

  // Dashboard live picks
  const [dashPicks,setDashPicks]     = useState([]);
  const [dashLoading,setDashLoading] = useState(false);
  const [dashError,setDashError]     = useState(null);

  // Explorer
  const [searchQ,setSearchQ]       = useState("");
  const [searching,setSearching]   = useState(false);
  const [searchResult,setResult]   = useState(null);
  const [searchError,setSearchErr] = useState(null);
  const [searchHistory,setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("inteliq_history") || "[]"); } catch { return []; }
  });

  // Portfolio sources
  const [cbHoldings,setCb] = useState([]);
  const [cbSyncing,setCbS] = useState(false);
  const [cbLastSync,setCbL]= useState(null);
  const [cbError,setCbE]   = useState("");

  const [csHoldings,setCs] = useState([]);
  const [csSyncing,setCsS] = useState(false);
  const [csLastSync,setCsL]= useState(null);
  const [csError,setCsE]   = useState("");

  const [cmcHoldings,setCmc] = useState(() => {
    try { return JSON.parse(localStorage.getItem("inteliq_cmc") || "[]"); } catch { return []; }
  });

  // Watchlist
  const [watchlist,setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("inteliq_watchlist") || "[]"); } catch { return []; }
  });

  // News
  const [newsFilter,setNewsFilter] = useState("ALL");
  const [newsItems,setNewsItems]   = useState(NEWS_MOCK);
  const [newsLoading,setNewsLoading] = useState(false);

  // IPO Calendar
  const [ipoItems,   setIpoItems]   = useState([]);
  const [ipoLoading, setIpoLoading] = useState(false);
  const [ipoFilter,  setIpoFilter]  = useState("ALL");
  const [ipoError,   setIpoError]   = useState(null);

  // Trade Journal
  const [journalEntries,  setJournalEntries]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("inteliq_journal") || "[]"); } catch { return []; }
  });
  const [journalAnalysis, setJournalAnalysis] = useState(null);
  const [journalAnalysing,setJournalAnalysing]= useState(false);
  const [journalAnalysisError, setJournalAnalysisError] = useState(null);
  const [journalForm,     setJournalForm]     = useState({ date: new Date().toISOString().slice(0,10), sym:"", action:"BUY", qty:"", price:"", currency:"USD", thesis:"" });
  const [journalFormOpen, setJournalFormOpen] = useState(false);
  const [journalExitForm, setJournalExitForm] = useState(null); // entry id being exited

  // Macro Calendar
  const [macroEvents,  setMacroEvents]  = useState([]);
  const [macroLoading, setMacroLoading] = useState(false);
  const [macroError,   setMacroError]   = useState(null);

  // Natural Language Screener
  const [screenerQ,       setScreenerQ]       = useState("");
  const [screenerResults, setScreenerResults] = useState(null);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerError,   setScreenerError]   = useState(null);

  // Earnings Calendar
  const [earningsData,    setEarningsData]    = useState({});
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsBriefs,  setEarningsBriefs]  = useState({});  // keyed by sym
  const [earningsBriefing,setEarningsBriefing]= useState({});  // loading states

  // Portfolio Coach
  const [coachReport,  setCoachReport]  = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError,   setCoachError]   = useState(null);

  // AI Call Record
  const [callRecords,        setCallRecords]        = useState(() => {
    try { return JSON.parse(localStorage.getItem("inteliq_calls") || "[]"); } catch { return []; }
  });
  const [callsFilter,        setCallsFilter]        = useState("ALL");
  const [callsPrices,        setCallsPrices]        = useState({});
  const [callsPriceFetching, setCallsPriceFetching] = useState(false);

  // Chart / Detail
  const [detailSym,setDetailSym]           = useState(null); // {sym,name,priceType,priceCurrency,sector}
  const [detailStock,setDetailStock]       = useState(null); // full card analysis object, if drilled from a card
  const [detailFrom,setDetailFrom]         = useState("explorer"); // which tab to go back to
  const [chartRange,setChartRange]         = useState("1mo");
  const [chartData,setChartData]           = useState(null);
  const [chartLoading,setChartLoading]     = useState(false);
  const [detailAnalysis,setDetailAnalysis] = useState(null);
  const [detailAnalysing,setDetailAnalysing] = useState(false);

  // Explorer inline chart
  const [explorerChart,setExplorerChart]               = useState(null);
  const [explorerChartLoading,setExplorerChartLoading] = useState(false);
  const [explorerAnalysis,setExplorerAnalysis]         = useState(null);

  // Glossary
  const [glossaryOpen,setGlossaryOpen] = useState(false);
  const [glossaryTerm,setGlossaryTerm] = useState(null);
  const openGlossary = t => { setGlossaryTerm(t||null); setGlossaryOpen(true); };
  const [customTerms,setCustomTerms] = useState(() => {
    try { return JSON.parse(localStorage.getItem("inteliq_glossary_custom") || "[]"); } catch { return []; }
  });
  const allGlossary = [...GLOSSARY, ...customTerms];

  // Persist custom glossary terms
  useEffect(() => { try { localStorage.setItem("inteliq_glossary_custom", JSON.stringify(customTerms)); } catch {} }, [customTerms]);

  const [glossaryExtracting,setGlossaryExtracting] = useState(false);

  async function extractGlossaryTerms(text) {
    if (!text || typeof text !== "string" || text.length < 50) return;
    try {
      const r = await fetch("/api/glossary/extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await r.json();
      if (!Array.isArray(d) || d.length === 0) return;
      setCustomTerms(prev => {
        const existing = new Set([...GLOSSARY, ...prev].map(g => g.term.toLowerCase()));
        const newTerms = d
          .filter(t => t.term && t.definition && !existing.has(t.term.toLowerCase()))
          .map(t => ({ term: t.term, def: t.definition }));
        return newTerms.length > 0 ? [...prev, ...newTerms] : prev;
      });
    } catch {}
  }

  // Persist CMC
  useEffect(() => { try { localStorage.setItem("inteliq_cmc", JSON.stringify(cmcHoldings)); } catch {} }, [cmcHoldings]);
  // Persist history
  useEffect(() => { try { localStorage.setItem("inteliq_history", JSON.stringify(searchHistory)); } catch {} }, [searchHistory]);
  // Persist watchlist
  useEffect(() => { try { localStorage.setItem("inteliq_watchlist", JSON.stringify(watchlist)); } catch {} }, [watchlist]);
  // Persist call records
  useEffect(() => { try { localStorage.setItem("inteliq_calls", JSON.stringify(callRecords)); } catch {} }, [callRecords]);
  // Persist journal
  useEffect(() => { try { localStorage.setItem("inteliq_journal", JSON.stringify(journalEntries)); } catch {} }, [journalEntries]);

  // Fetch FX rate on mount
  useEffect(() => {
    fetch("/api/fx/audusd").then(r => r.json()).then(d => { if (d.rate) setAudUsd(d.rate); }).catch(() => {});
  }, []);

  // Fetch live prices whenever holdings, watchlist, or dashboard picks change
  useEffect(() => {
    const all = [
      ...cbHoldings, ...csHoldings, ...cmcHoldings,
      ...dashPicks.map(s => ({ sym:s.sym, priceType:s.priceType })),
      ...watchlist.map(w => ({ sym:w.sym, priceType:w.priceType })),
    ];
    const unique = all.filter((s,i,a) => a.findIndex(x=>x.sym===s.sym)===i).map(h=>({sym:h.sym,type:h.priceType}));
    if (!unique.length) return;
    fetch("/api/prices", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({symbols:unique}) })
      .then(r=>r.json()).then(d=>setLP(p=>({...p,...d}))).catch(()=>{});
  }, [cbHoldings,csHoldings,cmcHoldings,dashPicks,watchlist]);

  // Sync exchanges on mount
  useEffect(() => { syncCoinbase(); syncCoinspot(); }, []);

  // Fetch dashboard picks on mount
  useEffect(() => { fetchDashPicks(); }, []);

  // Fetch news on mount
  useEffect(() => { fetchNews(); }, []);


  // Refetch chart when range or display currency changes
  useEffect(() => {
    if (tab === "detail" && detailSym) fetchChart(detailSym.sym, chartRange);
  }, [chartRange, displayCcy]);

  async function syncCoinbase() {
    setCbS(true); setCbE("");
    try {
      const r = await fetch("/api/coinbase/balances"); const d = await r.json();
      if (d.error) setCbE(d.error); else { setCb(d.holdings||[]); setCbL(nowTime()); }
    } catch { setCbE("Could not connect — check COINBASE_API_KEY and COINBASE_API_SECRET in .env"); }
    setCbS(false);
  }

  async function syncCoinspot() {
    setCsS(true); setCsE("");
    try {
      const r = await fetch("/api/coinspot/balances"); const d = await r.json();
      if (d.error) setCsE(d.error); else { setCs(d.holdings||[]); setCsL(nowTime()); }
    } catch { setCsE("Could not connect — check COINSPOT_API_KEY and COINSPOT_API_SECRET in .env"); }
    setCsS(false);
  }

  async function fetchDashPicks(force = false) {
    if (dashLoading) return;
    setDashLoading(true); setDashError(null);
    if (force) setDashPicks([]);
    try {
      const url = force ? "/api/dashboard/picks?force=1" : "/api/dashboard/picks";
      const r = await fetch(url);
      const d = await r.json();
      if (Array.isArray(d) && d.length > 0) {
        setDashPicks(d);
        d.forEach(pick => recordCall({ ...pick, priceAtCall: pick.priceStatic }, "dashboard"));
        const allText = d.map(p => [p.summary,p.macro,p.fundamental,p.technical,p.sentiment,p.portfolio].filter(Boolean).join(" ")).join(" ");
        extractGlossaryTerms(allText);
      } else setDashError(d.error || "No picks returned");
    } catch { setDashError("Could not load picks — check your connection"); }
    setDashLoading(false);
  }

  async function fetchNews() {
    setNewsLoading(true);
    try {
      const r = await fetch("/api/news");
      const d = await r.json();
      if (Array.isArray(d) && d.length > 0) setNewsItems(d);
    } catch {}
    setNewsLoading(false);
  }

  async function fetchIPO() {
    if (ipoLoading) return;
    setIpoLoading(true); setIpoError(null);
    try {
      const r = await fetch("/api/ipo");
      const d = await r.json();
      if (Array.isArray(d)) setIpoItems(d);
      else setIpoError(d.error || "Failed to load IPO data");
    } catch { setIpoError("Could not load IPO data — check your connection"); }
    setIpoLoading(false);
  }

  useEffect(() => { if (tab === "ipo") fetchIPO(); }, [tab]);

  useEffect(() => {
    if (tab !== "calls" || callRecords.length === 0) return;
    setCallsPriceFetching(true);
    const unique = callRecords
      .filter((c, i, a) => a.findIndex(x => x.sym === c.sym) === i)
      .map(c => ({ sym: c.sym, type: c.priceType }));
    fetch("/api/prices", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({symbols:unique}) })
      .then(r => r.json()).then(d => setCallsPrices(d)).catch(() => {})
      .finally(() => setCallsPriceFetching(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "coach" || allHoldings.length === 0) return;
    if (!coachReport && !coachLoading) runCoachAnalysis();
  }, [tab, allHoldings.length]);

  useEffect(() => {
    if (tab !== "macro") return;
    if (macroEvents.length && !macroError) return; // already loaded
    setMacroLoading(true); setMacroError(null);
    const holdingSyms = [...new Set([...allHoldings.map(h=>h.sym), ...watchlist.map(w=>w.sym)])];
    fetch("/api/macro", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ holdingSyms }) })
      .then(r => r.json()).then(d => { if (d.error) setMacroError(d.error); else setMacroEvents(d); })
      .catch(()=>setMacroError("Could not load macro calendar")).finally(()=>setMacroLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "earnings") return;
    const allSyms = [...new Set([
      ...allHoldings.map(h => h.sym),
      ...watchlist.map(w => w.sym),
    ])].filter(s => !["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX"].includes(s.toUpperCase()));
    if (!allSyms.length) return;
    setEarningsLoading(true);
    fetch("/api/earnings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ symbols: allSyms }) })
      .then(r => r.json()).then(d => setEarningsData(d)).catch(() => {})
      .finally(() => setEarningsLoading(false));
  }, [tab]);

  async function openDetail(symInfo, stock = null, preloadedAnalysis = null) {
    setDetailFrom(tab);
    setDetailSym(symInfo);
    setDetailStock(stock);
    setTab("detail");
    setChartData(null);
    setChartRange("1mo");
    if (preloadedAnalysis) {
      setDetailAnalysis(preloadedAnalysis);
      setDetailAnalysing(false);
      await fetchChart(symInfo.sym, "1mo", true);
    } else {
      setDetailAnalysis(null);
      await fetchChart(symInfo.sym, "1mo");
    }
  }

  async function fetchChart(sym, range, skipAnalysis = false) {
    setChartLoading(true);
    if (!skipAnalysis) setDetailAnalysis(null);
    try {
      const r = await fetch(`/api/chart/${encodeURIComponent(sym)}?range=${range}&currency=${displayCcy}`);
      const d = await r.json();
      if (!d.error) { setChartData(d); if (!skipAnalysis) fetchDetailAnalysis(d); }
    } catch {}
    setChartLoading(false);
  }

  async function fetchDetailAnalysis(data) {
    setDetailAnalysing(true);
    try {
      // Fetch fundamentals (server returns null for crypto/unknown)
      let fundamentals = null;
      try {
        const fr = await fetch(`/api/fundamentals/${encodeURIComponent(data.sym)}`);
        fundamentals = await fr.json();
      } catch {}
      const r = await fetch("/api/analyse/detail", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ sym:data.sym, name:data.name, candles:data.candles, range:data.range, currentPrice:data.currentPrice, currency:data.currency, indicators:data.indicators, fundamentals })
      });
      const d = await r.json();
      if (!d.error) {
        setDetailAnalysis(d);
        const allText = [d.summary,d.macro,d.fundamental,d.technical,d.sentiment,d.portfolio,d.momentum,d.volume,d.pattern?.note].filter(Boolean).join(" ");
        extractGlossaryTerms(allText);
      }
    } catch {}
    setDetailAnalysing(false);
  }

  const allHoldings = [...cbHoldings,...csHoldings,...cmcHoldings];

  async function handleSearch(overrideQ) {
    const q = (overrideQ || searchQ).trim();
    if (!q) return;
    if (overrideQ) setSearchQ(overrideQ);
    setSearching(true); setResult(null); setSearchErr(null); setExplorerAnalysis(null); setExplorerChart(null);
    try {
      const today = new Date().toLocaleDateString("en-AU",{year:"numeric",month:"long",day:"numeric"});
      const KNOWN_CRYPTO = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","DOT","MATIC","LINK","UNI","LTC","BCH","ATOM","SHIB","TRX","TON","OP","ARB","NEAR","GRT","NU"];
      const upperQ = q.toUpperCase();
      const isKnownCrypto = KNOWN_CRYPTO.includes(upperQ);
      const isTickerLike = /^[A-Z0-9.]{1,8}$/.test(upperQ);
      const priceType = isKnownCrypto ? "crypto" : "stock";
      // Parallel: live price + fundamentals (if ticker-like and not crypto)
      let livePriceCtx = "";
      let livePrice = null;
      let fundamentals = null;
      if (isTickerLike) {
        try {
          const parallelFetches = [
            fetch(`/api/price?sym=${upperQ}&type=${priceType}`).then(r=>r.json()).catch(()=>null),
            ...(!isKnownCrypto ? [fetch(`/api/fundamentals/${upperQ}`).then(r=>r.json()).catch(()=>null)] : []),
          ];
          const [pd, fmpData] = await Promise.all(parallelFetches);
          if (pd?.price) { livePrice = pd.price; livePriceCtx = ` The current live market price is $${pd.price.toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})} USD as of today — base all price levels, support/resistance, and targets on this actual price.`; }
          if (fmpData) fundamentals = fmpData;
        } catch {}
      }
      // Build fundamentals context for initial analyse call
      let fundamentalsCtx = "";
      if (fundamentals) {
        const parts = [];
        if (fundamentals.pe)        parts.push(`P/E: ${Number(fundamentals.pe).toFixed(1)}x`);
        if (fundamentals.evEbitda)  parts.push(`EV/EBITDA: ${Number(fundamentals.evEbitda).toFixed(1)}x`);
        if (fundamentals.fcfYield)  parts.push(`FCF Yield: ${Number(fundamentals.fcfYield).toFixed(1)}%`);
        if (fundamentals.roe)       parts.push(`ROE: ${(Number(fundamentals.roe)*100).toFixed(1)}%`);
        if (fundamentals.marketCap) parts.push(`Mkt Cap: ${fundamentals.marketCap}`);
        if (fundamentals.analystConsensus) {
          const c = fundamentals.analystConsensus;
          parts.push(`Analyst: ${c.strongBuy}×SB/${c.buy}×B/${c.hold}×H/${c.sell}×S`);
        }
        if (parts.length) fundamentalsCtx = `\n\nLIVE FUNDAMENTALS (FMP): ${parts.join(" | ")}\nUse this live data for your fundamental analysis.`;
      }
      const res = await fetch("/api/analyse", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:1000,
        system:`You are a senior investment analyst. Today is ${today}. Your training knowledge has a cutoff of approximately mid-2025 — do NOT present specific metrics from your training data (e.g. ETF flow volumes, exact hash rates, specific institutional inflow figures, dated earnings numbers) as if they are current facts for ${today}. For fundamentals, focus on structural and qualitative factors. If you cite a specific metric that may have changed, frame it as approximate or add "as of mid-2025". All macro commentary must reflect conditions as of ${today} — do not reference past rate decisions or events as if they are upcoming. For crypto assets (BTC, ETH, SOL etc) analyse the native coin/token directly — do NOT substitute an ETF or trust product. Respond ONLY with valid JSON, no markdown:
{"sym":"TICKER","name":"Full name","sector":"sector","verdict":"BUY|WATCH|AVOID|HOLD","conviction":"HIGH|MEDIUM|LOW","horizon":"Short|Medium|Long","priceStatic":123.45,"target":"$X","upside":"+X%","up":true,"priceType":"stock or crypto","avgCurrency":"USD or AUD","priceCurrency":"USD or AUD","summary":"2-3 sentences","macro":"2-3 sentences","fundamental":"2-3 sentences","technical":"2-3 sentences","sentiment":"2-3 sentences","insider":"2-3 sentences","portfolio":"2-3 sentences"}`,
        messages:[{role:"user",content:`Analyse this investment: ${q}.${livePriceCtx}${fundamentalsCtx}`}]
      })});
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}")+1));
      setResult(parsed);
      recordCall({ ...parsed, priceAtCall: livePrice || parsed.priceStatic }, "explorer");
      const explorerText = [parsed.summary,parsed.macro,parsed.fundamental,parsed.technical,parsed.sentiment,parsed.portfolio].filter(Boolean).join(" ");
      extractGlossaryTerms(explorerText);
      // Auto-fetch inline chart using display currency for crypto (BTC-USD or BTC-AUD)
      setExplorerChart(null); setExplorerChartLoading(true);
      fetch(`/api/chart/${encodeURIComponent(parsed.sym)}?range=1mo&currency=${displayCcy}`)
        .then(r=>r.json()).then(async d=>{
          if(!d.error){
            setExplorerChart(d);
            // Fetch fundamentals for the parsed symbol (may differ from search query)
            let detailFundamentals = null;
            if (parsed.priceType !== "crypto") {
              try { detailFundamentals = await fetch(`/api/fundamentals/${encodeURIComponent(parsed.sym)}`).then(r=>r.json()); } catch {}
            }
            // Run comprehensive analysis and update card verdict to match
            try {
              const ar = await fetch("/api/analyse/detail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...d, fundamentals:detailFundamentals})});
              const analysis = await ar.json();
              if(!analysis.error){
                setExplorerAnalysis(analysis);
                setResult(prev=>prev?{...prev,verdict:analysis.verdict,conviction:analysis.conviction,target:analysis.target,horizon:analysis.horizon}:prev);
              }
            } catch {}
          }
        }).catch(()=>{})
        .finally(()=>setExplorerChartLoading(false));
      // Save to history
      setHistory(prev => [
        { ...parsed, analysedAt: new Date().toISOString() },
        ...prev.filter(h => h.sym !== parsed.sym)
      ].slice(0, 10));
      fetch(`/api/price?sym=${parsed.sym}&type=${parsed.priceType}`).then(r=>r.json()).then(d=>setLP(p=>({...p,[parsed.sym]:d}))).catch(()=>{});
    } catch { setSearchErr("Analysis failed — please try again."); }
    setSearching(false);
  }

  function addToWatchlist(stock) {
    if (watchlist.find(w => w.sym === stock.sym)) return;
    setWatchlist(prev => [{
      sym: stock.sym, name: stock.name, sector: stock.sector,
      priceType: stock.priceType || "stock",
      priceCurrency: stock.priceCurrency || "USD",
      target: parseTargetNum(stock.target),
      targetCcy: stock.avgCurrency || "USD",
      addedAt: new Date().toISOString(),
      note: stock.summary ? stock.summary.slice(0, 100) + (stock.summary.length > 100 ? "…" : "") : "",
    }, ...prev]);
  }

  async function analyseJournal() {
    if (journalEntries.length < 3) return;
    setJournalAnalysing(true); setJournalAnalysisError(null);
    try {
      const r = await fetch("/api/journal/analyse", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ entries: journalEntries }) });
      const d = await r.json();
      if (d.error) setJournalAnalysisError(d.error); else setJournalAnalysis(d);
    } catch { setJournalAnalysisError("Analysis failed — please try again."); }
    setJournalAnalysing(false);
  }

  async function runScreener(q) {
    const query = (q || screenerQ).trim();
    if (!query) return;
    setScreenerLoading(true); setScreenerError(null); setScreenerResults(null);
    try {
      const r = await fetch("/api/screener", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ query }) });
      const d = await r.json();
      if (d.error) setScreenerError(d.error);
      else { setScreenerResults(d); d.forEach(pick => recordCall({...pick, priceAtCall: pick.priceStatic}, "screener")); }
    } catch { setScreenerError("Screener failed — please try again."); }
    setScreenerLoading(false);
  }

  function buildPortfolioSnapshot(holdings, prices, audUsdRate) {
    let totalUSD = 0;
    const details = [];
    for (const h of holdings) {
      const lp = prices[h.sym];
      const priceCcy = h.priceCurrency || lp?.currency || "USD";
      const price = lp?.price;
      const priceUSD = price ? toDisplay(price, priceCcy, "USD", audUsdRate) : null;
      const avgUSD   = h.avg ? toDisplay(h.avg, h.avgCurrency || "USD", "USD", audUsdRate) : null;
      const valueUSD = priceUSD != null ? h.qty * priceUSD : (avgUSD ? h.qty * avgUSD : 0);
      const unrealisedPct = priceUSD && avgUSD ? ((priceUSD - avgUSD) / avgUSD) * 100 : null;
      totalUSD += valueUSD;
      details.push({ sym: h.sym, name: h.name || h.sym, sector: h.sector || "Unknown", priceType: h.priceType || "stock", valueUSD, unrealisedPct });
    }
    details.forEach(d => { d.pct = totalUSD > 0 ? (d.valueUSD / totalUSD) * 100 : 0; });
    details.sort((a, b) => b.valueUSD - a.valueUSD);
    const sectorBreakdown = {};
    details.forEach(d => { const s = d.sector || "Unknown"; sectorBreakdown[s] = (sectorBreakdown[s] || 0) + d.pct; });
    const cryptoPct = details.filter(d => d.priceType === "crypto").reduce((s, d) => s + d.pct, 0);
    return { totalValueUSD: totalUSD, holdings: details, sectorBreakdown, cryptoPct, stocksPct: 100 - cryptoPct };
  }

  async function runCoachAnalysis() {
    setCoachLoading(true); setCoachError(null);
    const snapshot = buildPortfolioSnapshot(allHoldings, livePrices, audUsd);
    if (!snapshot.holdings.length) { setCoachError("No holdings available"); setCoachLoading(false); return; }
    try {
      const r = await fetch("/api/portfolio/coach", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ snapshot }) });
      const d = await r.json();
      if (d.error) setCoachError(d.error); else setCoachReport(d);
    } catch { setCoachError("Analysis failed — check your connection"); }
    setCoachLoading(false);
  }

  async function fetchEarningsBrief(sym, upcomingDate, recentSurprises) {
    setEarningsBriefing(p => ({...p, [sym]: true}));
    const today = new Date().toLocaleDateString("en-AU",{year:"numeric",month:"long",day:"numeric"});
    const surpriseCtx = recentSurprises?.length
      ? `Recent EPS surprises: ${recentSurprises.map(e => `${e.date} actual ${e.epsActual} vs est ${e.epsEstimated} (${e.surprise||"?"}) `).join(", ")}.`
      : "";
    try {
      const r = await fetch("/api/analyse", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:600,
          system:`You are a senior analyst. Today is ${today}. Return ONLY valid JSON:
{"watch":"Key metric/number to watch for","consensus":"What the market expects — be specific","risk":"Main earnings risk in 1 sentence","setup":"Technical/positioning setup going into earnings in 1 sentence","verdict":"BEAT_LIKELY|MISS_LIKELY|IN_LINE|UNCERTAIN"}`,
          messages:[{role:"user",content:`Pre-earnings brief for ${sym}. Upcoming date: ${upcomingDate||"next quarter"}. ${surpriseCtx} What should investors watch?`}],
        }),
      });
      const d = await r.json();
      const text = d.content?.find(b=>b.type==="text")?.text||"";
      const start = text.indexOf("{"), end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) setEarningsBriefs(p => ({...p, [sym]: JSON.parse(text.slice(start, end+1))}));
    } catch {}
    setEarningsBriefing(p => ({...p, [sym]: false}));
  }

  function recordCall(parsed, source) {
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    setCallRecords(prev => {
      const recent = prev.find(c => c.sym === parsed.sym && (Date.now() - new Date(c.calledAt).getTime()) < SIX_HOURS);
      if (recent) return prev;
      const record = {
        id: `${parsed.sym}-${Date.now()}`,
        sym: parsed.sym,           name: parsed.name || parsed.sym,
        verdict: parsed.verdict,   conviction: parsed.conviction || "MEDIUM",
        horizon: parsed.horizon || "Medium",
        priceAtCall:   parsed.priceAtCall  || parsed.priceStatic || null,
        priceType:     parsed.priceType    || "stock",
        priceCurrency: parsed.priceCurrency|| "USD",
        calledAt: new Date().toISOString(),
        target: parsed.target || null,
        source,
      };
      return [record, ...prev].slice(0, 50);
    });
  }

  const filteredNews = newsFilter === "ALL"
    ? newsItems
    : newsItems.filter(n => n.tag === newsFilter);

  const fxLabel = `AUD/USD: ${audUsd.toFixed(4)}`;

  return (
    <GlossaryCtx.Provider value={{ allGlossary, openGlossary }}>
    <>
      <style>{css}</style>
      <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>

        {/* ── Sidebar ── */}
        <aside style={{ width:220, background:"var(--sidebar)", borderRight:"1px solid var(--border)", padding:"20px 12px", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0 }}>
          <div style={{ padding:"8px 8px 24px", borderBottom:"1px solid var(--border)", marginBottom:24 }}>
            <span style={{ fontFamily:"var(--ff-head)", fontSize:20, fontWeight:900, letterSpacing:"-0.03em", color:"var(--text2)" }}>
              INTEL<span style={{ color:"var(--green)" }}>IQ</span>
            </span>
            <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"var(--ff-mono)", marginTop:2, letterSpacing:"0.08em" }}>INVESTMENT INTELLIGENCE</div>
          </div>
          <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
            {TABS.map(t => (
              <button key={t.id} className={`nav-item${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>
                <span style={{ fontSize:14 }}>{t.icon}</span>
                <span>{t.label}</span>
                {t.id==="portfolio"&&allHoldings.length>0&&(
                  <span style={{ marginLeft:"auto", background:"var(--green)20", color:"var(--green)", borderRadius:6, padding:"1px 7px", fontSize:10, fontFamily:"var(--ff-mono)", border:"1px solid var(--green)40" }}>{allHoldings.length}</span>
                )}
                {t.id==="watchlist"&&watchlist.length>0&&(
                  <span style={{ marginLeft:"auto", background:"var(--blue)20", color:"var(--blue)", borderRadius:6, padding:"1px 7px", fontSize:10, fontFamily:"var(--ff-mono)", border:"1px solid var(--blue)40" }}>{watchlist.length}</span>
                )}
                {t.id==="calls"&&callRecords.length>0&&(
                  <span style={{ marginLeft:"auto", background:"var(--purple)20", color:"var(--purple)", borderRadius:6, padding:"1px 7px", fontSize:10, fontFamily:"var(--ff-mono)", border:"1px solid var(--purple)40" }}>{callRecords.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div style={{ padding:"16px 8px 0", borderTop:"1px solid var(--border)", marginTop:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", animation:"pulse 2s infinite" }}/>
              <div>
                <div style={{ fontSize:10, fontFamily:"var(--ff-mono)", color:"var(--green)", letterSpacing:"0.08em" }}>LIVE DATA</div>
                <div style={{ fontSize:9, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>Yahoo · CoinGecko</div>
              </div>
            </div>
            <div style={{ fontSize:9, color:"var(--muted)", fontFamily:"var(--ff-mono)", letterSpacing:"0.04em" }}>{fxLabel}</div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex:1, padding:"32px 36px", overflowY:"auto", minWidth:0 }}>

          {/* ══ DASHBOARD ══ */}
          {tab==="dashboard"&&(
            <div>
              <div className="fu" style={{ marginBottom:32 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                  <div>
                    <h1 style={{ fontFamily:"var(--ff-head)", fontSize:28, fontWeight:800, letterSpacing:"-0.03em", color:"var(--text2)", lineHeight:1.2, marginBottom:6 }}>
                      {(()=>{const h=new Date().getHours();return h<12?"Good morning.":h<17?"Good afternoon.":"Good evening.";})()}<br/>
                      <span style={{ color:"var(--muted2)", fontWeight:600, fontSize:22 }}>
                        {dashLoading ? "Generating picks…" : dashPicks.length > 0 ? `${dashPicks.length} high-conviction picks today.` : "Today's top picks."}
                      </span>
                    </h1>
                    <p style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)", letterSpacing:"0.06em" }}>
                      {new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
                      {dashPicks.length > 0 && <span style={{marginLeft:10,color:"var(--green)"}}>· AI GENERATED · LIVE</span>}
                    </p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <button onClick={()=>fetchDashPicks(true)} disabled={dashLoading} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 16px",fontSize:10,color:dashLoading?"var(--muted)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:dashLoading?.5:1}}>
                      {dashLoading ? "↻ LOADING…" : "↻ REFRESH"}
                    </button>
                    {dashPicks.length > 0 && (
                      <button onClick={async()=>{setGlossaryExtracting(true);const t=dashPicks.map(p=>[p.summary,p.macro,p.fundamental,p.technical,p.sentiment,p.portfolio].filter(Boolean).join(" ")).join(" ");await extractGlossaryTerms(t);setGlossaryExtracting(false);openGlossary();}} disabled={glossaryExtracting} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 16px",fontSize:10,color:glossaryExtracting?"var(--muted)":"var(--amber)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:glossaryExtracting?.5:1}}>
                        {glossaryExtracting ? "◈ UPDATING…" : "◈ UPDATE GLOSSARY"}
                      </button>
                    )}
                    <CurrencyToggle value={displayCcy} onChange={setDisplayCcy}/>
                  </div>
                </div>
              </div>

              {/* Loading shimmer */}
              {dashLoading && dashPicks.length === 0 && (
                <div style={{display:"grid",gap:12,marginBottom:28}}>
                  {[1,2,3].map(i=>(
                    <div key={i} className="card" style={{padding:20}}>
                      <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}>
                        <div className="shimmer-el" style={{width:44,height:44,borderRadius:10,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div className="shimmer-el" style={{width:"40%",height:14,marginBottom:8}}/>
                          <div className="shimmer-el" style={{width:"60%",height:11}}/>
                        </div>
                        <div className="shimmer-el" style={{width:60,height:24,borderRadius:6}}/>
                      </div>
                      <div className="shimmer-el" style={{width:"90%",height:11,marginBottom:6}}/>
                      <div className="shimmer-el" style={{width:"75%",height:11}}/>
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {dashError && !dashLoading && (
                <div style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:12,padding:"20px 24px",marginBottom:28}}>
                  <div style={{fontSize:10,fontFamily:"var(--ff-mono)",color:"var(--red)",letterSpacing:"0.08em",marginBottom:6}}>COULD NOT GENERATE PICKS</div>
                  <p style={{fontSize:13,color:"var(--muted2)",marginBottom:14}}>{dashError}</p>
                  <button onClick={()=>fetchDashPicks()} style={{background:"none",border:"1px solid #ff525240",borderRadius:7,padding:"7px 16px",fontSize:11,color:"var(--red)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",cursor:"pointer"}}>TRY AGAIN</button>
                </div>
              )}

              {/* Live picks */}
              {dashPicks.length > 0 && (
                <div className="fu3">
                  <div className="section-label">TOP PICKS TODAY</div>
                  {dashPicks.map(s=>(
                    <StockCard key={s.sym} stock={s} expanded={expanded===s.sym} onToggle={()=>setExp(expanded===s.sym?null:s.sym)} livePrices={livePrices} displayCcy={displayCcy} audUsd={audUsd} onViewChart={()=>openDetail({sym:s.sym,name:s.name,priceType:s.priceType,priceCurrency:s.priceCurrency||"USD",sector:s.sector},s)} onAddWatchlist={()=>addToWatchlist(s)} inWatchlist={!!watchlist.find(w=>w.sym===s.sym)}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ EXPLORER ══ */}
          {tab==="explorer"&&(
            <div>
              <div className="fu" style={{marginBottom:28}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:8}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>Stock Explorer</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>AI analysis with drillable reasoning chain for any stock, ETF or crypto.</p>
                  </div>
                  <CurrencyToggle value={displayCcy} onChange={setDisplayCcy}/>
                </div>
              </div>
              <div className="fu2" style={{display:"flex",gap:8,marginBottom:20}}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} placeholder="e.g. NVIDIA, BHP, Bitcoin…" style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"13px 18px",color:"var(--text2)",fontSize:14}}/>
                <button onClick={handleSearch} disabled={searching} style={{background:searching?"var(--card)":"var(--green)",color:searching?"var(--muted)":"#0a0a14",border:"none",borderRadius:10,padding:"13px 28px",fontSize:13,fontFamily:"var(--ff-head)",fontWeight:700,opacity:searching?.7:1}}>
                  {searching?"Analysing…":"Analyse →"}
                </button>
              </div>

              {searching&&<div style={{display:"grid",gap:10,marginBottom:20}}>{[85,65,75].map((w,i)=><div key={i} className="shimmer-el" style={{height:20,width:`${w}%`}}/>)}</div>}
              {searchError&&<div style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:10,padding:16,color:"var(--red)",fontSize:13,marginBottom:20}}>{searchError}</div>}

              {searchResult&&!searching&&(
                <div className="fi">
                  <StockCard
                    stock={searchResult} expanded={true} onToggle={()=>{}}
                    livePrices={livePrices} displayCcy={displayCcy} audUsd={audUsd}
                    onAddWatchlist={() => addToWatchlist(searchResult)}
                    inWatchlist={!!watchlist.find(w => w.sym === searchResult.sym)}
                    onViewChart={() => openDetail({ sym:searchResult.sym, name:searchResult.name, priceType:searchResult.priceType, priceCurrency:searchResult.priceCurrency||"USD", sector:searchResult.sector }, searchResult, explorerAnalysis)}
                  />
                  {explorerChartLoading && (
                    <div className="shimmer-el" style={{height:260,marginTop:16,borderRadius:14}}/>
                  )}
                  {explorerChart && !explorerChartLoading && (
                    <div style={{marginTop:16,background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 20px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <span style={{fontSize:10,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Price Chart — 1 Month</span>
                        <button onClick={()=>openDetail({sym:searchResult.sym,name:searchResult.name,priceType:searchResult.priceType,priceCurrency:searchResult.priceCurrency||"USD",sector:searchResult.sector},searchResult,explorerAnalysis)} style={{background:"none",border:"1px solid var(--border)",borderRadius:7,padding:"4px 12px",fontSize:10,color:"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
                          FULL ANALYSIS →
                        </button>
                      </div>
                      <ChartCanvas candles={explorerChart.candles} analysis={null} range="1mo" currency={explorerChart.currency} indicators={explorerChart.indicators}/>
                    </div>
                  )}
                  <button onClick={()=>{setResult(null);setSearchQ("");setExplorerChart(null);}} style={{marginTop:8,background:"none",border:"none",fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)",padding:0,letterSpacing:"0.06em",cursor:"pointer"}}>
                    ← NEW SEARCH
                  </button>
                </div>
              )}

              {!searchResult&&!searching&&(
                <div>
                  {searchHistory.length > 0 && (
                    <div className="fu2" style={{marginBottom:28}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div className="section-label" style={{marginBottom:0}}>RECENT ANALYSES</div>
                        <button onClick={()=>setHistory([])} style={{background:"none",border:"none",fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",cursor:"pointer"}}>CLEAR</button>
                      </div>
                      <div style={{display:"grid",gap:6}}>
                        {searchHistory.slice(0,6).map(h=>(
                          <div key={h.sym} onClick={()=>setResult(h)} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--border2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                              <VerdictBadge v={h.verdict}/>
                              <span style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700,color:"var(--text2)"}}>{h.sym}</span>
                              <span style={{fontSize:12,color:"var(--muted2)"}}>{h.name}</span>
                              <SectorBadge sector={h.sector}/>
                            </div>
                            <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
                              {h.analysedAt && <span style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>{new Date(h.analysedAt).toLocaleDateString("en-AU",{day:"numeric",month:"short"})}</span>}
                              <span style={{fontSize:10,color:"var(--green)",fontFamily:"var(--ff-mono)"}}>VIEW →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="fu3">
                    <div className="section-label">SUGGESTED</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {["NVIDIA","BHP.AX","Bitcoin","Rio Tinto","Solana","CBA.AX","Palantir","Ethereum","AMD"].map(s=>(
                        <button key={s} onClick={()=>setSearchQ(s)} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 16px",fontSize:12,color:"var(--muted2)",fontFamily:"var(--ff-mono)"}}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ SCREENER ══ */}
          {tab==="screener"&&(
            <div>
              <div className="fu" style={{marginBottom:28}}>
                <div>
                  <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>Natural Language Screener</h1>
                  <p style={{fontSize:13,color:"var(--muted2)"}}>Describe what you're looking for — AI finds matching stocks with full analysis.</p>
                </div>
              </div>

              <div className="fu2" style={{display:"flex",gap:8,marginBottom:20}}>
                <input
                  value={screenerQ} onChange={e=>setScreenerQ(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&runScreener()}
                  placeholder="e.g. Undervalued ASX small-caps with strong cash flow and insider buying…"
                  style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"13px 18px",color:"var(--text2)",fontSize:14}}
                />
                <button onClick={()=>runScreener()} disabled={screenerLoading||!screenerQ.trim()} style={{background:screenerLoading||!screenerQ.trim()?"var(--card)":"var(--green)",color:screenerLoading||!screenerQ.trim()?"var(--muted)":"#0a0a14",border:"none",borderRadius:10,padding:"13px 28px",fontSize:13,fontFamily:"var(--ff-head)",fontWeight:700,opacity:screenerLoading?.7:1}}>
                  {screenerLoading?"Screening…":"Screen →"}
                </button>
              </div>

              {/* Suggested screens */}
              {!screenerResults && !screenerLoading && (
                <div className="fu3">
                  <div className="section-label">SUGGESTED SCREENS</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[
                      "Undervalued ASX small-caps with strong cash flow",
                      "High-conviction AI infrastructure plays",
                      "Beaten-down crypto with strong fundamentals",
                      "ASX mining stocks leveraged to China recovery",
                      "US dividend stocks with growing yields",
                      "High-growth software companies with positive FCF",
                    ].map(s=>(
                      <button key={s} onClick={()=>{setScreenerQ(s);runScreener(s);}} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 14px",fontSize:11,color:"var(--muted2)",fontFamily:"var(--ff-mono)",textAlign:"left"}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {screenerLoading && (
                <div style={{display:"grid",gap:12}}>
                  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 18px",marginBottom:4}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:"var(--green)",animation:"pulse 1s infinite"}}/>
                      <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted)"}}>AI is screening the market…</span>
                    </div>
                  </div>
                  {[1,2,3].map(i=>(
                    <div key={i} className="card" style={{padding:20}}>
                      <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}>
                        <div className="shimmer-el" style={{width:44,height:44,borderRadius:10,flexShrink:0}}/>
                        <div style={{flex:1}}><div className="shimmer-el" style={{width:"40%",height:14,marginBottom:8}}/><div className="shimmer-el" style={{width:"60%",height:11}}/></div>
                        <div className="shimmer-el" style={{width:60,height:24,borderRadius:6}}/>
                      </div>
                      <div className="shimmer-el" style={{width:"90%",height:11,marginBottom:6}}/>
                      <div className="shimmer-el" style={{width:"75%",height:11}}/>
                    </div>
                  ))}
                </div>
              )}

              {screenerError && <div style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:10,padding:16,color:"var(--red)",fontSize:13,marginBottom:20}}>{screenerError}</div>}

              {screenerResults && !screenerLoading && (
                <div className="fi">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div className="section-label" style={{marginBottom:0}}>{screenerResults.length} MATCHES FOUND</div>
                    <button onClick={()=>{setScreenerResults(null);setScreenerQ("");}} style={{background:"none",border:"none",fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)",padding:0,letterSpacing:"0.06em",cursor:"pointer"}}>← NEW SCREEN</button>
                  </div>
                  {screenerResults.map(s => (
                    <div key={s.sym} className="card" style={{padding:22,marginBottom:10,borderLeft:`3px solid ${{BUY:"var(--green)",WATCH:"var(--amber)",AVOID:"var(--red)",HOLD:"var(--border2)"}[s.verdict]||"var(--border2)"}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                            <span style={{fontFamily:"var(--ff-head)",fontSize:18,fontWeight:800,color:"var(--text2)"}}>{s.sym}</span>
                            <span style={{fontSize:13,color:"var(--muted2)"}}>{s.name}</span>
                            <VerdictBadge v={s.verdict}/>
                            <ConvictionDots level={s.conviction}/>
                          </div>
                          {s.matchReason && (
                            <div style={{background:"var(--green)10",border:"1px solid var(--green)25",borderRadius:8,padding:"6px 12px",marginBottom:8,display:"inline-block"}}>
                              <span style={{fontSize:10,fontFamily:"var(--ff-mono)",color:"var(--green)",letterSpacing:"0.06em"}}>MATCH — </span>
                              <span style={{fontSize:11,color:"var(--muted2)"}}>{s.matchReason}</span>
                            </div>
                          )}
                          <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7,maxWidth:600}}>{s.summary}</p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"var(--ff-mono)",fontSize:18,fontWeight:600,color:"var(--text2)",marginBottom:3}}>{s.priceStatic ? `$${s.priceStatic.toLocaleString()}` : "—"}</div>
                          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>tgt {s.target}</div>
                        </div>
                      </div>
                      <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>
                        <button onClick={()=>{setTab("explorer");setSearchQ(s.sym);handleSearch(s.sym);}} style={{background:"none",border:"1px solid var(--border)",borderRadius:7,padding:"5px 14px",fontSize:10,color:"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>FULL ANALYSIS →</button>
                        <button onClick={()=>addToWatchlist(s)} disabled={!!watchlist.find(w=>w.sym===s.sym)} style={{background:watchlist.find(w=>w.sym===s.sym)?"#00e67612":"none",border:`1px solid ${watchlist.find(w=>w.sym===s.sym)?"#00e67640":"var(--border)"}`,borderRadius:7,padding:"5px 14px",fontSize:10,color:watchlist.find(w=>w.sym===s.sym)?"var(--green)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
                          {watchlist.find(w=>w.sym===s.sym)?"✓ WATCHLIST":"+ WATCHLIST"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ PORTFOLIO ══ */}
          {tab==="portfolio"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:5}}>My Portfolio</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>Live prices across all sources.</p>
                  </div>
                  <CurrencyToggle value={displayCcy} onChange={setDisplayCcy}/>
                </div>
              </div>

              <div className="fu2" style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
                {PORT_TABS.map(t=>{
                  const count=t.id==="all"?allHoldings.length:t.id==="coinbase"?cbHoldings.length:t.id==="coinspot"?csHoldings.length:cmcHoldings.length;
                  const isActive=portTab===t.id;
                  return (
                    <button key={t.id} onClick={()=>setPortTab(t.id)} style={{background:isActive?`${t.color}18`:"none",border:`1px solid ${isActive?`${t.color}50`:"var(--border)"}`,borderRadius:10,padding:"8px 20px",fontSize:12,fontWeight:isActive?600:400,color:isActive?t.color:"var(--muted2)"}}>
                      {t.label}{count>0&&<span style={{marginLeft:7,fontSize:10,fontFamily:"var(--ff-mono)",opacity:.7}}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              {portTab==="all"&&(
                allHoldings.length>0 ? (
                  <>
                    <div className="fu"><SummaryStrip holdings={allHoldings} livePrices={livePrices} displayCcy={displayCcy} audUsd={audUsd}/></div>
                    <div className="fu2">
                      <div className="section-label">ALL HOLDINGS</div>
                      <div style={{display:"grid",gap:8}}>
                        {allHoldings.map(h=>(
                          <HoldingRow key={`${h.source}-${h.sym}`} holding={h} livePrice={livePrices[h.sym]} expanded={portExp===`${h.source}-${h.sym}`} onToggle={()=>setPortExp(p=>p===`${h.source}-${h.sym}`?null:`${h.source}-${h.sym}`)} onRemove={h.source==="cmc"?()=>setCmc(p=>p.filter(x=>x.sym!==h.sym)):null} onViewChart={()=>openDetail({sym:h.sym,name:h.name,priceType:h.priceType,priceCurrency:h.priceCurrency||"USD",sector:h.sector})} displayCcy={displayCcy} audUsd={audUsd}/>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"56px 32px",textAlign:"center"}}>
                    <p style={{color:"var(--muted2)",fontSize:15,fontFamily:"var(--ff-head)",fontWeight:600,marginBottom:10}}>No holdings yet</p>
                    <p style={{color:"var(--muted)",fontSize:13,marginBottom:28}}>Connect Coinbase, CoinSpot, or import your CMC CSV to get started.</p>
                    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                      <button onClick={syncCoinbase} style={{background:"none",border:"1px solid var(--amber)50",borderRadius:10,padding:"10px 20px",fontSize:12,color:"var(--amber)"}}>Sync Coinbase</button>
                      <button onClick={syncCoinspot} style={{background:"none",border:"1px solid var(--green)50",borderRadius:10,padding:"10px 20px",fontSize:12,color:"var(--green)"}}>Sync CoinSpot</button>
                      <button onClick={()=>setPortTab("cmc")} style={{background:"none",border:"1px solid #448aff50",borderRadius:10,padding:"10px 20px",fontSize:12,color:"var(--blue)"}}>Import CMC CSV</button>
                    </div>
                  </div>
                )
              )}

              {portTab==="coinbase"&&(
                <SourcePanel label="Coinbase" color="var(--amber)" holdings={cbHoldings} livePrices={livePrices} syncing={cbSyncing} lastSync={cbLastSync} error={cbError} onSync={syncCoinbase} onRemove={sym=>setCb(p=>p.filter(h=>h.sym!==sym))} onViewChart={h=>openDetail({sym:h.sym,name:h.name,priceType:h.priceType,priceCurrency:h.priceCurrency||"USD",sector:h.sector})} displayCcy={displayCcy} audUsd={audUsd}/>
              )}

              {portTab==="coinspot"&&(
                <SourcePanel label="CoinSpot" color="var(--green)" holdings={csHoldings} livePrices={livePrices} syncing={csSyncing} lastSync={csLastSync} error={csError} onSync={syncCoinspot} onRemove={sym=>setCs(p=>p.filter(h=>h.sym!==sym))} onViewChart={h=>openDetail({sym:h.sym,name:h.name,priceType:h.priceType,priceCurrency:h.priceCurrency||"USD",sector:h.sector})} displayCcy={displayCcy} audUsd={audUsd}/>
              )}

              {portTab==="cmc"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{width:10,height:10,borderRadius:"50%",background:"var(--blue)",boxShadow:"0 0 8px #448aff80"}}/>
                      <span style={{fontSize:13,fontFamily:"var(--ff-head)",fontWeight:700,color:"var(--blue)"}}>CMC Invest</span>
                      {cmcHoldings.length>0&&<span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted2)"}}>{cmcHoldings.length} positions</span>}
                    </div>
                    {cmcHoldings.length>0&&<button onClick={()=>setCmc([])} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"6px 14px",fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>CLEAR ALL</button>}
                  </div>
                  {cmcHoldings.length>0&&<SummaryStrip holdings={cmcHoldings} livePrices={livePrices} displayCcy={displayCcy} audUsd={audUsd}/>}
                  <div style={{marginBottom:cmcHoldings.length>0?24:0}}><CMCImport onImport={h=>setCmc(h)}/></div>
                  {cmcHoldings.length>0&&(
                    <div style={{display:"grid",gap:8}}>
                      {cmcHoldings.map(h=>(
                        <HoldingRow key={h.sym} holding={h} livePrice={livePrices[h.sym]} expanded={portExp===`cmc-${h.sym}`} onToggle={()=>setPortExp(p=>p===`cmc-${h.sym}`?null:`cmc-${h.sym}`)} onRemove={()=>setCmc(p=>p.filter(x=>x.sym!==h.sym))} onViewChart={()=>openDetail({sym:h.sym,name:h.name,priceType:h.priceType,priceCurrency:h.priceCurrency||"USD",sector:h.sector})} displayCcy={displayCcy} audUsd={audUsd}/>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ MACRO CALENDAR ══ */}
          {tab==="macro"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>Macro Calendar</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>Upcoming central bank decisions and data releases — contextualised against your portfolio.</p>
                  </div>
                  <button onClick={()=>{setMacroEvents([]);setMacroError(null);setMacroLoading(true);const syms=[...new Set([...allHoldings.map(h=>h.sym),...watchlist.map(w=>w.sym)])];fetch("/api/macro",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({holdingSyms:syms})}).then(r=>r.json()).then(d=>{if(d.error)setMacroError(d.error);else setMacroEvents(d);}).catch(()=>setMacroError("Failed")).finally(()=>setMacroLoading(false));}} disabled={macroLoading} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 16px",fontSize:10,color:macroLoading?"var(--muted)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:macroLoading?.5:1}}>
                    {macroLoading?"↻ LOADING…":"↻ REFRESH"}
                  </button>
                </div>
              </div>

              {macroLoading && <div style={{display:"grid",gap:10}}>{[1,2,3,4].map(i=><div key={i} className="shimmer-el" style={{height:120}}/>)}</div>}
              {macroError && (
                <div style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:12,padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                  <p style={{fontSize:13,color:"var(--red)"}}>{macroError}</p>
                </div>
              )}
              {!macroLoading && macroEvents.length > 0 && (() => {
                const now = new Date();
                const catColor = {FED:"var(--blue)",RBA:"var(--amber)",ECB:"var(--purple)",INFLATION:"var(--red)",EMPLOYMENT:"var(--green)",GROWTH:"var(--text2)",TRADE:"var(--muted2)",OTHER:"var(--muted2)"};
                const impColor = {HIGH:"var(--red)",MEDIUM:"var(--amber)",LOW:"var(--muted)"};
                return (
                  <div className="fu2">
                    {macroEvents.map((ev, i) => {
                      const evDate = new Date(ev.date);
                      const isPast = evDate < now;
                      const diffDays = Math.round((evDate - now) / 86400000);
                      const countdown = isPast ? `${Math.abs(diffDays)}d ago` : diffDays === 0 ? "TODAY" : diffDays === 1 ? "Tomorrow" : `in ${diffDays}d`;
                      const cc = catColor[ev.category] || "var(--muted2)";
                      return (
                        <div key={i} className="card" style={{padding:20,marginBottom:10,borderLeft:`3px solid ${impColor[ev.importance]||"var(--border)"}`,opacity:isPast?0.6:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                                <span className="badge" style={{background:`${cc}18`,color:cc,border:`1px solid ${cc}35`}}>{ev.category}</span>
                                <span className="badge" style={{background:`${impColor[ev.importance]}18`,color:impColor[ev.importance],border:`1px solid ${impColor[ev.importance]}35`}}>{ev.importance}</span>
                                <span className="badge" style={{background:"var(--surface)",color:"var(--muted2)",border:"1px solid var(--border)"}}>{ev.country}</span>
                                {isPast && <span className="badge" style={{background:"var(--surface)",color:"var(--muted)",border:"1px solid var(--border)"}}>PAST</span>}
                              </div>
                              <div style={{fontFamily:"var(--ff-head)",fontSize:15,fontWeight:700,color:"var(--text2)",marginBottom:6}}>{ev.event}</div>
                              <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.6,marginBottom:ev.portfolioImpact?10:0}}>{ev.preview}</p>
                              {ev.portfolioImpact && (
                                <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",marginBottom:8}}>
                                  <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:4}}>PORTFOLIO IMPACT</div>
                                  <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.5,margin:0}}>{ev.portfolioImpact}</p>
                                </div>
                              )}
                              {!isPast && (ev.bullCase || ev.bearCase) && (
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                                  {ev.bullCase && <div style={{background:"#00e67610",border:"1px solid #00e67625",borderRadius:7,padding:"8px 12px"}}>
                                    <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--green)",marginBottom:4,letterSpacing:"0.08em"}}>BULL CASE</div>
                                    <p style={{fontSize:11,color:"var(--muted2)",lineHeight:1.5,margin:0}}>{ev.bullCase}</p>
                                  </div>}
                                  {ev.bearCase && <div style={{background:"#ff525210",border:"1px solid #ff525225",borderRadius:7,padding:"8px 12px"}}>
                                    <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--red)",marginBottom:4,letterSpacing:"0.08em"}}>BEAR CASE</div>
                                    <p style={{fontSize:11,color:"var(--muted2)",lineHeight:1.5,margin:0}}>{ev.bearCase}</p>
                                  </div>}
                                </div>
                              )}
                              {ev.affectedHoldings?.length > 0 && (
                                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                                  {ev.affectedHoldings.map(s=><span key={s} className="badge" style={{background:"var(--surface)",color:"var(--muted2)",border:"1px solid var(--border)"}}>{s}</span>)}
                                </div>
                              )}
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:11,fontFamily:"var(--ff-mono)",color:!isPast&&diffDays<=7?"var(--amber)":"var(--muted2)",fontWeight:600,marginBottom:4}}>{countdown}</div>
                              <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>{ev.date}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══ NEWS ══ */}
          {tab==="news"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>News & Signals</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>
                      {newsLoading ? "Fetching live news…" : newsItems[0]?.live ? "Live from Yahoo Finance · refreshes every 15 min" : "Filtered to your universe."}
                    </p>
                  </div>
                  <button onClick={fetchNews} disabled={newsLoading} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 16px",fontSize:10,color:newsLoading?"var(--muted)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:newsLoading?.5:1}}>
                    {newsLoading ? "↻ LOADING…" : "↻ REFRESH"}
                  </button>
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
                {["ALL","US TECH","ASX MINING","CRYPTO"].map(f=>(
                  <button key={f} className={`filter-btn${newsFilter===f?" active":""}`} onClick={()=>setNewsFilter(f)}>{f}</button>
                ))}
              </div>
              {newsLoading && newsItems === NEWS_MOCK && (
                <div style={{display:"grid",gap:10,marginBottom:20}}>{[90,75,85].map((w,i)=><div key={i} className="shimmer-el" style={{height:80,width:`${w}%`}}/>)}</div>
              )}
              <div className="fu2">
                {filteredNews.length > 0
                  ? filteredNews.map((n,i)=><NewsCard key={i} item={n}/>)
                  : <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"32px",textAlign:"center"}}><p style={{color:"var(--muted2)",fontSize:13}}>No {newsFilter} news right now.</p></div>
                }
              </div>
            </div>
          )}

          {/* ══ WATCHLIST ══ */}
          {tab==="watchlist"&&(
            <div>
              <div className="fu" style={{marginBottom:28}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>Watchlist</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>Track stocks with price targets. Add from Explorer after any analysis.</p>
                  </div>
                  <CurrencyToggle value={displayCcy} onChange={setDisplayCcy}/>
                </div>
              </div>

              {watchlist.length === 0 ? (
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"56px 32px",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:16,opacity:.3}}>◇</div>
                  <p style={{color:"var(--muted2)",fontSize:15,fontFamily:"var(--ff-head)",fontWeight:600,marginBottom:10}}>Watchlist is empty</p>
                  <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>Analyse any stock in Explorer and tap "+ Watchlist" to add it here.</p>
                  <button onClick={()=>setTab("explorer")} style={{background:"none",border:"1px solid var(--green)50",borderRadius:10,padding:"10px 24px",fontSize:12,color:"var(--green)"}}>Go to Explorer →</button>
                </div>
              ) : (
                <div style={{display:"grid",gap:8}}>
                  {watchlist.map(w => {
                    const lp = livePrices[w.sym];
                    const priceCcy = w.priceCurrency || lp?.currency || "USD";
                    const rawPrice = lp?.price;
                    const dispPrice = rawPrice ? toDisplay(rawPrice, priceCcy, displayCcy, audUsd) : null;
                    const targetDisp = w.target ? toDisplay(w.target, w.targetCcy || "USD", displayCcy, audUsd) : null;
                    const toTargetPct = (dispPrice && targetDisp) ? ((targetDisp - dispPrice) / dispPrice) * 100 : null;
                    const crossed = toTargetPct != null && toTargetPct <= 0;
                    const close   = toTargetPct != null && !crossed && Math.abs(toTargetPct) < 5;
                    const accent  = crossed ? "var(--green)" : close ? "var(--amber)" : "var(--border2)";

                    return (
                      <div key={w.sym} className="card" style={{padding:"16px 20px",borderLeft:`3px solid ${accent}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                          <div style={{display:"flex",gap:12,alignItems:"center",minWidth:0}}>
                            <div style={{width:40,height:40,borderRadius:10,background:`${accent}18`,border:`1px solid ${accent}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontFamily:"var(--ff-head)",fontSize:11,fontWeight:800,color:accent}}>{w.sym.replace(".AX","").slice(0,3)}</span>
                            </div>
                            <div>
                              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                                <span style={{fontFamily:"var(--ff-head)",fontSize:15,fontWeight:700,color:"var(--text2)"}}>{w.sym}</span>
                                <SectorBadge sector={w.sector}/>
                                {crossed && <span className="badge" style={{background:"#00e67620",color:"var(--green)",border:"1px solid #00e67640"}}>TARGET HIT</span>}
                                {close && !crossed && <span className="badge" style={{background:"var(--amber)20",color:"var(--amber)",border:"1px solid var(--amber)40"}}>NEAR TARGET</span>}
                              </div>
                              <div style={{fontSize:12,color:"var(--muted2)"}}>{w.name}</div>
                            </div>
                          </div>

                          <div style={{display:"flex",gap:20,alignItems:"center"}}>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:4}}>PRICE</div>
                              {dispPrice != null
                                ? <div style={{fontFamily:"var(--ff-mono)",fontSize:16,color:"var(--text2)",fontWeight:500}}>{fmtMoney(dispPrice, displayCcy)}</div>
                                : <div className="shimmer-el" style={{width:64,height:16}}/>}
                              {lp && <div style={{fontSize:10,fontFamily:"var(--ff-mono)",color:lp.up?"var(--green)":"var(--red)",marginTop:2}}>{lp.changeStr} today</div>}
                            </div>

                            {targetDisp != null && (
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:4}}>TARGET</div>
                                <div style={{fontFamily:"var(--ff-mono)",fontSize:16,color:accent,fontWeight:500}}>{fmtMoney(targetDisp, displayCcy)}</div>
                                {toTargetPct != null && (
                                  <div style={{fontSize:10,fontFamily:"var(--ff-mono)",color:accent,marginTop:2}}>
                                    {crossed ? "✓ reached" : `${toTargetPct > 0 ? "+" : ""}${toTargetPct.toFixed(1)}% to go`}
                                  </div>
                                )}
                              </div>
                            )}

                            <button onClick={()=>openDetail({sym:w.sym,name:w.name,priceType:w.priceType,priceCurrency:w.priceCurrency,sector:w.sector})} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 14px",color:"var(--muted2)",fontSize:11,fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",flexShrink:0}}>
                              CHART
                            </button>
                            <button onClick={()=>setWatchlist(prev=>prev.filter(x=>x.sym!==w.sym))} style={{background:"#ff525218",border:"1px solid #ff525240",borderRadius:8,padding:"7px 14px",color:"var(--red)",fontSize:11,fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",flexShrink:0}}>
                              REMOVE
                            </button>
                          </div>
                        </div>

                        {w.note && (
                          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid var(--border)",fontSize:12,color:"var(--muted)",fontStyle:"italic",lineHeight:1.5}}>
                            {w.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* ══ PORTFOLIO COACH ══ */}
          {tab==="coach"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>Portfolio Coach</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>AI-powered portfolio health check — concentration, risk, and rebalancing advice.</p>
                  </div>
                  {coachReport && (
                    <button onClick={()=>{setCoachReport(null);runCoachAnalysis();}} disabled={coachLoading} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 16px",fontSize:10,color:coachLoading?"var(--muted)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:coachLoading?.5:1}}>
                      {coachLoading?"↻ ANALYSING…":"↻ REFRESH"}
                    </button>
                  )}
                </div>
              </div>

              {allHoldings.length === 0 ? (
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"52px 32px",textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:16,opacity:.25}}>◭</div>
                  <p style={{color:"var(--muted2)",fontSize:15,fontFamily:"var(--ff-head)",fontWeight:700,marginBottom:8}}>No portfolio connected.</p>
                  <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>Connect Coinbase, CoinSpot, or import a CMC CSV to get AI coaching.</p>
                  <button onClick={()=>setTab("portfolio")} style={{background:"var(--green)18",border:"1px solid var(--green)40",borderRadius:8,padding:"8px 20px",fontSize:11,color:"var(--green)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>GO TO PORTFOLIO →</button>
                </div>
              ) : coachLoading && !coachReport ? (
                <div style={{display:"grid",gap:12}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:4}}>
                    {[1,2,3,4].map(i=><div key={i} className="shimmer-el" style={{height:88}}/>)}
                  </div>
                  {[1,2,3].map(i=><div key={i} className="shimmer-el" style={{height:72}}/>)}
                </div>
              ) : coachError ? (
                <div style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:12,padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <p style={{fontSize:13,color:"var(--red)"}}>{coachError}</p>
                  <button onClick={runCoachAnalysis} style={{background:"none",border:"1px solid var(--red)50",borderRadius:8,padding:"6px 14px",fontSize:10,color:"var(--red)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>TRY AGAIN</button>
                </div>
              ) : coachReport ? (() => {
                const gradeColor = {A:"var(--green)",B:"var(--blue)",C:"var(--amber)",D:"#ff6e40",F:"var(--red)"}[coachReport.grade] || "var(--muted2)";
                const riskColor  = {AGGRESSIVE:"var(--red)",BALANCED:"var(--amber)",CONSERVATIVE:"var(--green)"}[coachReport.riskProfile] || "var(--muted2)";
                const snap = buildPortfolioSnapshot(allHoldings, livePrices, audUsd);
                const topHolding = snap.holdings[0];
                const priorityColor = {HIGH:"var(--red)",MEDIUM:"var(--amber)",LOW:"var(--green)"};
                return (
                  <div className="fi">
                    {/* Stats strip */}
                    <div className="fu" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
                      <div className="stat-card" style={{borderTop:`3px solid ${gradeColor}`}}>
                        <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.12em",marginBottom:8}}>PORTFOLIO GRADE</div>
                        <div style={{fontSize:40,fontFamily:"var(--ff-head)",fontWeight:900,color:gradeColor,lineHeight:1}}>{coachReport.grade}</div>
                        <div style={{fontSize:10,color:"var(--muted2)",marginTop:6,lineHeight:1.4}}>{coachReport.gradeNote}</div>
                      </div>
                      <div className="stat-card" style={{borderTop:`3px solid ${riskColor}`}}>
                        <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.12em",marginBottom:8}}>RISK PROFILE</div>
                        <div style={{fontSize:18,fontFamily:"var(--ff-head)",fontWeight:800,color:riskColor,lineHeight:1,marginBottom:6}}>{coachReport.riskProfile}</div>
                        <div style={{fontSize:10,color:"var(--muted2)",lineHeight:1.4}}>{coachReport.riskNote}</div>
                      </div>
                      <div className="stat-card">
                        <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.12em",marginBottom:8}}>TOP HOLDING</div>
                        {topHolding ? (
                          <>
                            <div style={{fontSize:18,fontFamily:"var(--ff-head)",fontWeight:800,color:"var(--text2)",lineHeight:1}}>{topHolding.sym}</div>
                            <div style={{fontSize:14,fontFamily:"var(--ff-mono)",color:"var(--amber)",marginTop:4}}>{topHolding.pct.toFixed(1)}% of portfolio</div>
                          </>
                        ) : <div style={{fontSize:14,color:"var(--muted)"}}>—</div>}
                      </div>
                      <div className="stat-card">
                        <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.12em",marginBottom:8}}>CRYPTO / STOCKS</div>
                        <div style={{fontSize:18,fontFamily:"var(--ff-head)",fontWeight:800,color:"var(--text2)",lineHeight:1}}>{snap.cryptoPct.toFixed(0)}% / {snap.stocksPct.toFixed(0)}%</div>
                        <div style={{marginTop:8,height:6,borderRadius:3,background:"var(--border)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${snap.cryptoPct}%`,background:"var(--purple)",borderRadius:3}}/>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="fu2 card" style={{padding:20,marginBottom:16}}>
                      <div className="section-label">OVERALL ASSESSMENT</div>
                      <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7,marginBottom:coachReport.outlook?12:0}}>{coachReport.summary}</p>
                      {coachReport.outlook && <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.6,fontStyle:"italic",borderTop:"1px solid var(--border)",paddingTop:10,marginTop:2}}>{coachReport.outlook}</p>}
                    </div>

                    {/* Strengths + Weaknesses */}
                    <div className="fu3" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                      <div className="card" style={{padding:18}}>
                        <div className="section-label">STRENGTHS</div>
                        {(coachReport.strengths||[]).map((s,i)=>(
                          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
                            <span style={{color:"var(--green)",fontWeight:700,flexShrink:0}}>✓</span>
                            <span style={{fontSize:12,color:"var(--muted2)",lineHeight:1.5}}>{s}</span>
                          </div>
                        ))}
                      </div>
                      <div className="card" style={{padding:18}}>
                        <div className="section-label">WEAKNESSES</div>
                        {(coachReport.weaknesses||[]).map((w,i)=>(
                          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
                            <span style={{color:"var(--red)",fontWeight:700,flexShrink:0}}>✗</span>
                            <span style={{fontSize:12,color:"var(--muted2)",lineHeight:1.5}}>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="card" style={{padding:20,marginBottom:16}}>
                      <div className="section-label">RECOMMENDED ACTIONS</div>
                      {(coachReport.actions||[]).map((a,i)=>(
                        <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 0",borderBottom:i<(coachReport.actions.length-1)?"1px solid var(--border)":"none"}}>
                          <span className="badge" style={{background:`${priorityColor[a.priority]||"var(--muted)"}18`,color:priorityColor[a.priority]||"var(--muted2)",border:`1px solid ${priorityColor[a.priority]||"var(--border)"}40`,flexShrink:0}}>{a.priority}</span>
                          <div>
                            <div style={{fontSize:13,color:"var(--text2)",fontWeight:600,marginBottom:3}}>{a.action}</div>
                            <div style={{fontSize:11,color:"var(--muted2)"}}>{a.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sector breakdown */}
                    <div className="card" style={{padding:20,marginBottom:16}}>
                      <div className="section-label">SECTOR BREAKDOWN</div>
                      {Object.entries(snap.sectorBreakdown).sort((a,b)=>b[1]-a[1]).map(([sector,pct])=>(
                        <div key={sector} style={{marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:12,color:"var(--muted2)"}}>{sector}</span>
                            <span style={{fontSize:12,fontFamily:"var(--ff-mono)",color:"var(--text2)"}}>{pct.toFixed(1)}%</span>
                          </div>
                          <div style={{height:6,borderRadius:3,background:"var(--border)",overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:"var(--green)",borderRadius:3,opacity:0.7}}/>
                          </div>
                        </div>
                      ))}
                      {coachReport.sectorComment && <p style={{fontSize:11,color:"var(--muted)",marginTop:12,lineHeight:1.5,fontStyle:"italic"}}>{coachReport.sectorComment}</p>}
                    </div>

                    {/* Concentration + Diversification */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                      {coachReport.concentration && (
                        <div className="card" style={{padding:18}}>
                          <div className="section-label">CONCENTRATION RISK</div>
                          <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.6}}>{coachReport.concentration}</p>
                        </div>
                      )}
                      {coachReport.diversification && (
                        <div className="card" style={{padding:18}}>
                          <div className="section-label">DIVERSIFICATION</div>
                          <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.6}}>{coachReport.diversification}</p>
                        </div>
                      )}
                    </div>
                    {coachReport.cryptoComment && (
                      <div className="card" style={{padding:18,marginBottom:16}}>
                        <div className="section-label">CRYPTO ALLOCATION</div>
                        <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.6}}>{coachReport.cryptoComment}</p>
                      </div>
                    )}
                  </div>
                );
              })() : null}
            </div>
          )}

          {/* ══ EARNINGS CALENDAR ══ */}
          {tab==="earnings"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>Earnings Calendar</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>Upcoming & recent earnings for your holdings and watchlist. Get an AI brief before each one.</p>
                  </div>
                  <button onClick={()=>{setEarningsData({});setEarningsBriefs({});}} disabled={earningsLoading} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 16px",fontSize:10,color:earningsLoading?"var(--muted)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:earningsLoading?.5:1}}>
                    {earningsLoading?"↻ LOADING…":"↻ REFRESH"}
                  </button>
                </div>
              </div>

              {Object.keys(earningsData).length === 0 && !earningsLoading && (
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"32px",textAlign:"center",marginBottom:16}}>
                  <p style={{color:"var(--muted2)",fontSize:13,marginBottom:8}}>No earnings data found.</p>
                  <p style={{color:"var(--muted)",fontSize:12}}>Ensure <code style={{fontFamily:"var(--ff-mono)",color:"var(--amber)"}}>FMP_API_KEY</code> is set in your .env and you have holdings or watchlist items.</p>
                </div>
              )}

              {earningsLoading && (
                <div style={{display:"grid",gap:10}}>{[1,2,3,4].map(i=><div key={i} className="shimmer-el" style={{height:80}}/>)}</div>
              )}

              {!earningsLoading && (() => {
                const now = new Date();
                const allEntries = [];
                Object.entries(earningsData).forEach(([sym, events]) => {
                  events.forEach(ev => {
                    const d = new Date(ev.date);
                    allEntries.push({ sym, ...ev, dateObj: d, isFuture: d >= now });
                  });
                });
                const upcoming = allEntries.filter(e => e.isFuture).sort((a,b) => a.dateObj - b.dateObj);
                const recent   = allEntries.filter(e => !e.isFuture && (now - e.dateObj) < 60 * 86400000).sort((a,b) => b.dateObj - a.dateObj);

                if (allEntries.length === 0 && Object.keys(earningsData).length > 0) {
                  return <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"32px",textAlign:"center"}}><p style={{color:"var(--muted2)",fontSize:13}}>No earnings data found for your holdings/watchlist.</p></div>;
                }
                if (allEntries.length === 0) return null;

                function EarningsRow({ e }) {
                  const brief = earningsBriefs[e.sym];
                  const loading = earningsBriefing[e.sym];
                  const surprises = earningsData[e.sym]?.filter(x => x.epsActual != null && x.epsEstimated != null) || [];
                  const verdictColor = {BEAT_LIKELY:"var(--green)",MISS_LIKELY:"var(--red)",IN_LINE:"var(--amber)",UNCERTAIN:"var(--muted2)"};
                  const diffDays = Math.round((e.dateObj - now) / 86400000);
                  const countdown = e.isFuture
                    ? diffDays === 0 ? "TODAY" : diffDays === 1 ? "Tomorrow" : `in ${diffDays}d`
                    : Math.abs(diffDays) <= 1 ? "Yesterday" : `${Math.abs(diffDays)}d ago`;
                  const countdownColor = e.isFuture && diffDays <= 7 ? "var(--amber)" : e.isFuture ? "var(--text2)" : "var(--muted)";
                  const surprise = e.epsActual != null && e.epsEstimated != null
                    ? ((e.epsActual - e.epsEstimated) / Math.abs(e.epsEstimated || 1) * 100) : null;

                  return (
                    <div className="card" style={{padding:18,marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
                        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                          <div style={{width:40,height:40,borderRadius:10,background:"var(--surface)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <span style={{fontFamily:"var(--ff-head)",fontSize:10,fontWeight:800,color:"var(--muted2)"}}>{e.sym.replace(".AX","").slice(0,3)}</span>
                          </div>
                          <div>
                            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                              <span style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700,color:"var(--text2)"}}>{e.sym}</span>
                              <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:countdownColor,fontWeight:600}}>{countdown}</span>
                              <span style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>{e.date}</span>
                              {e.time && <span className="badge" style={{background:"var(--surface)",color:"var(--muted2)",border:"1px solid var(--border)"}}>{e.time}</span>}
                            </div>
                            {!e.isFuture && surprise != null && (
                              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                                <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted2)"}}>EPS actual: <span style={{color:"var(--text2)",fontWeight:600}}>{e.epsActual?.toFixed(2)}</span></span>
                                <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted2)"}}>est: {e.epsEstimated?.toFixed(2)}</span>
                                <span className="badge" style={{background:surprise>=0?"#00e67618":"#ff525218",color:surprise>=0?"var(--green)":"var(--red)",border:`1px solid ${surprise>=0?"#00e67640":"#ff525240"}`}}>
                                  {surprise>=0?"+":""}{surprise.toFixed(1)}% surprise
                                </span>
                              </div>
                            )}
                            {e.isFuture && e.epsEstimated != null && (
                              <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted2)"}}>Est EPS: <span style={{color:"var(--text2)"}}>{e.epsEstimated?.toFixed(2)}</span></span>
                            )}
                          </div>
                        </div>
                        {e.isFuture && (
                          <button onClick={()=>fetchEarningsBrief(e.sym, e.date, surprises.slice(0,4))} disabled={loading} style={{background:loading?"none":"var(--surface)",border:`1px solid ${brief?"var(--green)50":"var(--border)"}`,borderRadius:8,padding:"6px 14px",fontSize:10,color:loading?"var(--muted)":brief?"var(--green)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",flexShrink:0}}>
                            {loading?"BRIEFING…":brief?"✓ BRIEFED":"GET AI BRIEF"}
                          </button>
                        )}
                      </div>
                      {brief && (
                        <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)",display:"grid",gap:10}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                            <span className="badge" style={{background:`${verdictColor[brief.verdict]||"var(--muted)"}18`,color:verdictColor[brief.verdict]||"var(--muted2)",border:`1px solid ${verdictColor[brief.verdict]||"var(--border)"}40`}}>{brief.verdict?.replace("_"," ")}</span>
                            <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.06em"}}>AI PRE-EARNINGS BRIEF</span>
                          </div>
                          {[{l:"WATCH FOR",v:brief.watch},{l:"CONSENSUS",v:brief.consensus},{l:"KEY RISK",v:brief.risk},{l:"SETUP",v:brief.setup}].filter(x=>x.v).map(({l,v})=>(
                            <div key={l}>
                              <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:3}}>{l}</div>
                              <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.5,margin:0}}>{v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <>
                    {upcoming.length > 0 && (
                      <div className="fu2" style={{marginBottom:28}}>
                        <div className="section-label">UPCOMING EARNINGS ({upcoming.length})</div>
                        {upcoming.map((e,i) => <EarningsRow key={`${e.sym}-${e.date}-${i}`} e={e}/>)}
                      </div>
                    )}
                    {recent.length > 0 && (
                      <div className="fu3">
                        <div className="section-label">RECENT RESULTS</div>
                        {recent.map((e,i) => <EarningsRow key={`${e.sym}-${e.date}-${i}`} e={e}/>)}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ══ IPO CALENDAR ══ */}
          {tab==="ipo"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>IPO Calendar</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>Upcoming &amp; recent listings — NASDAQ · NYSE · ASX</p>
                  </div>
                  <button onClick={()=>{setIpoItems([]);fetchIPO();}} disabled={ipoLoading} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px 16px",fontSize:10,color:ipoLoading?"var(--muted)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:ipoLoading?.5:1}}>
                    {ipoLoading ? "↻ LOADING…" : "↻ REFRESH"}
                  </button>
                </div>
              </div>

              <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
                {["ALL","UPCOMING","PRICED","FILED","WITHDRAWN"].map(f=>(
                  <button key={f} className={`filter-btn${ipoFilter===f?" active":""}`} onClick={()=>setIpoFilter(f)}>{f}</button>
                ))}
              </div>

              {ipoError && (
                <div style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:12,padding:"20px 24px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <p style={{fontSize:13,color:"var(--red)"}}>{ipoError}</p>
                  <button onClick={fetchIPO} style={{background:"none",border:"1px solid var(--red)50",borderRadius:8,padding:"6px 14px",fontSize:10,color:"var(--red)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>TRY AGAIN</button>
                </div>
              )}

              {ipoLoading && (
                <div style={{display:"grid",gap:10,marginBottom:20}}>
                  {[1,2,3,4].map(i=><div key={i} className="shimmer-el" style={{height:90}}/>)}
                </div>
              )}

              {!ipoLoading && !ipoError && (() => {
                const statusMap = { UPCOMING:"expected", PRICED:"priced", FILED:"filed", WITHDRAWN:"withdrawn" };
                const filtered = ipoFilter === "ALL" ? ipoItems : ipoItems.filter(i => i.status === statusMap[ipoFilter]);
                if (filtered.length === 0) {
                  return (
                    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"40px 32px",textAlign:"center"}}>
                      <div style={{fontSize:28,marginBottom:12,opacity:.3}}>◆</div>
                      <p style={{color:"var(--muted2)",fontSize:14,fontFamily:"var(--ff-head)",fontWeight:600,marginBottom:8}}>
                        {ipoItems.length === 0 ? "No IPO data available." : "No upcoming IPOs in this window."}
                      </p>
                      {ipoItems.length === 0 && <p style={{color:"var(--muted)",fontSize:12}}>Finnhub API key may not be configured.</p>}
                    </div>
                  );
                }
                return (
                  <div className="fu2">
                    {filtered.map((ipo,i) => (
                      <IpoCard key={`${ipo.symbol}-${ipo.date}-${i}`} ipo={ipo} onAnalyse={sym=>{setTab("explorer");handleSearch(sym);}}/>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══ AI CALLS ══ */}
          {tab==="calls"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>AI Track Record</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>Every verdict the AI has made — with live return tracking.</p>
                  </div>
                  {callRecords.length > 0 && (
                    <button onClick={()=>{ if(window.confirm("Clear all call records? This cannot be undone.")) setCallRecords([]); }} style={{background:"#ff525218",border:"1px solid #ff525240",borderRadius:8,padding:"7px 16px",fontSize:10,color:"var(--red)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
                      CLEAR ALL
                    </button>
                  )}
                </div>
              </div>

              {callRecords.length === 0 ? (
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"52px 32px",textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:16,opacity:.25}}>◐</div>
                  <p style={{color:"var(--muted2)",fontSize:15,fontFamily:"var(--ff-head)",fontWeight:700,marginBottom:8}}>No calls recorded yet.</p>
                  <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,lineHeight:1.6,maxWidth:420,margin:"0 auto 24px"}}>
                    Every time the AI gives a verdict in Explorer or Dashboard, it's automatically saved here with the entry price. Over time you'll build a track record you can actually verify.
                  </p>
                  <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={()=>setTab("explorer")} style={{background:"var(--green)18",border:"1px solid var(--green)40",borderRadius:8,padding:"8px 20px",fontSize:11,color:"var(--green)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
                      GO TO EXPLORER →
                    </button>
                    <button onClick={()=>setTab("dashboard")} style={{background:"var(--purple)18",border:"1px solid var(--purple)40",borderRadius:8,padding:"8px 20px",fontSize:11,color:"var(--purple)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
                      GO TO DASHBOARD →
                    </button>
                  </div>
                </div>
              ) : (() => {
                // ── Stats computation ──
                const withPrices = callRecords.filter(c => {
                  const cp = callsPrices[c.sym]?.price;
                  return cp != null && c.priceAtCall != null && c.priceAtCall > 0;
                }).map(c => {
                  const cp = callsPrices[c.sym]?.price;
                  const ret = ((cp - c.priceAtCall) / c.priceAtCall) * 100;
                  const win = (["BUY","HOLD"].includes(c.verdict) && ret > 0) || (["AVOID","SELL"].includes(c.verdict) && ret < 0);
                  return { ...c, returnPct: ret, win };
                });

                const buyCallsWithPrices = withPrices.filter(c => c.verdict === "BUY");
                const buyWins = buyCallsWithPrices.filter(c => c.win).length;
                const buyWinRate = buyCallsWithPrices.length >= 3 ? (buyWins / buyCallsWithPrices.length * 100) : null;
                const avgBuyReturn = buyCallsWithPrices.length > 0
                  ? buyCallsWithPrices.reduce((s, c) => s + c.returnPct, 0) / buyCallsWithPrices.length
                  : null;
                const best  = withPrices.length > 0 ? withPrices.reduce((a, b) => a.returnPct > b.returnPct ? a : b) : null;
                const worst = withPrices.length > 0 ? withPrices.reduce((a, b) => a.returnPct < b.returnPct ? a : b) : null;

                const verdictCounts = { BUY:0, WATCH:0, AVOID:0, HOLD:0 };
                callRecords.forEach(c => { if (verdictCounts[c.verdict] != null) verdictCounts[c.verdict]++; });

                const filtered = callsFilter === "ALL" ? callRecords : callRecords.filter(c => c.verdict === callsFilter);

                return (
                  <>
                    {/* Stats strip */}
                    <div className="fu2" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>
                      {[
                        { l:"TOTAL CALLS", v:`${callRecords.length}`, c:"var(--text2)", sub:null },
                        { l:"BUY WIN RATE", v: buyWinRate != null ? `${buyWinRate.toFixed(0)}%` : buyCallsWithPrices.length < 3 ? `need ${3 - buyCallsWithPrices.length} more` : "—", c: buyWinRate != null ? (buyWinRate >= 50 ? "var(--green)" : "var(--red)") : "var(--muted)", sub: buyCallsWithPrices.length > 0 ? `${buyWins}/${buyCallsWithPrices.length} BUYs` : null },
                        { l:"AVG BUY RETURN", v: avgBuyReturn != null ? `${avgBuyReturn >= 0 ? "+" : ""}${avgBuyReturn.toFixed(1)}%` : "—", c: avgBuyReturn != null ? (avgBuyReturn >= 0 ? "var(--green)" : "var(--red)") : "var(--muted)", sub:null },
                        { l:"BEST CALL", v: best ? `${best.returnPct >= 0 ? "+" : ""}${best.returnPct.toFixed(1)}%` : "—", c:"var(--green)", sub: best ? best.sym : null },
                        { l:"WORST CALL", v: worst ? `${worst.returnPct >= 0 ? "+" : ""}${worst.returnPct.toFixed(1)}%` : "—", c:"var(--red)", sub: worst ? worst.sym : null },
                      ].map(m => (
                        <div key={m.l} className="stat-card">
                          <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.12em",marginBottom:10}}>{m.l}</div>
                          <div style={{fontSize:20,fontFamily:"var(--ff-head)",fontWeight:800,color:m.c,lineHeight:1}}>{m.v}</div>
                          {m.sub && <div style={{fontSize:10,color:"var(--muted2)",marginTop:5,fontFamily:"var(--ff-mono)"}}>{m.sub}</div>}
                        </div>
                      ))}
                    </div>

                    {/* Filter pills */}
                    <div className="fu3" style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
                      {["ALL","BUY","WATCH","AVOID","HOLD"].map(f => {
                        const count = f === "ALL" ? callRecords.length : verdictCounts[f] || 0;
                        return (
                          <button key={f} className={`filter-btn${callsFilter===f?" active":""}`} onClick={()=>setCallsFilter(f)}>
                            {f} {count > 0 && `(${count})`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Card list */}
                    {callsPriceFetching && callsPrices && Object.keys(callsPrices).length === 0 ? (
                      <div style={{display:"grid",gap:10}}>
                        {[1,2,3].map(i=><div key={i} className="shimmer-el" style={{height:88}}/>)}
                      </div>
                    ) : filtered.length === 0 ? (
                      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"32px",textAlign:"center"}}>
                        <p style={{color:"var(--muted2)",fontSize:13}}>No {callsFilter} calls recorded.</p>
                      </div>
                    ) : (
                      <div className="fu2">
                        {filtered.map(c => (
                          <CallCard
                            key={c.id}
                            record={c}
                            currentPriceData={callsPrices[c.sym]}
                            priceFetching={callsPriceFetching}
                            onAnalyse={sym => { setTab("explorer"); handleSearch(sym); }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ══ TRADE JOURNAL ══ */}
          {tab==="journal"&&(
            <div>
              <div className="fu" style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h1 style={{fontFamily:"var(--ff-head)",fontSize:26,fontWeight:800,color:"var(--text2)",marginBottom:6}}>Trade Journal</h1>
                    <p style={{fontSize:13,color:"var(--muted2)"}}>Log your trades. AI identifies behavioural patterns over time.</p>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {journalEntries.length >= 3 && (
                      <button onClick={analyseJournal} disabled={journalAnalysing} style={{background:journalAnalysing?"none":"#448aff18",border:`1px solid ${journalAnalysing?"var(--border)":"#448aff40"}`,borderRadius:8,padding:"7px 16px",fontSize:10,color:journalAnalysing?"var(--muted)":"var(--blue)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",opacity:journalAnalysing?.5:1}}>
                        {journalAnalysing?"◈ ANALYSING…":"◈ ANALYSE PATTERNS"}
                      </button>
                    )}
                    <button onClick={()=>setJournalFormOpen(p=>!p)} style={{background:journalFormOpen?"var(--green)18":"none",border:`1px solid ${journalFormOpen?"var(--green)40":"var(--border)"}`,borderRadius:8,padding:"7px 16px",fontSize:10,color:journalFormOpen?"var(--green)":"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>
                      {journalFormOpen?"✕ CANCEL":"+ LOG TRADE"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Add trade form */}
              {journalFormOpen && (
                <div className="fu card" style={{padding:20,marginBottom:20}}>
                  <div className="section-label">NEW TRADE ENTRY</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:12}}>
                    {[
                      {label:"DATE",      key:"date",     type:"date",   placeholder:""},
                      {label:"SYMBOL",    key:"sym",      type:"text",   placeholder:"e.g. NVDA"},
                      {label:"ACTION",    key:"action",   type:"select", options:["BUY","SELL"]},
                      {label:"QUANTITY",  key:"qty",      type:"number", placeholder:"10"},
                      {label:"PRICE",     key:"price",    type:"number", placeholder:"450.00"},
                      {label:"CURRENCY",  key:"currency", type:"select", options:["USD","AUD"]},
                    ].map(f=>(
                      <div key={f.key}>
                        <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:5}}>{f.label}</div>
                        {f.type==="select"
                          ? <select value={journalForm[f.key]} onChange={e=>setJournalForm(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 12px",color:"var(--text2)",fontSize:13,fontFamily:"var(--ff-mono)"}}>
                              {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                          : <input type={f.type} value={journalForm[f.key]} placeholder={f.placeholder} onChange={e=>setJournalForm(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 12px",color:"var(--text2)",fontSize:13,fontFamily:"var(--ff-mono)"}}/>
                        }
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:5}}>INVESTMENT THESIS</div>
                    <textarea value={journalForm.thesis} onChange={e=>setJournalForm(p=>({...p,thesis:e.target.value}))} placeholder="Why are you making this trade? What's the thesis?" rows={2} style={{width:"100%",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 12px",color:"var(--text2)",fontSize:13,fontFamily:"var(--ff-body)",resize:"vertical"}}/>
                  </div>
                  <button
                    onClick={()=>{
                      const {date,sym,action,qty,price,currency,thesis} = journalForm;
                      if (!sym.trim() || !qty || !price) return;
                      const entry = { id:`j-${Date.now()}`, date, sym:sym.toUpperCase().trim(), action, qty:parseFloat(qty), price:parseFloat(price), currency, thesis, loggedAt:new Date().toISOString(), exitDate:null, exitPrice:null };
                      setJournalEntries(p=>[entry,...p]);
                      setJournalFormOpen(false);
                      setJournalForm(p=>({...p,sym:"",qty:"",price:"",thesis:""}));
                    }}
                    style={{background:"var(--green)",color:"#0a0a14",border:"none",borderRadius:8,padding:"9px 24px",fontSize:12,fontFamily:"var(--ff-head)",fontWeight:700}}
                  >
                    LOG TRADE
                  </button>
                </div>
              )}

              {/* AI Analysis */}
              {journalAnalysisError && <div style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:10,padding:"12px 16px",color:"var(--red)",fontSize:12,marginBottom:16}}>{journalAnalysisError}</div>}
              {journalAnalysis && (
                <div className="fu2 card" style={{padding:20,marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div className="section-label" style={{marginBottom:0}}>AI PATTERN ANALYSIS</div>
                    <button onClick={()=>setJournalAnalysis(null)} style={{background:"none",border:"none",fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)",cursor:"pointer",letterSpacing:"0.06em"}}>DISMISS</button>
                  </div>
                  <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7,marginBottom:16}}>{journalAnalysis.summary}</p>
                  {journalAnalysis.keyAdvice && (
                    <div style={{background:"var(--blue)12",border:"1px solid var(--blue)30",borderRadius:8,padding:"12px 16px",marginBottom:16}}>
                      <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--blue)",letterSpacing:"0.1em",marginBottom:4}}>KEY ADVICE</div>
                      <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,margin:0,fontWeight:500}}>{journalAnalysis.keyAdvice}</p>
                    </div>
                  )}
                  {journalAnalysis.patterns?.length > 0 && (
                    <div style={{marginBottom:16}}>
                      <div className="section-label">BEHAVIOURAL PATTERNS</div>
                      {journalAnalysis.patterns.map((p,i)=>(
                        <div key={i} style={{padding:"12px 0",borderBottom:i<journalAnalysis.patterns.length-1?"1px solid var(--border)":"none"}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                            <span style={{fontFamily:"var(--ff-head)",fontSize:13,fontWeight:700,color:"var(--text2)"}}>{p.pattern}</span>
                            <span className="badge" style={{background:({HIGH:"#ff525218",MEDIUM:"#ffab4018",LOW:"#00e67618"})[p.severity]||"var(--surface)",color:({HIGH:"var(--red)",MEDIUM:"var(--amber)",LOW:"var(--green)"})[p.severity]||"var(--muted2)",border:`1px solid ${({HIGH:"#ff525240",MEDIUM:"#ffab4040",LOW:"#00e67640"})[p.severity]||"var(--border)"}`}}>{p.severity}</span>
                          </div>
                          <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.5,marginBottom:6}}>{p.description}</p>
                          <p style={{fontSize:11,color:"var(--green)",fontFamily:"var(--ff-mono)"}}>{p.advice}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                    {journalAnalysis.winRate && <div><div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:3}}>WIN RATE</div><div style={{fontSize:16,fontFamily:"var(--ff-head)",fontWeight:700,color:"var(--green)"}}>{journalAnalysis.winRate}</div></div>}
                    {journalAnalysis.topMistake && <div style={{flex:1,minWidth:200}}><div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:3}}>BIGGEST MISTAKE</div><div style={{fontSize:12,color:"var(--red)"}}>{journalAnalysis.topMistake}</div></div>}
                  </div>
                </div>
              )}

              {/* Entry list */}
              {journalEntries.length === 0 ? (
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"52px 32px",textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:16,opacity:.25}}>◫</div>
                  <p style={{color:"var(--muted2)",fontSize:15,fontFamily:"var(--ff-head)",fontWeight:700,marginBottom:8}}>No trades logged yet.</p>
                  <p style={{color:"var(--muted)",fontSize:13,marginBottom:24}}>Log 3+ trades and AI will identify behavioural patterns — are you holding losers too long? Selling winners too early?</p>
                  <button onClick={()=>setJournalFormOpen(true)} style={{background:"var(--green)18",border:"1px solid var(--green)40",borderRadius:8,padding:"8px 20px",fontSize:11,color:"var(--green)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>LOG YOUR FIRST TRADE →</button>
                </div>
              ) : (
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div className="section-label" style={{marginBottom:0}}>TRADE LOG ({journalEntries.length})</div>
                    {journalEntries.length < 3 && <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>Add {3-journalEntries.length} more trade{3-journalEntries.length!==1?"s":""} to unlock pattern analysis</span>}
                  </div>
                  {journalEntries.map(e=>{
                    const isClosed = !!e.exitDate;
                    const pnlPct = isClosed && e.price && e.exitPrice
                      ? ((e.exitPrice - e.price) / e.price * 100 * (e.action==="SELL"?-1:1))
                      : null;
                    return (
                      <div key={e.id} className="card" style={{padding:18,marginBottom:10,borderLeft:`3px solid ${e.action==="BUY"?"var(--green)":"var(--red)"}`,opacity:isClosed?0.65:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                          <div>
                            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                              <span className="badge" style={{background:e.action==="BUY"?"#00e67618":"#ff525218",color:e.action==="BUY"?"var(--green)":"var(--red)",border:`1px solid ${e.action==="BUY"?"#00e67640":"#ff525240"}`}}>{e.action}</span>
                              <span style={{fontFamily:"var(--ff-head)",fontSize:15,fontWeight:700,color:"var(--text2)"}}>{e.sym}</span>
                              <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted)"}}>{e.date}</span>
                              {isClosed && <span className="badge" style={{background:"var(--surface)",color:"var(--muted)",border:"1px solid var(--border)"}}>CLOSED</span>}
                              {pnlPct != null && <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:pnlPct>=0?"var(--green)":"var(--red)",fontWeight:600}}>{pnlPct>=0?"+":""}{pnlPct.toFixed(1)}%</span>}
                            </div>
                            <div style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted2)"}}>
                              {e.qty} × {e.currency}{e.price}
                              {isClosed && ` → ${e.currency}${e.exitPrice} (${e.exitDate})`}
                            </div>
                            {e.thesis && <p style={{fontSize:11,color:"var(--muted)",marginTop:6,fontStyle:"italic",lineHeight:1.4}}>{e.thesis}</p>}
                          </div>
                          <div style={{display:"flex",gap:6,flexShrink:0}}>
                            {!isClosed && (
                              journalExitForm===e.id ? (
                                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                  <input type="number" placeholder="Exit price" id={`exit-${e.id}`} style={{width:100,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 8px",color:"var(--text2)",fontSize:12,fontFamily:"var(--ff-mono)"}}/>
                                  <button onClick={()=>{
                                    const ep = parseFloat(document.getElementById(`exit-${e.id}`)?.value);
                                    if (!ep) return;
                                    setJournalEntries(p=>p.map(x=>x.id===e.id?{...x,exitDate:new Date().toISOString().slice(0,10),exitPrice:ep}:x));
                                    setJournalExitForm(null);
                                  }} style={{background:"var(--green)",color:"#0a0a14",border:"none",borderRadius:6,padding:"5px 12px",fontSize:10,fontFamily:"var(--ff-mono)",fontWeight:700}}>CLOSE</button>
                                  <button onClick={()=>setJournalExitForm(null)} style={{background:"none",border:"1px solid var(--border)",borderRadius:6,padding:"5px 10px",fontSize:10,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>✕</button>
                                </div>
                              ) : (
                                <button onClick={()=>setJournalExitForm(e.id)} style={{background:"none",border:"1px solid var(--border)",borderRadius:6,padding:"5px 12px",fontSize:10,color:"var(--muted2)",fontFamily:"var(--ff-mono)",letterSpacing:"0.06em"}}>CLOSE TRADE</button>
                              )
                            )}
                            <button onClick={()=>setJournalEntries(p=>p.filter(x=>x.id!==e.id))} style={{background:"#ff525212",border:"1px solid #ff525230",borderRadius:6,padding:"5px 10px",fontSize:10,color:"var(--red)",fontFamily:"var(--ff-mono)"}}>✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ DETAIL / CHART ══ */}
          {tab==="detail"&&(
            <div>
              {/* back + header */}
              <div className="fu" style={{marginBottom:20}}>
                <button onClick={()=>setTab(detailFrom||"explorer")} style={{background:"none",border:"none",fontSize:11,color:"var(--muted2)",fontFamily:"var(--ff-mono)",padding:"0 0 12px",letterSpacing:"0.06em",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                  ← BACK
                </button>
                {detailSym && (
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                        <h1 style={{fontFamily:"var(--ff-head)",fontSize:28,fontWeight:900,color:"var(--text2)",letterSpacing:"-0.02em"}}>{detailSym.sym}</h1>
                        <span style={{fontSize:14,color:"var(--muted2)"}}>{detailSym.name}</span>
                        <SectorBadge sector={detailSym.sector}/>
                      </div>
                      {/* price row */}
                      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}>
                        {chartData && (() => {
                          const rawPrice = chartData.currentPrice;
                          const dispPrice = toDisplay(rawPrice, chartData.currency, displayCcy, audUsd);
                          const dispPrev  = toDisplay(chartData.previousClose, chartData.currency, displayCcy, audUsd);
                          const chg = dispPrev ? ((dispPrice - dispPrev) / dispPrev) * 100 : null;
                          const symbol = displayCcy === "AUD" ? "A$" : "$";
                          return (
                            <>
                              <span style={{fontFamily:"var(--ff-mono)",fontSize:22,fontWeight:600,color:"var(--text2)"}}>
                                {symbol}{dispPrice?.toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:dispPrice>=10?2:4})}
                              </span>
                              {chg != null && <span style={{fontFamily:"var(--ff-mono)",fontSize:13,color:chg>=0?"var(--green)":"var(--red)"}}>{chg>=0?"+":""}{chg.toFixed(2)}%</span>}
                              <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--ff-mono)"}}>{displayCcy}</span>
                            </>
                          );
                        })()}
                      </div>
                      {/* single unified verdict */}
                      <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
                        {detailAnalysing && (
                          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--amber)",animation:"pulse 1s infinite"}}/>
                            <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted)"}}>Analysing…</span>
                          </div>
                        )}
                        {detailAnalysis && !detailAnalysing && (
                          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 16px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <VerdictBadge v={detailAnalysis.verdict}/>
                              <ConvictionDots level={detailAnalysis.conviction}/>
                              {detailAnalysis.horizon && <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted2)"}}>{detailAnalysis.horizon} term</span>}
                              {detailAnalysis.target && <span style={{fontSize:11,fontFamily:"var(--ff-mono)",color:"var(--muted2)"}}>Target {detailAnalysis.target}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <CurrencyToggle value={displayCcy} onChange={setDisplayCcy}/>
                  </div>
                )}
              </div>

              {/* range selector */}
              <div style={{display:"flex",gap:4,marginBottom:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:4}}>
                  {["1d","7d","1mo","3mo","1y"].map(r=>(
                    <button key={r} onClick={()=>setChartRange(r)} style={{background:chartRange===r?"var(--green)":"none",color:chartRange===r?"#0a0a14":"var(--muted2)",border:`1px solid ${chartRange===r?"var(--green)":"var(--border)"}`,borderRadius:7,padding:"5px 14px",fontSize:11,fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",fontWeight:chartRange===r?700:400}}>
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={()=>openGlossary()} style={{background:"none",border:"1px solid var(--border)",borderRadius:7,padding:"5px 14px",fontSize:11,fontFamily:"var(--ff-mono)",letterSpacing:"0.06em",color:"var(--amber)"}}>
                  ◈ GLOSSARY
                </button>
              </div>

              {/* chart */}
              <div className="card" style={{padding:12,marginBottom:16,overflow:"hidden"}}>
                {chartLoading && (
                  <div style={{height:420,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div>
                      <div style={{display:"grid",gap:8}}>{[90,70,80].map((w,i)=><div key={i} className="shimmer-el" style={{height:16,width:`${w}%`}}/>)}</div>
                      <p style={{color:"var(--muted)",fontSize:12,fontFamily:"var(--ff-mono)",marginTop:16,textAlign:"center"}}>Loading chart…</p>
                    </div>
                  </div>
                )}
                {!chartLoading && chartData?.candles?.length > 0 && (
                  <ChartCanvas candles={chartData.candles} analysis={detailAnalysis} range={chartRange} currency={chartData.currency} indicators={chartData.indicators}/>
                )}
                {!chartLoading && !chartData && (
                  <div style={{height:420,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <p style={{color:"var(--red)",fontSize:13}}>Chart data unavailable</p>
                  </div>
                )}
              </div>

              {/* ── Technical chart analysis — shown first, right after the chart ── */}
              {detailAnalysis && !detailAnalysing && (
                <div className="fu2" style={{display:"grid",gap:12,marginBottom:16}}>
                  <div className="section-label">TECHNICAL CHART ANALYSIS</div>

                  {/* Summary */}
                  <div className="card" style={{padding:20}}>
                    <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7,margin:0}}>{linkifyText(detailAnalysis.summary, openGlossary, allGlossary)}</p>
                    {detailAnalysis.stopLoss && <div style={{marginTop:10,fontSize:12,fontFamily:"var(--ff-mono)",color:"var(--red)"}}>Stop loss: {detailAnalysis.stopLoss}</div>}
                  </div>

                  {/* Reasoning sections */}
                  {[
                    {l:"MACRO ENVIRONMENT", v:detailAnalysis.macro},
                    {l:"FUNDAMENTALS",      v:detailAnalysis.fundamental},
                    {l:"TECHNICAL ANALYSIS",v:detailAnalysis.technical},
                    {l:"SENTIMENT",         v:detailAnalysis.sentiment},
                    {l:"PORTFOLIO FIT",     v:detailAnalysis.portfolio},
                  ].filter(x=>x.v).length > 0 && (
                    <div className="card" style={{padding:20,display:"grid",gap:14}}>
                      {[
                        {l:"MACRO ENVIRONMENT", v:detailAnalysis.macro},
                        {l:"FUNDAMENTALS",      v:detailAnalysis.fundamental},
                        {l:"TECHNICAL ANALYSIS",v:detailAnalysis.technical},
                        {l:"SENTIMENT",         v:detailAnalysis.sentiment},
                        {l:"PORTFOLIO FIT",     v:detailAnalysis.portfolio},
                      ].filter(x=>x.v).map(({l,v},i,arr)=>(
                        <div key={l} style={{paddingBottom:i<arr.length-1?14:0,borderBottom:i<arr.length-1?"1px solid var(--border)":"none"}}>
                          <div style={{fontSize:9,fontFamily:"var(--ff-mono)",color:"var(--muted)",letterSpacing:"0.12em",marginBottom:5}}>{l}</div>
                          <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7,margin:0}}>{linkifyText(v, openGlossary, allGlossary)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chart levels */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {detailAnalysis.support?.length > 0 && (
                      <div className="card" style={{padding:16}}>
                        <div className="section-label">SUPPORT LEVELS</div>
                        {detailAnalysis.support.map((s,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<detailAnalysis.support.length-1?"1px solid var(--border)":"none"}}>
                            <span style={{fontSize:12,color:"var(--muted2)"}}>{s.label}</span>
                            <div style={{display:"flex",gap:8,alignItems:"center"}}>
                              <span className="badge" style={{background:"#00e67612",color:"var(--green)",border:"1px solid #00e67630",fontSize:9}}>{s.strength}</span>
                              <span style={{fontFamily:"var(--ff-mono)",fontSize:13,color:"var(--green)",fontWeight:600}}>${s.price?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {detailAnalysis.resistance?.length > 0 && (
                      <div className="card" style={{padding:16}}>
                        <div className="section-label">RESISTANCE LEVELS</div>
                        {detailAnalysis.resistance.map((r,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<detailAnalysis.resistance.length-1?"1px solid var(--border)":"none"}}>
                            <span style={{fontSize:12,color:"var(--muted2)"}}>{r.label}</span>
                            <div style={{display:"flex",gap:8,alignItems:"center"}}>
                              <span className="badge" style={{background:"#ff525212",color:"var(--red)",border:"1px solid #ff525230",fontSize:9}}>{r.strength}</span>
                              <span style={{fontFamily:"var(--ff-mono)",fontSize:13,color:"var(--red)",fontWeight:600}}>${r.price?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {(detailAnalysis.pattern?.name || detailAnalysis.momentum || detailAnalysis.volume) && (
                    <div className="card" style={{padding:20}}>
                      {detailAnalysis.pattern?.name && detailAnalysis.pattern.name !== "null" && (
                        <div style={{marginBottom:14}}>
                          <div className="section-label">PATTERN DETECTED</div>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                            {(() => {
                              const pName = detailAnalysis.pattern.name;
                              const col = detailAnalysis.pattern.bullish ? "var(--green)" : "var(--red)";
                              const matched = allGlossary.find(g => pName.toLowerCase().includes(g.term.toLowerCase()));
                              return matched
                                ? <span onClick={() => openGlossary(matched.term)} style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700,color:col,cursor:"pointer",borderBottom:"1px dotted currentColor"}} title={`Click to define: ${matched.term}`}>{pName}</span>
                                : <span style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700,color:col}}>{pName}</span>;
                            })()}
                            <span className="badge" style={{background:detailAnalysis.pattern.bullish?"#00e67618":"#ff525218",color:detailAnalysis.pattern.bullish?"var(--green)":"var(--red)",border:`1px solid ${detailAnalysis.pattern.bullish?"#00e67640":"#ff525240"}`}}>{detailAnalysis.pattern.bullish?"BULLISH":"BEARISH"}</span>
                          </div>
                          {detailAnalysis.pattern.note && <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.6}}>{linkifyText(detailAnalysis.pattern.note, openGlossary, allGlossary)}</p>}
                        </div>
                      )}
                      {detailAnalysis.momentum && (
                        <div style={{marginBottom:detailAnalysis.volume?14:0}}>
                          <div className="section-label">MOMENTUM</div>
                          <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.6}}>{linkifyText(detailAnalysis.momentum, openGlossary, allGlossary)}</p>
                        </div>
                      )}
                      {detailAnalysis.volume && (
                        <div>
                          <div className="section-label">VOLUME</div>
                          <p style={{fontSize:12,color:"var(--muted2)",lineHeight:1.6}}>{linkifyText(detailAnalysis.volume, openGlossary, allGlossary)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
      <GlossaryModal open={glossaryOpen} onClose={()=>setGlossaryOpen(false)} focusTerm={glossaryTerm} allGlossary={allGlossary}/>
    </>
    </GlossaryCtx.Provider>
  );
}
