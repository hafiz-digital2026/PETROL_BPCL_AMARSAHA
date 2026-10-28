// Phase 5: Lubricant stock/bikri, Staff haazri + salary/advance, DSR WhatsApp report
Object.assign(PG,{lube,staff});
const WA=(txt,ph)=>{const n=String(ph||S.cfg.owner_wa||'').replace(/\D/g,'').slice(-10);window.open('https://wa.me/'+(n?'91'+n:'')+'?text='+encodeURIComponent(txt),'_blank')};
const f2=n=>(+n||0).toFixed(2),r0=n=>Math.round(+n||0).toLocaleString('en-IN');

// ---------- Shift ke andar lube line ----------
function addLu(){
 if(!S.lubes?.length)return alert('Owner/Manager must first add items in the Lubricant tab.');
 $('#lu').insertAdjacentHTML('beforeend',`<div class="row lul"><label>Item<select class=lp onchange=calc()>${S.lubes.map(x=>`<option value=${x.id}>${esc(x.name)} (₹${x.price}/${esc(x.unit||'pc')})</option>`).join('')}</select></label><label>Qty<input type=number step=.01 class=lq oninput=calc()></label></div>`)}

// ---------- DSR ----------
function dsrLines(title,scs,rds){
 const by={};rds.forEach(r=>{const k=r.product;by[k]=by[k]||{l:0,t:0,a:0};by[k].l+=num(r.ltr);by[k].t+=num(r.test_ltr);by[k].a+=num(r.amount)});
 const s=k=>scs.reduce((a,x)=>a+num(x[k]),0),u=p=>p=='CNG'?'kg':'L';
 return [`*${S.cfg.name}*`,title,'',
  ...Object.entries(by).map(([p,v])=>`${p}: ${f2(v.l)} ${u(p)} = ₹${r0(v.a)}${v.t?` (test ${f2(v.t)} ${u(p)})`:''}`),
  s('lube')?`Lubricant: ₹${r0(s('lube'))}`:'',
  `*Total sale: ₹${r0(s('total_sale'))}*`,'',
  `Credit: ₹${r0(s('credit'))}`,`PhonePe/UPI: ₹${r0(s('phonepe'))}`,`Debit/Credit card: ₹${r0(s('upi'))}`,`HP Card: ₹${r0(s('hpcard'))}`,`Expenses: ₹${r0(s('expense'))}`,
  `Expected cash: ₹${r0(s('expected_cash'))}`,`Cash counted: ₹${r0(s('cash_counted'))}`,
  `${s('shortage')>0?'⚠ Shortage':'Short/excess'}: ₹${r0(s('shortage'))}`].filter(x=>x!=='').join('\n')}
function showDSR(sc,rows){
 const txt=dsrLines(`Shift: ${sc.date} ${sc.shift}\nClosed by: ${sc.closed_by}`,[sc],rows);S.dsr=txt;
 M(`<div class=card><h3>✅ Shift saved</h3><pre style="white-space:pre-wrap;background:#f4f7fd;padding:12px;border-radius:10px">${esc(txt)}</pre>
 <button class=wa onclick="WA(S.dsr)">📲 WhatsApp to Owner</button> <button onclick="go(S.me?.role=='employee'?'shift':'dash')">OK</button>
 ${S.cfg.owner_wa?'':'<p class=note>Add the Owner WhatsApp number in Settings so this button sends straight to the owner.</p>'}</div>`)}
async function dayDSR(){
 const d=today(),[sc,rd]=await Promise.all([q('shift_close',r=>r.eq('date',d)),q('readings',r=>r.eq('date',d))]);
 if(!sc.length)return alert('No shift has been closed today yet.');
 WA(dsrLines(`Daily Sales Report (DSR): ${d}\nShifts: ${sc.map(x=>x.shift.split(' ')[0]+' - '+(x.closed_by||'')).join(', ')}`,sc,rd))}

// ---------- Lubricant ----------
async function lube(){
 const[it,tx]=await Promise.all([q('lube_items',r=>r.order('name')),q('lube_txn',r=>r.order('date',{ascending:false}).order('id',{ascending:false}))]);
 const st={},ms=today().slice(0,8)+'01',sold={};
 tx.forEach(x=>{st[x.item_id]=(st[x.item_id]||0)+(x.type=='sale'?-1:1)*num(x.qty);if(x.type=='sale'&&x.date>=ms)sold[x.item_id]=(sold[x.item_id]||0)+num(x.amount)});
 const nm={};it.forEach(x=>nm[x.id]=x.name);const own=S.me?.role=='owner';
 M(`<div class=g><div class=card><span class=ic>🧴</span>Items<div class=big>${it.length}</div></div><div class=card><span class=ic>💰</span>Sales this month<div class=big>${inr(Object.values(sold).reduce((a,b)=>a+b,0))}</div></div><div class=card><span class=ic>⚠️</span>Low stock<div class=big>${it.filter(x=>x.active&&(st[x.id]||0)<=num(x.low_qty)).length}</div></div></div>
 <div class="card tw"><h3>Stock</h3><table><tr><th>Item</th><th>Rate</th><th>GST%</th><th>Stock</th><th>This month</th><th>Active</th></tr>${it.map(x=>`<tr><td>${esc(x.name)}</td><td>${inr(x.price)}/${esc(x.unit)}</td><td>${x.gst}</td><td class="${(st[x.id]||0)<=num(x.low_qty)?'red':''}"><b>${f2(st[x.id]||0)}</b> ${esc(x.unit)}</td><td>${inr(sold[x.id]||0)}</td><td>${x.active?'✓':'—'}</td>${own?`<td><button onclick="luEdit(${x.id})">✏️</button></td>`:''}</tr>`).join('')||'<tr><td>No items. Add below.</td></tr>'}</table></div>
 <div class=card><h3>${S.lue?'Edit item':'New item'}</h3><div class=row><label>Name (e.g. HP Racer 4T 1L)<input id=ln1></label><label>Unit<input id=lu1 value=pc></label><label>Selling rate ₹<input type=number step=.01 id=lr1></label><label>GST %<input type=number id=lg1 value=18></label><label>Low stock alert<input type=number id=ll1 value=5></label></div><button class=p onclick=luSave()>Save item</button></div>
 <div class=card><h3>Stock in (purchase) / sale / adjustment</h3><div class=row><label>Date<input type=date id=ld1 value="${today()}"></label><label>Item<select id=li1>${it.filter(x=>x.active).map(x=>`<option value=${x.id}>${esc(x.name)}</option>`).join('')}</select></label><label>Type<select id=lt1><option value=purchase>Purchase (in)</option><option value=sale>Sale (out)</option><option value=adjust>Adjust (+/-)</option></select></label><label>Qty<input type=number step=.01 id=lq1></label><label>Rate ₹ (cost rate for purchase)<input type=number step=.01 id=lr2></label></div><button class=p onclick=luTx()>Save</button></div>
 <div class="card tw"><b>Recent</b><table><tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Amount</th><th>By</th></tr>${tx.slice(0,40).map(x=>`<tr><td>${x.date}</td><td>${esc(nm[x.item_id])}</td><td>${x.type}</td><td>${x.qty}</td><td>${inr(x.amount)}</td><td>${esc(x.by_name)}</td>${del('lube_txn',x.id)}</tr>`).join('')}</table></div>`);
 if(S.lue){const x=it.find(i=>i.id==S.lue);if(x){$('#ln1').value=x.name;$('#lu1').value=x.unit;$('#lr1').value=x.price;$('#lg1').value=x.gst;$('#ll1').value=x.low_qty}}}
function luEdit(id){S.lue=id;lube()}
async function luSave(){
 const o={name:$('#ln1').value.trim(),unit:$('#lu1').value.trim()||'pc',price:num($('#lr1').value),gst:num($('#lg1').value),low_qty:num($('#ll1').value)};
 if(!o.name||o.price<=0)return alert('Enter name and rate');
 const{error}=S.lue?await sb.from('lube_items').update(o).eq('id',S.lue):await sb.from('lube_items').insert(o);
 error?alert(error.message):(S.lue=null,lube())}
async function luTx(){
 const ty=$('#lt1').value,qq=num($('#lq1').value),id=+$('#li1').value;if(!id||!qq)return alert('Enter item and qty');
 if(ty!='adjust'&&qq<0)return alert('Qty cannot be negative');
 const{data:it}=await sb.from('lube_items').select('price').eq('id',id).maybeSingle(),rt=ty=='sale'?num(it?.price):num($('#lr2').value);
 const{error}=await sb.from('lube_txn').insert({item_id:id,date:$('#ld1').value,type:ty,qty:qq,rate:rt,amount:qq*rt,by_name:S.me?.name||S.me?.email||''});error?alert(error.message):lube()}

// ---------- Staff: haazri, salary, advance ----------
async function staff(){
 const mo=S.smo||(S.smo=today().slice(0,7)),d1=mo+'-01',dn=new Date(+mo.slice(0,4),+mo.slice(5),0).getDate(),d2=mo+'-'+String(dn).padStart(2,'0');
 const[st,at,pay,td]=await Promise.all([q('staff',r=>r.order('name')),q('attendance',r=>r.gte('date',d1).lte('date',d2)),q('staff_pay',r=>r.gte('date',d1).lte('date',d2).order('date',{ascending:false})),q('attendance',r=>r.eq('date',S.sd||today()))]);
 const cnt={},pd={},adv={},tm={};at.forEach(x=>{cnt[x.staff_id]=cnt[x.staff_id]||{P:0,H:0,A:0,L:0};cnt[x.staff_id][x.status]++});
 pay.forEach(x=>{(x.type=='advance'?adv:pd)[x.staff_id]=((x.type=='advance'?adv:pd)[x.staff_id]||0)+num(x.amount)});td.forEach(x=>tm[x.staff_id]=x.status);
 const act=st.filter(x=>x.active),earn=x=>{const c=cnt[x.id]||{P:0,H:0,L:0};return num(x.salary)/dn*(c.P+c.L+c.H/2)},nm={};st.forEach(x=>nm[x.id]=x.name);
 M(`<div class=g><div class=card><span class=ic>👷</span>Staff<div class=big>${act.length}</div></div><div class=card><span class=ic>✅</span>Present today<div class=big>${td.filter(x=>x.status=='P').length}</div></div><div class=card><span class=ic>💸</span>${mo} advance<div class=big>${inr(Object.values(adv).reduce((a,b)=>a+b,0))}</div></div><div class=card><span class=ic>🧾</span>${mo} salary paid<div class=big>${inr(Object.values(pd).reduce((a,b)=>a+b,0))}</div></div></div>
 <div class="card tw"><h3>Attendance</h3><div class=row><label>Date<input type=date id=sdt value="${S.sd||today()}" onchange="S.sd=this.value;staff()"></label></div>
 <table><tr><th>Name</th><th>Job</th><th>P</th><th>½ Half</th><th>A</th><th>Leave</th></tr>${act.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.job)}</td>${['P','H','A','L'].map(k=>`<td><input type=radio style="width:auto" name=at_${x.id} value=${k} ${tm[x.id]==k?'checked':''}></td>`).join('')}</tr>`).join('')||'<tr><td>Add staff below</td></tr>'}</table><br><button class=p onclick=atSave()>Save attendance</button></div>
 <div class="card tw"><h3>Month: <input type=month id=smo value=${mo} style="width:auto" onchange="S.smo=this.value;staff()"></h3>
 <table><tr><th>Name</th><th>Monthly salary</th><th>P</th><th>½</th><th>A</th><th>L</th><th>Earned</th><th>Advance</th><th>Paid</th><th>Balance</th><th></th></tr>${act.map(x=>{const c=cnt[x.id]||{P:0,H:0,A:0,L:0},b=earn(x)-(adv[x.id]||0)-(pd[x.id]||0);return`<tr><td>${esc(x.name)}</td><td>${inr(x.salary)}</td><td>${c.P}</td><td>${c.H}</td><td>${c.A}</td><td>${c.L}</td><td>${inr(earn(x).toFixed(0))}</td><td>${inr(adv[x.id]||0)}</td><td>${inr(pd[x.id]||0)}</td><td class="${b<0?'red':'grn'}"><b>${inr(b.toFixed(0))}</b></td><td>${x.phone?`<button class=wa onclick="WA(slip(${x.id}),'${esc(x.phone)}')">📲</button>`:''}</td></tr>`}).join('')}</table>
 <small>Earned = monthly salary ÷ ${dn} days × (P + Leave + ½×Half). Balance = Earned − advance − paid.</small></div>
 <div class=card><h3>Advance / salary payment</h3><div class=row><label>Date<input type=date id=pd3 value="${today()}"></label><label>Staff<select id=ps3>${act.map(x=>`<option value=${x.id}>${esc(x.name)}</option>`).join('')}</select></label><label>Type<select id=pt3><option value=advance>Advance</option><option value=salary>Salary</option><option value=bonus>Bonus/gift</option></select></label><label>Amount<input type=number id=pa3></label><label>Paid from<select id=pb3><option value=cash>Cash</option><option value=bank>Bank</option></select></label><label>Note<input id=pn3></label></div><button class=p onclick=payStaff()>Save</button></div>
 <div class="card tw"><b>${mo} payments</b><table><tr><th>Date</th><th>Staff</th><th>Type</th><th>Amount</th><th>By</th></tr>${pay.map(x=>`<tr><td>${x.date}</td><td>${esc(nm[x.staff_id])}</td><td>${x.type}</td><td>${inr(x.amount)}</td><td>${esc(x.by_name)}</td>${del('staff_pay',x.id)}</tr>`).join('')}</table></div>
 <div class="card tw"><h3>Staff list</h3><div class=row><label>Name<input id=sn4></label><label>Phone<input id=sp4></label><label>Job (DSM, manager, guard)<input id=sj4></label><label>Monthly salary ₹<input type=number id=ss4></label></div><button class=p onclick=stAdd()>+ Add staff</button>
 <table><tr><th>Name</th><th>Phone</th><th>Job</th><th>Salary</th><th>Active</th></tr>${st.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(x.job)}</td><td>${inr(x.salary)}</td><td><input type=checkbox style="width:auto" ${x.active?'checked':''} onchange="stAct(${x.id},this.checked)"></td></tr>`).join('')}</table></div>`);
 window.SL={st,cnt,adv,pd,mo,dn,earn}}
function slip(id){const{st,cnt,adv,pd,mo,earn}=SL,x=st.find(s=>s.id==id),c=cnt[id]||{P:0,H:0,A:0,L:0};
 return`*${S.cfg.name}*\nSalary statement ${mo}: ${x.name}\nPresent ${c.P}, Half ${c.H}, Leave ${c.L}, Absent ${c.A}\nEarned: ₹${r0(earn(x))}\nAdvance: ₹${r0(adv[id])}\nPaid: ₹${r0(pd[id])}\n*Balance: ₹${r0(earn(x)-(adv[id]||0)-(pd[id]||0))}*`}
async function atSave(){
 const d=$('#sdt').value,who=S.me?.name||S.me?.email||'',rows=[...document.querySelectorAll('input[type=radio]:checked')].map(r=>({staff_id:+r.name.slice(3),date:d,status:r.value,marked_by:who}));
 if(!rows.length)return alert('No attendance selected');
 const{error}=await sb.from('attendance').upsert(rows,{onConflict:'staff_id,date'});error?alert(error.message):(alert('Attendance saved ✓'),staff())}
async function payStaff(){
 const a=num($('#pa3').value),id=+$('#ps3').value,ty=$('#pt3').value,d=$('#pd3').value,b=$('#pb3').value,who=S.me?.name||S.me?.email||'';if(!id||a<=0)return alert('Enter staff and amount');
 const nm=SL.st.find(x=>x.id==id)?.name||'';
 let{error}=await sb.from('staff_pay').insert({staff_id:id,date:d,type:ty,amount:a,note:$('#pn3').value,by_name:who});
 if(!error)error=(await sb.from('ledger_entries').insert({date:d,book:b,type:'out',category:ty=='bonus'?'Gift':'Salary',amount:a,note:(ty=='advance'?'Advance: ':ty=='bonus'?'Bonus: ':'Salary: ')+nm+($('#pn3').value?' - '+$('#pn3').value:''),by_name:who})).error;
 error?alert(error.message):staff()}
async function stAdd(){const o={name:$('#sn4').value.trim(),phone:$('#sp4').value.trim(),job:$('#sj4').value.trim(),salary:num($('#ss4').value)};if(!o.name)return alert('Name?');
 const{error}=await sb.from('staff').insert(o);error?alert(error.message):staff()}
async function stAct(id,v){const{error}=await sb.from('staff').update({active:v}).eq('id',id);error?alert(error.message):staff()}
