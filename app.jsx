const seedTokens = [
  { id:"rhood-cat", name:"Rhood Cat", symbol:"RCAT", price:"$0.00084", mc:"$84.2K", vol:"$31.8K", holders:241, progress:82, age:"3m", emoji:"🐈", status:"Bonding", change:"+18.4%", creator:"0x7a1…91c" },
  { id:"orbit-pebble", name:"Orbit Pebble", symbol:"PEBB", price:"$0.00172", mc:"$172K", vol:"$94.6K", holders:614, progress:96, age:"11m", emoji:"🪨", status:"Almost there", change:"+41.2%", creator:"0x19b…4fe" },
  { id:"hood-radio", name:"Hood Radio", symbol:"HRAD", price:"$0.00031", mc:"$31.4K", vol:"$12.1K", holders:109, progress:44, age:"24m", emoji:"📻", status:"Bonding", change:"+7.8%", creator:"0x2c0…aa8" },
  { id:"moon-mango", name:"Moon Mango", symbol:"MNGO", price:"$0.00391", mc:"$391K", vol:"$244K", holders:1_028, progress:100, age:"1h", emoji:"🥭", status:"Graduated", change:"+63.9%", creator:"0x51d…20b" },
  { id:"pixel-rat", name:"Pixel Rat", symbol:"PRAT", price:"$0.00012", mc:"$12.9K", vol:"$4.2K", holders:67, progress:19, age:"2h", emoji:"🐀", status:"Bonding", change:"-2.4%", creator:"0x4f1…e09" },
  { id:"vault-dust", name:"Vault Dust", symbol:"DUST", price:"$0.00067", mc:"$67.5K", vol:"$28.9K", holders:312, progress:71, age:"3h", emoji:"✦", status:"Bonding", change:"+12.1%", creator:"0x88a…d10" }
];

const activity = [
  ["BUY","RCAT","0.42 RHOD","0x7a1…91c","12s"],
  ["BUY","PEBB","1.80 RHOD","0x19b…4fe","27s"],
  ["SELL","HRAD","0.17 RHOD","0x2c0…aa8","41s"],
  ["BUY","MNGO","3.40 RHOD","0x51d…20b","1m"],
  ["GRADUATE","MNGO","Pool created","0x51d…20b","2m"],
  ["BUY","DUST","0.66 RHOD","0x88a…d10","3m"]
];

function useLocalTokens(){
  const [custom, setCustom] = useState(()=>JSON.parse(localStorage.getItem("rhood-custom-tokens")||"[]"));
  useEffect(()=>localStorage.setItem("rhood-custom-tokens", JSON.stringify(custom)),[custom]);
  return [custom, setCustom];
}

function App(){
  return <Router><Shell/></Router>
}

function Shell(){
  const [wallet,setWallet] = useState("");
  const [menu,setMenu] = useState(false);
  const connect = ()=>setWallet(wallet ? "" : "0x9A4…71F");
  return <>
    <div className="noise"/>
    <div className="ticker"><span>RHOOD FORGE</span><span>PERMISSIONLESS TOKEN LAUNCHES</span><span>ROBINHOOD CHAIN</span><span>CURVE → POOL → LOCK</span><span>RHOOD FORGE</span></div>
    <header className="nav">
      <Link to="/" className="brand" onClick={()=>setMenu(false)}>
        <span className="brand-mark">R</span><span>RHOOD<span className="brand-dim">FORGE</span></span>
      </Link>
      <nav className={menu ? "navlinks open":"navlinks"}>
        <NavLink to="/explore" onClick={()=>setMenu(false)}>Explore</NavLink>
        <NavLink to="/activity" onClick={()=>setMenu(false)}>Pulse</NavLink>
        <NavLink to="/analytics" onClick={()=>setMenu(false)}>Analytics</NavLink>
        <NavLink to="/docs" onClick={()=>setMenu(false)}>Docs</NavLink>
        <NavLink to="/create" className="create-link" onClick={()=>setMenu(false)}><Plus size={15}/> Launch</NavLink>
      </nav>
      <div className="nav-actions">
        <button className="icon-btn" title="Help"><CircleHelp size={18}/></button>
        <button className="wallet-btn" onClick={connect}><Wallet size={16}/>{wallet || "Connect Wallet"}</button>
        <button className="menu-btn" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
      </div>
    </header>
    <main><Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/explore" element={<Explore/>}/>
      <Route path="/token/:id" element={<TokenPage/>}/>
      <Route path="/create" element={<Create/>}/>
      <Route path="/activity" element={<ActivityPage/>}/>
      <Route path="/analytics" element={<Analytics/>}/>
      <Route path="/profile" element={<Profile wallet={wallet}/>}/>
      <Route path="/docs" element={<Docs/>}/>
      <Route path="/docs/:section" element={<Docs/>}/>
      <Route path="*" element={<NotFound/>}/>
    </Routes></main>
    <footer className="footer">
      <div><b>RHOOD FORGE</b><span>Built for the open edge of Robinhood Chain.</span></div>
      <div className="footer-links"><Link to="/docs">Protocol</Link><Link to="/docs/security">Security</Link><Link to="/docs/contracts">Contracts</Link><a href="https://github.com/" target="_blank">GitHub <ExternalLink size={12}/></a></div>
    </footer>
  </>
}

function Home(){
  return <div>
    <section className="hero wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot"/> LIVE ON RHOOD CHAIN <span className="eyebrow-sep">/</span> 4663</div>
        <h1>Forge the next<br/><em>market</em> before it exists.</h1>
        <p className="hero-sub">A permissionless launch terminal for fast, transparent token markets. Launch in minutes. Let the curve discover price. Graduate into liquidity.</p>
        <div className="hero-actions">
          <Link className="btn primary" to="/create"><Rocket size={17}/> Launch a token</Link>
          <Link className="btn ghost" to="/explore">Explore markets <ArrowUpRight size={17}/></Link>
        </div>
        <div className="micro-stats">
          <div><b>12,421</b><span>launches</span></div><div><b>$8.4M</b><span>volume</span></div><div><b>1,823</b><span>graduated</span></div>
        </div>
      </div>
      <div className="hero-terminal">
        <div className="terminal-top"><span>FORGE / LIVE FEED</span><span className="green">● ONLINE</span></div>
        <div className="terminal-main">
          <div className="terminal-token"><div className="orb">🐈</div><div><small>JUST LAUNCHED</small><h3>RHOOD CAT <span>$RCAT</span></h3></div><span className="up">+18.4%</span></div>
          <div className="fake-chart">
            <svg viewBox="0 0 520 190" preserveAspectRatio="none"><path d="M0 158 C45 153,50 132,80 143 S120 118,150 126 S188 95,220 109 S265 86,292 94 S330 61,355 75 S405 52,430 60 S468 30,520 18" fill="none"/><path d="M0 158 C45 153,50 132,80 143 S120 118,150 126 S188 95,220 109 S265 86,292 94 S330 61,355 75 S405 52,430 60 S468 30,520 18 L520 190 L0 190 Z" className="chart-fill"/></svg>
          </div>
          <div className="terminal-row"><span>CURVE</span><b>82.4%</b><span>MCAP</span><b>$84.2K</b></div>
          <div className="progress"><span style={{width:"82%"}}/></div>
          <div className="terminal-buy"><span>1 RHOD</span><span>≈ 1,184 RCAT</span><button>BUY <ArrowUpRight size={14}/></button></div>
        </div>
      </div>
    </section>

    <section className="section wrap">
      <div className="section-head"><div><span className="kicker">01 / DISCOVERY</span><h2>Markets in motion</h2></div><Link to="/explore" className="text-link">View all <ArrowUpRight size={15}/></Link></div>
      <div className="token-grid">{seedTokens.slice(0,4).map(t=><TokenCard key={t.id} token={t}/>)}</div>
    </section>

    <section className="feature-band">
      <div className="wrap feature-grid">
        <div><span className="kicker">02 / THE ENGINE</span><h2>Curve first.<br/><em>Liquidity second.</em></h2></div>
        <div className="feature-copy"><p>Every launch begins as a live market, not a static presale page. The curve handles discovery. When the threshold is reached, liquidity graduates into a DEX pool and stays locked.</p><div className="steps"><div><span>01</span><b>Launch</b><small>Deploy token + curve</small></div><div><span>02</span><b>Trade</b><small>Price discovers itself</small></div><div><span>03</span><b>Graduate</b><small>Pool + permanent lock</small></div></div></div>
      </div>
    </section>

    <section className="section wrap">
      <div className="section-head"><div><span className="kicker">03 / PULSE</span><h2>Nothing hides in the dark.</h2></div><Link to="/activity" className="text-link">Open pulse <ArrowUpRight size={15}/></Link></div>
      <div className="activity-table">{activity.slice(0,5).map((a,i)=><ActivityRow key={i} item={a}/>)}</div>
    </section>
  </div>
}

function TokenCard({token}){
  return <Link to={`/token/${token.id}`} className="token-card">
    <div className="card-top"><div className="token-avatar">{token.emoji}</div><div><h3>{token.name}</h3><span>${token.symbol}</span></div><span className={`status ${token.status==="Graduated"?"graduated":""}`}>{token.status}</span></div>
    <div className="card-price"><b>{token.price}</b><span className={token.change.startsWith("+")?"up":"down"}>{token.change}</span></div>
    <div className="mini-chart"><svg viewBox="0 0 240 55" preserveAspectRatio="none"><path d={`M0 48 C25 44,25 ${35-token.progress/8},50 39 S75 42,95 30 S125 ${37-token.progress/10},145 32 S170 20,190 25 S220 ${18-token.progress/12},240 ${8+Math.max(0,20-token.progress/4)}`} fill="none"/></svg></div>
    <div className="card-progress"><span><small>CURVE</small><b>{token.progress}%</b></span><div className="progress"><span style={{width:`${token.progress}%`}}/></div></div>
    <div className="card-foot"><span><Users size={13}/> {token.holders}</span><span><BarChart3 size={13}/> {token.vol}</span><span>{token.age}</span></div>
  </Link>
}

function Explore(){
  const [filter,setFilter]=useState("Trending");
  const [q,setQ]=useState("");
  const all=seedTokens;
  const visible=useMemo(()=>all.filter(t=>(t.name+t.symbol).toLowerCase().includes(q.toLowerCase())),[q]);
  return <div className="page wrap">
    <div className="page-title"><div><span className="kicker">MARKET INDEX / 01</span><h1>Explore the forge.</h1><p>Find the markets moving fastest, the launches closest to graduation, and the ideas nobody has priced yet.</p></div><Link to="/create" className="btn primary"><Plus size={16}/> New launch</Link></div>
    <div className="explore-tools"><div className="searchbox"><Search size={17}/><input placeholder="Search name, symbol or contract" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="filters">{["Trending","Newest","Volume","Market Cap","Graduating"].map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div></div>
    <div className="token-grid big">{visible.map(t=><TokenCard key={t.id} token={t}/>)}</div>
  </div>
}

function TokenPage(){
  const {id}=useParams(); const token=seedTokens.find(x=>x.id===id)||seedTokens[0];
  const [side,setSide]=useState("buy"); const [amount,setAmount]=useState("0.10");
  return <div className="page wrap">
    <div className="token-hero"><div className="token-title"><div className="token-avatar huge">{token.emoji}</div><div><div className="eyebrow">LIVE MARKET <span className="live-dot"/></div><h1>{token.name} <span>${token.symbol}</span></h1><p>Created by <b>{token.creator}</b> · launched {token.age} ago</p></div></div><div className="token-actions"><button className="icon-btn"><Bell size={17}/></button><button className="icon-btn"><Copy size={17}/></button></div></div>
    <div className="token-stats"><Stat label="Price" value={token.price} change={token.change}/><Stat label="Market cap" value={token.mc}/><Stat label="24h volume" value={token.vol}/><Stat label="Holders" value={token.holders}/><Stat label="Curve" value={`${token.progress}%`}/></div>
    <div className="trade-layout">
      <div className="chart-panel"><div className="panel-head"><div><span className="kicker">PRICE / RHOD</span><h2>{token.price}</h2></div><div className="time-tabs"><span className="active">1H</span><span>6H</span><span>1D</span><span>ALL</span></div></div><div className="large-chart"><svg viewBox="0 0 900 430" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopOpacity=".28"/><stop offset="100%" stopOpacity="0"/></linearGradient></defs><path d="M0 340 C60 330,70 270,130 295 S190 220,250 252 S320 165,380 200 S450 235,510 165 S580 188,625 118 S690 152,735 92 S810 112,900 45 L900 430 L0 430Z" fill="url(#g)"/><path d="M0 340 C60 330,70 270,130 295 S190 220,250 252 S320 165,380 200 S450 235,510 165 S580 188,625 118 S690 152,735 92 S810 112,900 45" fill="none" stroke="currentColor" strokeWidth="3"/></svg><div className="axis"><span>$0.0001</span><span>$0.0005</span><span>$0.0010</span><span>$0.0020</span></div></div><div className="curve-meter"><div><span>GRADUATION PROGRESS</span><b>{token.progress}%</b></div><div className="progress"><span style={{width:`${token.progress}%`}}/></div><small>{token.progress>=100?"Graduated to liquidity pool":"Keep trading to push this market toward graduation."}</small></div></div>
      <div className="trade-box"><div className="trade-tabs"><button className={side==="buy"?"active":""} onClick={()=>setSide("buy")}>Buy</button><button className={side==="sell"?"active":""} onClick={()=>setSide("sell")}>Sell</button></div><label>YOU PAY</label><div className="amount-input"><input value={amount} onChange={e=>setAmount(e.target.value)}/><span>RHOD</span></div><div className="balance">Balance <b>—</b></div><div className="receive"><span>{side==="buy"?"YOU RECEIVE":"YOU GET"}</span><b>{side==="buy"?"≈ 118.4K":"≈ 118.4K"} ${token.symbol}</b></div><div className="quote"><span>Price impact</span><b>0.42%</b><span>Network fee</span><b>~$0.01</b></div><button className="btn primary full"><Zap size={16}/>{side==="buy"?"Buy token":"Sell token"}</button><small className="demo-note">Demo trading UI — connect a wallet and wire the contract before mainnet use.</small></div>
    </div>
    <div className="detail-grid"><div className="panel"><div className="panel-head"><h3>Recent trades</h3><Link to="/activity">All activity</Link></div>{activity.map((a,i)=><ActivityRow key={i} item={a}/>)}</div><div className="panel"><div className="panel-head"><h3>Market notes</h3><span className="muted">ON-CHAIN</span></div><InfoLine icon={<ShieldCheck/>} title="Liquidity" value={token.progress>=100?"Graduated pool":"Curve reserve"}/><InfoLine icon={<LockKeyhole/>} title="Graduation" value={token.progress>=100?"Complete":"Automatic threshold"}/><InfoLine icon={<Users/>} title="Holders" value={token.holders}/><InfoLine icon={<Globe2/>} title="Network" value="Robinhood Chain"/></div></div>
  </div>
}

function Stat({label,value,change}){return <div className="stat"><span>{label}</span><b>{value}</b>{change&&<small className={change.startsWith("+")?"up":"down"}>{change}</small>}</div>}
function InfoLine({icon,title,value}){return <div className="info-line"><span className="info-icon">{React.cloneElement(icon,{size:16})}</span><div><b>{title}</b><small>{value}</small></div></div>}
function ActivityRow({item}){return <div className="activity-row"><span className={`activity-badge ${item[0].toLowerCase()}`}>{item[0]==="BUY"?<ArrowDown size={13}/>:item[0]==="SELL"?<ArrowUp size={13}/>:<Sparkles size={13}/>}</span><div><b>{item[0]} <span>${item[1]}</span></b><small>{item[3]}</small></div><strong>{item[2]}</strong><time>{item[4]}</time></div>}

function Create(){
  const [form,setForm]=useState({name:"",symbol:"",description:"",website:"",x:"",telegram:""});
  const [custom,setCustom]=useLocalTokens(); const [created,setCreated]=useState(false);
  const update=k=>e=>setForm({...form,[k]:e.target.value});
  const submit=e=>{e.preventDefault(); if(!form.name||!form.symbol)return; const t={id:"local-"+Date.now(),name:form.name,symbol:form.symbol.toUpperCase(),price:"—",mc:"—",vol:"0",holders:0,progress:0,age:"now",emoji:"✦",status:"Draft",change:"0%",creator:"You"}; setCustom([t,...custom]);setCreated(true)};
  return <div className="page wrap narrow">
    <div className="page-title centered"><div><span className="kicker">LAUNCH TERMINAL / 01</span><h1>Put an idea on-chain.</h1><p>No application. No gatekeeper. Define the market, publish the curve, and let traders decide what comes next.</p></div></div>
    {created?<div className="success-box"><div className="success-icon"><Check/></div><h2>Launch package prepared.</h2><p>Your token is saved locally as a demo. The next step is wiring the factory contract for real deployment.</p><Link to="/explore" className="btn primary">Explore markets</Link></div>:
    <form className="create-form" onSubmit={submit}>
      <div className="form-section"><div className="form-section-head"><span>01</span><div><h3>Identity</h3><p>Make it recognizable in one glance.</p></div></div><div className="form-grid"><Field label="Token name" placeholder="e.g. Rhood Cat" value={form.name} onChange={update("name")}/><Field label="Ticker" placeholder="e.g. RCAT" value={form.symbol} onChange={update("symbol")}/></div><Field label="Description" placeholder="What is this market about?" textarea value={form.description} onChange={update("description")}/></div>
      <div className="form-section"><div className="form-section-head"><span>02</span><div><h3>Presence</h3><p>Give the market somewhere to go.</p></div></div><div className="form-grid"><Field label="Website" placeholder="https://" value={form.website} onChange={update("website")}/><Field label="X / Social" placeholder="@handle or URL" value={form.x} onChange={update("x")}/></div><Field label="Telegram" placeholder="https://t.me/..." value={form.telegram} onChange={update("telegram")}/></div>
      <div className="form-section"><div className="form-section-head"><span>03</span><div><h3>Market rules</h3><p>These values define the launch economics.</p></div></div><div className="rule-grid"><Rule title="Pair" value="RHOD"/><Rule title="Launch supply" value="1,000,000,000"/><Rule title="Graduation" value="10 RHOD"/><Rule title="Creator tax" value="0.50%"/></div><div className="notice"><ShieldCheck size={17}/><span>For production, these parameters will be enforced by the deployed factory and curve contracts. This interface is currently a front-end demo.</span></div></div>
      <button className="btn primary full" type="submit"><Rocket size={17}/> Prepare launch</button>
    </form>}
  </div>
}
function Field({label,placeholder,value,onChange,textarea}){return <label className="field"><span>{label}</span>{textarea?<textarea placeholder={placeholder} value={value} onChange={onChange}/>:<input placeholder={placeholder} value={value} onChange={onChange}/>}</label>}
function Rule({title,value}){return <div className="rule"><span>{title}</span><b>{value}</b><SlidersHorizontal size={14}/></div>}

function ActivityPage(){
  return <div className="page wrap"><div className="page-title"><div><span className="kicker">NETWORK PULSE / 24H</span><h1>Everything that moved.</h1><p>A live-style feed for launches, buys, sells and graduations.</p></div><div className="live-chip"><span className="live-dot"/> STREAMING</div></div><div className="activity-layout"><div className="activity-table full-table">{[...activity,...activity,...activity].map((a,i)=><ActivityRow key={i} item={a}/>)}</div><aside className="side-card"><span className="kicker">NOW</span><h3>Market temperature</h3><div className="gauge"><Gauge size={34}/><b>72</b><span>/ 100</span></div><p>Momentum is elevated across small-cap launches.</p><Link to="/explore" className="text-link">Scan markets <ArrowUpRight size={14}/></Link></aside></div></div>
}

function Analytics(){
  return <div className="page wrap"><div className="page-title"><div><span className="kicker">PROTOCOL / ANALYTICS</span><h1>The numbers behind the noise.</h1><p>Transparent market-level and protocol-level signals, presented without the black box.</p></div></div><div className="analytics-grid"><Stat label="Total launches" value="12,421"/><Stat label="Total volume" value="$8.4M"/><Stat label="Graduated" value="1,823"/><Stat label="Active markets" value="4,212"/></div><div className="analytics-panel"><div className="panel-head"><h3>Launch activity</h3><span className="muted">LAST 30 DAYS</span></div><div className="bar-chart">{Array.from({length:30},(_,i)=><div key={i} style={{height:`${18+(i*17)%75}%`}}><span/></div>)}</div><div className="chart-labels"><span>30d ago</span><span>15d</span><span>Today</span></div></div><div className="two-panels"><div className="panel"><div className="panel-head"><h3>Protocol flow</h3></div><InfoLine icon={<Rocket/>} title="New launches" value="12,421"/><InfoLine icon={<TrendingUp/>} title="Graduations" value="1,823"/><InfoLine icon={<Activity/>} title="Trades indexed" value="284,991"/><InfoLine icon={<Users/>} title="Unique holders" value="83,421"/></div><div className="panel"><div className="panel-head"><h3>Network</h3></div><InfoLine icon={<Zap/>} title="Chain" value="Robinhood Chain"/><InfoLine icon={<Layers3/>} title="Settlement" value="On-chain"/><InfoLine icon={<LockKeyhole/>} title="Liquidity" value="Locked after graduation"/><InfoLine icon={<ShieldCheck/>} title="Source of truth" value="Contracts + events"/></div></div></div>
}

function Profile({wallet}){return <div className="page wrap"><div className="profile-head"><div className="profile-avatar">R</div><div><span className="kicker">WALLET PROFILE</span><h1>{wallet||"Anonymous builder"}</h1><p>{wallet?"Connected session":"Connect a wallet to personalize this page."}</p></div><button className="btn ghost"><Copy size={15}/> Copy address</button></div><div className="analytics-grid"><Stat label="Created" value="12"/><Stat label="Holdings" value="7"/><Stat label="Trades" value="183"/><Stat label="Creator fees" value="0.84 RHOD"/></div><div className="panel"><div className="panel-head"><h3>Your launches</h3><Link to="/create">Create another <Plus size={14}/></Link></div><div className="token-grid">{seedTokens.slice(0,3).map(t=><TokenCard key={t.id} token={t}/>)}</div></div></div>}

function Docs(){
  const items=[["overview","Overview"],["launches","How launches work"],["curve","Bonding curve"],["trading","Trading"],["graduation","Graduation"],["fees","Fees"],["security","Security"],["contracts","Contracts"]];
  return <div className="docs wrap"><aside className="docs-nav"><span className="kicker">DOCS / READ</span>{items.map(([s,n])=><NavLink key={s} to={`/docs/${s}`}>{n}</NavLink>)}</aside><article className="doc-content"><span className="kicker">RHOOD FORGE PROTOCOL</span><h1>Build on an open launch rail.</h1><p className="lead">RHOOD Forge is designed around a simple idea: the market should be able to form in public, with its rules visible before the first trade.</p><h2>Launch lifecycle</h2><div className="doc-flow"><span>CREATE</span><i>→</i><span>CURVE</span><i>→</i><span>TRADE</span><i>→</i><span>GRADUATE</span><i>→</i><span>POOL</span></div><h2>What is fixed?</h2><p>At launch, the contract records the market configuration: supply, pair, curve parameters, graduation threshold and fee rules. The front end is a window into those rules—not the authority that changes them.</p><h2>Why the curve?</h2><p>A curve makes price discovery continuous from the first trade. Instead of asking creators to manufacture a complete order book, the protocol starts with a deterministic market mechanism and moves liquidity into a DEX pool once the graduation condition is met.</p><div className="doc-callout"><ShieldCheck size={20}/><div><b>Production note</b><span>This repository contains a complete front-end experience, but the transaction layer is intentionally marked as demo until audited contracts and verified ABIs are connected.</span></div></div></article></div>
}

function NotFound(){return <div className="empty wrap"><span className="kicker">404 / LOST MARKET</span><h1>This route never graduated.</h1><p>The page you requested does not exist.</p><Link className="btn primary" to="/explore">Back to Explore</Link></div>}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
