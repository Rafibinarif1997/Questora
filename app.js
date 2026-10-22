(() => {
const cfg = window.RHOOD_CONFIG;
const $ = (id) => document.getElementById(id);
let provider, signer, account, activeFilter = 'all';
const short = (s) => s ? `${s.slice(0,6)}…${s.slice(-4)}` : '';
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4200)}
function setStatus(msg){$('listingStatus').textContent=msg}
function isConfigured(){return Boolean(cfg.contracts.factory && cfg.abis.factory)}
async function connectWallet(){
 if(!window.ethereum){toast('No EVM wallet detected. Open this site in MetaMask or another injected wallet.');return}
 try {
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts',[]);
  signer=await provider.getSigner();account=await signer.getAddress();
  const net=await provider.getNetwork();
  if(Number(net.chainId)!==cfg.chainId){await switchNetwork();provider=new ethers.BrowserProvider(window.ethereum);signer=await provider.getSigner();account=await signer.getAddress()}
  $('connectBtn').innerHTML=`${short(account)} <span>✓</span>`;
  $('connectBtn').classList.add('connected');toast('Wallet connected to Robinhood Chain Testnet.');
 } catch(e){toast(e?.shortMessage||e?.message||'Wallet connection cancelled.')}
}
async function switchNetwork(){
 try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:cfg.chainIdHex}]})}
 catch(e){if(e.code===4902){await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:cfg.chainIdHex,chainName:cfg.chainName,nativeCurrency:cfg.nativeCurrency,rpcUrls:cfg.rpcUrls,blockExplorerUrls:cfg.blockExplorerUrls}]})}else throw e}
}
$('connectBtn').addEventListener('click',connectWallet);
$('menuBtn').addEventListener('click',()=>$('nav').classList.toggle('open'));
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>$('nav').classList.remove('open')));
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeFilter=b.dataset.filter;renderEmpty()}));
function renderEmpty(){
 const q=$('searchInput').value.trim();
 if(q){$('tokenGrid').innerHTML=`<div class="empty-state"><div class="empty-icon">⌕</div><b>NO INDEXED TOKENS FOUND</b><p>Live token discovery needs a configured factory and event indexer. Your search: “${escapeHtml(q)}”</p></div>`;return}
 const msg=activeFilter==='graduated'?'Graduated token data will appear when the graduation manager and indexer are configured.':activeFilter==='new'?'New launches will appear when the factory address and event indexer are configured.':'Token listings will appear here when a verified RHOOD Forge factory/indexer is configured.';
 $('tokenGrid').innerHTML=`<div class="empty-state"><div class="empty-icon">✳</div><b>THE FLOOR IS QUIET. FOR NOW.</b><p>${msg}</p><a href="#launch" class="text-link">Be the first to forge ↗</a></div>`;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('searchInput').addEventListener('input',renderEmpty);
$('refreshBtn').addEventListener('click',async()=>{renderEmpty();if(isConfigured()){setStatus('Factory configured · indexer required');toast('Factory is configured. Add event indexing to load token listings.')}else{setStatus('Factory not configured');toast('Add the verified factory address and ABI in config.js first.')}});
$('launchForm').addEventListener('submit',async(e)=>{
 e.preventDefault();const name=$('tokenName').value.trim(),symbol=$('tokenSymbol').value.trim().toUpperCase();
 const msg=$('launchMessage');msg.textContent='';
 if(!name||!symbol){msg.textContent='Token name and ticker are required.';return}
 if(!/^[A-Z0-9]{2,10}$/.test(symbol)){msg.textContent='Ticker must be 2–10 letters or numbers.';return}
 if(!window.ethereum){msg.textContent='Connect an EVM wallet to continue.';return}
 if(!account){await connectWallet();if(!account)return}
 if(!isConfigured()){msg.textContent='Preview ready — no transaction sent. To enable real launches, deploy and verify the RHOOD Forge factory contract, then add its address and ABI in config.js. The factory must enforce the fixed 500M supply, 80/10/10 allocation and team vesting rules.';toast('Launch disabled: factory contract not configured.');return}
 // Intentionally fail closed: a valid ABI and method schema must be explicitly implemented,
 // rather than guessing a payable factory method and risking funds.
 msg.textContent='Factory address detected, but launch is still locked until the verified factory ABI and exact create-token method are wired and reviewed.';
});
if(window.ethereum){window.ethereum.on?.('accountsChanged',()=>{account=null;$('connectBtn').innerHTML='Connect wallet <span>↗</span>';if(window.ethereum.selectedAddress)connectWallet()});window.ethereum.on?.('chainChanged',()=>{provider=null;signer=null;account=null;$('connectBtn').innerHTML='Connect wallet <span>↗</span>'})}
setStatus(isConfigured()?'Factory configured · indexer required':'Factory not configured');
})();