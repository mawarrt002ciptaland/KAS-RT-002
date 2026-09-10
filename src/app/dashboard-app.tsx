"use client";

import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, Building2, CalendarDays, Check, Copy,
  ChevronDown, CircleDollarSign, ClipboardList, CreditCard, Download, FileBarChart,
  HandCoins, Home, LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, ReceiptText,
  Search, Settings, ShieldCheck, ShoppingBag, TrendingDown, TrendingUp, Upload, UserPlus, Users, WalletCards, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { MarketplaceView, ReceiptView, SettingsView } from "./community-features";
import { useRouter } from "next/navigation";
import { PaymentReview } from "./account-management";
import { roleLabel, type SessionUser } from "@/lib/auth-types";

async function sendForm(path:string, form:FormData) {
  const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(Object.fromEntries(form))});
  const result=await response.json().catch(()=>({error:"Respons tidak dapat dibaca."}));
  if(!response.ok)throw new Error(result.error||"Data tidak dapat disimpan.");
}
const createResident=(form:FormData)=>sendForm("/api/admin/residents",form);
const createTransaction=(form:FormData)=>sendForm("/api/admin/transactions",form);

type Resident = { id:number; nik:string; name:string; address:string; phone:string; familyMembers:number; status:"aktif"|"nonaktif"; joinedAt:string; createdAt:string };
type Transaction = { id:number; type:"masuk"|"keluar"; category:string; description:string; amount:number; transactionDate:string; createdAt:string };
type Bill = { id:number; residentId:number; residentName:string; residentAddress:string; feeName:string; period:string; amount:number; status:"lunas"|"belum_lunas"; dueDate:string; paidAt:string|null };
type Fee = { id:number; name:string; amount:number; description:string; active:boolean };
type Props = { residents:Resident[]; transactions:Transaction[]; bills:Bill[]; fees:Fee[]; sessionUser:SessionUser };
type View = "dashboard"|"pemasukan"|"pengeluaran"|"tagihan"|"warga"|"laporan"|"kwitansi"|"marketplace"|"settings";
type Modal = "transaction"|"resident"|null;

const money = (value:number) => new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(value);
const shortMoney = (value:number) => value >= 1_000_000 ? `Rp ${(value/1_000_000).toFixed(value%1_000_000 ? 1:0)} jt` : `Rp ${(value/1000).toFixed(0)} rb`;
const niceDate = (value:string) => new Intl.DateTimeFormat("id-ID", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(`${value}T00:00:00`));
const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const fullMonthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function exportCsv(filename:string, headers:string[], rows:(string|number|null|undefined)[][]) {
  const safe=(value:string|number|null|undefined)=>{
    let text=String(value??"");
    if (/^[=+\-@]/.test(text)) text=`'${text}`;
    return `"${text.replace(/"/g,'""')}"`;
  };
  const content="\uFEFF"+[headers,...rows].map(row=>row.map(safe).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8;"}));
  const link=document.createElement("a"); link.href=url; link.download=`${filename}-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

const nav = [
  { id:"dashboard" as View, label:"Ringkasan", icon:LayoutDashboard },
  { id:"pemasukan" as View, label:"Pemasukan", icon:ArrowDownLeft },
  { id:"pengeluaran" as View, label:"Pengeluaran", icon:ArrowUpRight },
  { id:"tagihan" as View, label:"Tagihan Warga", icon:ReceiptText },
  { id:"warga" as View, label:"Data Warga", icon:Users },
  { id:"kwitansi" as View, label:"Kwitansi", icon:ReceiptText },
  { id:"laporan" as View, label:"Laporan", icon:FileBarChart },
  { id:"marketplace" as View, label:"Marketplace", icon:ShoppingBag },
  { id:"settings" as View, label:"Pengaturan", icon:Settings },
];

function Empty({ text }:{text:string}) { return <div className="empty"><ClipboardList size={32}/><p>{text}</p></div> }

export default function DashboardApp({ residents, transactions, bills: initialBills, fees, sessionUser }:Props) {
  const router=useRouter();
  const isAdmin=sessionUser.role==="admin";
  const initials=sessionUser.name.split(" ").map(part=>part[0]).slice(0,2).join("");
  const permittedNav=nav.filter(item=>isAdmin||["tagihan","kwitansi","marketplace"].includes(item.id));
  const [view,setView] = useState<View>(isAdmin?"dashboard":"tagihan");
  const [actionError,setActionError]=useState("");
  const [pending,setPending]=useState(false);
  const [notice,setNotice]=useState("");
  const [modal,setModal] = useState<Modal>(null);
  const [bills,setBills] = useState(initialBills);
  const [paymentBill,setPaymentBill] = useState<Bill|null>(null);
  const [brandLogo,setBrandLogo] = useState("");
  const [brandIdentity,setBrandIdentity] = useState({ name:"KAS RT 002", subtitle:"BLOK MAWAR · CIPTALAND" });
  const [paymentInfo,setPaymentInfo] = useState({ account:"Rekening belum diatur oleh pengurus.", qris:"" });
  const [mobileNav,setMobileNav] = useState(false);
  const [query,setQuery] = useState("");
  const [txMonth,setTxMonth] = useState("semua");
  const [txYear,setTxYear] = useState("semua");
  const [billFilter,setBillFilter] = useState<"semua"|"lunas"|"belum_lunas">("semua");
  useEffect(()=>{setBills(initialBills)},[initialBills]);
  useEffect(()=>{
    const load=()=>{try{
      const settings=JSON.parse(localStorage.getItem("kasrt-settings")||"{}");
      setBrandLogo(localStorage.getItem("kasrt-logo")||"");
      setBrandIdentity({name:settings.shortName||settings.name||"KAS RT 002",subtitle:settings.subtitle||"BLOK MAWAR · CIPTALAND"});
      setPaymentInfo({account:settings.account||"Rekening belum diatur oleh pengurus.",qris:localStorage.getItem("kasrt-qris")||""});
    }catch{}};
    load(); window.addEventListener("kasrt-settings-updated",load);
    return()=>{window.removeEventListener("kasrt-settings-updated",load)};
  },[]);

  async function confirmPayment(bill:Bill, form:HTMLFormElement){
    setPending(true);setActionError("");
    try{
      const payload=new FormData(form);payload.set("billId",String(bill.id));
      const response=await fetch("/api/payments",{method:"POST",body:payload,credentials:"same-origin"});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Bukti tidak dapat dikirim.");
      setPaymentBill(null);setNotice("Bukti diterima. Status tagihan tetap belum lunas sampai diverifikasi pengurus.");router.refresh();
    }catch(error){setActionError(error instanceof Error?error.message:"Gagal mengirim bukti.")}finally{setPending(false)}
  }

  const income = transactions.filter(t=>t.type==="masuk").reduce((n,t)=>n+t.amount,0);
  const expense = transactions.filter(t=>t.type==="keluar").reduce((n,t)=>n+t.amount,0);
  const balance = income-expense;
  const unpaid = bills.filter(b=>b.status==="belum_lunas");
  const collected = bills.filter(b=>b.status==="lunas").reduce((n,b)=>n+b.amount,0);
  const target = bills.reduce((n,b)=>n+b.amount,0);
  const completion = target ? Math.round(collected/target*100) : 0;

  const chartData = useMemo(()=>monthNames.map((month,i)=>{
    const list=transactions.filter(t=>new Date(`${t.transactionDate}T00:00:00`).getMonth()===i);
    return { month, Pemasukan:list.filter(t=>t.type==="masuk").reduce((n,t)=>n+t.amount,0), Pengeluaran:list.filter(t=>t.type==="keluar").reduce((n,t)=>n+t.amount,0) };
  }),[transactions]);
  const categoryData = useMemo(()=>{
    const sums = new Map<string,number>(); transactions.filter(t=>t.type==="keluar").forEach(t=>sums.set(t.category,(sums.get(t.category)||0)+t.amount));
    return Array.from(sums,([name,value])=>({name,value}));
  },[transactions]);
  const transactionYears=Array.from(new Set(transactions.map(t=>String(new Date(`${t.transactionDate}T00:00:00`).getFullYear())))).sort((a,b)=>b.localeCompare(a));
  const activeTxType=view==="pengeluaran"?"keluar":"masuk";
  const filteredTx=transactions.filter(t=>{
    const date=new Date(`${t.transactionDate}T00:00:00`);
    return t.type===activeTxType&&(txMonth==="semua"||date.getMonth()===Number(txMonth))&&(txYear==="semua"||String(date.getFullYear())===txYear)&&`${t.description} ${t.category}`.toLowerCase().includes(query.toLowerCase());
  });
  const filteredBills=bills.filter(b=>(billFilter==="semua"||b.status===billFilter)&&`${b.residentName} ${b.residentAddress}`.toLowerCase().includes(query.toLowerCase()));
  const filteredResidents=residents.filter(r=>`${r.name} ${r.address} ${r.phone}`.toLowerCase().includes(query.toLowerCase()));
  const viewName=nav.find(n=>n.id===view)?.label;

  async function submitAction(action:(fd:FormData)=>Promise<void>, fd:FormData) {
    setPending(true);setActionError("");
    try{await action(fd);setModal(null);setNotice("Data berhasil disimpan ke database.");router.refresh()}catch(error){setActionError(error instanceof Error?error.message:"Penyimpanan gagal.")}finally{setPending(false)}
  }
  function go(next:View){if(!permittedNav.some(item=>item.id===next))return;setView(next);setQuery("");setMobileNav(false);setActionError("")}
  async function logout(){
    setPending(true);setActionError("");
    try{const response=await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin"});if(!response.ok)throw new Error("Logout belum berhasil. Coba lagi.");window.location.replace("/login")}catch(error){setActionError(error instanceof Error?error.message:"Koneksi bermasalah.");setPending(false)}
  }
  function exportResidents(){exportCsv("data-warga-blok-mawar",["No","NIK","Nama Warga","Alamat","No. Telepon","Jumlah Jiwa","Status","Tanggal Bergabung"],filteredResidents.map((r,i)=>[i+1,r.nik,r.name,r.address,r.phone,r.familyMembers,r.status,r.joinedAt]))}
  function exportTransactions(){const label=activeTxType==="masuk"?"pemasukan":"pengeluaran";exportCsv(`${label}-kas-${txYear}-${txMonth}`,["No","ID Transaksi","Tanggal","Kategori","Keterangan","Nominal (Rp)","Jenis"],filteredTx.map((t,i)=>[i+1,`TRX-${String(t.id).padStart(5,"0")}`,t.transactionDate,t.category,t.description,t.amount,label]))}
  function exportReport(){const summaryRows:(string|number)[][]=[["RINGKASAN","Total Pemasukan",income],["RINGKASAN","Total Pengeluaran",expense],["RINGKASAN","Saldo Bersih",balance],["RINGKASAN","Tagihan Terkumpul",collected],["RINGKASAN","Tagihan Belum Lunas",target-collected],...transactions.map(t=>[t.type==="masuk"?"PEMASUKAN":"PENGELUARAN",t.transactionDate,t.category,t.description,t.amount])];exportCsv("laporan-keuangan-kas-rt",["Jenis Data","Tanggal/Keterangan","Kategori/Nilai","Keterangan","Nominal (Rp)"],summaryRows)}

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"open":""}`}>
      <div className="brand"><div className={`brand-mark ${brandLogo?"has-logo":""}`}>{brandLogo?<img src={brandLogo} alt="Logo KAS RT"/>:<Building2 size={24}/>}</div><div className="brand-copy"><strong>{brandIdentity.name}</strong><span>{brandIdentity.subtitle}</span></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={20}/></button></div>
      <div className="neighborhood"><span className="hood-icon"><Home size={17}/></span><div><b>RT 002 · RW 014</b><small>Perumahan Ciptaland</small></div></div>
      <p className="nav-label">MENU UTAMA</p>
      <nav>{permittedNav.map(item=><button key={item.id} className={view===item.id?"active":""} onClick={()=>go(item.id)}><item.icon size={19}/><span>{item.id==="tagihan"&&!isAdmin?"Tagihan Saya":item.label}</span>{item.id==="tagihan"&&unpaid.length>0&&<em>{unpaid.length}</em>}</button>)}</nav>
      {isAdmin&&<><p className="nav-label second">SISTEM</p><nav><button onClick={()=>go("settings")}><ShieldCheck size={19}/><span>Hak Akses</span></button></nav></>}
      <div className="sidebar-card"><div><HandCoins size={19}/><b>Kas transparan,<br/>warga nyaman.</b></div><p>{isAdmin?"Kelola data warga dan keuangan melalui akun pengurus.":"Pantau tagihan dan kwitansi Anda dalam satu tempat."}</p><small>AKUN {roleLabel(sessionUser.role).toUpperCase()} · SESI AMAN</small></div>
      <div className="user-mini"><div className="avatar">{initials}</div><div><b>{sessionUser.name}</b><small>{roleLabel(sessionUser.role)}</small></div><button type="button" className="dots" onClick={logout} disabled={pending} aria-label="Keluar dari akun" title="Keluar"><LogOut size={18}/></button></div>
    </aside>
    {mobileNav&&<button className="nav-backdrop" onClick={()=>setMobileNav(false)} aria-label="Tutup navigasi"/>}

    <main className="main">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" onClick={()=>setMobileNav(true)}><Menu size={22}/></button><div><span>Blok Mawar /</span><b>{viewName}</b></div></div><div className="top-actions"><label className="global-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari data..."/><kbd>⌘ K</kbd></label><button className="icon-button"><Bell size={20}/><i/></button><div className="profile"><div className="avatar small">{initials}</div><div><b>{sessionUser.name}</b><span>{roleLabel(sessionUser.role)}</span></div><button type="button" className="dots" onClick={logout} disabled={pending} aria-label="Logout"><LogOut size={16}/></button></div></div></header>

      <div className="content">
        {actionError&&!modal&&!paymentBill&&<div className="account-alert" role="alert">{actionError}</div>}
        {notice&&<div className="account-notice" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Tutup pemberitahuan"><X size={15}/></button></div>}
        {!isAdmin&&<div className="account-notice"><ShieldCheck size={18}/><span>Selamat datang, <b>{sessionUser.name}</b>. Data yang ditampilkan hanya milik akun Anda.</span></div>}
        {view==="dashboard"&&isAdmin&&<>
          <section className="page-heading"><div><p>SELAMAT DATANG, {sessionUser.name.toUpperCase()} 👋</p><h1>Ringkasan Keuangan</h1><span>Pantau kondisi keuangan lingkungan dalam satu tampilan.</span></div><div className="heading-actions"><button className="btn secondary" onClick={()=>setModal("resident")}><UserPlus size={17}/>Tambah Warga</button><button className="btn primary" onClick={()=>setModal("transaction")}><Plus size={18}/>Catat Transaksi</button></div></section>
          <section className="stats-grid">
            <Stat title="SALDO KAS SAAT INI" value={money(balance)} note="Saldo bersih keseluruhan" icon={WalletCards} color="indigo" trend="+12,5%" />
            <Stat title="PEMASUKAN" value={money(income)} note="Tahun berjalan 2026" icon={TrendingUp} color="green" trend="+8,2%" />
            <Stat title="PENGELUARAN" value={money(expense)} note="Tahun berjalan 2026" icon={TrendingDown} color="orange" />
            <Stat title="TAGIHAN TERTUNDA" value={money(unpaid.reduce((n,b)=>n+b.amount,0))} note={`${unpaid.length} warga belum lunas`} icon={ReceiptText} color="red" />
          </section>
          <section className="dashboard-grid">
            <div className="card chart-card"><div className="card-head"><div><h2>Arus Kas Bulanan</h2><p>Perbandingan pemasukan dan pengeluaran tahun 2026</p></div><button className="period"><CalendarDays size={16}/>Tahun 2026<ChevronDown size={15}/></button></div><div className="big-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:20,right:8,left:0,bottom:0}}><defs><linearGradient id="income" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#635bff" stopOpacity=".28"/><stop offset="1" stopColor="#635bff" stopOpacity=".02"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#eef1f6"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#8a94a6",fontSize:12}}/><YAxis axisLine={false} tickLine={false} width={58} tickFormatter={shortMoney} tick={{fill:"#8a94a6",fontSize:11}}/><Tooltip formatter={(v)=>money(Number(v))} contentStyle={{borderRadius:14,border:"1px solid #e8eaf0",boxShadow:"0 8px 30px rgba(25,32,56,.1)"}}/><Legend iconType="circle" iconSize={8}/><Area type="monotone" dataKey="Pemasukan" stroke="#635bff" strokeWidth={3} fill="url(#income)"/><Area type="monotone" dataKey="Pengeluaran" stroke="#ff8a4c" strokeWidth={2.5} fill="transparent" strokeDasharray="6 5"/></AreaChart></ResponsiveContainer></div></div>
            <div className="card progress-card"><div className="card-head"><div><h2>Tagihan Bulan Ini</h2><p>April 2026</p></div><button className="dots"><MoreHorizontal/></button></div><div className="progress-visual"><div className="radial" style={{"--progress":`${completion*3.6}deg`} as React.CSSProperties}><div><b>{completion}%</b><span>Terkumpul</span></div></div></div><div className="progress-meta"><div><i className="paid-dot"/><span>Sudah lunas</span><b>{bills.length-unpaid.length} warga</b></div><div><i className="unpaid-dot"/><span>Belum lunas</span><b>{unpaid.length} warga</b></div></div><div className="collection"><span>Dana terkumpul</span><b>{money(collected)} <small>/ {money(target)}</small></b></div><button className="text-button" onClick={()=>go("tagihan")}>Lihat semua tagihan <ArrowRight size={16}/></button></div>
          </section>
          <section className="dashboard-grid lower">
            <div className="card"><div className="card-head"><div><h2>Transaksi Terbaru</h2><p>Aktivitas kas terbaru Blok Mawar</p></div><button className="text-button inline" onClick={()=>go("pemasukan")}>Lihat semua <ArrowRight size={15}/></button></div><TransactionTable data={transactions.slice(0,5)} compact/></div>
            <div className="card"><div className="card-head"><div><h2>Pengeluaran per Kategori</h2><p>Distribusi penggunaan dana</p></div></div><div className="pie-wrap"><div className="pie-chart-shell"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={categoryData} innerRadius={52} outerRadius={76} paddingAngle={4} dataKey="value">{categoryData.map((_,i)=><Cell key={i} fill={["#635bff","#ff9f43","#2bc48a","#30b7d8"][i%4]}/>)}</Pie><Tooltip formatter={(v)=>money(Number(v))}/></PieChart></ResponsiveContainer><div className="pie-total"><span>Total</span><b>{shortMoney(expense)}</b></div></div><div className="pie-legend descriptive">{categoryData.map((c,i)=><div className="legend-row" key={c.name}><i style={{background:["#635bff","#ff9f43","#2bc48a","#30b7d8"][i%4]}}/><span><b>{c.name}</b><small>{money(c.value)}</small></span><strong>{expense?Math.round(c.value/expense*100):0}%</strong></div>)}<p><span>●</span> Persentase dihitung dari total pengeluaran yang tercatat.</p></div></div></div>
          </section>
        </>}

        {(view==="pemasukan"||view==="pengeluaran")&&<SectionPage eyebrow="KEUANGAN" title={view==="pemasukan"?"Pemasukan Kas":"Pengeluaran Kas"} subtitle={`Kelola dan unduh seluruh data ${view} berdasarkan periode.`} action={<div className="heading-actions"><button className="btn secondary" onClick={exportTransactions}><Download size={16}/>Export CSV</button><button className="btn primary" onClick={()=>setModal("transaction")}><Plus size={18}/>Tambah {view==="pemasukan"?"Pemasukan":"Pengeluaran"}</button></div>}>
          <div className="stats-grid mini"><MiniStat label={`Total ${view==="pemasukan"?"Pemasukan":"Pengeluaran"} Terfilter`} value={money(filteredTx.reduce((n,t)=>n+t.amount,0))} icon={view==="pemasukan"?ArrowDownLeft:ArrowUpRight} cls={view==="pemasukan"?"positive":"negative"}/><MiniStat label="Jumlah Transaksi" value={`${filteredTx.length} transaksi`} icon={ClipboardList} cls="primary"/><MiniStat label="Saldo Kas Saat Ini" value={money(balance)} icon={CircleDollarSign} cls="primary"/></div>
          <div className="card table-card"><div className="table-tools period-tools"><div className="period-filters"><label><span>PERIODE BULAN</span><select value={txMonth} onChange={e=>setTxMonth(e.target.value)}><option value="semua">Semua Bulan</option>{fullMonthNames.map((m,i)=><option value={i} key={m}>{m}</option>)}</select></label><label><span>PERIODE TAHUN</span><select value={txYear} onChange={e=>setTxYear(e.target.value)}><option value="semua">Semua Tahun</option>{transactionYears.map(y=><option key={y}>{y}</option>)}</select></label></div><div className="table-tool-actions"><span className="table-count">{filteredTx.length} data ditemukan</span><button className="btn secondary" onClick={exportTransactions}><Download size={16}/>Export CSV</button></div></div><TransactionTable data={filteredTx}/></div>
        </SectionPage>}

        {view==="tagihan"&&<SectionPage eyebrow="IURAN WARGA" title={isAdmin?"Tagihan Warga":"Tagihan Saya"} subtitle={isAdmin?"Pantau status pembayaran iuran warga.":"Lihat tagihan dan bukti pembayaran milik Anda."} action={null}>
          {isAdmin&&<PaymentReview onReviewed={()=>router.refresh()}/>}<div className="stats-grid mini"><MiniStat label="Total Tagihan" value={money(target)} icon={ReceiptText} cls="primary"/><MiniStat label="Sudah Terkumpul" value={money(collected)} icon={Check} cls="positive"/><MiniStat label="Belum Tertagih" value={money(target-collected)} icon={CalendarDays} cls="negative"/></div>
          <div className="card table-card"><div className="table-tools"><div className="segmented">{(["semua","lunas","belum_lunas"] as const).map(f=><button className={billFilter===f?"active":""} onClick={()=>setBillFilter(f)} key={f}>{f==="semua"?"Semua":f==="lunas"?"Lunas":"Belum Lunas"}</button>)}</div><span className="table-count">{filteredBills.length} tagihan</span></div><div className="table-scroll"><table><thead><tr><th>WARGA</th><th>JENIS IURAN</th><th>PERIODE</th><th>NOMINAL</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredBills.map(b=><tr key={b.id}><td><div className="person"><div className="avatar table-avatar">{b.residentName.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><b>{b.residentName}</b><span>{b.residentAddress}</span></div></div></td><td>{b.feeName}</td><td>{b.period}</td><td className="strong">{money(b.amount)}</td><td><Status type={b.status}/></td><td>{b.status==="belum_lunas"?<button className="pay-button" onClick={()=>setPaymentBill(b)}>Bayar Sekarang</button>:<button className="dots"><MoreHorizontal size={18}/></button>}</td></tr>)}</tbody></table></div></div>
        </SectionPage>}

        {view==="warga"&&<SectionPage eyebrow="DATABASE RT" title="Data Warga" subtitle="Data kepala keluarga yang terdaftar di Blok Mawar." action={<div className="heading-actions"><button className="btn secondary" onClick={exportResidents}><Download size={16}/>Export CSV</button><button className="btn primary" onClick={()=>setModal("resident")}><UserPlus size={17}/>Tambah Warga</button></div>}>
          <div className="card resident-banner"><div className="resident-total"><div><Users/></div><span><b>{residents.length}</b> Kepala Keluarga</span></div><div className="banner-divider"/><div><span>Total jiwa terdaftar</span><b>{residents.reduce((n,r)=>n+r.familyMembers,0)} jiwa</b></div><div><span>Status hunian</span><b className="green-text">100% aktif</b></div></div>
          <div className="card table-card"><div className="table-tools"><b>Daftar Kepala Keluarga</b><div className="table-tool-actions"><span className="table-count">{filteredResidents.length} data warga</span><button className="btn secondary" onClick={exportResidents}><Download size={15}/>Export CSV</button></div></div><div className="table-scroll"><table><thead><tr><th>NAMA WARGA</th><th>ALAMAT</th><th>NO. TELEPON</th><th>ANGGOTA</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredResidents.map(r=><tr key={r.id}><td><div className="person"><div className="avatar table-avatar">{r.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><b>{r.name}</b><span>NIK •••• {r.nik.slice(-4)}</span></div></div></td><td className="strong">{r.address}</td><td>{r.phone}</td><td>{r.familyMembers} jiwa</td><td><span className="status paid"><i/>Aktif</span></td><td><button className="dots"><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div></div>
        </SectionPage>}

        {view==="laporan"&&<SectionPage eyebrow="TRANSPARANSI" title="Laporan Keuangan" subtitle="Ringkasan dan laporan kas yang siap dibagikan kepada warga." action={<div className="heading-actions"><button className="btn secondary" onClick={exportReport}><Download size={16}/>Export CSV</button><button className="btn primary" onClick={()=>window.print()}><Download size={17}/>Cetak PDF</button></div>}>
          <div className="report-hero card"><div><span>LAPORAN KAS RT</span><h2>Ringkasan Tahun 2026</h2><p>Blok Mawar RT 002 RW 014 · Perumahan Ciptaland</p></div><div className="report-balance"><span>Saldo akhir</span><b>{money(balance)}</b><small>Diperbarui hari ini</small></div></div>
          <div className="report-grid"><div className="card report-summary"><h3>Ringkasan Keuangan</h3><div><span>Saldo awal periode</span><b>{money(0)}</b></div><div><span>Total pemasukan</span><b className="green-text">+ {money(income)}</b></div><div><span>Total pengeluaran</span><b className="red-text">− {money(expense)}</b></div><div className="total"><span>Saldo akhir</span><b>{money(balance)}</b></div></div><div className="card report-summary"><h3>Rekap Iuran April</h3><div><span>Target penerimaan</span><b>{money(target)}</b></div><div><span>Dana diterima</span><b>{money(collected)}</b></div><div><span>Sisa tagihan</span><b>{money(target-collected)}</b></div><div className="total"><span>Tingkat pelunasan</span><b>{completion}%</b></div></div></div>
          <div className="card report-note"><ShieldCheck/><div><b>Laporan terverifikasi Bendahara RT</b><p>Seluruh angka dihasilkan otomatis dari transaksi yang tercatat di sistem KAS RT Blok Mawar.</p></div></div>
        </SectionPage>}
        {view==="kwitansi"&&<ReceiptView bills={bills} logo={brandLogo}/>} 
        {view==="marketplace"&&<MarketplaceView/>}
        {view==="settings"&&<SettingsView/>}
      </div>
    </main>

    {modal&&<div className="modal-wrap" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={()=>setModal(null)}/><div className="modal"><div className="modal-head"><div><span>{modal==="transaction"?"PEMBUKUAN KAS":"DATABASE WARGA"}</span><h2>{modal==="transaction"?"Catat Transaksi Baru":"Tambah Data Warga"}</h2></div><button className="icon-button" onClick={()=>setModal(null)}><X size={20}/></button></div>{actionError&&<div className="account-alert modal-alert" role="alert">{actionError}</div>}{modal==="transaction"?<TransactionForm onSubmit={fd=>submitAction(createTransaction,fd)} pending={pending} defaultType={view==="pengeluaran"?"keluar":"masuk"}/>:<ResidentForm onSubmit={fd=>submitAction(createResident,fd)} pending={pending}/>}</div></div>}
    {paymentBill&&<div className="modal-wrap payment-wrap" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={()=>setPaymentBill(null)}/><div className="modal payment-modal"><div className="modal-head"><div><span>PEMBAYARAN TAGIHAN</span><h2>Bayar Iuran Warga</h2></div><button className="icon-button" onClick={()=>setPaymentBill(null)}><X size={20}/></button></div><div className="payment-content"><div className="payment-summary"><div><span>{paymentBill.feeName} · {paymentBill.period}</span><b>{paymentBill.residentName}</b><small>{paymentBill.residentAddress}</small></div><strong>{money(paymentBill.amount)}</strong></div><div className="payment-methods"><div className="qris-panel"><span>SCAN QRIS</span>{paymentInfo.qris?<img src={paymentInfo.qris} alt="QRIS pembayaran RT"/>:<div className="qris-empty"><CreditCard/><b>QRIS belum diunggah</b><small>Admin dapat mengunggahnya di Pengaturan.</small></div>}</div><div className="transfer-panel"><span>TRANSFER BANK</span><p>Transfer tepat sesuai nominal tagihan ke rekening berikut:</p><div className="account-box"><b>{paymentInfo.account}</b><button onClick={()=>navigator.clipboard?.writeText(paymentInfo.account)}><Copy size={15}/>Salin</button></div><ul><li>Pastikan nama dan nominal sudah sesuai.</li><li>Simpan bukti transfer untuk verifikasi.</li></ul></div></div><form onSubmit={e=>{e.preventDefault();void confirmPayment(paymentBill,e.currentTarget)}}><label className="proof-upload"><input name="proof" type="file" accept="image/png,image/jpeg" required disabled={pending}/><span><Upload size={18}/><b>Unggah bukti pembayaran</b><small>JPG/PNG · Maksimal 2 MB</small></span></label>{actionError&&<div className="account-alert" role="alert">{actionError}</div>}<button disabled={pending} className="btn primary submit"><Check size={17}/>{pending?"Mengirim…":"Kirim Bukti Pembayaran"}</button></form><p className="payment-disclaimer">Bukti disimpan di server. Tagihan baru menjadi lunas setelah pengurus memverifikasi pembayaran.</p></div></div></div>}
  </div>
}

function Stat({title,value,note,icon:Icon,color,trend}:{title:string;value:string;note:string;icon:typeof WalletCards;color:string;trend?:string}) { return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={22}/></div><div className="stat-copy"><span>{title}</span><b>{value}</b><small>{note}</small></div>{trend&&<em><TrendingUp size={12}/>{trend}</em>}</div> }
function MiniStat({label,value,icon:Icon,cls}:{label:string;value:string;icon:typeof WalletCards;cls:string}) { return <div className="mini-stat card"><div className={`mini-icon ${cls}`}><Icon/></div><div><span>{label}</span><b>{value}</b></div></div> }
function SectionPage({eyebrow,title,subtitle,action,children}:{eyebrow:string;title:string;subtitle:string;action:React.ReactNode;children:React.ReactNode}) { return <><section className="page-heading"><div><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></div>{action}</section>{children}</> }
function Status({type}:{type:"lunas"|"belum_lunas"}) { return <span className={`status ${type==="lunas"?"paid":"unpaid"}`}><i/>{type==="lunas"?"Lunas":"Belum Lunas"}</span> }
function TransactionTable({data,compact=false}:{data:Transaction[];compact?:boolean}) { if(!data.length)return <Empty text="Belum ada transaksi"/>; return <div className="table-scroll"><table><thead><tr><th>TRANSAKSI</th><th>KATEGORI</th><th>TANGGAL</th><th>NOMINAL</th>{!compact&&<th/>}</tr></thead><tbody>{data.map(t=><tr key={t.id}><td><div className="transaction-name"><div className={`tx-icon ${t.type}`}><ArrowDownLeft size={17}/></div><div><b>{t.description}</b><span>TRX-{String(t.id).padStart(5,"0")}</span></div></div></td><td><span className="category">{t.category}</span></td><td>{niceDate(t.transactionDate)}</td><td className={`amount ${t.type}`}>{t.type==="masuk"?"+":"−"} {money(t.amount)}</td>{!compact&&<td><button className="dots"><MoreHorizontal size={18}/></button></td>}</tr>)}</tbody></table></div> }
function TransactionForm({onSubmit,pending,defaultType="masuk"}:{onSubmit:(fd:FormData)=>void;pending:boolean;defaultType?:"masuk"|"keluar"}) { return <form action={onSubmit} className="modal-form"><div className="field"><label>JENIS TRANSAKSI</label><div className="type-select"><label><input defaultChecked={defaultType==="masuk"} type="radio" name="type" value="masuk"/><span><ArrowDownLeft/>Pemasukan</span></label><label><input defaultChecked={defaultType==="keluar"} type="radio" name="type" value="keluar"/><span><ArrowUpRight/>Pengeluaran</span></label></div></div><div className="field-row"><div className="field"><label>KATEGORI</label><select name="category" required defaultValue=""><option value="" disabled>Pilih kategori</option><option>Iuran Bulanan</option><option>Iuran Sampah</option><option>Dana Sosial</option><option>Keamanan</option><option>Kebersihan</option><option>Fasilitas</option><option>Lainnya</option></select></div><div className="field"><label>TANGGAL</label><input name="transactionDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></div></div><div className="field"><label>NOMINAL</label><div className="prefix-input"><span>Rp</span><input name="amount" inputMode="numeric" placeholder="0" required/></div></div><div className="field"><label>KETERANGAN</label><textarea name="description" placeholder="Contoh: Pembayaran iuran bulan April" required/></div><button disabled={pending} className="btn primary submit">{pending?"Menyimpan...":"Simpan Transaksi"}<ArrowRight size={17}/></button></form> }
function ResidentForm({onSubmit,pending}:{onSubmit:(fd:FormData)=>void;pending:boolean}) { return <form action={onSubmit} className="modal-form"><div className="field"><label>NAMA LENGKAP</label><input name="name" placeholder="Nama kepala keluarga" required/></div><div className="field"><label>NOMOR INDUK KEPENDUDUKAN</label><input name="nik" inputMode="numeric" placeholder="16 digit NIK" minLength={16} maxLength={16} pattern="[0-9]{16}" required/></div><div className="field"><label>ALAMAT RUMAH</label><input name="address" placeholder="Contoh: Blok Mawar A1 No. 10" required/></div><div className="field-row"><div className="field"><label>NO. TELEPON</label><input name="phone" placeholder="08xx-xxxx-xxxx" required/></div><div className="field"><label>JUMLAH JIWA</label><input name="familyMembers" type="number" min="1" defaultValue="1" required/></div></div><button disabled={pending} className="btn primary submit">{pending?"Menyimpan...":"Simpan Data Warga"}<ArrowRight size={17}/></button></form> }
