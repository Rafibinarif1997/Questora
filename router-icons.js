// Zero-build browser router + icon shim for GitHub Pages branch deployment.
const RouterContext = React.createContext({path: location.hash.replace(/^#/, '') || '/', navigate:()=>{}, params:{}});
function getPath(){ return location.hash.replace(/^#/, '') || '/'; }
function Router({children}){
  const [path,setPath]=React.useState(getPath());
  React.useEffect(()=>{ const fn=()=>setPath(getPath()); addEventListener('hashchange',fn); return ()=>removeEventListener('hashchange',fn); },[]);
  const navigate=(to)=>{ location.hash=to; };
  return React.createElement(RouterContext.Provider,{value:{path,navigate,params:{}}},children);
}
function Link({to,children,...props}){ return React.createElement('a',{...props,href:'#'+to},children); }
function NavLink({to,children,className,onClick,...props}){ const {path}=React.useContext(RouterContext); const active=path===to || (to!=='/' && path.startsWith(to+'/')); const cls=typeof className==='function'?className({isActive:active}):(className||'')+(active?' active':''); return React.createElement('a',{...props,href:'#'+to,className:cls,onClick},children); }
function matchRoute(pattern,path){
  if(pattern==='*') return {};
  const a=pattern.split('/').filter(Boolean), b=path.split('/').filter(Boolean); if(a.length!==b.length) return null; const p={}; for(let i=0;i<a.length;i++){ if(a[i].startsWith(':')) p[a[i].slice(1)]=decodeURIComponent(b[i]||''); else if(a[i]!==b[i]) return null; } return p;
}
function Routes({children}){ const {path}=React.useContext(RouterContext); const routes=React.Children.toArray(children); let chosen=null, params={}; for(const r of routes){ const m=matchRoute(r.props.path,path); if(m){chosen=r;params=m;break;} } if(!chosen) chosen=routes.find(r=>r.props.path==='*')||routes[0]; if(!chosen)return null; return React.createElement(RouteContext.Provider,{value:params},chosen.props.element); }
function Route(){return null;}
const RouteContext=React.createContext({});
function useParams(){return React.useContext(RouteContext);}
function useNavigate(){return React.useContext(RouterContext).navigate;}
function Outlet(){return null;}
// Minimal icon components: no package manager or icon library required.
const iconNames=['ArrowUpRight','BarChart3','Bell','BookOpen','ChevronDown','CircleHelp','Copy','Flame','Gauge','Globe2','Layers3','LockKeyhole','Menu','Plus','Rocket','Search','ShieldCheck','Sparkles','TrendingUp','Users','Wallet','X','Zap','ArrowDown','ArrowUp','Activity','ExternalLink','Check','SlidersHorizontal'];
for(const n of iconNames){ window[n]=function Icon(){ return React.createElement('span',{className:'icon-fallback','aria-hidden':'true'},'•'); }; }
