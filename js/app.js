
const DB_KEY='hood_memory_demo_v1';
const DEMO={
  wallet:'DEMO-WALLET',
  nftCount:1,
  xp:120,
  missions:[],
  completed:[],
  demo:true,
  profile:'Demo Tester'
};
function state(){try{return JSON.parse(localStorage.getItem(DB_KEY))||DEMO}catch{return DEMO}}
function save(s){localStorage.setItem(DB_KEY,JSON.stringify(s))}
function toast(title,msg,type='ok'){const x=document.createElement('div');x.className='toast '+type;x.innerHTML='<b>'+title+'</b>'+msg;document.body.appendChild(x);setTimeout(()=>x.remove(),3200)}
function requireDemo(){const s=state();if(!s.demo){s.demo=true;save(s)}return s}
function xpAdd(n,reason){const s=requireDemo();s.xp+=n;s.completed=s.completed||[];save(s);toast('XP EARNED',`+${n} XP · ${reason}`);document.dispatchEvent(new Event('hm:state'))}
function navActive(){const p=location.pathname;document.querySelectorAll('.nav a').forEach(a=>{if(p.includes(a.getAttribute('href').split('/')[0]))a.classList.add('active')})}
document.addEventListener('DOMContentLoaded',()=>{navActive();document.querySelectorAll('[data-xp]').forEach(b=>b.addEventListener('click',()=>xpAdd(+b.dataset.xp,b.dataset.reason||'Demo mission')));document.querySelectorAll('[data-demo-reset]').forEach(b=>b.onclick=()=>{localStorage.removeItem(DB_KEY);toast('RESET','Demo progress reset.');setTimeout(()=>location.reload(),350)});const s=state();document.querySelectorAll('[data-xp-total]').forEach(e=>e.textContent=s.xp.toLocaleString());document.querySelectorAll('[data-nft-count]').forEach(e=>e.textContent=s.nftCount);document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>document.querySelector('.nav').classList.toggle('mobile-open'))});
