"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Plus, RefreshCw, ShieldCheck, X } from "lucide-react";

type Account = { id: number; name: string; username: string; role: "admin" | "warga"; active: boolean };
async function api(path: string, body?: Record<string, unknown>) {
  const response = await fetch(path, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({ error: "Respons server tidak terbaca." }));
  if (!response.ok) throw new Error(data.error || "Permintaan gagal.");
  return data;
}
export function AccountManagement() {
  const [users,setUsers]=useState<Account[]>([]), [open,setOpen]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState("");
  async function load(){try{setUsers((await api("/api/admin/users")).users)}catch(e){setError(e instanceof Error?e.message:"Tidak dapat memuat akun.")}}
  useEffect(()=>{void load()},[]);
  async function create(form:FormData){
    setBusy(true);setError("");
    try{await api("/api/admin/users",Object.fromEntries(form));await load();setOpen(false)}catch(e){setError(e instanceof Error?e.message:"Gagal membuat akun.")}finally{setBusy(false)}
  }
  return <div className="card auth-management"><div className="card-head"><div><h2>Manajemen Akun</h2><p>Akun pengurus dibuat oleh admin. Akun warga dibuat melalui verifikasi NIK.</p></div><button className="btn primary" onClick={()=>{setError("");setOpen(true)}}><Plus size={16}/>Tambah Pengurus</button></div>
    {error&&!open&&<div role="alert" className="account-alert">{error}</div>}
    <div className="table-scroll"><table><thead><tr><th>NAMA</th><th>USERNAME</th><th>AKSES</th><th>STATUS</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td className="strong">{u.name}</td><td>{u.username}</td><td>{u.role==="admin"?"Admin / Pengurus":"Warga"}</td><td><span className={`status ${u.active?"paid":"unpaid"}`}><i/>{u.active?"Aktif":"Nonaktif"}</span></td></tr>)}</tbody></table></div>
    <p className="auth-management-note"><ShieldCheck size={15}/>Pengurus memiliki akses administrasi penuh. Warga hanya dapat mengakses data dan tagihannya sendiri.</p>
    {open&&<div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Tambah akun pengurus"><button className="modal-backdrop" onClick={()=>!busy&&setOpen(false)} aria-label="Tutup"/><div className="modal"><div className="modal-head"><div><span>AKUN PENGURUS</span><h2>Tambah Pengurus RT</h2></div><button className="icon-button" onClick={()=>setOpen(false)} disabled={busy} aria-label="Tutup"><X size={20}/></button></div><form action={create} className="modal-form">{error&&<div className="account-alert" role="alert">{error}</div>}<div className="field"><label htmlFor="manager-name">NAMA PENGURUS</label><input id="manager-name" name="name" minLength={3} maxLength={80} required/></div><div className="field"><label htmlFor="manager-username">USERNAME</label><input id="manager-username" name="username" autoComplete="off" minLength={3} maxLength={32} required placeholder="Contoh: bendahara"/></div><div className="field"><label htmlFor="manager-password">PASSWORD</label><input id="manager-password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required/></div><div className="field"><label htmlFor="manager-confirm">KONFIRMASI PASSWORD</label><input id="manager-confirm" name="confirmPassword" type="password" autoComplete="new-password" required/></div><p className="auth-management-note">Minimal 10 karakter berisi huruf dan angka. Akun ini mempunyai akses penuh sebagai pengurus.</p><button className="btn primary submit" disabled={busy}>{busy?"Menyimpan…":"Buat Akun Pengurus"}</button></form></div></div>}
  </div>;
}

type Review = { id:number; billId:number; name:string; period:string; amount:number; image:string };
export function PaymentReview({onReviewed}:{onReviewed:()=>void}) {
  const [items,setItems]=useState<Review[]>([]), [selected,setSelected]=useState<Review|null>(null), [error,setError]=useState(""), [busy,setBusy]=useState(false);
  async function load(){try{setItems((await api("/api/admin/payments")).payments)}catch(e){setError(e instanceof Error?e.message:"Gagal memuat bukti.")}}
  useEffect(()=>{void load()},[]);
  async function approve(){if(!selected)return;setBusy(true);setError("");try{await api("/api/admin/payments",{billId:selected.billId});setSelected(null);await load();onReviewed()}catch(e){setError(e instanceof Error?e.message:"Verifikasi gagal.")}finally{setBusy(false)}}
  return <section className="card auth-review"><div className="card-head"><div><h2>Bukti Menunggu Verifikasi <span className="review-count">{items.length}</span></h2><p>Pembayaran hanya dicatat sebagai pemasukan setelah Anda menyetujuinya.</p></div><button className="dots" onClick={load} aria-label="Muat ulang bukti"><RefreshCw size={17}/></button></div>{error&&!selected&&<div className="account-alert" role="alert">{error}</div>}{!items.length?<p className="auth-management-note">Belum ada bukti yang menunggu verifikasi.</p>:<div className="review-items">{items.map(item=><button key={item.id} onClick={()=>setSelected(item)}><span><b>{item.name}</b><small>{item.period}</small></span><strong>{new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(item.amount)}</strong><span>Lihat bukti →</span></button>)}</div>}
    {selected&&<div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Verifikasi pembayaran"><button className="modal-backdrop" onClick={()=>!busy&&setSelected(null)} aria-label="Tutup bukti"/><div className="modal"><div className="modal-head"><div><span>VERIFIKASI PEMBAYARAN</span><h2>{selected.name}</h2></div><button className="icon-button" onClick={()=>setSelected(null)} disabled={busy} aria-label="Tutup"><X size={18}/></button></div><div className="modal-form"><img className="verification-image" src={selected.image} alt={`Bukti pembayaran ${selected.name}`}/><p className="auth-management-note">Periksa mutasi rekening, nominal, dan nama pengirim sebelum menyetujui.</p>{error&&<div className="account-alert" role="alert">{error}</div>}<button className="btn primary submit" disabled={busy} onClick={approve}>{busy?<LoaderCircle size={17}/>:<CheckCircle2 size={17}/>}Setujui & Tandai Lunas</button></div></div></div>}
  </section>;
}
