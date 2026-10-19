// Offline mode: internet na ho to entry phone/PC me save, internet aate hi apne aap Supabase me sync.
// index.html me supabase script ke TURANT BAAD aur main script se PEHLE load hota hai.
(()=>{
const OF=window.fetch.bind(window),LS=localStorage,Q='pq',BADK='pq_bad',
OKT=['readings','shift_close','party_txn','ledger_entries','purchases','dips'];
const J=(o,s=200)=>new Response(typeof o=='string'?o:JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json'}});
const jp=(k,d)=>{try{return JSON.parse(LS[k]||d)}catch{return JSON.parse(d)}};
const queue=()=>jp(Q,'[]'),save=q=>{LS[Q]=JSON.stringify(q);badge()};
const stored=()=>{const k=Object.keys(LS).find(k=>/^sb-.*-auth-token$/.test(k));try{return JSON.parse(LS[k])}catch{return null}};
const isNet=e=>e instanceof TypeError,tb=u=>(u.match(/\/rest\/v1\/([a-z_]+)/)||[])[1];
const NEEDNET=J({message:'Is kaam ke liye internet chahiye (offline me sirf shift/stock/book/purchase entry hoti hai)'},503);

window.fetch=async(input,init={})=>{
 const url=typeof input=='string'?input:input.url,m=(init.method||'GET').toUpperCase(),rest=url.includes('/rest/v1/'),au=url.includes('/auth/v1/');
 if(!rest&&!au)return OF(input,init);
 const off=!navigator.onLine;
 if(au){
  if(!off)try{return await OF(input,init)}catch(e){if(!isNet(e))throw e}
  const s=stored();if(!s)return J({message:'offline'},503);
  if(url.includes('/user'))return J(s.user);
  if(url.includes('/token'))return J({...s,expires_in:30,token_type:'bearer'});
  return J({message:'offline'},503)}
 const hd=Object.fromEntries(new Headers(init.headers||{})),key='gc:'+url+'|'+(hd.accept||'');
 if(m=='GET'){
  if(!off)try{const r=await OF(input,init);if(r.ok){const t=await r.clone().text();try{LS[key]=t}catch{}}return r}catch(e){if(!isNet(e))throw e}
  const c=LS[key];return c!=null?J(c):J({message:'Offline: ye data abhi cache me nahi hai'},503)}
 const T=tb(url);
 if(!off)try{return await OF(input,init)}catch(e){if(!isNet(e))throw e}
 if(m!='POST'||!OKT.includes(T)||typeof init.body!='string')return NEEDNET.clone();
 const{authorization,Authorization,...h}=hd,q=queue();q.push({t:Date.now(),url,hd:h,body:init.body,tb:T});save(q);
 const rows=[].concat(JSON.parse(init.body));
 Object.keys(LS).filter(k=>k.startsWith('gc:')&&tb(k.slice(3))==T).forEach(k=>{try{const a=JSON.parse(LS[k]);if(Array.isArray(a))LS[k]=JSON.stringify([...rows.map(r=>({...r,id:-Date.now()})),...a])}catch{}});
 return J('',201)};

async function sync(){
 if(window._sy||!navigator.onLine||!queue().length||typeof sb=='undefined')return;window._sy=1;let n=0;const bad=[];
 try{
  let tok;try{const r=await sb.auth.refreshSession();tok=r.data.session?.access_token}catch{}
  if(!tok)tok=(await sb.auth.getSession()).data.session?.access_token;
  if(!tok)return;
  for(let q=queue();q.length;q=queue()){
   const it=q[0];let r;
   try{r=await OF(it.url,{method:'POST',headers:{...it.hd,Authorization:'Bearer '+tok},body:it.body})}catch{break}
   if(r.status==401)break;
   if(!r.ok)bad.push(it.tb+': '+(await r.text()).slice(0,120)+' | '+it.body.slice(0,100));else n++;
   save(q.slice(1))}
 }finally{window._sy=0}
 if(bad.length){LS[BADK]=JSON.stringify([...jp(BADK,'[]'),...bad]);alert('Sync me '+bad.length+' entry reject hui:\n'+bad.slice(0,3).join('\n'))}
 if(n)alert(n+' offline entry sync ho gayi ✓');
 badge();if(n&&typeof S!='undefined'&&S.page=='dash')go('dash')}

function badge(){
 if(!document.body)return;let b=document.getElementById('ob');
 if(!b){b=document.createElement('div');b.id='ob';b.style.cssText='position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:99;color:#fff;border-radius:20px;padding:8px 14px;font:13px system-ui;cursor:pointer;box-shadow:0 2px 6px #0004';b.onclick=sync;document.body.appendChild(b)}
 const n=queue().length,off=!navigator.onLine;
 b.style.display=(off||n)?'block':'none';b.style.background=off?'#c0392b':'#e67e22';
 b.textContent=(off?'⚠ Offline':'● Online')+(n?' · '+n+' pending (tap = sync)':'')}

async function warm(){try{if(!navigator.onLine||typeof sb=='undefined')return;const{data:{session}}=await sb.auth.getSession();if(!session)return;
 await Promise.all([sb.from('pump_settings').select('data').eq('id',1).maybeSingle(),
  sb.from('readings').select('nozzle,closing').order('date',{ascending:false}).order('id',{ascending:false}).limit(100),
  sb.from('parties').select('id,name').order('name'),sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle()])}catch{}}

addEventListener('online',()=>{badge();setTimeout(()=>{sync();warm()},1500)});
addEventListener('offline',badge);
addEventListener('DOMContentLoaded',()=>{badge();setTimeout(()=>{sync();warm()},4000)});
setInterval(()=>{badge();sync()},30000);
})();
