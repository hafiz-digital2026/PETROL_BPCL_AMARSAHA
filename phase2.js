// Phase 2: Stock, Cash/Bank Books, Reports (CA Pack, Tally), Bank Reconciliation
const TK0=[['T1','MS'],['T2','HSD'],['T3','MS'],['T4','HSD'],['T5','MS'],['T6','HSD']],LOW=2000,
EXP=['Tiffin','Sweeper','Electric bill','T.A.','Staff salary','Salary','Expense','Electricity','Rent','Gift','Staff welfare','Repair','Office/Misc','Other'],
CAT=['Opening balance','Sales deposit','Party receipt','Purchase payment','Transfer','HP card settlement','Tiffin','Sweeper','Electric bill','T.A.','Staff salary','Salary','Electricity','Rent','Gift','Staff welfare','Repair','Office/Misc','Expense','Other'];
Object.assign(L.bn,{stock:'স্টক',books:'ক্যাশ ও ব্যাংক বুক',reports:'রিপোর্ট'});
const sm=(a,k)=>a.reduce((s,x)=>s+num(x[k]),0),M=h=>$('#main').innerHTML=h;
const q=async(tb,f)=>{if(f&&/limit\(/.test(f)){return(await f(sb.from(tb).select('*'))).data||[]}const o=[];for(let i=0;;i+=1000){let r=sb.from(tb).select('*');if(f)r=f(r);const{data}=await r.range(i,i+999);if(!data?.length)break;o.push(...data);if(data.length<1000)break}return o};
const dl=(n,txt,ty)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:ty}));a.download=n+'-'+today()+'.'+(ty=='text/csv'?'csv':'xml');a.click()};
const csv=(n,rows)=>dl(n,'\ufeff'+rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');
const ins=async(tb,o,after)=>{if(window._i)return;if(o.litres===0||o.ltr===0||o.rate===0)return alert('Litres and rate cannot be 0');window._i=1;try{const{error}=await sb.from(tb).insert(o);error?alert(error.message):after()}finally{setTimeout(()=>window._i=0,1500)}};
const pd=s=>{s=String(s||'').trim();let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);if(m)return`${m[3].length==2?'20'+m[3]:m[3]}-${m[2].padStart(2,0)}-${m[1].padStart(2,0)}`;m=s.match(/^\d{4}-\d{2}-\d{2}/);return m?m[0]:null};
const pc=l=>{const o=[];let c='',z=0;for(const h of l){if(h=='"')z=!z;else if(h==','&&!z){o.push(c);c=''}else c+=h}o.push(c);return o};
const del=(tb,id)=>S.me?.role=='owner'&&id>0?`<td><button title="Delete" onclick="dRow('${tb}',${id})">🗑</button></td>`:'';
async function dRow(tb,id){if(!confirm('Delete this entry? It cannot be undone.'))return;const{error}=await sb.from(tb).delete().eq('id',id);error?alert(error.message):go(S.page)}
async function dShift(id){const{data:x}=await sb.from('shift_close').select('*').eq('id',id).maybeSingle();if(!x)return;
 if(!confirm('Shift '+x.date+' '+x.shift+' will be fully deleted (all nozzle readings + credit entries of that shift). Sure?'))return;
 let e=(await sb.from('readings').delete().eq('date',x.date).eq('shift',x.shift)).error;
 if(!e)e=(await sb.from('party_txn').delete().eq('date',x.date).like('note','Shift '+x.shift+'%').eq('type','credit')).error;
 if(!e)e=(await sb.from('shift_close').delete().eq('id',id)).error;
 e?alert(e.message):go(S.page)}
const og=go,PG={stock,books,reports,recon};
go=p=>{if(PG[p]){S.page=p;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.id=='n_'+p));PG[p]()}else og(p);
 let b=$('#bk');if(!b){document.querySelector('nav').insertAdjacentHTML('afterend','<div id=bk></div>');b=$('#bk')}
 b.innerHTML=(!localStorage.lb||Date.now()-new Date(localStorage.lb)>3*864e5)?'<div class=card style="background:#fff3cd;margin:8px">⚠ Backup pending (3+ days). Press the Backup button at the top.</div>':''};
async function backupXlsx(){
 if(typeof XLSX=='undefined')return alert('Excel library did not load (internet needed). JSON backup is done.');
 const ps=(await pg('parties','*')).data||[],nm={};ps.forEach(p=>nm[p.id]=p.name);
 const T=[['Nozzle Readings','readings'],['Shifts','shift_close'],['Purchases','purchases'],['Tank Dips','dips'],['Cash-Bank Book','ledger_entries'],['Party Ledger','party_txn'],['Parties','parties']],wb=XLSX.utils.book_new();
 for(const[n,t]of T){let r=(await pg(t,'*')).data||[];
  if(t=='party_txn')r=r.map(x=>({party:nm[x.party_id]||x.party_id,...x}));
  r.sort((a,b)=>String(a.date||'')<String(b.date||'')?-1:1);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(r),n)}
 XLSX.writeFile(wb,'pump-data-'+today()+'.xlsx')}
const ob=backup;backup=async()=>{await ob();await backupXlsx();localStorage.lb=today()};

// v6.3: book stock per product (latest dip + purchases after it - sales after it)
async function bookStocks(){
 const CG=S.cfg.nozzles.some(n=>n.p=='CNG'),TK=TK0.concat(CG?[['CNG','CNG']]:[]),PR=['MS','HSD'].concat(CG?['CNG']:[]);
 const dp=await q('dips',r=>r.order('date',{ascending:false}).order('id',{ascending:false}).limit(100)),lt={};
 dp.forEach(d=>{if(!(d.tank in lt))lt[d.tank]=d});
 const d0=Object.values(lt).map(x=>x.date).sort()[0]||today();
 const[rd,pu]=await Promise.all([q('readings',r=>r.gte('date',d0)),q('purchases',r=>r.gte('date',d0))]),o={};
 PR.forEach(p=>{const tk=TK.filter(x=>x[1]==p&&lt[x[0]]);if(!tk.length){o[p]=null;return}
  const E=tk.map(x=>lt[x[0]].created_at||'9').sort().pop();
  o[p]=sm(tk.map(x=>lt[x[0]]),'litres')+sm(pu.filter(x=>x.product==p&&(x.created_at||'9')>E),'ltr')-sm(rd.filter(x=>x.product==p&&(x.created_at||'9')>E),'ltr')});
 return{PR,o};
}
async function stock(){
 const CG=S.cfg.nozzles.some(n=>n.p=='CNG'),TK=TK0.concat(CG?[['CNG','CNG']]:[]),PR=['MS','HSD'].concat(CG?['CNG']:[]),U=p=>p=='CNG'?'kg':'L';
 const dp=await q('dips',r=>r.order('date',{ascending:false}).order('id',{ascending:false}).limit(100)),lt={};
 dp.forEach(d=>{if(!(d.tank in lt))lt[d.tank]=d});
 const d0=Object.values(lt).map(x=>x.date).sort()[0]||today();
 const[rd,pu]=await Promise.all([q('readings',r=>r.gte('date',d0)),q('purchases',r=>r.order('date',{ascending:false}).order('id',{ascending:false}).limit(30))]);
 const cards=PR.map(p=>{const tk=TK.filter(x=>x[1]==p&&lt[x[0]]),D=tk.map(x=>lt[x[0]].date).sort().pop();
  if(!D)return`<div class=card>${p}<div class=big>—</div><small>${p=='CNG'?'Enter opening stock (kg) in Tank dip with CNG selected':'Enter a dip'}</small></div>`;
  const E=tk.map(x=>lt[x[0]].created_at||'9').sort().pop(),st=sm(tk.map(x=>lt[x[0]]),'litres')+sm(pu.filter(x=>x.product==p&&(x.created_at||'9')>E),'ltr')-sm(rd.filter(x=>x.product==p&&(x.created_at||'9')>E),'ltr');
  return`<div class=card>${p} book stock<div class="big ${st<LOW?'red':''}">${st.toFixed(0)} ${U(p)}</div>${st<LOW?'<b class=red>Stock low! Order a tanker</b><br>':''}<small>dip of ${D} + purchase - sale</small></div>`}).join('');
 M(`<div class=g>${cards}</div>
 <div class=card><h3>Tank dip</h3><div class=row><label>Date<input type=date id=dd value="${today()}"></label><label>Tank<select id=dt>${TK.map(x=>`<option value=${x[0]} data-p=${x[1]}>${x[0]} (${x[1]})</option>`).join('')}</select></label><label>Litres (from dip chart) / CNG kg<input type=number id=dl></label><label>Density<input type=number step=.0001 id=dn></label></div><button class=p onclick="ins('dips',{date:$('#dd').value,tank:$('#dt').value,product:$('#dt').selectedOptions[0].dataset.p,litres:num($('#dl').value),density:num($('#dn').value)||null},stock)">Save dip</button></div>
 <div class=card><h3>${esc(S.cfg.company||'HPCL')} tanker purchase</h3><div class=row><label>Date<input type=date id=pdt value="${today()}"></label><label>Product<select id=pp2>${PR.map(p=>`<option>${p}</option>`).join('')}</select></label><label>Litres / kg<input type=number id=pl2></label><label>Rate<input type=number step=.01 id=pr2></label><label>Invoice no.<input id=pi2></label><label>Supplier / from<input id=ps2 placeholder="HPCL depot / party"></label></div><button class=p onclick="ins('purchases',{date:$('#pdt').value,product:$('#pp2').value,ltr:num($('#pl2').value),rate:num($('#pr2').value),amount:num($('#pl2').value)*num($('#pr2').value),invoice:[$('#pi2').value.trim(),$('#ps2').value.trim()].filter(Boolean).join(' · ')},stock)">Save purchase</button></div>
 <div class="card tw"><b>Recent purchases</b><table><tr><th>Date</th><th>Product</th><th>Litres</th><th>Amount</th><th>Invoice</th></tr>${pu.map(x=>`<tr><td>${x.date}</td><td>${x.product}</td><td>${x.ltr}</td><td>${inr(x.amount)}</td><td>${esc(x.invoice)}</td>${del('purchases',x.id)}</tr>`).join('')}</table></div>
 <div class="card tw"><b>Recent dips</b><table><tr><th>Date</th><th>Tank</th><th>Litres</th><th>Density</th></tr>${dp.slice(0,10).map(x=>`<tr><td>${x.date}</td><td>${x.tank}</td><td>${x.litres}</td><td>${x.density??''}</td>${del('dips',x.id)}</tr>`).join('')}</table></div>`);
}

// v6.2: shift cash (cash counted + shift expenses already posted as cash-out) is added to the Cash book
const shiftCash=scs=>(scs||[]).reduce((s,x)=>s+num(x.cash_counted)+num(x.expense),0);
async function books(){
 const[all,scs]=await Promise.all([q('ledger_entries',r=>r.order('date',{ascending:false}).order('id',{ascending:false})),q('shift_close')]),sc=shiftCash(scs),bal=b=>all.filter(x=>x.book==b).reduce((s,x)=>s+(x.type=='in'?1:-1)*num(x.amount),0)+(b=='cash'?sc:0);
 M(`<div class=g><div class=card>Cash book<div class=big>${inr(bal('cash'))}</div><small>incl. shift cash ${inr(sc)}</small></div><div class=card>Bank book<div class=big>${inr(bal('bank'))}</div></div></div>
 <div class=card><h3>New entry (cash/bank/expense/salary)</h3><div class=row><label>Date<input type=date id=ld value="${today()}"></label><label>Book<select id=lb><option value=cash>Cash</option><option value=bank>Bank</option></select></label><label>In/Out<select id=lt><option value=in>In (received)</option><option value=out>Out (paid)</option></select></label><label>Category<select id=lc>${CAT.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Amount<input type=number id=la></label><label>Note<input id=ln></label></div>
 <button class=p onclick="num($('#la').value)>0?ins('ledger_entries',{date:$('#ld').value,book:$('#lb').value,type:$('#lt').value,category:$('#lc').value,amount:num($('#la').value),note:$('#ln').value,by_name:S.me?.name||S.me?.email||''},books):alert('Amount?')">Save</button></div>
 <div class="card tw"><table><tr><th>Date</th><th>Book</th><th>In/Out</th><th>Category</th><th>Amount</th><th>Note</th><th>By</th><th>Recon</th></tr>${all.slice(0,80).map(x=>`<tr><td>${x.date}</td><td>${x.book}</td><td>${x.type}</td><td>${esc(x.category)}</td><td>${inr(x.amount)}</td><td>${esc(x.note)}</td><td>${esc(x.by_name)}</td><td>${x.recon?'✓':''}</td>${del('ledger_entries',x.id)}</tr>`).join('')}</table></div>`);
}

async function reports(){
 const f=S.rf||(S.rf=[today().slice(0,8)+'01',today()]),w=r=>r.gte('date',f[0]).lte('date',f[1]);
 const[rd,pu,le,ps,tx,all,scs,lt]=await Promise.all([q('readings',w),q('purchases',w),q('ledger_entries',w),q('parties'),q('party_txn'),q('ledger_entries'),q('shift_close'),q('lube_txn',w).catch(()=>[])]);
 const[puA,ltA,BS]=await Promise.all([q('purchases',r=>r.lte('date',f[1])),q('lube_txn',r=>r.lte('date',f[1])).catch(()=>[]),bookStocks()]);
 // v6.3: profit = sale - cost of what was SOLD (litres sold x average purchase rate), not sale - all purchases
 const U=p=>p=='CNG'?'kg':'L',AV={};BS.PR.forEach(p=>{const a=puA.filter(x=>x.product==p),qn=sm(a,'ltr');AV[p]=qn>0?sm(a,'amount')/qn:null});
 const PP=BS.PR.map(p=>{const r=rd.filter(x=>x.product==p),qn=sm(r,'ltr'),sa=sm(r,'amount'),c=AV[p]==null?null:qn*AV[p];return{p,qn,sa,av:AV[p],c,pr:c==null?null:sa-c}});
 const LA={};ltA.filter(x=>x.type=='purchase').forEach(x=>{const o=LA[x.item_id]||(LA[x.item_id]={q:0,a:0});o.q+=num(x.qty);o.a+=num(x.amount)});
 const lsl=lt.filter(x=>x.type=='sale'),lc=lsl.reduce((s,x)=>{const o=LA[x.item_id];return s+(o&&o.q>0?num(x.qty)*o.a/o.q:0)},0),lnc=lsl.some(x=>!(LA[x.item_id]?.q>0));
 const fc=PP.reduce((s,x)=>s+(x.c||0),0),miss=PP.filter(x=>x.qn>0&&x.c==null).map(x=>x.p).concat(lnc?['Lube']:[]),cogs=fc+lc;
 const RT=S.cfg.rates||{},RS=BS.PR.map(p=>{const st=BS.o[p],rt=num(RT[p]);return{p,st,av:AV[p],val:st!=null&&AV[p]!=null?st*AV[p]:null,rt,ep:st!=null&&AV[p]!=null&&rt?st*(rt-AV[p]):null}});
 const ls=sm(lsl,'amount'),lp=sm(lt.filter(x=>x.type=='purchase'),'amount'),sale=sm(rd,'amount')+ls,pur=sm(pu,'amount')+lp,ex=sm(le.filter(x=>x.type=='out'&&EXP.includes(x.category)),'amount'),
 bal=b=>all.filter(x=>x.book==b).reduce((s,x)=>s+(x.type=='in'?1:-1)*num(x.amount),0)+(b=='cash'?shiftCash(scs):0),due={};
 tx.forEach(x=>due[x.party_id]=(due[x.party_id]||0)+(x.type=='credit'?1:-1)*num(x.amount));
 const po=ps.map(p=>[p.name,p.phone||'',due[p.id]||0]);window.RP={rd,pu,le,po};
 // v6.5: daily register (like the shop's paper book) + expense by type
 const inR=x=>x.date>=f[0]&&x.date<=f[1],scR=scs.filter(inR),txR=tx.filter(inR),pn={};ps.forEach(p=>pn[p.id]=p.name);
 const cP=[...new Set(txR.filter(x=>x.type=='credit').map(x=>x.party_id))].sort((a,b)=>String(pn[a]).localeCompare(String(pn[b]))),exO=le.filter(x=>x.type=='out'&&EXP.includes(x.category)),eC=EXP.filter(c=>exO.some(x=>x.category==c));
 const ds=[...new Set([...scR,...txR,...exO].map(x=>x.date))].sort(),g=(a,d,k)=>a.filter(x=>x.date==d).reduce((s,x)=>s+num(x[k]),0);
 const RG=ds.map(d=>[d,g(scR,d,'total_sale'),g(scR,d,'phonepe'),g(scR,d,'upi'),g(scR,d,'hpcard'),...cP.map(p=>g(txR.filter(x=>x.type=='credit'&&x.party_id==p),d,'amount')),...eC.map(c=>g(exO.filter(x=>x.category==c),d,'amount')),g(scR,d,'cash_counted'),g(scR,d,'shortage'),g(txR.filter(x=>x.type=='payment'),d,'amount')]);
 const RH=['Date','Sale','PhonePe/UPI','Card','HP card',...cP.map(p=>'Credit: '+(pn[p]||p)),...eC,'Cash','Short(+)/Excess(-)','Due paid'],RT2=['TOTAL',...RH.slice(1).map((_,i)=>RG.reduce((s,r)=>s+num(r[i+1]),0))];
 window.RP.reg=[RH,...RG,RT2];window.RP.exT=[['Expense type','Amount','Entries'],...eC.map(c=>{const a=exO.filter(x=>x.category==c);return[c,sm(a,'amount'),a.length]})];
 const cell=v=>typeof v=='number'?(v?inr(v):'–'):esc(v),regH=`<div class="card tw"><h3>📒 Daily register (like the book)</h3><button onclick="csv('daily-register',RP.reg)">⬇ Excel (CSV)</button> <button onclick="csv('expense-by-type',RP.exT)">⬇ Expenses by type</button><table><tr>${RH.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${[...RG,RT2].map((r,i)=>`<tr${i==RG.length?' style="font-weight:700;background:#eef4ff"':''}>${r.map(v=>`<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</table>
 <h3>Expenses by type</h3><table><tr><th>Type</th><th>Amount</th><th>Entries</th></tr>${window.RP.exT.slice(1).map(r=>`<tr><td>${esc(r[0])}</td><td>${inr(r[1])}</td><td>${r[2]}</td></tr>`).join('')}<tr><td><b>Total</b></td><td><b>${inr(sm(exO,'amount'))}</b></td><td></td></tr></table></div>`;
 M(`<div class=card><div class=row><label>From<input type=date id=rf value=${f[0]}></label><label>To<input type=date id=rt value=${f[1]}></label></div><button class=p onclick="S.rf=[$('#rf').value,$('#rt').value];reports()">Show</button></div>
 <div class="card tw"><h3>Profit & Loss</h3><table><tr><td>Sales (fuel ${inr(sale-ls)} + lube ${inr(ls)})</td><td>${inr(sale)}</td></tr><tr><td>Cost of goods sold (fuel ${inr(fc)} + lube ${inr(lc)})<br><small>litres/kg sold × average purchase rate</small></td><td>${inr(cogs)}</td></tr><tr><td><b>Gross profit</b></td><td><b>${inr(sale-cogs)}</b></td></tr><tr><td>Expenses (salary, rent, etc.)</td><td>${inr(ex)}</td></tr><tr><td><b>Net profit</b></td><td><b class="${sale-cogs-ex<0?'red':'grn'}">${inr(sale-cogs-ex)}</b></td></tr><tr><td><small>Purchases this period (bought, not all sold): fuel ${inr(pur-lp)} + lube ${inr(lp)}</small></td><td><small>${inr(pur)}</small></td></tr></table>
 ${miss.length?`<p class=red>⚠ No purchase rate yet for ${miss.join(', ')}. Enter a tanker/lube purchase so its cost can be counted; until then its cost is taken as ₹0.</p>`:''}
 <h3>Product-wise profit</h3><table><tr><th>Product</th><th>Sold</th><th>Sale</th><th>Avg buy rate</th><th>Cost</th><th>Profit</th><th>Per L/kg</th></tr>${PP.map(x=>`<tr><td>${x.p}</td><td>${x.qn.toFixed(2)} ${U(x.p)}</td><td>${inr(x.sa)}</td><td>${x.av==null?'—':'₹'+x.av.toFixed(2)}</td><td>${x.c==null?'—':inr(x.c)}</td><td class="${(x.pr||0)<0?'red':'grn'}">${x.pr==null?'—':inr(x.pr)}</td><td>${x.pr==null||!x.qn?'—':'₹'+(x.pr/x.qn).toFixed(2)}</td></tr>`).join('')}<tr><td>Lube</td><td></td><td>${inr(ls)}</td><td></td><td>${inr(lc)}</td><td class="${ls-lc<0?'red':'grn'}">${inr(ls-lc)}</td><td></td></tr></table>
 <h3>Stock in hand (not yet sold)</h3><table><tr><th>Product</th><th>Book stock</th><th>Bought value</th><th>Today's rate</th><th>Profit if sold at today's rate</th></tr>${RS.map(x=>`<tr><td>${x.p}</td><td>${x.st==null?'— (enter dip)':x.st.toFixed(0)+' '+U(x.p)}</td><td>${x.val==null?'—':inr(x.val)}</td><td>${x.rt?'₹'+x.rt:'—'}</td><td class="${(x.ep||0)<0?'red':'grn'}">${x.ep==null?'—':inr(x.ep)}</td></tr>`).join('')}</table>
 <h3>Balances (trial summary)</h3><table><tr><td>Cash book</td><td>${inr(bal('cash'))}</td></tr><tr><td>Bank book</td><td>${inr(bal('bank'))}</td></tr><tr><td>HP card (due from company)</td><td>${inr(sm(scs,'hpcard')-all.filter(x=>x.category=='HP card settlement'&&x.type=='in').reduce((a,x)=>a+num(x.amount),0))}</td></tr><tr><td>Debtors (party due)</td><td>${inr(po.reduce((s,x)=>s+x[2],0))}</td></tr></table></div>
 ${regH}
 <div class=card><h3>CA Pack</h3><button onclick="csv('daybook',dayBook())">Day book (Excel/CSV)</button> <button onclick="csv('party-outstanding',[['Party','Phone','Due'],...RP.po])">Party outstanding</button> <button onclick="tally()">Tally XML</button></div>
 <div class="card tw"><h3>Party outstanding</h3><table>${po.filter(x=>x[2]>0).map(x=>`<tr><td>${esc(x[0])}</td><td>${inr(x[2])}</td><td><a target=_blank href="https://wa.me/91${String(x[1]).replace(/\D/g,'').slice(-10)}?text=${encodeURIComponent('Namaskar '+x[0]+', '+S.cfg.name+' me aapka '+x[2].toFixed(0)+' taka baki hai. Kripya jama kar dein.')}">WhatsApp</a></td></tr>`).join('')}</table></div>`);
}
const dayBook=()=>{const r=[];RP.rd.forEach(x=>r.push([x.date,'Sale',x.nozzle,x.ltr,x.amount]));RP.pu.forEach(x=>r.push([x.date,'Purchase',x.product+' '+(x.invoice||''),x.ltr,x.amount]));RP.le.forEach(x=>r.push([x.date,x.book+' '+x.type,x.category+' '+(x.note||''),'',x.amount]));
 return[['Date','Type','Detail','Litres','Amount'],...r.sort((a,b)=>a[0]>b[0]?1:-1)]};
const tally=()=>{const V=(d,ty,dr,cr,a,n)=>`<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${ty}" ACTION="Create"><DATE>${d.replace(/-/g,'')}</DATE><VOUCHERTYPENAME>${ty}</VOUCHERTYPENAME><NARRATION>${esc(n||'')}</NARRATION><ALLLEDGERENTRIES.LIST><LEDGERNAME>${esc(dr)}</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${a}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>${esc(cr)}</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${a}</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>`,sd={};
 RP.rd.forEach(x=>sd[x.date]=(sd[x.date]||0)+num(x.amount));
 let v=Object.entries(sd).map(([d,a])=>V(d,'Sales','Cash','Fuel Sales',a.toFixed(2),'Daily fuel sales')).join('');
 v+=RP.pu.map(x=>V(x.date,'Purchase','Fuel Purchase',S.cfg.company||'HPCL',num(x.amount).toFixed(2),x.invoice)).join('');
 v+=RP.le.map(x=>{const b=x.book=='cash'?'Cash':'Bank',a=num(x.amount).toFixed(2);return x.type=='out'?V(x.date,'Payment',x.category,b,a,x.note):V(x.date,'Receipt',b,x.category,a,x.note)}).join('');
 dl('tally-vouchers',`<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>${v}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`,'text/xml')};

function recon(){M(`<div class=card><h3>Bank Reconciliation</h3><p>Upload bank statement CSV (first row must be headers).</p><input type=file id=bf accept=".csv" onchange=rLoad(this)><div id=rm></div></div><div id=rr></div>`)}
function rLoad(el){const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{S.csv=r.result.split(/\r?\n/).filter(Boolean).map(pc);const o=S.csv[0].map((x,i)=>`<option value=${i}>${esc(x)}</option>`).join('');
 $('#rm').innerHTML=`<div class=row><label>Date<select id=cd>${o}</select></label><label>Withdrawal/Debit<select id=cw>${o}</select></label><label>Deposit/Credit<select id=cp>${o}</select></label></div><button class=p onclick=rMatch()>Match</button>`};r.readAsText(f)}
async function rMatch(){
 const bk=await q('ledger_entries',r=>r.eq('book','bank')),used=new Set(),ok=[],bad=[],ci=['cd','cw','cp'].map(i=>+$('#'+i).value),n=v=>num(String(v||'').replace(/,/g,''));
 S.csv.slice(1).forEach(r=>{const d=pd(r[ci[0]]),w=n(r[ci[1]]),a=w||n(r[ci[2]]),ty=w?'out':'in';if(!d||!a)return;
  const m=bk.find(x=>!x.recon&&!used.has(x.id)&&x.type==ty&&Math.abs(num(x.amount)-a)<.01&&Math.abs(new Date(x.date)-new Date(d))<=3*864e5);
  m?(used.add(m.id),ok.push(m)):bad.push([d,ty,a])});
 S.ok=[...used];const rest=bk.filter(x=>!x.recon&&!used.has(x.id));
 $('#rr').innerHTML=`<div class="card tw"><p class=grn>Matched: ${ok.length}</p><p class=red>In statement, not in book (${bad.length}):</p><table>${bad.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${inr(x[2])}</td></tr>`).join('')}</table><p class=red>In book, not in statement (${rest.length}):</p><table>${rest.map(x=>`<tr><td>${x.date}</td><td>${x.type}</td><td>${inr(x.amount)}</td><td>${esc(x.category)}</td></tr>`).join('')}</table><button class=p onclick=rMark()>Mark matched as reconciled</button></div>`}
async function rMark(){if(!S.ok.length)return;const{error}=await sb.from('ledger_entries').update({recon:true}).in('id',S.ok);error?alert(error.message):(alert('Done'),recon())}
