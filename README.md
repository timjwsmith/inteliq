# ◈ IntelIQ — Investment Intelligence Platform

A personal investment research platform with AI-powered, drillable reasoning. Covers AU/UK/US tech stocks, ASX mining, and crypto.

## Features

- **Dashboard** — Macro regime summary, live ticker tape, top daily picks
- **Stock Explorer** — Search any stock/crypto for full AI analysis with layered reasoning chain
- **My Portfolio** — Holdings tracker with rotation recommendations and P&L
- **News Feed** — Filtered news with AI impact commentary

### Key Differentiator
Every recommendation shows a full **Macro → Fundamental → Technical → Sentiment → Insider → Portfolio Fit** reasoning chain — expandable layer by layer. No black boxes.

---

## Quick Start (Docker)

### Prerequisites
- Docker + Docker Compose installed
- Anthropic API key ([get one here](https://console.anthropic.com))

### 1. Clone & configure
```bash
git clone https://github.com/YOUR_USERNAME/inteliq.git
cd inteliq
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Run
```bash
docker-compose up --build
```

### 3. Open
```
http://localhost:3000
```

That's it. The app + API proxy server spin up together.

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│   React Frontend    │────▶│  Express API Server  │
│   (nginx :3000)     │     │     (:3001)           │
└─────────────────────┘     └──────────┬───────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Anthropic API   │
                              │  (Claude Sonnet) │
                              └──────────────────┘
```

The Express server acts as a secure proxy — your API key never touches the browser.

---

## Local Development (without Docker)

```bash
# Terminal 1 — API server
cp server-package.json package.json  # temporarily
npm install
cp .env.example .env                 # add your key
node server.js

# Terminal 2 — React app
npm install
npm start
```

---

## Roadmap

- [ ] Live price data (Yahoo Finance / Alpha Vantage API)
- [ ] Dynamic portfolio — add/remove holdings
- [ ] Watchlist with price alerts
- [ ] Historical recommendation tracking
- [ ] EPL predictions & betting value app

---

## Disclaimer

IntelIQ is for informational purposes only. Nothing here constitutes financial advice. Always do your own research.
