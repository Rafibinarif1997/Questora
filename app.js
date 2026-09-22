const collections=[
  ["🐻","Rhood Bears","1,111 items","0.08 RH","1.2K"],
  ["📺","Hood Pixels","404 items","0.05 RH","856"],
  ["4️⃣0️⃣4️⃣","The Last 404","404 items","0.10 RH","942"],
  ["🏹","Hood Warriors","1,000 items","0.07 RH","721"],
  ["💎","Rhood Stones","2,222 items","0.09 RH","1.1K"],
  ["🥷","Cyber Monks","1,111 items","0.12 RH","188"]
];
const nfts=[
  ["🐻","Rhood Bear #042","0.08 RH"],["🐱","Pixel Cat #117","0.06 RH"],["📺","Forgotten TV","0.15 RH"],
  ["🥷","Hood Warrior #021","0.12 RH"],["💎","Crystal Stone","0.09 RH"],["🤖","Robot #003","0.07 RH"]
];
function card([icon,name,meta,price,likes], nft=false){
  return `<article class="card"><div class="card-img">${icon}</div><div class="card-body"><h3>${name}</h3><p>${meta||"Unique digital collectible"}</p><div class="price"><span>${price}</span><span>${nft?"♡":"♡ "+likes}</span></div></div></article>`;
}
document.getElementById("collectionGrid").innerHTML=collections.map(x=>card(x)).join("");
document.getElementById("nftGrid").innerHTML=nfts.map(x=>card(x,true)).join("");
function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:"smooth"});}
const menu=document.getElementById("menuBtn");
menu.onclick=()=>document.getElementById("nav").classList.toggle("open");
document.getElementById("walletBtn").onclick=()=>{
  const b=document.getElementById("walletBtn");
  b.textContent=b.textContent==="Connect Wallet"?"Wallet Connected":"Connect Wallet";
};
document.getElementById("themeBtn").onclick=()=>document.body.classList.toggle("theme-light");
document.addEventListener("keydown",e=>{if(e.key==="/" && document.activeElement.tagName!=="INPUT"){e.preventDefault();document.querySelector(".search input")?.focus();}});
