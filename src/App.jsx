import { useState, useEffect, useRef } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap";
document.head.appendChild(fontLink);

// ── Design tokens ──────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       #0a0c10;
    --surface:  #111318;
    --card:     #161a22;
    --border:   #1e2330;
    --border2:  #252c3a;
    --gold:     #e8b84b;
    --gold2:    #f5d07a;
    --golddim:  rgba(232,184,75,0.12);
    --green:    #3ecf8e;
    --red:      #f56565;
    --blue:     #60a5fa;
    --purple:   #a78bfa;
    --text:     #e2e8f0;
    --muted:    #64748b;
    --muted2:   #94a3b8;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .fade-up { animation: fadeUp .4s ease both; }
  .fade-up-2 { animation: fadeUp .4s .08s ease both; }
  .fade-up-3 { animation: fadeUp .4s .16s ease both; }
  .fade-up-4 { animation: fadeUp .4s .24s ease both; }

  .loading-shimmer {
    background: linear-gradient(90deg, var(--card) 25%, var(--border2) 50%, var(--card) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }
`;

// ── Mock data ──────────────────────────────────────────────────────────────
const TICKERS = [
  { sym:"NVDA", chg:"+3.2%", price:"875.40", up:true },
  { sym:"BHP.AX", chg:"-0.8%", price:"44.12", up:false },
  { sym:"AAPL", chg:"+1.1%", price:"182.63", up:true },
  { sym:"BTC",  chg:"+4.7%", price:"67,240", up:true },
  { sym:"RIO.AX",chg:"+0.3%",price:"118.90",up:true },
  { sym:"ETH",  chg:"+2.9%", price:"3,480",  up:true },
  { sym:"CBA.AX",chg:"-0.4%",price:"114.20",up:false},
  { sym:"MSFT", chg:"+0.9%", price:"420.10", up:true },
  { sym:"SOL",  chg:"+8.1%", price:"182.40", up:true },
  { sym:"WDS.AX",chg:"-1.2%",price:"27.85", up:false},
];

const TOP_PICKS = [
  {
    sym:"NVDA", name:"NVIDIA Corporation", sector:"US Tech",
    verdict:"BUY", conviction:"HIGH", horizon:"Medium",
    price:"$875.40", target:"$1,050", upside:"+20%", up:true,
    summary:"AI infrastructure supercycle intact. Data centre revenue accelerating beyond consensus. Margins expanding.",
    macro:"Rate cut expectations rising → tech rotation beneficiary. AI capex from hyperscalers accelerating.",
    fundamental:"Revenue +122% YoY. Gross margin 76%. P/E elevated but justified by growth trajectory. Strong FCF generation.",
    technical:"Breaking out of 6-week consolidation on above-avg volume. RSI 58 — room to run. Key support $820.",
    sentiment:"3 major analyst upgrades past 30 days. Institutional accumulation visible in 13F filings. Insider held steady.",
    insider:"No sells. CEO Jensen Huang holds full position. No dilution signals.",
    portfolio:"Fills US semiconductor gap. Complements any AU tech holding with US AI exposure.",
    tag:"au-uk-us-tech"
  },
  {
    sym:"PLS.AX", name:"Pilbara Minerals", sector:"ASX Mining",
    verdict:"WATCH", conviction:"MEDIUM", horizon:"Long",
    price:"$3.18", target:"$4.20", upside:"+32%", up:true,
    summary:"Lithium oversupply pressuring near-term. But structural EV demand makes this a compelling long entry zone.",
    macro:"Lithium spot price depressed but showing early floor signals. China EV demand re-accelerating.",
    fundamental:"Revenue down YoY on lithium price weakness. Balance sheet strong — no debt. Cost controls improving.",
    technical:"Consolidating near 52-week lows. Potential double-bottom forming. Watch for break above $3.40.",
    sentiment:"Mixed analyst coverage. 2 upgrades, 1 downgrade this month. Retail sentiment bearish — contrarian signal.",
    insider:"Board member purchased $280k at $3.05 last month. Meaningful.",
    portfolio:"ASX mining exposure at cyclical low. High risk/reward for long horizon.",
    tag:"asx-mining"
  },
  {
    sym:"BTC", name:"Bitcoin", sector:"Crypto",
    verdict:"BUY", conviction:"HIGH", horizon:"Medium",
    price:"$67,240", target:"$95,000", upside:"+41%", up:true,
    summary:"ETF inflows creating structural demand shift. Supply shock post-halving. Institutional adoption accelerating.",
    macro:"Dollar weakness + rate cut cycle historically bullish crypto. Macro tailwind building.",
    fundamental:"On-chain: long-term holder supply at ATH. Exchange reserves falling. Halving impact lagged but incoming.",
    technical:"Above all major MAs. Consolidating below ATH. Volume profile supports continuation. Bull flag forming.",
    sentiment:"Fear & Greed: 72 (Greed). Institutional ETF inflows $400M+ daily average past 2 weeks.",
    insider:"N/A — on-chain whale wallets accumulating, not distributing.",
    portfolio:"No crypto exposure assumed as baseline. BTC is the lowest-risk crypto entry.",
    tag:"crypto"
  },
];

const NEWS = [
  { time:"2h ago", tag:"US TECH", tagColor:"var(--blue)", headline:"Fed minutes signal two cuts possible in 2024 — tech multiples re-rating begins", sentiment:"BULLISH", impact:"HIGH", affected:["NVDA","MSFT","AAPL"], commentary:"Rate-sensitive growth stocks are the primary beneficiary. This confirms the macro tailwind in our NVDA BUY thesis. Watch for rotation from defensives." },
  { time:"4h ago", tag:"ASX MINING", tagColor:"var(--gold)", headline:"China PMI beats expectations — iron ore jumps 3.2%, copper surges", sentiment:"BULLISH", impact:"MEDIUM", affected:["BHP.AX","RIO.AX","FMG.AX"], commentary:"Short-term positive for the majors. Doesn't change our structural lithium thesis but boosts sentiment across ASX resources broadly." },
  { time:"6h ago", tag:"CRYPTO", tagColor:"var(--purple)", headline:"BlackRock Bitcoin ETF crosses $15B AUM — fastest ETF growth in history", sentiment:"BULLISH", impact:"HIGH", affected:["BTC","ETH"], commentary:"Structural, not speculative. Institutional allocation is now systematic. Reinforces our BTC BUY conviction at current levels." },
  { time:"9h ago", tag:"ASX MINING", tagColor:"var(--gold)", headline:"Lithium price stabilises for second consecutive week — floor forming?", sentiment:"NEUTRAL", impact:"MEDIUM", affected:["PLS.AX","LTR.AX","AKE.AX"], commentary:"Too early to call a reversal but the rate of decline has slowed. Supports our WATCH on PLS.AX — accumulate in tranches." },
];

const PORTFOLIO = [
  { sym:"AAPL",  name:"Apple Inc",         qty:50,  avg:155.20, price:182.63, sector:"US Tech",    horizon:"Long",   verdict:"HOLD",  pnl:"+17.7%", up:true },
  { sym:"BHP.AX",name:"BHP Group",         qty:200, avg:46.50,  price:44.12,  sector:"ASX Mining", horizon:"Medium", verdict:"WATCH", pnl:"-5.1%",  up:false },
  { sym:"ETH",   name:"Ethereum",          qty:2.5, avg:2800,   price:3480,   sector:"Crypto",     horizon:"Medium", verdict:"HOLD",  pnl:"+24.3%", up:true },
  { sym:"WDS.AX",name:"Woodside Energy",   qty:300, avg:31.10,  price:27.85,  sector:"ASX Energy", horizon:"Long",   verdict:"SELL",  pnl:"-10.5%", up:false },
];

const ROTATE = {
  from: { sym:"WDS.AX", reason:"Structural energy transition headwinds. Oil price ceiling. Better capital deployment available." },
  to:   { sym:"NVDA",   reason:"Aligns with AI supercycle. Replaces energy exposure with higher-conviction growth." },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function VerdictBadge({ v, small }) {
  const colors = { BUY:"var(--green)", WATCH:"var(--gold)", AVOID:"var(--red)", SELL:"var(--red)", HOLD:"var(--blue)" };
  return (
    <span style={{
      background: colors[v] ? colors[v]+"22" : "#ffffff22",
      color: colors[v] || "var(--text)",
      border: `1px solid ${colors[v] || "#fff"}44`,
      borderRadius:4, padding: small?"2px 7px":"4px 10px",
      fontSize: small?10:11, fontFamily:"var(--font-mono)", fontWeight:500, letterSpacing:"0.08em",
      textTransform:"uppercase"
    }}>{v}</span>
  );
}

function ConvictionDots({ level }) {
  const map = { HIGH:3, MEDIUM:2, LOW:1 };
  const n = map[level] || 1;
  return (
    <span style={{display:"flex",gap:3,alignItems:"center"}}>
      {[0,1,2].map(i=>(
        <span key={i} style={{
          width:6,height:6,borderRadius:"50%",
          background: i<n ? "var(--gold)" : "var(--border2)"
        }}/>
      ))}
      <span style={{fontSize:10,color:"var(--muted2)",fontFamily:"var(--font-mono)",marginLeft:4}}>{level}</span>
    </span>
  );
}

function ReasoningChain({ stock }) {
  const [open, setOpen] = useState(null);
  const layers = [
    { key:"macro",       label:"MACRO",       icon:"🌐", content: stock.macro },
    { key:"fundamental", label:"FUNDAMENTAL", icon:"📊", content: stock.fundamental },
    { key:"technical",   label:"TECHNICAL",   icon:"📈", content: stock.technical },
    { key:"sentiment",   label:"SENTIMENT",   icon:"📰", content: stock.sentiment },
    { key:"insider",     label:"INSIDER",     icon:"👤", content: stock.insider },
    { key:"portfolio",   label:"PORTFOLIO FIT",icon:"💼", content: stock.portfolio },
  ];
  return (
    <div style={{marginTop:16}}>
      <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",marginBottom:8}}>REASONING CHAIN — CLICK TO EXPAND</div>
      {layers.map((l,i)=>(
        <div key={l.key} style={{marginBottom:4}}>
          <button onClick={()=>setOpen(open===l.key?null:l.key)} style={{
            width:"100%", background: open===l.key ? "var(--golddim)" : "var(--surface)",
            border:`1px solid ${open===l.key?"var(--gold)":"var(--border)"}`,
            borderRadius:6, padding:"8px 12px", cursor:"pointer",
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span style={{display:"flex",alignItems:"center",gap:8}}>
              {i>0&&<span style={{width:1,height:12,background:"var(--border2)",marginRight:4}}/>}
              <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:"var(--gold)",letterSpacing:"0.08em"}}>{l.icon} {l.label}</span>
            </span>
            <span style={{color:"var(--muted)",fontSize:12}}>{open===l.key?"▲":"▼"}</span>
          </button>
          {open===l.key&&(
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderTop:"none",borderRadius:"0 0 6px 6px",padding:"12px 16px"}}>
              <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.6}}>{l.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StockCard({ stock, expanded, onToggle }) {
  return (
    <div className="fade-up" style={{
      background:"var(--card)", border:`1px solid ${expanded?"var(--gold)":"var(--border)"}`,
      borderRadius:10, padding:20, cursor:"pointer",
      transition:"border-color .2s",
    }}>
      <div onClick={onToggle} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontFamily:"var(--font-head)",fontSize:20,fontWeight:700,color:"var(--gold)"}}>{stock.sym}</span>
            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--font-mono)"}}>{stock.sector}</span>
          </div>
          <div style={{fontSize:12,color:"var(--muted2)",marginBottom:8}}>{stock.name}</div>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <VerdictBadge v={stock.verdict} />
            <ConvictionDots level={stock.conviction} />
            <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:"var(--muted)",border:"1px solid var(--border2)",borderRadius:4,padding:"2px 6px"}}>{stock.horizon} term</span>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"var(--font-mono)",fontSize:16,fontWeight:500}}>{stock.price}</div>
          <div style={{fontFamily:"var(--font-mono)",fontSize:13,color:stock.up?"var(--green)":"var(--red)"}}>{stock.upside} target</div>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>Target: {stock.target}</div>
        </div>
      </div>
      <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.6,marginTop:12,borderTop:"1px solid var(--border)",paddingTop:12}}>
        {stock.summary}
      </p>
      {expanded && <ReasoningChain stock={stock} />}
      <div style={{marginTop:12,textAlign:"right"}}>
        <span style={{fontSize:11,color:"var(--gold)",fontFamily:"var(--font-mono)",cursor:"pointer"}}>
          {expanded?"▲ COLLAPSE REASONING":"▼ FULL REASONING CHAIN"}
        </span>
      </div>
    </div>
  );
}

function NewsCard({ item }) {
  const [open, setOpen] = useState(false);
  const sentColors = { BULLISH:"var(--green)", BEARISH:"var(--red)", NEUTRAL:"var(--muted2)" };
  return (
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:16,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:item.tagColor,border:`1px solid ${item.tagColor}44`,borderRadius:4,padding:"2px 6px"}}>{item.tag}</span>
            <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:sentColors[item.sentiment]}}>{item.sentiment}</span>
            <span style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--font-mono)"}}>{item.time}</span>
          </div>
          <p style={{fontSize:13,fontWeight:500,lineHeight:1.5,color:"var(--text)"}}>{item.headline}</p>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {item.affected.map(s=>(
              <span key={s} style={{fontSize:10,fontFamily:"var(--font-mono)",background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:4,padding:"2px 6px",color:"var(--muted2)"}}>{s}</span>
            ))}
          </div>
        </div>
        <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:"var(--muted)",background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:4,padding:"3px 8px",whiteSpace:"nowrap"}}>
          IMPACT: {item.impact}
        </span>
      </div>
      {open && (
        <div style={{marginTop:12,background:"var(--golddim)",border:"1px solid var(--gold)44",borderRadius:6,padding:12}}>
          <div style={{fontSize:10,color:"var(--gold)",fontFamily:"var(--font-mono)",marginBottom:6}}>⚡ AI ANALYSIS</div>
          <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.6}}>{item.commentary}</p>
        </div>
      )}
      <button onClick={()=>setOpen(!open)} style={{
        marginTop:10,background:"none",border:"none",cursor:"pointer",
        fontSize:11,color:"var(--gold)",fontFamily:"var(--font-mono)",padding:0
      }}>{open?"▲ HIDE ANALYSIS":"▼ AI ANALYSIS"}</button>
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id:"dashboard", label:"Dashboard" },
  { id:"explorer",  label:"Explorer" },
  { id:"portfolio", label:"My Portfolio" },
  { id:"news",      label:"News Feed" },
];

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [expanded, setExpanded] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [portfolioExpanded, setPortfolioExpanded] = useState(null);
  const apiCallRef = useRef(false);

  async function handleSearch() {
    if (!searchQ.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    apiCallRef.current = true;
    try {
      const res = await fetch("/api/analyse", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a senior investment analyst specialising in AU/UK/US tech stocks, ASX mining, and crypto. 
Respond ONLY with a valid JSON object (no markdown, no preamble) with this exact structure:
{
  "sym": "TICKER",
  "name": "Full company name",
  "sector": "sector label",
  "verdict": "BUY|WATCH|AVOID|HOLD",
  "conviction": "HIGH|MEDIUM|LOW",
  "horizon": "Short|Medium|Long",
  "price": "current approx price with currency",
  "target": "12-month price target",
  "upside": "+X% or -X%",
  "up": true or false,
  "summary": "2-3 sentence executive summary",
  "macro": "macro environment analysis",
  "fundamental": "fundamental analysis",
  "technical": "technical analysis",
  "sentiment": "news and analyst sentiment",
  "insider": "insider activity",
  "portfolio": "portfolio fit and considerations"
}`,
          messages:[{ role:"user", content:`Analyse this investment: ${searchQ}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setSearchResult(parsed);
    } catch(e) {
      setSearchError("Analysis failed. Please try again.");
    }
    setSearching(false);
  }

  const totalValue = PORTFOLIO.reduce((s,h)=>s+(h.qty*h.price),0);
  const totalCost   = PORTFOLIO.reduce((s,h)=>s+(h.qty*h.avg),0);
  const totalPnl    = ((totalValue-totalCost)/totalCost*100).toFixed(1);

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"var(--font-body)" }}>

        {/* Header */}
        <header style={{
          background:"var(--surface)", borderBottom:"1px solid var(--border)",
          padding:"0 24px", position:"sticky", top:0, zIndex:100,
        }}>
          <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",height:56}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:28,height:28,background:"var(--gold)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:14}}>◈</span>
              </div>
              <span style={{fontFamily:"var(--font-head)",fontSize:17,fontWeight:800,letterSpacing:"-0.02em"}}>
                INTEL<span style={{color:"var(--gold)"}}>IQ</span>
              </span>
            </div>
            <nav style={{display:"flex",gap:4}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  background: tab===t.id ? "var(--golddim)" : "none",
                  border: tab===t.id ? "1px solid var(--gold)44" : "1px solid transparent",
                  borderRadius:6, padding:"6px 14px", cursor:"pointer",
                  fontSize:12, fontFamily:"var(--font-body)", fontWeight:500,
                  color: tab===t.id ? "var(--gold)" : "var(--muted2)",
                  transition:"all .15s"
                }}>{t.label}</button>
              ))}
            </nav>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"var(--green)",animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--font-mono)"}}>LIVE</span>
            </div>
          </div>
        </header>

        {/* Ticker tape */}
        <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",overflow:"hidden",height:32,display:"flex",alignItems:"center"}}>
          <div style={{display:"flex",animation:"ticker 30s linear infinite",whiteSpace:"nowrap"}}>
            {[...TICKERS,...TICKERS].map((t,i)=>(
              <span key={i} style={{padding:"0 20px",fontSize:11,fontFamily:"var(--font-mono)",display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:"var(--muted2)"}}>{t.sym}</span>
                <span style={{fontWeight:500}}>{t.price}</span>
                <span style={{color:t.up?"var(--green)":"var(--red)"}}>{t.chg}</span>
                <span style={{color:"var(--border2)"}}>│</span>
              </span>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px"}}>

          {/* ── DASHBOARD ── */}
          {tab==="dashboard"&&(
            <div>
              <div className="fade-up" style={{marginBottom:28}}>
                <h1 style={{fontFamily:"var(--font-head)",fontSize:28,fontWeight:800,letterSpacing:"-0.03em"}}>
                  Good morning. <span style={{color:"var(--gold)"}}>3 high-conviction opportunities</span> today.
                </h1>
                <p style={{fontSize:13,color:"var(--muted2)",marginTop:6}}>Thursday, 27 Feb 2026 · Markets open · Last updated 2 min ago</p>
              </div>

              {/* Macro summary strip */}
              <div className="fade-up-2" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
                {[
                  { label:"MACRO REGIME",    value:"RISK ON",    sub:"Fed pivot mode",        color:"var(--green)" },
                  { label:"US TECH SIGNAL",  value:"BULLISH",    sub:"AI cycle intact",       color:"var(--green)" },
                  { label:"ASX MINING",      value:"NEUTRAL",    sub:"China data mixed",       color:"var(--gold)" },
                  { label:"CRYPTO",          value:"BULLISH",    sub:"ETF inflows strong",     color:"var(--green)" },
                ].map(m=>(
                  <div key={m.label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px"}}>
                    <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",marginBottom:6}}>{m.label}</div>
                    <div style={{fontSize:16,fontFamily:"var(--font-head)",fontWeight:700,color:m.color}}>{m.value}</div>
                    <div style={{fontSize:11,color:"var(--muted2)",marginTop:2}}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* Top picks */}
              <div className="fade-up-3" style={{marginBottom:8}}>
                <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",marginBottom:14}}>TOP PICKS TODAY</div>
                <div style={{display:"grid",gap:12}}>
                  {TOP_PICKS.map((s,i)=>(
                    <StockCard key={s.sym} stock={s} expanded={expanded===s.sym} onToggle={()=>setExpanded(expanded===s.sym?null:s.sym)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EXPLORER ── */}
          {tab==="explorer"&&(
            <div>
              <div className="fade-up" style={{marginBottom:24}}>
                <h1 style={{fontFamily:"var(--font-head)",fontSize:24,fontWeight:800,letterSpacing:"-0.03em",marginBottom:6}}>Stock Explorer</h1>
                <p style={{fontSize:13,color:"var(--muted2)"}}>Search any stock, ETF or crypto for a full AI-powered analysis with drillable reasoning.</p>
              </div>

              <div className="fade-up-2" style={{display:"flex",gap:10,marginBottom:24}}>
                <input
                  value={searchQ}
                  onChange={e=>setSearchQ(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleSearch()}
                  placeholder="e.g. NVIDIA, BHP, Bitcoin, Afterpay..."
                  style={{
                    flex:1, background:"var(--card)", border:"1px solid var(--border2)",
                    borderRadius:8, padding:"12px 16px", color:"var(--text)",
                    fontSize:14, fontFamily:"var(--font-body)", outline:"none",
                  }}
                />
                <button onClick={handleSearch} disabled={searching} style={{
                  background:"var(--gold)", color:"var(--bg)", border:"none",
                  borderRadius:8, padding:"12px 24px", cursor:"pointer",
                  fontSize:13, fontFamily:"var(--font-head)", fontWeight:700,
                  opacity: searching ? .6 : 1,
                }}>{searching?"ANALYSING...":"ANALYSE"}</button>
              </div>

              {searching&&(
                <div style={{display:"grid",gap:8}}>
                  {[80,60,90,70].map((w,i)=>(
                    <div key={i} className="loading-shimmer" style={{height:20,width:`${w}%`,marginBottom:4}}/>
                  ))}
                </div>
              )}

              {searchError&&(
                <div style={{background:"var(--card)",border:"1px solid var(--red)44",borderRadius:8,padding:16,color:"var(--red)",fontSize:13}}>{searchError}</div>
              )}

              {searchResult&&!searching&&(
                <div className="fade-up">
                  <StockCard stock={searchResult} expanded={true} onToggle={()=>{}} />
                </div>
              )}

              {!searchResult&&!searching&&(
                <div className="fade-up-3">
                  <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",marginBottom:12}}>SUGGESTED SEARCHES</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {["NVIDIA","BHP.AX","Bitcoin","Afterpay","Rio Tinto","Solana","CBA.AX","Palantir"].map(s=>(
                      <button key={s} onClick={()=>{setSearchQ(s);}} style={{
                        background:"var(--card)",border:"1px solid var(--border2)",borderRadius:6,
                        padding:"8px 14px",cursor:"pointer",fontSize:12,color:"var(--muted2)",
                        fontFamily:"var(--font-mono)",transition:"all .15s"
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PORTFOLIO ── */}
          {tab==="portfolio"&&(
            <div>
              <div className="fade-up" style={{marginBottom:24}}>
                <h1 style={{fontFamily:"var(--font-head)",fontSize:24,fontWeight:800,letterSpacing:"-0.03em",marginBottom:6}}>My Portfolio</h1>
                <p style={{fontSize:13,color:"var(--muted2)"}}>Portfolio-aware analysis and rotation recommendations.</p>
              </div>

              {/* Summary strip */}
              <div className="fade-up-2" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
                {[
                  { label:"TOTAL VALUE",  value:`$${totalValue.toLocaleString("en",{maximumFractionDigits:0})}`, color:"var(--text)" },
                  { label:"TOTAL P&L",    value:`${totalPnl>0?"+":""}${totalPnl}%`,  color: totalPnl>0?"var(--green)":"var(--red)" },
                  { label:"HOLDINGS",     value:`${PORTFOLIO.length} positions`,     color:"var(--text)" },
                  { label:"ALERTS",       value:"1 SELL signal",                     color:"var(--red)" },
                ].map(m=>(
                  <div key={m.label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px"}}>
                    <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",marginBottom:6}}>{m.label}</div>
                    <div style={{fontSize:16,fontFamily:"var(--font-head)",fontWeight:700,color:m.color}}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Rotate recommendation */}
              <div className="fade-up-2" style={{background:"var(--card)",border:"1px solid var(--gold)66",borderRadius:10,padding:20,marginBottom:24}}>
                <div style={{fontSize:10,color:"var(--gold)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",marginBottom:12}}>⚡ ROTATION OPPORTUNITY</div>
                <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                  <div style={{background:"var(--surface)",border:"1px solid var(--red)44",borderRadius:8,padding:"12px 20px",flex:1,minWidth:160}}>
                    <div style={{fontSize:10,color:"var(--red)",fontFamily:"var(--font-mono)",marginBottom:4}}>SELL</div>
                    <div style={{fontFamily:"var(--font-head)",fontSize:20,fontWeight:800}}>{ROTATE.from.sym}</div>
                    <p style={{fontSize:11,color:"var(--muted2)",marginTop:6,lineHeight:1.5}}>{ROTATE.from.reason}</p>
                  </div>
                  <div style={{fontSize:24,color:"var(--gold)"}}>→</div>
                  <div style={{background:"var(--surface)",border:"1px solid var(--green)44",borderRadius:8,padding:"12px 20px",flex:1,minWidth:160}}>
                    <div style={{fontSize:10,color:"var(--green)",fontFamily:"var(--font-mono)",marginBottom:4}}>BUY</div>
                    <div style={{fontFamily:"var(--font-head)",fontSize:20,fontWeight:800}}>{ROTATE.to.sym}</div>
                    <p style={{fontSize:11,color:"var(--muted2)",marginTop:6,lineHeight:1.5}}>{ROTATE.to.reason}</p>
                  </div>
                </div>
              </div>

              {/* Holdings */}
              <div className="fade-up-3">
                <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--font-mono)",letterSpacing:"0.1em",marginBottom:12}}>HOLDINGS</div>
                <div style={{display:"grid",gap:8}}>
                  {PORTFOLIO.map(h=>(
                    <div key={h.sym} style={{background:"var(--card)",border:`1px solid ${h.verdict==="SELL"?"var(--red)44":"var(--border)"}`,borderRadius:8,padding:16,cursor:"pointer"}}
                      onClick={()=>setPortfolioExpanded(portfolioExpanded===h.sym?null:h.sym)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",gap:16,alignItems:"center"}}>
                          <div>
                            <div style={{fontFamily:"var(--font-head)",fontSize:16,fontWeight:700,color:"var(--gold)"}}>{h.sym}</div>
                            <div style={{fontSize:11,color:"var(--muted2)"}}>{h.name}</div>
                          </div>
                          <VerdictBadge v={h.verdict} small />
                          <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:"var(--muted)",border:"1px solid var(--border2)",borderRadius:4,padding:"2px 6px"}}>{h.horizon}</span>
                        </div>
                        <div style={{display:"flex",gap:24,alignItems:"center"}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"var(--font-mono)",fontSize:13}}>${(h.qty*h.price).toLocaleString("en",{maximumFractionDigits:0})}</div>
                            <div style={{fontSize:10,color:"var(--muted)"}}>Qty: {h.qty}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"var(--font-mono)",fontSize:14,color:h.up?"var(--green)":"var(--red)",fontWeight:500}}>{h.pnl}</div>
                            <div style={{fontSize:10,color:"var(--muted)"}}>Avg: ${h.avg}</div>
                          </div>
                        </div>
                      </div>
                      {portfolioExpanded===h.sym&&(
                        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)"}}>
                          <p style={{fontSize:12,color:"var(--muted2)"}}>
                            {h.verdict==="SELL"?"⚠️ Structural headwinds outweigh near-term income. Capital better deployed into AI/tech rotation.":"✓ Hold position. Thesis intact. Review at next earnings."}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── NEWS ── */}
          {tab==="news"&&(
            <div>
              <div className="fade-up" style={{marginBottom:24}}>
                <h1 style={{fontFamily:"var(--font-head)",fontSize:24,fontWeight:800,letterSpacing:"-0.03em",marginBottom:6}}>News & Signals</h1>
                <p style={{fontSize:13,color:"var(--muted2)"}}>Filtered to your asset universe. Every story analysed for portfolio impact.</p>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                {["ALL","US TECH","ASX MINING","CRYPTO"].map(f=>(
                  <button key={f} style={{
                    background:"var(--card)",border:"1px solid var(--border2)",borderRadius:6,
                    padding:"6px 14px",cursor:"pointer",fontSize:11,fontFamily:"var(--font-mono)",color:"var(--muted2)"
                  }}>{f}</button>
                ))}
              </div>
              <div className="fade-up-2">
                {NEWS.map((n,i)=><NewsCard key={i} item={n} />)}
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer style={{borderTop:"1px solid var(--border)",padding:"16px 24px",marginTop:40}}>
          <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--font-mono)"}}>INTELIQ · Not financial advice · For informational purposes only</span>
            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--font-mono)"}}>Powered by Claude AI</span>
          </div>
        </footer>
      </div>
    </>
  );
}
