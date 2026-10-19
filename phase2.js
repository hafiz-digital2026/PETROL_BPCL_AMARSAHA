// Phase 2: Stock, Cash/Bank Books, Reports (CA Pack, Tally), Bank Reconciliation
const TK=[['T1','MS'],['T2','HSD'],['T3','MS'],['T4','HSD'],['T5','MS'],['T6','HSD']],LOW=2000,
EXP=['Salary','Expense','Electricity','Rent','Other'],
CAT=['Opening balance','Sales deposit','Party receipt','Purchase payment','Transfer','Salary','Electricity','Rent','Expense','Other'];
Object.assign(L.bn,{stock:'স্টক',books:'ক্যাশ ও ব্যাংক বুক',reports:'রিপোর্ট'});
const sm=(a,k)=>a.reduce((s,x)=>s+num(x[k]),0),M=h=>$('#main').innerHTML=h;
const q=async(tb,f)=>{if(f&&/limit\(/.test(f)){return(await f(sb.from(tb).select('*'))).data||[]}const o=[];for(let i=0;;i+=1000){let r=sb.from(tb).select('*');if(f)r=f(r);const{data}=await r.range(i,i+999);if(!data?.length)break;o.push(...data);if(data.length<1000)break}return o};
const dl=(n,txt,ty)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:ty}));a.download=n+'-'+today()+'.'+(ty=='text/csv'?'csv':'xml');a.click()};
const csv=(n,rows)=>dl(n,'\ufeff'+rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');
const ins=async(tb,o,after)=>{const{error}=await sb.from(tb).insert(o);error?alert(error.message):after()};
const pd=s=>{s=String(s||'').trim();let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);if(m)return`${m[3].length==2?'20'+m[3]:m[3]}-${m[2].padStart(2,0)}-${m[1].padStart(2,0)}`;m=s.match(/^\d{4}-\d{2}-\d{2}/);return m?m[0]:null};
const pc=l=>{const o=[];let c='',z=0;for(const h of l){if(h=='"')z=!z;else if(h==','&&!z){o.push(c);c=''}else c+=h}o.push(c);return o};
const og=go,PG={stock,books,reports,recon};
go=p=>{if(PG[p]){S.page=p;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.id=='n_'+p));PG[p]()}else og(p);
 let b=$('#bk');if(!b){document.querySelector('nav').insertAdjacentHTML('afterend','<div id=bk></div>');b=$('#bk')}
 b.innerHTML=(!localStorage.lb||Date.now()-new Date(localStorage.lb)>3*864e5)?'<div class=card style="background:#fff3cd;margin:8px">⚠ Backup lena baaki hai (3+ din). Upar Backup button dabao.</div>':''};
const ob=backup;backup=async()=>{await ob();localStorage.lb=today()};

async function stock(){
 const dp=await q('dips',r=>r.order('date',{ascending:false}).order('id',{ascending:false}).limit(100)),lt={};
 dp.forEach(d=>{if(!(d.tank in lt))lt[d.tank]=d});
 const d0=Object.values(lt).map(x=>x.date).sort()[0]||today();
 const[rd,pu]=await Promise.all([q('readings',r=>r.gte('date',d0)),q('purchases',r=>r.order('date',{ascending:false}).order('id',{ascending:false}).limit(30))]);
 const cards=['MS','HSD'].map(p=>{const tk=TK.filter(x=>x[1]==p&&lt[x[0]]),D=tk.map(x=>lt[x[0]].date).sort().pop();
  if(!D)return`<div class=card>${p}<div class=big>—</div><small>Dip entry karo</small></div>`;
  const st=sm(tk.map(x=>lt[x[0]]),'litres')+sm(pu.filter(x=>x.product==p&&x.date>D),'ltr')-sm(rd.filter(x=>x.product==p&&x.date>D),'ltr');
  return`<div class=card>${p} book stock<div class="big ${st<LOW?'red':''}">${st.toFixed(0)} L</div>${st<LOW?'<b class=red>Stock low! Tanker order karo</b><br>':''}<small>dip of ${D} + purchase - sale</small></div>`}).join('');
 M(`<div class=g>${cards}</div>
 <div class=card><h3>Tank dip</h3><div class=row><label>Date<input type=date id=dd value="${today()}"></label><label>Tank<select id=dt>${TK.map(x=>`<option value=${x[0]}>${x[0]} (${x[1]})</option>`).join('')}</select></label><label>Litres (dip chart se)<input type=number id=dl></label><label>Density<input type=number step=.0001 id=dn></label></div><button class=p onclick="ins('dips',{date:$('#dd').value,tank:$('#dt').value,product:TK.find(x=>x[0]==$('#dt').value)[1],litres:num($('#dl').value),density:num($('#dn').value)||null},stock)">Save dip</button></div>
 <div class=card><h3>BPCL tanker purchase</h3><div class=row><label>Date<input type=date id=pdt value="${today()}"></label><label>Product<select id=pp2><option>MS</option><option>HSD</option></select></label><label>Litres<input type=number id=pl2></label><label>Rate/L<input type=number step=.01 id=pr2></label><label>Invoice no.<input id=pi2></label></div><button class=p onclick="ins('purchases',{date:$('#pdt').value,product:$('#pp2').value,ltr:num($('#pl2').value),rate:num($('#pr2').value),amount:num($('#pl2').value)*num($('#pr2').value),invoice:$('#pi2').value},stock)">Save purchase</button></div>
 <div class="card tw"><b>Recent purchases</b><table><tr><th>Date</th><th>Product</th><th>Litres</th><th>Amount</th><th>Invoice</th></tr>${pu.map(x=>`<tr><td>${x.date}</td><td>${x.product}</td><td>${x.ltr}</td><td>${inr(x.amount)}</td><td>${esc(x.invoice)}</td></tr>`).join('')}</table></div>`);
}

async function books(){
 const all=await q('ledger_entries',r=>r.order('date',{ascending:false}).order('id',{ascending:false})),bal=b=>all.filter(x=>x.book==b).reduce((s,x)=>s+(x.type=='in'?1:-1)*num(x.amount),0);
 M(`<div class=g><div class=card>Cash book<div class=big>${inr(bal('cash'))}</div></div><div class=card>Bank book<div class=big>${inr(bal('bank'))}</div></div></div>
 <div class=card><h3>New entry (cash/bank/expense/salary)</h3><div class=row><label>Date<input type=date id=ld value="${today()}"></label><label>Book<select id=lb><option value=cash>Cash</option><option value=bank>Bank</option></select></label><label>In/Out<select id=lt><option value=in>In (jama)</option><option value=out>Out (kharcha)</option></select></label><label>Category<select id=lc>${CAT.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Amount<input type=number id=la></label><label>Note<input id=ln></label></div>
 <button class=p onclick="num($('#la').value)>0?ins('ledger_entries',{date:$('#ld').value,book:$('#lb').value,type:$('#lt').value,category:$('#lc').value,amount:num($('#la').value),note:$('#ln').value},books):alert('Amount?')">Save</button></div>
 <div class="card tw"><table><tr><th>Date</th><th>Book</th><th>In/Out</th><th>Category</th><th>Amount</th><th>Note</th><th>Recon</th></tr>${all.slice(0,80).map(x=>`<tr><td>${x.date}</td><td>${x.book}</td><td>${x.type}</td><td>${esc(x.category)}</td><td>${inr(x.amount)}</td><td>${esc(x.note)}</td><td>${x.recon?'✓':''}</td></tr>`).join('')}</table></div>`);
}

async function reports(){
 const f=S.rf||(S.rf=[today().slice(0,8)+'01',today()]),w=r=>r.gte('date',f[0]).lte('date',f[1]);
 const[rd,pu,le,ps,tx,all]=await Promise.all([q('readings',w),q('purchases',w),q('ledger_entries',w),q('parties'),q('party_txn'),q('ledger_entries')]);
 const sale=sm(rd,'amount'),pur=sm(pu,'amount'),ex=sm(le.filter(x=>x.type=='out'&&EXP.includes(x.category)),'amount'),
 bal=b=>all.filter(x=>x.book==b).reduce((s,x)=>s+(x.type=='in'?1:-1)*num(x.amount),0),due={};
 tx.forEach(x=>due[x.party_id]=(due[x.party_id]||0)+(x.type=='credit'?1:-1)*num(x.amount));
 const po=ps.map(p=>[p.name,p.phone||'',due[p.id]||0]);window.RP={rd,pu,le,po};
 M(`<div class=card><div class=row><label>From<input type=date id=rf value=${f[0]}></label><label>To<input type=date id=rt value=${f[1]}></label></div><button class=p onclick="S.rf=[$('#rf').value,$('#rt').value];reports()">Show</button></div>
 <div class="card tw"><h3>Profit & Loss</h3><table><tr><td>Sales</td><td>${inr(sale)}</td></tr><tr><td>Purchases</td><td>${inr(pur)}</td></tr><tr><td><b>Gross profit</b></td><td><b>${inr(sale-pur)}</b></td></tr><tr><td>Expenses (salary, rent, etc.)</td><td>${inr(ex)}</td></tr><tr><td><b>Net profit</b></td><td><b class="${sale-pur-ex<0?'red':'grn'}">${inr(sale-pur-ex)}</b></td></tr></table>
 <h3>Balances (trial summary)</h3><table><tr><td>Cash book</td><td>${inr(bal('cash'))}</td></tr><tr><td>Bank book</td><td>${inr(bal('bank'))}</td></tr><tr><td>Debtors (party due)</td><td>${inr(po.reduce((s,x)=>s+x[2],0))}</td></tr></table></div>
 <div class=card><h3>CA Pack</h3><button onclick="csv('daybook',dayBook())">Day book (Excel/CSV)</button> <button onclick="csv('party-outstanding',[['Party','Phone','Due'],...RP.po])">Party outstanding</button> <button onclick="tally()">Tally XML</button></div>
 <div class="card tw"><h3>Party outstanding</h3><table>${po.filter(x=>x[2]>0).map(x=>`<tr><td>${esc(x[0])}</td><td>${inr(x[2])}</td><td><a target=_blank href="https://wa.me/91${String(x[1]).replace(/\D/g,'').slice(-10)}?text=${encodeURIComponent('Namaskar '+x[0]+', '+S.cfg.name+' me aapka '+x[2].toFixed(0)+' taka baki hai. Kripya jama kar dein.')}">WhatsApp</a></td></tr>`).join('')}</table></div>`);
}
const dayBook=()=>{const r=[];RP.rd.forEach(x=>r.push([x.date,'Sale',x.nozzle,x.ltr,x.amount]));RP.pu.forEach(x=>r.push([x.date,'Purchase',x.product+' '+(x.invoice||''),x.ltr,x.amount]));RP.le.forEach(x=>r.push([x.date,x.book+' '+x.type,x.category+' '+(x.note||''),'',x.amount]));
 return[['Date','Type','Detail','Litres','Amount'],...r.sort((a,b)=>a[0]>b[0]?1:-1)]};
const tally=()=>{const V=(d,ty,dr,cr,a,n)=>`<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${ty}" ACTION="Create"><DATE>${d.replace(/-/g,'')}</DATE><VOUCHERTYPENAME>${ty}</VOUCHERTYPENAME><NARRATION>${esc(n||'')}</NARRATION><ALLLEDGERENTRIES.LIST><LEDGERNAME>${esc(dr)}</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${a}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>${esc(cr)}</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${a}</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>`,sd={};
 RP.rd.forEach(x=>sd[x.date]=(sd[x.date]||0)+num(x.amount));
 let v=Object.entries(sd).map(([d,a])=>V(d,'Sales','Cash','Fuel Sales',a.toFixed(2),'Daily fuel sales')).join('');
 v+=RP.pu.map(x=>V(x.date,'Purchase','Fuel Purchase','BPCL',num(x.amount).toFixed(2),x.invoice)).join('');
 v+=RP.le.map(x=>{const b=x.book=='cash'?'Cash':'Bank',a=num(x.amount).toFixed(2);return x.type=='out'?V(x.date,'Payment',x.category,b,a,x.note):V(x.date,'Receipt',b,x.category,a,x.note)}).join('');
 dl('tally-vouchers',`<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>${v}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`,'text/xml')};

function recon(){M(`<div class=card><h3>Bank Reconciliation</h3><p>Bank statement CSV upload karo (pehli row header ho).</p><input type=file id=bf accept=".csv" onchange=rLoad(this)><div id=rm></div></div><div id=rr></div>`)}
function rLoad(el){const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{S.csv=r.result.split(/\r?\n/).filter(Boolean).map(pc);const o=S.csv[0].map((x,i)=>`<option value=${i}>${esc(x)}</option>`).join('');
 $('#rm').innerHTML=`<div class=row><label>Date<select id=cd>${o}</select></label><label>Withdrawal/Debit<select id=cw>${o}</select></label><label>Deposit/Credit<select id=cp>${o}</select></label></div><button class=p onclick=rMatch()>Match</button>`};r.readAsText(f)}
async function rMatch(){
 const bk=await q('ledger_entries',r=>r.eq('book','bank')),used=new Set(),ok=[],bad=[],ci=['cd','cw','cp'].map(i=>+$('#'+i).value),n=v=>num(String(v||'').replace(/,/g,''));
 S.csv.slice(1).forEach(r=>{const d=pd(r[ci[0]]),w=n(r[ci[1]]),a=w||n(r[ci[2]]),ty=w?'out':'in';if(!d||!a)return;
  const m=bk.find(x=>!x.recon&&!used.has(x.id)&&x.type==ty&&Math.abs(num(x.amount)-a)<.01&&Math.abs(new Date(x.date)-new Date(d))<=3*864e5);
  m?(used.add(m.id),ok.push(m)):bad.push([d,ty,a])});
 S.ok=[...used];const rest=bk.filter(x=>!x.recon&&!used.has(x.id));
 $('#rr').innerHTML=`<div class="card tw"><p class=grn>Matched: ${ok.length}</p><p class=red>Statement me hai, book me nahi (${bad.length}):</p><table>${bad.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${inr(x[2])}</td></tr>`).join('')}</table><p class=red>Book me hai, statement me nahi (${rest.length}):</p><table>${rest.map(x=>`<tr><td>${x.date}</td><td>${x.type}</td><td>${inr(x.amount)}</td><td>${esc(x.category)}</td></tr>`).join('')}</table><button class=p onclick=rMark()>Matched ko reconciled mark karo</button></div>`}
async function rMark(){if(!S.ok.length)return;const{error}=await sb.from('ledger_entries').update({recon:true}).in('id',S.ok);error?alert(error.message):(alert('Done'),recon())}
