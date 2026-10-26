# Amar Saha BPCL Petrol Pump Software (Phase 1 + 2 + 3 + Offline)

## Files (sab ek hi folder me, sab GitHub pe upload karni hain)
| File | Kaam |
|---|---|
| `index.html` | Main app: login, shift, khata, dashboard, settings (Phase 1) |
| `phase2.js` | Stock, Cash/Bank book, Reports, CA Pack, Tally XML, Bank Recon |
| `phase3.js` | Owner / Manager / Employee roles + Users tab |
| `offline.js` | Offline entry + internet aate hi auto sync |
| `sw.js`, `manifest.webmanifest` | Install (Add to Home Screen) + app shell cache |
| `schema.sql`, `schema_phase2.sql`, `schema_phase3.sql` | Database (Supabase me isi order me run karna) |
| `README.md` | Yeh guide |

## STEP 1: Supabase (database, free)
1. supabase.com > New project (Region: Mumbai ya Singapore). Database password save kar lo.
2. **SQL Editor > New query**: teen SQL isi order me, har ek alag query me paste karke **Run**: `schema.sql`, phir `schema_phase2.sql`, phir `schema_phase3.sql`.
3. **Authentication > Users > Add user**: apna email + password (Auto-confirm tick). **Pehle user apne aap Owner banta hai.** (Agar user SQL se pehle bana tha to phase3 SQL usko Owner bana deta hai.)
4. **Authentication > Sign In / Providers > Email**: "Allow new users to sign up" band karo.
5. **Project Settings > API**: `Project URL` aur `anon public` key copy karo. (service_role key kabhi mat use karna.)

## STEP 2: index.html me key daalo
`index.html` Notepad me kholo, ye line dhundo aur apni values paste karo:
`const SB_URL='PASTE_SUPABASE_URL', SB_KEY='PASTE_SUPABASE_ANON_KEY';`

## STEP 3: GitHub pe upload
1. github.com > **New repository** > naam `amar-saha-pump` > **Private** > Create.
2. **"uploading an existing file"** > in **8 files** drag-drop karo: `index.html`, `phase2.js`, `phase3.js`, `offline.js`, `sw.js`, `manifest.webmanifest`, `README.md`, aur SQL files (repo Private hai to chalega).
3. **Commit changes**. Baad me kuch badalna ho to **Add file > Upload files**, wahi naam ki file dalo. Render apne aap update kar dega.

## STEP 4: Render (link)
1. render.com > **New > Static Site** > repo `amar-saha-pump` chuno.
2. Build Command: khali. Publish Directory: `.` > **Create Static Site**.
3. Link milega: `https://amar-saha-pump.onrender.com`. Static Site so nahi jati.
4. Phone: Chrome menu > **Add to Home Screen / Install app**. PC: address bar ka **Install** icon.

## STEP 5: Pehli baar use (Owner login)
1. **Settings**: MS/HSD rate daalo (abhi 0 hai), pump naam/phone dekho > Save.
2. **Users** tab: Supabase me naya user banao (Add user), wo yahan employee ban ke dikhega; role (manager/employee) aur naam set karo.
3. **Parties**: credit party add karo.
4. **Stock**: har tank ki dip entry (2000 L se kam par laal alert).
5. **Shift**: closing reading, credit, UPI, counted cash > Save.

## Roles
| Role | Kya kar sakta hai |
|---|---|
| Owner | Sab kuch, Settings, Users |
| Manager | Shift, Stock, Books, Khata, Reports, Bank Recon |
| Employee | Sirf Shift entry (credit sale likh sakta hai, khata balance/reports nahi dekhta) |

Asli rok database (RLS) me hai. Kisi ko band karna ho to Users tab me Active ka tick hatao.

## Offline mode
- Internet jaane par neeche laal **Offline** badge. Shift, stock dip, purchase, cash/bank book ki entry phone/PC me save hoti hai; internet aate hi apne aap sync (naarangi badge = pending, dabao to turant sync).
- **Shart:** pehli baar internet me login karo, logout mat karo, aur online ek baar Shift tab kholo (rate, party list, last closing save ho jaye).
- Offline me nahi hoga: naya party/user, Settings, payment receive, bank reconcile.
- Sync se pehle browser ka data saaf mat karo. Ek shift ek hi device se bharo (warna double ho sakti hai).

## Reset (sirf Owner)
Settings ke neeche **Danger zone**: pehle Backup download hota hai, phir `RESET` likhna padta hai. Saari entries (aur chaho to parties) khali ho jati hain. Settings, rate, nozzle aur users bache rehte hain. Reset se pehle Backup (Excel+JSON) apne aap hota hai, par Excel/JSON ko app me wapas load karne ka option nahi hai (sirf dekhne/CA ke liye). Shuru me test data saaf karne ke liye use karo.

## Reports / CA Pack / Tally
- **Reports:** P&L, balance summary, Day book (CSV, Excel me khulta hai), party outstanding + WhatsApp reminder.
- **Tally XML:** Tally me pehle ledgers banao: `Cash`, `Bank`, `Fuel Sales`, `Fuel Purchase`, `BPCL`, aur Books me jo category use karo (Salary, Rent, etc.). Phir Import > Vouchers. Sales voucher poora Cash me jata hai (credit sale alag nahi). Pehle CA se test import karwa lo.
- **Bank Recon:** bank statement CSV upload > date/debit/credit column chuno > Match > Reconciled mark karo.

## Backup (zaroori)
- Supabase free me auto backup nahi. **Backup** button ek saath **Excel (.xlsx, alag sheet har cheez ki) aur JSON** download karta hai (saare tables) hafte me ek baar Google Drive me rakho. 3 din se zyada ho to peela warning aata hai.
- Supabase free project 7 din bina use ke pause hota hai. Roz shift entry hogi to koi dikkat nahi.

## Abhi nahi hai
Bill print + logo, PDF export, "kisne entry ki" ka record, poora Bangla (sirf menu/main labels), app ke andar se naya user banana.

## Note
Petrol/diesel par GST nahi lagta (VAT rate me shamil). GST sirf lubricant jaise saman par.

---
## Phase 4: HP pump ke liye (test, PhonePe/HP card, CNG, kharcha, naam)
1. Supabase SQL Editor me `schema_phase4.sql` run karo (**pehle**, phir naya `index.html` aur `phase2.js` upload).
2. **Opening reading** ab pichli closing se aati hai aur Employee/Manager badal nahi sakte (sirf Owner). Sabse pehli baar (jab pichli reading nahi) sab likh sakte hain.
3. **Test (L):** har nozzle ke saamne subah ka test tel daalo. Wo sale se kat jata hai (tank me wapas jata hai).
4. **Payment:** PhonePe, UPI/other, HP Card, Cash counted. HP Card ka paisa cash me nahi aata, isliye cash se kat jata hai. Company jab bank me bheje to **Books > Bank > In > HP card settlement** likho. **Reports** me "HP card (company se aana baki)" dikhega.
5. **Kharcha:** Shift closing me "+ Expense line" (gift, chai, repair, salary...). Cash se kat ta hai aur Books me jata hai, kisne diya wo naam ke saath.
6. **Closed by:** shift kisne close ki, uska naam Dashboard me "By" column me dikhta hai.
7. **CNG:** Settings > Nozzles me CNG nozzle jodo, jaise `{"id":"CNG1","p":"CNG","n":"CNG 1"}` aur CNG rate/kg daalo. Dashboard me kg dikhega.
