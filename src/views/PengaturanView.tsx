import { useState } from "react";
import { Settings, Building2, Wallet, Palette, Users, Save, Download, RotateCcw, Sparkles, Moon, Sun, Trash2, KeyRound, Plus, Smartphone, Database } from "lucide-react";
import { toast } from "sonner";
import DatabaseSqlTab from "./DatabaseSqlTab";
import { useData } from "@/data/store";
import type { User } from "@/data/types";
import { useUI } from "@/store/ui";
import { useInstallPrompt } from "@/hooks";
import { relativeTime, formatRupiah } from "@/lib/format";
import { isValidUrl } from "@/lib/utils";
import { Button, Input, Select, Textarea, Field, SegmentTabs, Switch } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, SectionTitle, Avatar, StatusBadge, FileUploadField, RupiahInput, IconButton, type UploadValue } from "@/components/shared";

type Tab = "profil" | "keuangan" | "tampilan" | "akun" | "database";

export default function PengaturanView() {
  const [tab, setTab] = useState<Tab>("profil");
  return (
    <div className="space-y-5">
      <PageHeader title="Pengaturan" description="Konfigurasi Sistem Informasi RT 002" icon={<Settings className="h-5 w-5" />} />
      <SegmentTabs value={tab} onChange={setTab} items={[{ value: "profil", label: "Profil RT", icon: <Building2 className="h-4 w-4" /> }, { value: "keuangan", label: "Keuangan", icon: <Wallet className="h-4 w-4" /> }, { value: "tampilan", label: "Tampilan", icon: <Palette className="h-4 w-4" /> }, { value: "akun", label: "Akun", icon: <Users className="h-4 w-4" /> }, { value: "database", label: "Database (Neon)", icon: <Database className="h-4 w-4" /> }]} />
      {tab === "profil" && <ProfilTab />}
      {tab === "keuangan" && <KeuanganTab />}
      {tab === "tampilan" && <TampilanTab />}
      {tab === "akun" && <AkunTab />}
      {tab === "database" && <DatabaseSqlTab />}
    </div>
  );
}

function useDraft(keys: string[]) {
  const pengaturan = useData((s) => s.pengaturan);
  const setPengaturan = useData((s) => s.setPengaturan);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const get = (k: string) => (k in draft ? draft[k] : pengaturan[k] ?? "");
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const dirty = Object.keys(draft).some((k) => draft[k] !== (pengaturan[k] ?? ""));
  const save = () => { const patch: Record<string, string> = {}; keys.forEach((k) => { if (k in draft) patch[k] = draft[k]; }); setPengaturan(patch); setDraft({}); toast.success("Pengaturan disimpan"); };
  return { get, set, save, dirty, pengaturan, setPengaturan };
}

function ProfilTab() {
  const keys = ["nama_rt", "rt", "rw", "blok", "perumahan", "kota", "alamat", "periode_pengurus", "whatsapp_admin", "nama_ketua", "nama_bendahara", "nama_sekretaris"];
  const { get, set, save, dirty, pengaturan, setPengaturan } = useDraft(keys);
  const [logo, setLogo] = useState<UploadValue | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border bg-card p-4 lg:col-span-1">
        <SectionTitle title="Logo RT" />
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow">{pengaturan.logo_url ? <img src={pengaturan.logo_url} alt="Logo RT 002" className="h-full w-full object-cover" /> : <Building2 className="h-10 w-10" />}</span>
          <div className="w-full"><FileUploadField value={logo} onChange={(v) => { setLogo(v); if (v) { setPengaturan({ logo_url: v.url }); toast.success("Logo diperbarui"); } }} accept="image/*" label="Unggah logo" compact /></div>
          <div className="flex w-full gap-2"><Input type="url" inputMode="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://… (URL logo)" aria-label="URL logo" /><Button variant="outline" onClick={() => { if (!isValidUrl(logoUrl)) return toast.error("URL tidak valid"); setPengaturan({ logo_url: logoUrl }); setLogoUrl(""); toast.success("Logo diperbarui"); }}>Pakai</Button></div>
          {pengaturan.logo_url && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setPengaturan({ logo_url: "" }); setLogo(null); }}>Hapus logo</Button>}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4 lg:col-span-2">
        <SectionTitle title="Identitas RT" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama RT" htmlFor="st-nama" className="sm:col-span-2"><Input id="st-nama" value={get("nama_rt")} onChange={(e) => set("nama_rt", e.target.value)} /></Field>
          <Field label="RT" htmlFor="st-rt"><Input id="st-rt" inputMode="numeric" value={get("rt")} onChange={(e) => set("rt", e.target.value)} /></Field>
          <Field label="RW" htmlFor="st-rw"><Input id="st-rw" inputMode="numeric" value={get("rw")} onChange={(e) => set("rw", e.target.value)} /></Field>
          <Field label="Blok" htmlFor="st-blok"><Input id="st-blok" value={get("blok")} onChange={(e) => set("blok", e.target.value)} /></Field>
          <Field label="Perumahan" htmlFor="st-per"><Input id="st-per" value={get("perumahan")} onChange={(e) => set("perumahan", e.target.value)} /></Field>
          <Field label="Kota" htmlFor="st-kota"><Input id="st-kota" value={get("kota")} onChange={(e) => set("kota", e.target.value)} /></Field>
          <Field label="Periode pengurus" htmlFor="st-periode"><Input id="st-periode" value={get("periode_pengurus")} onChange={(e) => set("periode_pengurus", e.target.value)} /></Field>
          <Field label="Alamat lengkap" htmlFor="st-alamat" className="sm:col-span-2"><Textarea id="st-alamat" rows={2} value={get("alamat")} onChange={(e) => set("alamat", e.target.value)} /></Field>
          <Field label="WhatsApp Admin" htmlFor="st-wa" hint="Format internasional tanpa +, contoh 6281234567890"><Input id="st-wa" type="tel" inputMode="tel" value={get("whatsapp_admin")} onChange={(e) => set("whatsapp_admin", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="Nama Ketua" htmlFor="st-ketua"><Input id="st-ketua" value={get("nama_ketua")} onChange={(e) => set("nama_ketua", e.target.value)} /></Field>
          <Field label="Nama Bendahara" htmlFor="st-bend"><Input id="st-bend" value={get("nama_bendahara")} onChange={(e) => set("nama_bendahara", e.target.value)} /></Field>
          <Field label="Nama Sekretaris" htmlFor="st-sek"><Input id="st-sek" value={get("nama_sekretaris")} onChange={(e) => set("nama_sekretaris", e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={save} disabled={!dirty} leftIcon={<Save className="h-4 w-4" />} fullWidth className="sm:w-auto">Simpan Profil</Button></div>
      </div>
    </div>
  );
}

function KeuanganTab() {
  const keys = ["iuran_bulanan", "iuran_keamanan", "iuran_kebersihan", "bank_nama", "bank_rekening", "bank_pemilik", "qris_url"];
  const { get, set, save, dirty, pengaturan, setPengaturan } = useDraft(keys);
  const [qris, setQris] = useState<UploadValue | null>(null);
  const [ttd, setTtd] = useState<UploadValue | null>(null);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-4">
        <SectionTitle title="Nominal Iuran" />
        <div className="space-y-4">
          {[["iuran_bulanan", "Iuran bulanan"], ["iuran_keamanan", "Iuran keamanan"], ["iuran_kebersihan", "Iuran kebersihan"]].map(([k, l]) => <Field key={k} label={`${l} (Rp)`} htmlFor={`st-${k}`} hint={formatRupiah(Number(get(k)) || 0)}><RupiahInput id={`st-${k}`} value={Number(get(k)) || 0} onChange={(n) => set(k, String(n))} /></Field>)}
        </div>
        <SectionTitle title="Rekening Bank" className="mt-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama bank" htmlFor="st-bank"><Input id="st-bank" value={get("bank_nama")} onChange={(e) => set("bank_nama", e.target.value)} /></Field>
          <Field label="No. rekening" htmlFor="st-rek"><Input id="st-rek" inputMode="numeric" value={get("bank_rekening")} onChange={(e) => set("bank_rekening", e.target.value)} /></Field>
          <Field label="Atas nama" htmlFor="st-an" className="sm:col-span-2"><Input id="st-an" value={get("bank_pemilik")} onChange={(e) => set("bank_pemilik", e.target.value)} /></Field>
          <Field label="Tautan QRIS" htmlFor="st-qris" className="sm:col-span-2"><Input id="st-qris" type="url" inputMode="url" value={get("qris_url")} onChange={(e) => set("qris_url", e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={save} disabled={!dirty} leftIcon={<Save className="h-4 w-4" />} fullWidth className="sm:w-auto">Simpan Keuangan</Button></div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <SectionTitle title="Gambar QRIS" />
          {pengaturan.qris_image && <img src={pengaturan.qris_image} alt="QRIS" className="mx-auto mb-3 h-40 w-40 rounded-xl border object-contain" />}
          <FileUploadField value={qris} onChange={(v) => { setQris(v); if (v) { setPengaturan({ qris_image: v.url }); toast.success("QRIS diperbarui"); } }} accept="image/*" label="Unggah QRIS" compact />
          {pengaturan.qris_image && <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => { setPengaturan({ qris_image: "" }); setQris(null); }}>Hapus QRIS</Button>}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <SectionTitle title="Tanda Tangan Bendahara" />
          {pengaturan.ttd_bendahara && <img src={pengaturan.ttd_bendahara} alt="Tanda tangan" className="mx-auto mb-3 h-20 object-contain" />}
          <FileUploadField value={ttd} onChange={(v) => { setTtd(v); if (v) { setPengaturan({ ttd_bendahara: v.url }); toast.success("Tanda tangan diperbarui"); } }} accept="image/*" label="Unggah tanda tangan (PNG transparan)" compact />
          {pengaturan.ttd_bendahara && <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => { setPengaturan({ ttd_bendahara: "" }); setTtd(null); }}>Hapus tanda tangan</Button>}
        </div>
      </div>
    </div>
  );
}

function TampilanTab() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const setRole = useUI((s) => s.setRole);
  const resetData = useData((s) => s.resetData);
  const { canInstall, install, isStandalone } = useInstallPrompt();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-4">
        <SectionTitle title="Tema" />
        <Switch id="sw-dark" checked={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} label="Mode gelap" description="Nyaman untuk penggunaan malam hari" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => setTheme("light")} className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-sm font-medium ${theme === "light" ? "border-primary bg-primary/10 text-primary" : ""}`}><Sun className="h-4 w-4" />Terang</button>
          <button onClick={() => setTheme("dark")} className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-sm font-medium ${theme === "dark" ? "border-primary bg-primary/10 text-primary" : ""}`}><Moon className="h-4 w-4" />Gelap</button>
        </div>
        <SectionTitle title="Mode Aplikasi" className="mt-6" />
        <Button variant="soft" fullWidth leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => { setRole("warga"); toast.success("Beralih ke Mode Warga"); }}>Buka Mode Warga</Button>
        <p className="mt-2 text-xs text-muted-foreground">Mode warga menampilkan tagihan saya, pengumuman, aduan, dan profil dengan navigasi bawah yang sederhana.</p>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <SectionTitle title="Aplikasi (PWA)" />
          <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Smartphone className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Install Sistem Informasi RT 002</p><p className="text-xs text-muted-foreground">{isStandalone ? "Aplikasi sudah terpasang dan berjalan mandiri." : canInstall ? "Pasang di layar utama untuk akses cepat & offline." : "Gunakan menu browser “Tambahkan ke layar utama” bila tombol tidak tersedia."}</p></div></div>
          <Button className="mt-3" fullWidth leftIcon={<Download className="h-4 w-4" />} disabled={!canInstall || isStandalone} onClick={async () => { const r = await install(); toast[r === "accepted" ? "success" : "info"](r === "accepted" ? "Aplikasi terpasang" : "Pemasangan dibatalkan"); }}>Install Aplikasi</Button>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-card p-4">
          <SectionTitle title="Data" />
          <p className="text-sm text-muted-foreground">Data tersimpan di perangkat ini. Reset akan mengembalikan seluruh data ke kondisi awal (contoh RT 002).</p>
          <Button variant="outline" className="mt-3 text-destructive" fullWidth leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmReset(true)}>Reset ke Data Awal</Button>
        </div>
      </div>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset seluruh data?" description="Semua perubahan (transaksi, warga, tagihan, dll.) akan dikembalikan ke data contoh awal." confirmLabel="Ya, reset" onConfirm={() => { resetData(); toast.success("Data direset ke kondisi awal"); }} />
    </div>
  );
}

const ROLES: User["role"][] = ["admin", "ketua", "bendahara", "pengurus", "warga"];
function AkunTab() {
  const users = useData((s) => s.users);
  const addUser = useData((s) => s.addUser);
  const updateUser = useData((s) => s.updateUser);
  const deleteUser = useData((s) => s.deleteUser);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [f, setF] = useState({ nama: "", email: "", role: "pengurus" as User["role"], telepon: "", password: "" });
  const [del, setDel] = useState<User | null>(null);
  function openCreate() { setEdit(null); setF({ nama: "", email: "", role: "pengurus", telepon: "", password: "" }); setOpen(true); }
  function openEdit(u: User) { setEdit(u); setF({ nama: u.nama, email: u.email, role: u.role, telepon: u.telepon ?? "", password: "" }); setOpen(true); }
  function submit() {
    if (!f.nama.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return toast.error("Nama dan email valid wajib diisi");
    if (!edit && f.password.length < 6) return toast.error("Password minimal 6 karakter");
    if (edit) { updateUser(edit.id, { nama: f.nama.trim(), email: f.email.trim(), role: f.role, telepon: f.telepon || undefined }); toast.success("Akun diperbarui"); }
    else { addUser({ nama: f.nama.trim(), email: f.email.trim(), role: f.role, telepon: f.telepon || undefined }); toast.success("Akun dibuat"); }
    setOpen(false);
  }
  return (
    <div className="rounded-xl border bg-card p-4">
      <SectionTitle title={`Akun Pengguna (${users.length})`} action={<Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Tambah</Button>} />
      <ul className="divide-y">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 py-3">
            <Avatar name={u.nama} src={u.foto} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{u.nama}</p><p className="truncate text-xs text-muted-foreground">{u.email}{u.lastLogin ? ` • login ${relativeTime(u.lastLogin)}` : ""}</p><div className="mt-1 flex flex-wrap gap-1"><StatusBadge status={u.role} /><StatusBadge status={u.status} /></div></div>
            <div className="flex shrink-0 gap-0.5">
              <IconButton icon={<KeyRound className="h-4 w-4" />} label="Reset password" onClick={() => toast.success(`Tautan reset password dikirim ke ${u.email}`)} />
              <IconButton icon={<Settings className="h-4 w-4" />} label="Edit" onClick={() => openEdit(u)} />
              <IconButton icon={<Trash2 className="h-4 w-4" />} label="Hapus" tone="destructive" onClick={() => setDel(u)} />
            </div>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Edit Akun" : "Tambah Akun"} size="sm" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={submit}>Simpan</Button></>}>
        <div className="space-y-4">
          <Field label="Nama" htmlFor="ak-nama" required><Input id="ak-nama" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></Field>
          <Field label="Email" htmlFor="ak-email" required><Input id="ak-email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Peran"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as User["role"] })} options={ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))} /></Field>
          <Field label="Telepon" htmlFor="ak-tel"><Input id="ak-tel" type="tel" inputMode="tel" value={f.telepon} onChange={(e) => setF({ ...f, telepon: e.target.value })} /></Field>
          {!edit && <Field label="Password" htmlFor="ak-pass" required hint="Minimal 6 karakter"><Input id="ak-pass" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>}
        </div>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus akun?" description={del?.email} confirmLabel="Hapus" onConfirm={() => { if (del) { deleteUser(del.id); toast.success("Akun dihapus"); } }} />
    </div>
  );
}
