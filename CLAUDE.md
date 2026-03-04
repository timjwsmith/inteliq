# IntelIQ — Investment Intelligence Platform

## What this is
A full-stack React + Express investment dashboard. Live stock/crypto data, AI-powered analysis, multi-source portfolio management, and charting.

## Stack
- Frontend: React (Vite), single file at `src/App.jsx`
- Backend: Express server at `server.js`
- Deployed via Docker (`docker-compose.yml`)
- Fonts: Outfit, DM Sans, DM Mono (Google Fonts)

## Design system
- Dark purple theme (`#120f1e` bg, `#1a1630` sidebar, `#252040` cards)
- Accent: `#00e676` green, `#ff5252` red, `#ffab40` amber, `#448aff` blue
- CSS-in-JS via a `<style>` tag injected in App.jsx

## Navigation tabs
- Dashboard (◈) — live AI-generated picks, refreshed every 4h
- Explorer (◎) — search any stock/crypto, AI analysis + inline chart
- Portfolio (◑) — multi-source holdings with CHART button on every holding
- News (◉) — live Yahoo Finance RSS, filterable by category
- Watchlist (◇) — saved stocks with price targets
- IPO (◆) — upcoming & recent IPOs on NASDAQ, NYSE, and ASX (Finnhub)

## Key features

### Dashboard
- AI generates 3 fresh picks on load via `/api/dashboard/picks` (Claude Sonnet)
- Cached 4 hours server-side; force-refresh via `?force=1` or the ↻ REFRESH button
- Time-aware greeting (Good morning/afternoon/evening)
- No hardcoded picks — everything is live and current

### Stock Explorer
- Search any ticker or name; Claude returns full JSON analysis
- Before calling Claude, live price is pre-fetched for known tickers and injected into the prompt
  so technical analysis references the actual current price, not training-data estimates
- Today's date is always included in the prompt — macro/sentiment reflects current conditions
- For crypto (BTC, ETH etc): explicitly told to analyse the native coin, NOT an ETF or trust
- Chart auto-loads inline below the result (1-month OHLCV), respects display currency
- "FULL ANALYSIS →" button opens the detail page
- Search history persisted to localStorage (last 10)
- "Save to Watchlist" button on every result

### Portfolio
- Sources: Coinbase (CDP JWT auth), CoinSpot (HMAC-SHA512), CMC Invest CSV import
- Every holding has a CHART button (expand a row to see it) — opens the full detail page
- All Holdings, Coinbase, CoinSpot, and CMC tabs all have chart access
- Live prices fetched in batch; crypto uses a single CoinGecko call (avoids rate limits)
- ← BACK on the detail page returns to the correct originating tab

### Stock detail page
- OHLCV candlestick chart with volume bars (HTML5 Canvas, responsive)
- Range selector: 1D / 7D / 1M / 3M / 1Y — re-fetches on currency toggle too
- Support/resistance levels drawn as overlays on the chart
- **Single unified verdict**: one comprehensive Claude analysis combining live OHLCV chart data
  with fundamental, macro, sentiment, and portfolio knowledge — never two conflicting signals
  - Pulsing "Analysing…" indicator while in progress
  - Verdict + conviction + horizon + target shown in header once complete
- Analysis sections: Summary, Macro Environment, Fundamentals, Technical Analysis, Sentiment,
  Portfolio Fit, Support/Resistance levels, Pattern detected, Momentum, Volume
- **Crypto chart currency**: chart endpoint accepts `?currency=USD|AUD` — fetches `BTC-USD` or
  `BTC-AUD` from Yahoo Finance natively; toggling the display currency re-fetches the correct ticker

### News
- Live Yahoo Finance RSS (US Tech, Crypto, ASX feeds), cached 15 min
- Filter buttons: ALL / US TECH / ASX MINING / CRYPTO
- Auto-tagged by sentiment (BULLISH/BEARISH/NEUTRAL) and impact (HIGH/MEDIUM/LOW)

### Watchlist
- Add from any Explorer result
- Shows live price, % to target, today's change
- CHART button opens detail page

## Portfolio / currency logic
- CMC CSV: avg cost is always AUD, US stock prices come back USD from Yahoo, ASX prices come back AUD
- All P&L normalises to USD first before comparing, then converts to display currency
- Live AUD/USD rate fetched from Yahoo Finance (`/api/fx/audusd`)

## API endpoints (server.js)
- POST `/api/analyse` — Anthropic proxy for stock/crypto analysis (Explorer search)
- POST `/api/analyse/detail` — unified analysis: live OHLCV + fundamentals + indicators → single verdict
  - Accepts: `{ sym, name, candles, range, currentPrice, currency, indicators, fundamentals }`
  - Injects LIVE FUNDAMENTAL DATA and COMPUTED TECHNICAL INDICATORS blocks into the Claude system prompt
- GET  `/api/chart/:sym?range=1d|7d|1mo|3mo|1y&currency=USD|AUD` — OHLCV from Yahoo Finance
  - Crypto symbols auto-suffixed: BTC → BTC-USD or BTC-AUD based on currency param
  - Response now includes `indicators` object: `{ ema50, ema200, rsi, macd: { macd, signal, histogram }, bb: { upper, middle, lower } }`
- GET  `/api/fundamentals/:sym` — FMP live fundamentals (stocks only; returns null for crypto/missing key)
  - Returns: `{ pe, evEbitda, fcfYield, debtEquity, roe, marketCap, earningsSurprises, analystConsensus }`
- GET  `/api/price?sym=X&type=stock|crypto` — single live price
- POST `/api/prices` — batch live prices (crypto batched into one CoinGecko call)
- GET  `/api/fx/audusd` — live AUD/USD rate
- GET  `/api/coinbase/balances` — Coinbase Advanced Trade API (CDP JWT/ES256 auth)
- GET  `/api/coinspot/balances` — CoinSpot read-only API (HMAC-SHA512)
- GET  `/api/news` — Yahoo Finance RSS aggregated + tagged, cached 15 min
- GET  `/api/ipo` — Finnhub IPO calendar (NASDAQ/NYSE/ASX/CBOE, 14d back → 90d ahead), cached 4h; returns `[]` if no `FINNHUB_API_KEY`
- GET  `/api/dashboard/picks` — AI-generated top 3 picks, cached 4h (`?force=1` to bust)
- GET  `/health` — server health check (no /api prefix)
- POST `/api/portfolio/dividends` — FMP key-metrics (dividendYield, dividendPerShare) + historical-dividends; 24h per-symbol cache; crypto skipped
- GET  `/api/benchmarks` — ^GSPC + ^AXJO 1Y daily OHLCV, returns 1D/1W/1M/3M/1Y returns; 15-min cache
- POST `/api/portfolio/history` — reconstructs portfolio value series from holdings × historical OHLCV; forward-fills holiday gaps
- POST `/api/portfolio/risk` — Beta vs ^GSPC, annualised volatility, Sharpe (4.5% rf), max drawdown from 1Y daily OHLCV

## JSON parsing (all Claude endpoints)
All Claude responses use `text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)` for arrays
and `text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)` for objects — this handles
trailing text/commentary that Claude occasionally appends after the JSON.

## Coinbase API authentication
- Uses CDP JWT with ES256 (ECDSA P-256)
- Key created at portal.cdp.coinbase.com → API Keys → Advanced Settings → **ECDSA**
- `COINBASE_API_KEY` = full key name: `organizations/.../apiKeys/...`
- `COINBASE_API_SECRET` = PEM EC private key with `\n` as literal backslash-n in .env
- JWT signing must use `dsaEncoding: "ieee-p1363"` (raw 64-byte r||s) — NOT the default DER format
  - Default Node.js DER signature is ~72 bytes and will be rejected with 401
- Key requires **Coinbase App & Advanced Trade → View (read-only)** permission

## Environment variables (.env)
ANTHROPIC_API_KEY, COINBASE_API_KEY, COINBASE_API_SECRET, COINSPOT_API_KEY, COINSPOT_API_SECRET, FINNHUB_API_KEY (used for IPO calendar — tab shows empty state if absent), FMP_API_KEY (financialmodelingprep.com — for live fundamentals)

## Deployment
docker-compose down && docker-compose up --build --force-recreate

## Git workflow
- Always work on a feature branch (never commit directly to main)
- Branch naming: `feature/short-description`
- Push branch and raise a PR for Tim to review before merging

## Feature Roadmap (agreed 2026-03-03)
Implement in this order. Update status as work is completed.

1. ~~**AI Portfolio Coach**~~ — ✅ DONE (PR #9) — concentration risk, sector imbalance, grade, rebalancing suggestions
2. ~~**AI Calls / Track Record**~~ — ✅ DONE (PR #8) — logs every verdict with entry price, live return tracking, win rate stats
3. ~~**Earnings Calendar + AI Pre/Post Brief**~~ — ✅ DONE (PR #10) — FMP earnings data, EPS surprises, AI brief button
4. ~~**Natural Language Screener**~~ — ✅ DONE (PR #11) — "find undervalued ASX small-caps with insider buying" → AI translates to results
5. ~~**Macro Event Calendar with Portfolio Impact**~~ — ✅ DONE (PR #12) — Fed/CPI/jobs events with bull/bear cases per holding
6. ~~**AI Trade Journal**~~ — ✅ DONE (PR #13) — log buy/sell entries, AI identifies behavioural patterns over time
7. ~~**Watchlist Price Alerts + AI Trigger Conditions**~~ — ✅ DONE (PR #14) — price above/below and daily change % alerts with 60s polling

## Portfolio Professional Upgrade (agreed 2026-03-04)
Chained branch series — each PR based on the previous feature branch:
- PR #15 ~~Enhanced SummaryStrip~~ — 8 stats across 2 rows (Total, P&L, Today, Best, Worst / Crypto, Stocks, Positions)
- PR #16 ~~AllocationPanel~~ — donut chart (HTML5 Canvas), sector bars, top 5 holdings
- PR #17 ~~Concentration warnings~~ — portWeight label + ⚠ CONCENTRATED badge on HoldingRow ≥20%
- PR #18 ~~DividendPanel~~ — annual yield%, income, YOC, ex-div date (FMP) — stock holdings only
- PR #19 ~~BenchmarkStrip~~ — portfolio today % vs S&P500/ASX200 with 1D/1W/1M/3M/1Y toggle
- PR #20 ~~PortfolioChart~~ — responsive HTML5 Canvas line chart, 1M/3M/1Y ranges
- PR #21 ~~RiskPanel~~ — Beta, Volatility, Sharpe, Max DD vs ^GSPC

### All Holdings tab panel order (top → bottom):
SummaryStrip → PortfolioChart → BenchmarkStrip → AllocationPanel → RiskPanel → DividendPanel → Holdings list
