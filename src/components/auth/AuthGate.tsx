import { useState } from "react";
import { Database, Eye, EyeOff, Home, KeyRound, Loader2, LogIn, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { getAdminApiBase, setAdminApiBase } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Button, Field, Input, Tabs } from "@/components/ui";

type Mode = "login" | "register";

export function AuthGate() {
  const authStatus = useAuth((s) => s.status);
  const error = useAuth((s) => s.error);
  const checkSession = useAuth((s) => s.checkSession);
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.registerResident);
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [form, setForm] = useState({ email: "", password: "", nik: "", noKK: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password);
        toast.success("Berhasil masuk.");
      } else {
      await register({ email: form.email.trim(), password: form.password, nik: form.nik, noKK: form.noKK });
        toast.success("Akun warga berhasil dibuat dan diverifikasi.");
      }
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Permintaan belum dapat diproses.");
    } finally {
      setBusy(false);
    }
  }

  async function saveApiUrl() {
    const value = apiUrl.trim().replace(/\/$/, "");
    if (value && !/^https?:\/\//i.test(value)) return toast.error("Alamat API harus diawali https:// atau http://");
    if (!setAdminApiBase(value)) return toast.error("Browser tidak dapat menyimpan alamat API sesi.");
    setApiUrl("");
    toast.success(value ? "Alamat API disimpan. Memeriksa server..." : "Alamat API sesi dihapus.");
    await checkSession();
  }

  if (authStatus === "checking") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4" aria-live="polite">
        <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 text-sm font-medium shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Memeriksa sesi aman...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="flex min-h-16 items-center gap-3 border-b px-4 pt-safe sm:px-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Home className="h-5 w-5" /></span>
        <div className="min-w-0"><p className="truncate text-sm font-extrabold">SISTEM INFORMASI RT 002</p><p className="truncate text-xs text-muted-foreground">Blok Mawar · RW 014 · Ciptaland Batam</p></div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-emerald-700 to-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-4 top-12 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Layanan digital warga</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight xl:text-5xl">Satu pintu untuk informasi dan layanan RT 002.</h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75">Masuk dengan akun yang didaftarkan pengurus. Warga mendaftar memakai NIK dan No. KK yang sudah diverifikasi pengurus RT.</p>
          </div>
          <div className="relative grid max-w-xl gap-3 sm:grid-cols-2">
            <Feature icon={<Database className="h-4 w-4" />} title="Data tersinkron" body="Informasi dibaca dari database RT." />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Akses berdasarkan peran" body="Warga dan pengurus mendapat tampilan sesuai akun." />
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            {authStatus === "offline" ? (
              <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning-foreground dark:text-warning"><Database className="h-6 w-6" /></span>
                <h2 className="mt-4 text-xl font-bold">Server aplikasi belum terhubung</h2>
                <p className="mt-1 text-sm text-muted-foreground">Login dan pendaftaran aman memerlukan backend server. Website tidak membuat sesi login dari localStorage.</p>
                {error && <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs text-muted-foreground">{error}</p>}
                <div className="mt-4 space-y-3">
                  <Field label="Alamat API backend" htmlFor="api-server-url" hint="Contoh: https://rt002-api.example.com. Isi hanya jika API server di-host terpisah.">
                    <Input id="api-server-url" type="url" inputMode="url" autoComplete="url" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder={getAdminApiBase() || "https://alamat-api-anda"} />
                  </Field>
                  <div className="flex flex-col gap-2 sm:flex-row"><Button onClick={saveApiUrl} className="flex-1">Simpan Alamat & Coba Lagi</Button>{getAdminApiBase() && <Button variant="outline" onClick={() => { setApiUrl(""); void setAdminApiBase(""); void checkSession(); }}>Reset Alamat API</Button>}</div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Untuk deployment, jalankan <code className="rounded bg-muted px-1 font-mono">server/index.mjs</code> pada layanan Node.js dengan <code className="rounded bg-muted px-1 font-mono">DATABASE_URL</code> dan <code className="rounded bg-muted px-1 font-mono">AUTH_SECRET</code>.</p>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div>
                <h2 className="mt-4 text-2xl font-extrabold">{mode === "login" ? "Selamat datang" : "Daftar akun warga"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Masuk dengan akun resmi warga atau pengurus RT 002." : "NIK dan No. KK dicocokkan di server dengan data kependudukan RT."}</p>

                <Tabs value={mode} onChange={setMode} className="mt-5" items={[{ value: "login", label: "Masuk" }, { value: "register", label: "Daftar sebagai warga" }]} />

                <form onSubmit={submit} className="mt-5 space-y-4">
                  <Field label="Email" htmlFor="auth-email" required><Input id="auth-email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="nama@email.com" required /></Field>
                  {mode === "register" && <div className="grid gap-3 sm:grid-cols-2"><Field label="NIK" htmlFor="auth-nik" required hint="16 digit"><Input id="auth-nik" inputMode="numeric" autoComplete="off" maxLength={16} value={form.nik} onChange={(event) => setForm({ ...form, nik: event.target.value.replace(/\D/g, "") })} placeholder="••••••••••••••••" required /></Field><Field label="No. KK" htmlFor="auth-kk" required hint="16 digit"><Input id="auth-kk" inputMode="numeric" autoComplete="off" maxLength={16} value={form.noKK} onChange={(event) => setForm({ ...form, noKK: event.target.value.replace(/\D/g, "") })} placeholder="••••••••••••••••" required /></Field></div>}
                  <Field label="Password" htmlFor="auth-password" required hint={mode === "register" ? "Minimal 8 karakter" : undefined}>
                    <div className="relative"><Input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === "register" ? "Minimal 8 karakter" : "Password"} className="pr-12" required minLength={mode === "register" ? 8 : 1} /><button type="button" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="touch-target absolute right-0 top-0 flex items-center justify-center rounded-r-lg px-3 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                  </Field>
                  <Button type="submit" size="lg" fullWidth loading={busy} leftIcon={mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}>{mode === "login" ? "Masuk" : "Verifikasi & Buat Akun"}</Button>
                </form>

                {mode === "login" ? <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground"><p className="flex items-center gap-1.5 font-semibold text-foreground"><Users className="h-3.5 w-3.5" />Akun pengurus</p><p className="mt-1">Admin/ketua/bendahara/pengurus dibuat oleh administrator. Tidak ada pendaftaran mandiri untuk akun dengan akses pengurus.</p></div> : <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground"><p className="flex items-center gap-1.5 font-semibold text-foreground"><KeyRound className="h-3.5 w-3.5" />Privasi NIK</p><p className="mt-1">NIK dan No. KK hanya dipakai server untuk pencocokan. Keduanya tidak disimpan di browser atau dikembalikan dalam jawaban pendaftaran.</p></div>}
              </div>
            )}
          </div>
        </section>
      </div>
      <footer className="border-t px-4 py-3 pb-safe text-center text-xs text-muted-foreground">Sistem Informasi RT 002 · Blok Mawar · RW 014</footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex gap-3 rounded-xl border border-white/15 bg-white/10 p-3"><span className="mt-0.5 text-white">{icon}</span><span><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block text-xs leading-relaxed text-white/70">{body}</span></span></div>;
}