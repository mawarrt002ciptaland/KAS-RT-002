"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, Fingerprint, IdCard, LoaderCircle, LockKeyhole, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import type { AuthStatus } from "@/lib/auth-types";
import styles from "./auth.module.css";

type Mode = "login" | "register" | "setup";
type VerifiedResident = { name: string; address: string; maskedNik: string };
type Reply = { ok: boolean; error?: string; code?: string; resident?: VerifiedResident } & Partial<AuthStatus>;
async function request(path: string, body?: Record<string, unknown>): Promise<Reply> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "same-origin", cache: "no-store", body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const data: Reply = await response.json().catch(() => ({ ok: false, error: "Respons server tidak valid." }));
  if (!response.ok || !data.ok) throw new Error(data.error === "Respons server tidak valid." ? "Respons server tidak dapat dibaca. Coba lagi atau hubungi pengurus." : data.error || "Permintaan belum berhasil. Coba lagi.");
  return data;
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [nik, setNik] = useState("");
  const [resident, setResident] = useState<VerifiedResident | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    let active = true;
    request("status").then(data => { if (active) setStatus(data as AuthStatus); }).catch(() => {
      if (active) setServiceError("Layanan akun belum siap. Hubungi pengurus untuk memeriksa DATABASE_URL dan menjalankan migrasi database.");
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "register" && !resident) {
        const result = await request("verify-nik", { nik });
        if (result.resident) setResident(result.resident);
        return;
      }
      const payload = {
        username: String(form.get("username") || "").trim(), password: String(form.get("password") || ""),
        confirmPassword: String(form.get("confirmPassword") || ""), remember: form.get("remember") === "on",
        name: String(form.get("name") || "").trim(), setupKey: String(form.get("setupKey") || ""),
      };
      if (mode !== "login" && payload.password !== payload.confirmPassword) throw new Error("Konfirmasi password tidak sama.");
      await request(mode, payload);
      // Confirm the HttpOnly cookie is accepted; never substitute a local token.
      try { await request("me"); } catch {
        throw new Error("Akun berhasil diverifikasi, tetapi cookie sesi diblokir. Buka website di tab baru dan izinkan cookie untuk situs ini.");
      }
      setSuccess(true);
      window.location.assign("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "Koneksi terlalu lama. Coba kembali beberapa saat lagi.");
    } finally { setBusy(false); }
  }

  const isRegistration = mode === "register";
  const blockedSetup = mode === "setup" && status && (status.hasAdmin || !status.setupEnabled);
  const disabled = busy || success || !status?.ready || Boolean(serviceError);
  return <main className={styles.page}>
    <div className={styles.backgroundGlow} aria-hidden="true" />
    <div className={styles.outerBrand}><WalletCards size={21} /><span>KAS RT <b>BLOK MAWAR</b></span></div>
    <section className={styles.card}>
      <div className={styles.logo}><WalletCards size={31} strokeWidth={1.8}/></div>
      <p className={styles.kicker}>PORTAL WARGA & PENGURUS</p>
      <h1>{mode === "login" ? <>Selamat Datang <span>👋</span></> : mode === "register" ? "Daftar Akun Warga" : "Siapkan Admin RT"}</h1>
      <p className={styles.identity}>Blok Mawar RT 002 RW 014</p>
      <p className={styles.subtitle}>{mode === "login" ? "Masuk untuk mengakses layanan lingkungan Anda." : mode === "register" ? "Verifikasi NIK untuk mulai menggunakan layanan warga." : "Buat akun pengelola pertama dengan kunci penyiapan."}</p>
      {mode !== "setup" && <div className={styles.tabs}>
        <Link className={mode === "login" ? styles.activeTab : ""} href="/login">Masuk</Link>
        <Link className={isRegistration ? styles.activeTab : ""} href="/register">Daftar Warga</Link>
      </div>}
      {isRegistration && <div className={styles.steps}><span className={styles.stepActive}><i>{resident ? <Check size={12}/> : "1"}</i>Verifikasi NIK</span><div/><span className={resident ? styles.stepActive : ""}><i>2</i>Buat akun</span></div>}
      {serviceError && <Notice>{serviceError}</Notice>}
      {error && <Notice>{error}</Notice>}
      {success && <div className={styles.success} role="status"><CheckCircle2 size={18}/>Berhasil. Membuka dashboard…</div>}
      {blockedSetup ? <div className={styles.setupNotice}><ShieldCheck size={24}/><h2>{status.hasAdmin ? "Admin sudah terdaftar" : "Penyiapan belum diaktifkan"}</h2><p>{status.hasAdmin ? "Gunakan akun pengurus yang sudah dibuat untuk masuk." : "Pengelola server perlu memasang ADMIN_SETUP_KEY sebelum membuat admin pertama."}</p><Link href="/login">Kembali ke halaman login <ArrowRight size={14}/></Link></div> : <form method="post" action={`/api/auth/${mode}`} onSubmit={submit} className={styles.form}>
        {isRegistration && !resident ? <>
          <label htmlFor="nik">NOMOR INDUK KEPENDUDUKAN</label>
          <div className={styles.input}><IdCard size={19}/><input autoFocus id="nik" name="nik" autoComplete="off" value={nik} onChange={e => setNik(e.target.value.replace(/\D/g, "").slice(0,16))} inputMode="numeric" pattern="[0-9]{16}" minLength={16} maxLength={16} placeholder="Masukkan 16 digit NIK" required disabled={busy}/></div>
          <p className={styles.help}>NIK harus sudah tercatat di Data Warga oleh pengurus RT. Satu NIK hanya dapat digunakan untuk satu akun.</p>
        </> : <>
          {resident && <div className={styles.verified}><CheckCircle2 size={20}/><div><b>NIK terverifikasi</b><span>{resident.name} · {resident.maskedNik}</span></div><button type="button" onClick={() => { setResident(null); setError(""); }} disabled={busy}>Ganti</button></div>}
          {mode === "setup" && <><label htmlFor="setupKey">KUNCI PENYIAPAN ADMIN</label><div className={styles.input}><ShieldCheck size={18}/><input id="setupKey" name="setupKey" type="password" autoComplete="off" minLength={32} required placeholder="ADMIN_SETUP_KEY dari server" disabled={busy}/></div><label htmlFor="name">NAMA PENGURUS</label><div className={styles.input}><UserRound size={18}/><input id="name" name="name" minLength={3} maxLength={80} required placeholder="Nama lengkap pengurus" disabled={busy}/></div></>}
          <label htmlFor="username">USERNAME</label>
          <div className={styles.input}><UserRound size={18}/><input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={32} pattern={mode === "login" ? undefined : "[A-Za-z0-9][A-Za-z0-9._\\-]{2,31}"} placeholder={mode === "login" ? "Masukkan username" : "Pilih username Anda"} required disabled={busy}/></div>
          <PasswordField name="password" label="PASSWORD" creating={mode !== "login"} disabled={busy}/>
          {mode !== "login" && <><p className={styles.help}>Minimal 10 karakter, menggunakan huruf dan angka.</p><PasswordField name="confirmPassword" label="KONFIRMASI PASSWORD" creating disabled={busy}/></>}
          {mode === "login" && <label className={styles.remember}><input name="remember" type="checkbox"/>Ingat saya selama 7 hari</label>}
        </>}
        <button className={styles.submit} disabled={disabled}>{busy ? <LoaderCircle size={18} className={styles.spinner}/> : isRegistration && !resident ? <Fingerprint size={19}/> : <ArrowRight size={18}/>} {busy ? "Memproses…" : success ? "Membuka dashboard…" : isRegistration ? resident ? "Buat Akun Warga" : "Verifikasi NIK" : mode === "setup" ? "Buat Admin & Masuk" : "Masuk Sekarang"}</button>
        {!status && !serviceError && <p className={styles.loading} role="status">Memeriksa layanan akun…</p>}
      </form>}
      {mode === "login" ? <div className={styles.below}><p>Belum punya akun? <Link href="/register">Daftar sebagai Warga</Link></p><small>Lupa password? Hubungi pengurus RT untuk bantuan.</small>{status?.setupEnabled && <Link className={styles.setupLink} href="/setup">Penyiapan admin pertama <ArrowRight size={13}/></Link>}</div> : <Link className={styles.back} href="/login"><ArrowLeft size={14}/>Sudah punya akun? Masuk di sini</Link>}
      <div className={styles.secure}><ShieldCheck size={14}/>Akses pribadi · Sesi dilindungi di server</div>
    </section>
    <p className={styles.footer}>Perumahan Ciptaland <i/>Transparan, tertib, dan terhubung.</p>
  </main>;
}
function Notice({ children }: { children: ReactNode }) { return <div className={styles.error} role="alert"><AlertCircle size={17}/><span>{children}</span></div>; }
function PasswordField({ name, label, creating, disabled }: { name: string; label: string; creating: boolean; disabled: boolean }) {
  const [visible, setVisible] = useState(false);
  return <><label htmlFor={name}>{label}</label><div className={styles.input}><LockKeyhole size={18}/><input id={name} name={name} type={visible ? "text" : "password"} autoComplete={creating ? "new-password" : "current-password"} placeholder={name === "confirmPassword" ? "Ulangi password" : "Masukkan password"} minLength={creating ? 10 : 1} maxLength={128} required disabled={disabled}/><button type="button" aria-label={visible ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></>;
}
