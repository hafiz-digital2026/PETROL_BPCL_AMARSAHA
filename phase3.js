// Phase 3: Owner / Manager / Employee roles (UI side; asli suraksha RLS me hai)
const ACL={owner:['dash','shift','stock','books','parties','reports','recon','settings','users'],manager:['dash','shift','stock','books','parties','reports','recon'],employee:['shift']};
const og3=go;
sb.auth.onAuthStateChange(e=>{if(e=='SIGNED_OUT')S.me=null});
function applyRole(){const r=S.me.role,al=ACL[r]||[];
 document.querySelectorAll('nav button').forEach(b=>{b.style.display=al.includes(b.id.slice(2))?'':'none'});
 if(r=='owner'&&!$('#n_users'))document.querySelector('nav').insertAdjacentHTML('beforeend',`<button id=n_users onclick="go('users')">Users</button>`);
 const h=document.querySelector('header b');if(h&&!$('#rb'))h.insertAdjacentHTML('afterend',` <small id=rb>(${esc(S.me.name||S.me.email||'')} · ${esc(r||'no role')})</small>`);
 if(r=='employee')document.querySelectorAll('header button').forEach(b=>{if(/backup/.test(b.getAttribute('onclick')||''))b.style.display='none'})}
go=async p=>{
 if(!S.me){const{data:{user}}=await sb.auth.getUser();S.me=(await sb.from('profiles').select('*').eq('id',user.id).maybeSingle()).data||{}}
 const al=ACL[S.me.role]||[];applyRole();
 if(!al.length)return M('<div class=card><b class=red>Access nahi mila.</b><br>Owner se apna role set karwao.</div>');
 if(!al.includes(p))p=al[0];
 if(p=='users'){S.page=p;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.id=='n_users'));return users()}
 og3(p)};
async function users(){
 const d=await q('profiles',r=>r.order('created_at')),me=(await sb.auth.getUser()).data.user.id;
 M(`<div class="card tw"><h3>Users & roles</h3><p>Naya user: Supabase > Authentication > Users > Add user. Wo yahan <b>employee</b> ban ke dikhega, phir role set karke Save dabao.<br><small>Owner: sab kuch | Manager: Settings aur Users chhodkar sab | Employee: sirf shift entry. Apna role khud nahi badal sakte.</small></p>
 <table><tr><th>Email</th><th>Name</th><th>Role</th><th>Active</th><th></th></tr>${d.map(u=>{const s=u.id==me?'disabled':'';return`<tr><td>${esc(u.email)}</td><td><input id=un_${u.id} value="${esc(u.name)}"></td><td><select id=ur_${u.id} ${s}>${['owner','manager','employee'].map(r=>`<option ${u.role==r?'selected':''}>${r}</option>`).join('')}</select></td><td><input type=checkbox style="width:auto" id=ua_${u.id} ${u.active?'checked':''} ${s}></td><td><button class=p onclick="uSave('${u.id}')">Save</button></td></tr>`}).join('')}</table></div>`)}
async function uSave(id){const{error}=await sb.from('profiles').update({name:$('#un_'+id).value,role:$('#ur_'+id).value,active:$('#ua_'+id).checked}).eq('id',id);error?alert(error.message):alert('Saved')}

// Owner-only: Reset (Settings ke neeche "Danger zone")
const sp0=settingsPage;
settingsPage=function(){sp0();if(S.me?.role=='owner')$('#main').insertAdjacentHTML('beforeend',`<div class=card style="border:2px solid #c0392b"><h3 class=red>Danger zone: Reset</h3><p>Pehle apne aap Backup download hoga, phir RESET likhna padega. Settings, rate, nozzle aur users bache rahenge.</p><button onclick="resetAll(0)" style="background:#fdecea;color:#c0392b">Reset entries (parties ki list rahegi)</button> <button onclick="resetAll(1)" style="background:#c0392b;color:#fff">Reset ALL (parties bhi)</button></div>`)};
async function resetAll(withParties){
 if(S.me?.role!='owner')return;
 if(JSON.parse(localStorage.pq||'[]').length)return alert('Pehle pending offline entries sync hone do.');
 if(!confirm('Pehle poore data ka Backup download hoga. Aage badhein?'))return;
 await backup();
 if(prompt('Saari '+(withParties?'entries aur parties':'entries')+' hamesha ke liye delete hongi.\nConfirm karne ke liye RESET likho:')!=='RESET')return alert('Cancel ho gaya. Kuch delete nahi hua.');
 for(const t of['party_txn','readings','shift_close','dips','purchases','ledger_entries',...(withParties?['parties']:[])]){const{error}=await sb.from(t).delete().gt('id',0);if(error)return alert(t+': '+error.message)}
 localStorage.removeItem('pq');Object.keys(localStorage).filter(k=>k.startsWith('gc:')).forEach(k=>localStorage.removeItem(k));
 alert('Reset ho gaya. Software khali hai (Settings aur users bache hain).');go('dash')}
