import { useMemo, useState } from "react";
import { Home, ReceiptText, Megaphone, MessageSquareWarning, User, Bell, Wallet, Clock, CheckCircle2, MapPin, CalendarDays, Phone, MessageCircle, Sparkles, Moon, Sun, Download, QrCode, Building2, ChevronRight, Copy, LogOut, Plus, Link2, Database, RefreshCw, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { useUI, type WargaTab } from "@/store/ui";
import { useData } from "@/data/store";
import { useAuth } from "@/store/auth";
import { useInstallPrompt, useLoadState } from "@/hooks";
import { CURRENT_WARGA_ID, RT_INFO, JENIS_TAGIHAN_LABEL } from "@/lib/constants";
import { formatRupiah, formatTanggalID, formatTanggalLengkapID, relativeTime, periodeLabel, toWaNumber, maskPhone, BULAN_SHORT } from "@/lib/format";
import { cn, openWhatsApp, copyText, openExternal } from "@/lib/utils";
import { Button, Badge, Tabs, Switch } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { StatCard, RupiahText, StatusBadge, EmptyState, ErrorState, CardSkeleton, Avatar, InfoRow, SectionTitle } from "@/components/shared";
import { PengaduanFormModal } from "@/views/PengaduanView";
import { Receipt } from "@/views/KwitansiView";
import type { Kwitansi, Pengumuman } from "@/data/types";

const WA_MSG = RT_INFO.pesanAduan;

export default function WargaApp() {
  const tab = useUI((s) => s.wargaTab);
  const setTab = useUI((s) => s.setWargaTab);
  const setRole = useUI((s) => s.setRole);
  const authUser = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const neonStatus = useData((s) => s.neonStatus);
  const neonError = useData((s) => s.neonError);
  const syncRemoteData = useData((s) => s.syncRemoteData);
  const logo = useData((s) => s.pengaturan.logo_url);
  const tagihan = useData((s) => s.tagihan);
  const belum = tagihan.filter((t) => t.wargaId === authUser?.wargaId && t.status !== "lunas").length;
  const [notifOpen, setNotifOpen] = useState(false);
  const pengumuman = useData((s) => s.pengumuman);

  if (neonStatus !== "connected") {
    const syncing = neonStatus === "syncing";
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex h-14 items-center gap-2 border-b px-4 pt-safe">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Home className="h-5 w-5" /></span>
          <span className="text-sm font-bold">RT 002 Blok Mawar</span>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/20 text-warning-foreground dark:text-warning">{syncing ? <RefreshCw className="h-7 w-7 animate-spin" /> : <CircleAlert className="h-7 w-7" />}</span>
          <h1 className="mt-4 text-lg font-bold">{syncing ? "Menghubungkan data warga…" : "Data warga belum tersinkron"}</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Aplikasi tidak akan menampilkan data contoh dari localStorage sebagai informasi warga. Dashboard read-only Neon tidak menyertakan data pribadi warga.</p>
          {neonError && <p className="mt-2 max-w-md break-words text-xs text-muted-foreground">{neonError}</p>}
          <div className="mt-4 flex w-full max-w-sm flex-col gap-2">
            <Button onClick={() => void syncRemoteData()} leftIcon={<RefreshCw className="h-4 w-4" />}>Coba Sinkronkan</Button>
            <Button variant="outline" leftIcon={<Database className="h-4 w-4" />} onClick={() => setRole("admin")}>Pengaturan Database</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full max-w-[100vw] flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 pt-safe backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">{logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <Home className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1 leading-none"><p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sistem Informasi</p><p className="truncate text-sm font-extrabold">RT 002 Blok Mawar</p></div>
          <button onClick={() => setNotifOpen(true)} className="touch-target relative flex items-center justify-center rounded-lg hover:bg-muted" aria-label="Notifikasi"><Bell className="h-5 w-5" />{(belum > 0 || pengumuman.some((p) => p.prioritas === "mendesak" && p.status === "aktif")) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />}</button>
          <button onClick={() => setTab("profil")} className="touch-target flex items-center justify-center" aria-label="Profil"><Avatar name={authUser?.nama ?? "Warga"} size="sm" /></button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-safe-nav sm:px-5">
        <div className="mx-auto w-full max-w-3xl min-w-0">
          {tab === "home" && <WargaHome />}
          {tab === "tagihan" && <WargaTagihan />}
          {tab === "pengumuman" && <WargaInfo />}
          {tab === "aduan" && <WargaAduan />}
          {tab === "profil" && <WargaProfil canSwitchAdmin={authUser?.role !== "warga"} onSwitchAdmin={() => { setRole("admin"); toast.success("Beralih ke tampilan pengurus"); }} onLogout={() => void logout().then(() => toast.success("Anda sudah keluar.")).catch(() => toast.error("Logout belum dapat diproses. Coba lagi."))} />}
        </div>
      </main>

      {/* WhatsApp float */}
      <button onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, WA_MSG)} aria-label="WhatsApp Aduan Warga" className="fixed right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-whatsapp px-4 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-whatsapp-dark bottom-safe-nav sm:bottom-safe-nav">
        <MessageCircle className="h-6 w-6" /><span className="hidden sm:inline">WhatsApp Aduan</span>
      </button>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur" aria-label="Navigasi utama" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-3xl items-stretch">
          <BottomTab tab="home" icon={<Home className="h-5 w-5" />} label="Home" />
          <BottomTab tab="tagihan" icon={<ReceiptText className="h-5 w-5" />} label="Tagihan" badge={belum} />
          <BottomTab tab="pengumuman" icon={<Megaphone className="h-5 w-5" />} label="Pengumuman" />
          <BottomTab tab="aduan" icon={<MessageSquareWarning className="h-5 w-5" />} label="Aduan" />
          <BottomTab tab="profil" icon={<User className="h-5 w-5" />} label="Profil" />
        </div>
      </nav>

      <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifikasi" size="sm">
        <ul className="divide-y">
          {belum > 0 && <li className="py-3"><button onClick={() => { setNotifOpen(false); setTab("tagihan"); }} className="flex w-full items-start gap-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/25 text-warning-foreground"><ReceiptText className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold">{belum} tagihan belum dibayar</span><span className="block text-xs text-muted-foreground">Ketuk untuk melihat tagihan saya</span></span></button></li>}
          {pengumuman.filter((p) => p.status === "aktif").slice(0, 4).map((p) => <li key={p.id} className="py-3"><button onClick={() => { setNotifOpen(false); setTab("pengumuman"); }} className="flex w-full items-start gap-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Megaphone className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold break-anywhere">{p.judul}</span><span className="block text-xs text-muted-foreground">{relativeTime(p.tanggal)}</span></span></button></li>)}
        </ul>
      </Modal>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

function BottomTab({ tab, icon, label, badge }: { tab: WargaTab; icon: React.ReactNode; label: string; badge?: number }) {
  const active = useUI((s) => s.wargaTab === tab);
  const setTab = useUI((s) => s.setWargaTab);
  return (
    <button onClick={() => setTab(tab)} aria-label={label} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold sm:text-[11px]", active ? "text-primary" : "text-muted-foreground")}>
      <span className="relative">{icon}{badge ? <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{badge}</span> : null}</span>
      <span className="truncate">{label}</span>
      {active && <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />}
    </button>
  );
}

function useMe() {
  const warga = useData((s) => s.warga);
  const tagihan = useData((s) => s.tagihan);
  const authUser = useAuth((s) => s.user);
  const wargaId = authUser?.wargaId;
  const me = wargaId
    ? warga.find((w) => w.id === wargaId)
    : authUser?.role !== "warga"
      ? warga.find((w) => w.id === CURRENT_WARGA_ID)
      : undefined;
  const myTagihan = useMemo(() => tagihan.filter((t) => t.wargaId === me?.id).sort((a, b) => b.periode.localeCompare(a.periode)), [tagihan, me?.id]);
  const tunggakan = myTagihan.filter((t) => t.status !== "lunas");
  return { me, myTagihan, tunggakan, totalTunggakan: tunggakan.reduce((a, t) => a + t.jumlah + t.denda, 0) };
}

/* ---------------- HOME ---------------- */
function WargaHome() {
  const { me, myTagihan, tunggakan, totalTunggakan } = useMe();
  const pengumuman = useData((s) => s.pengumuman);
  const kegiatan = useData((s) => s.kegiatan);
  const pengurus = useData((s) => s.pengurus);
  const setTab = useUI((s) => s.setWargaTab);
  const { loading, error, refetch } = useLoadState();
  if (loading) return <div className="space-y-3"><CardSkeleton className="h-28" /><CardSkeleton className="h-24" /><CardSkeleton className="h-40" /></div>;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  const now = new Date();
  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-primary via-primary to-emerald-700 p-4 text-primary-foreground shadow-md sm:p-5">
        <p className="text-xs text-primary-foreground/80">Halo, {me?.nama} 👋</p>
        <h2 className="text-fluid-h3 mt-0.5 font-extrabold">Selamat datang di Sistem RT 002</h2>
        <p className="mt-1 text-xs text-primary-foreground/80">{formatTanggalLengkapID(now)} • {me?.noRumah}, Blok Mawar</p>
      </section>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Tagihan Saya (Tunggakan)" tone="warning" value={<RupiahText value={totalTunggakan} />} icon={<Wallet className="h-5 w-5" />} hint={tunggakan.length ? `${tunggakan.length} tagihan belum lunas` : "Semua tagihan lunas 🎉"} action={<button onClick={() => setTab("tagihan")} className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-primary">Status pembayaran <ChevronRight className="h-3.5 w-3.5" /></button>} />
        <StatCard title="Tagihan Lunas" tone="income" value={`${myTagihan.filter((t) => t.status === "lunas").length} tagihan`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard title="Belum Bayar" tone="expense" value={`${tunggakan.length} tagihan`} icon={<Clock className="h-5 w-5" />} />
      </section>
      <Button variant="whatsapp" fullWidth size="lg" leftIcon={<MessageCircle className="h-5 w-5" />} onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, WA_MSG)}>💬 WhatsApp Aduan Warga</Button>

      <section>
        <SectionTitle title="Pengumuman" action={<button onClick={() => setTab("pengumuman")} className="min-h-[36px] text-xs font-semibold text-primary">Lihat semua</button>} />
        <div className="space-y-2">{pengumuman.filter((p) => p.status === "aktif").slice(0, 3).map((p) => <PengumumanCard key={p.id} p={p} compact />)}</div>
      </section>
      <section>
        <SectionTitle title="Kegiatan Mendatang" />
        {kegiatan.filter((k) => k.status === "akan_datang").length === 0 ? <EmptyState title="Belum ada kegiatan" /> : (
          <ul className="space-y-2">{kegiatan.filter((k) => k.status === "akan_datang").sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime()).slice(0, 3).map((k) => { const d = new Date(k.tanggalMulai); return (
            <li key={k.id} className="flex items-center gap-3 rounded-xl border bg-card p-3"><span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground leading-none"><span className="text-lg font-extrabold">{d.getDate()}</span><span className="text-[10px] font-semibold uppercase">{BULAN_SHORT[d.getMonth()]}</span></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{k.judul}</span><span className="block truncate text-xs text-muted-foreground"><Clock className="mr-0.5 inline h-3 w-3" />{k.jam ?? ""} <MapPin className="ml-1 mr-0.5 inline h-3 w-3" />{k.lokasi}</span></span><Badge tone="primary">{k.kategori}</Badge></li>
          ); })}</ul>
        )}
      </section>
      <section>
        <SectionTitle title="Kontak RT" />
        <ul className="grid gap-2 sm:grid-cols-2">{pengurus.slice(0, 4).map((p) => <li key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-3"><Avatar name={p.nama} src={p.foto} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.nama}</span><span className="block truncate text-xs text-muted-foreground">{p.jabatan}</span></span>{p.telepon && <><a href={`tel:${p.telepon}`} aria-label={`Telepon ${p.nama}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><Phone className="h-4 w-4" /></a><button aria-label={`WhatsApp ${p.nama}`} onClick={() => openWhatsApp(toWaNumber(p.telepon), `Halo ${p.jabatan} ${p.nama}, saya ${me?.nama} (${me?.noRumah}). `)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#25D366] hover:bg-[#25D366]/10"><MessageCircle className="h-4 w-4" /></button></>}</li>)}</ul>
      </section>
    </div>
  );
}

function PengumumanCard({ p, compact }: { p: Pengumuman; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const tone = p.prioritas === "mendesak" ? "border-l-destructive" : p.prioritas === "penting" ? "border-l-warning" : "border-l-primary";
  return (
    <article className={cn("rounded-xl border border-l-4 bg-card p-4", tone)}>
      <div className="flex flex-wrap items-center gap-1.5">{p.prioritas !== "normal" && <StatusBadge status={p.prioritas} />}<Badge tone="muted">{p.kategori}</Badge><span className="text-xs text-muted-foreground">{relativeTime(p.tanggal)}</span></div>
      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug break-anywhere">{p.judul}</h3>
      <p className={cn("mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap", compact && !open && "line-clamp-2")}>{p.konten}</p>
      {compact && <button onClick={() => setOpen((o) => !o)} className="mt-1 min-h-[36px] text-xs font-semibold text-primary">{open ? "Sembunyikan" : "Baca selengkapnya"}</button>}
    </article>
  );
}

/* ---------------- TAGIHAN ---------------- */
function WargaTagihan() {
  const { me, myTagihan, tunggakan, totalTunggakan } = useMe();
  const pengaturan = useData((s) => s.pengaturan);
  const kwitansi = useData((s) => s.kwitansi);
  const [kw, setKw] = useState<Kwitansi | null>(null);
  const konfirmasi = () => openWhatsApp(RT_INFO.whatsappAdmin, `Halo Bendahara RT 002, saya ${me?.nama} (${me?.noRumah}) ingin konfirmasi pembayaran iuran ${tunggakan.map((t) => periodeLabel(t.periode)).join(", ")} sebesar ${formatRupiah(totalTunggakan)}. Bukti transfer terlampir.`);
  return (
    <div className="space-y-5">
      <h1 className="text-fluid-h3 font-bold">Tagihan Saya</h1>
      <div className={cn("rounded-2xl p-4 text-white shadow-md", tunggakan.length ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-primary to-emerald-700")}>
        <p className="text-xs text-white/80">{tunggakan.length ? "Total yang harus dibayar" : "Status pembayaran"}</p>
        <p className="mt-1 text-3xl font-extrabold tabular break-anywhere">{tunggakan.length ? formatRupiah(totalTunggakan) : "Lunas 🎉"}</p>
        <p className="mt-1 text-xs text-white/80">{tunggakan.length ? `${tunggakan.length} tagihan • ${tunggakan.map((t) => periodeLabel(t.periode)).join(", ")}` : "Terima kasih atas partisipasi Anda"}</p>
        {tunggakan.length > 0 && <Button variant="outline" className="mt-3 border-white/40 bg-white/15 text-white hover:bg-white/25" fullWidth leftIcon={<MessageCircle className="h-4 w-4" />} onClick={konfirmasi}>Konfirmasi Pembayaran via WhatsApp</Button>}
      </div>

      <section className="rounded-xl border bg-card p-4">
        <SectionTitle title="Cara Bayar" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/40 p-3"><p className="inline-flex items-center gap-1.5 text-sm font-semibold"><Building2 className="h-4 w-4 text-primary" />Transfer Bank</p><p className="mt-1 text-sm">{pengaturan.bank_nama}</p><p className="font-mono text-base font-bold tabular">{pengaturan.bank_rekening}</p><p className="text-xs text-muted-foreground">a.n. {pengaturan.bank_pemilik}</p><Button size="sm" variant="outline" className="mt-2" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={async () => { (await copyText(pengaturan.bank_rekening.replace(/\D/g, ""))) && toast.success("Nomor rekening disalin"); }}>Salin No. Rekening</Button></div>
          <div className="rounded-xl bg-muted/40 p-3"><p className="inline-flex items-center gap-1.5 text-sm font-semibold"><QrCode className="h-4 w-4 text-primary" />QRIS</p>{pengaturan.qris_image ? <img src={pengaturan.qris_image} alt="QRIS RT 002" className="mt-2 h-32 w-32 rounded-lg border bg-white object-contain" /> : <p className="mt-1 text-sm text-muted-foreground">Scan QRIS di Pos RT atau buka tautan QRIS.</p>}{pengaturan.qris_url && <Button size="sm" variant="outline" className="mt-2" onClick={() => openExternal(pengaturan.qris_url)}>Buka QRIS</Button>}</div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Atau bayar tunai langsung ke Bendahara {pengaturan.nama_bendahara} ({pengaturan.bank_pemilik ? "Mawar 02" : ""}).</p>
      </section>

      <section>
        <SectionTitle title="Riwayat Tagihan" />
        {myTagihan.length === 0 ? <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="Belum ada tagihan" /> : (
          <ul className="space-y-2">{myTagihan.map((t) => { const k = kwitansi.find((x) => x.tagihanId === t.id); return (
            <li key={t.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[15px] font-semibold">{JENIS_TAGIHAN_LABEL[t.jenis]} — {periodeLabel(t.periode)}</p><p className="text-xs text-muted-foreground">{t.kode} • Jatuh tempo {formatTanggalID(t.tanggalJatuhTempo)}</p></div><StatusBadge status={t.status} /></div>
              <div className="mt-2 flex items-center justify-between gap-3"><p className="text-lg font-bold tabular">{formatRupiah(t.jumlah + t.denda)}</p>{t.status === "lunas" ? <span className="text-xs text-success">Dibayar {t.tanggalBayar ? formatTanggalID(t.tanggalBayar) : ""} • {t.metode}</span> : <Button size="sm" variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={konfirmasi}>Bayar</Button>}</div>
              {k && <button onClick={() => setKw(k)} className="mt-2 inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-primary">Lihat kwitansi {k.kode} <ChevronRight className="h-3.5 w-3.5" /></button>}
            </li>
          ); })}</ul>
        )}
      </section>
      <Modal open={!!kw} onClose={() => setKw(null)} title="Kwitansi" description={kw?.kode} size="lg" bodyClassName="bg-muted/40 p-3 sm:p-6">{kw && <Receipt k={kw} p={pengaturan} />}</Modal>
    </div>
  );
}

/* ---------------- INFO ---------------- */
function WargaInfo() {
  const pengumuman = useData((s) => s.pengumuman);
  const kegiatan = useData((s) => s.kegiatan);
  const [t, setT] = useState<"pengumuman" | "kegiatan">("pengumuman");
  const aktif = pengumuman.filter((p) => p.status === "aktif").sort((a, b) => ({ mendesak: 0, penting: 1, normal: 2 }[a.prioritas] - { mendesak: 0, penting: 1, normal: 2 }[b.prioritas]) || new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  return (
    <div className="space-y-4">
      <h1 className="text-fluid-h3 font-bold">Pengumuman RT 002</h1>
      <Tabs value={t} onChange={setT} items={[{ value: "pengumuman", label: "Pengumuman", count: aktif.length }, { value: "kegiatan", label: "Kegiatan", count: kegiatan.length }]} />
      {t === "pengumuman" ? (aktif.length === 0 ? <EmptyState icon={<Megaphone className="h-6 w-6" />} title="Belum ada pengumuman" /> : <div className="space-y-3">{aktif.map((p) => <PengumumanCard key={p.id} p={p} />)}</div>) : (
        <ul className="space-y-2">{[...kegiatan].sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime()).map((k) => { const d = new Date(k.tanggalMulai); return (
          <li key={k.id} className="rounded-xl border bg-card p-3"><div className="flex items-start gap-3"><span className={cn("flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none", k.status === "akan_datang" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><span className="text-lg font-extrabold">{d.getDate()}</span><span className="text-[10px] font-semibold uppercase">{BULAN_SHORT[d.getMonth()]}</span></span><div className="min-w-0 flex-1"><p className="text-[15px] font-semibold leading-snug break-anywhere">{k.judul}</p><div className="mt-1 flex flex-wrap gap-1.5"><Badge tone="muted">{k.kategori}</Badge><StatusBadge status={k.status} /></div><p className="mt-1 text-xs text-muted-foreground"><CalendarDays className="mr-0.5 inline h-3 w-3" />{formatTanggalID(k.tanggalMulai)}{k.jam ? ` • ${k.jam}` : ""} <MapPin className="ml-1 mr-0.5 inline h-3 w-3" />{k.lokasi}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{k.deskripsi}</p></div></div></li>
        ); })}</ul>
      )}
    </div>
  );
}

/* ---------------- ADUAN ---------------- */
function WargaAduan() {
  const { me } = useMe();
  const pengaduan = useData((s) => s.pengaduan);
  const mine = pengaduan.filter((p) => p.wargaId === me?.id || p.pelapor === me?.nama).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h1 className="text-fluid-h3 font-bold">Aduan Saya</h1><Button size="sm" onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Buat Aduan</Button></div>
      <Button variant="whatsapp" fullWidth size="lg" leftIcon={<MessageCircle className="h-5 w-5" />} onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, WA_MSG)}>💬 WhatsApp Aduan Warga</Button>
      {mine.length === 0 ? <EmptyState icon={<MessageSquareWarning className="h-6 w-6" />} title="Belum ada aduan" description="Sampaikan keluhan atau laporan Anda kepada pengurus RT." action={<Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Buat Aduan</Button>} /> : (
        <ul className="space-y-2">{mine.map((p) => (
          <li key={p.id} className="rounded-xl border bg-card p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-mono text-xs font-semibold text-primary">{p.kode}</p><p className="text-[15px] font-semibold leading-snug break-anywhere">{p.judul}</p></div><StatusBadge status={p.status} /></div><p className="mt-1 text-xs text-muted-foreground">{p.kategori} • {p.lokasi ?? "-"} • {relativeTime(p.createdAt)}</p>{p.tanggapan && <div className="mt-2 rounded-lg bg-primary/5 p-3 text-sm"><p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Tanggapan Pengurus</p><p className="mt-0.5">{p.tanggapan}</p></div>}</li>
        ))}</ul>
      )}
      <PengaduanFormModal open={open} onClose={() => setOpen(false)} pelaporFixed={me ? { nama: me.nama, wargaId: me.id } : undefined} />
    </div>
  );
}

/* ---------------- PROFIL ---------------- */
function WargaProfil({ onSwitchAdmin, onLogout, canSwitchAdmin }: { onSwitchAdmin: () => void; onLogout: () => void; canSwitchAdmin: boolean }) {
  const { me } = useMe();
  const pengurus = useData((s) => s.pengurus);
  const tautan = useData((s) => s.tautan);
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const { canInstall, install } = useInstallPrompt();
  if (!me) return <EmptyState title="Profil tidak ditemukan" />;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 p-4 text-primary-foreground"><Avatar name={me.nama} size="xl" className="h-16 w-16 bg-white/20 text-white" /><div className="min-w-0"><p className="text-lg font-bold leading-tight break-anywhere">{me.nama}</p><p className="text-sm text-primary-foreground/80">Kepala Keluarga • {me.noRumah}</p><p className="text-xs text-primary-foreground/80">Blok Mawar, Perumahan Ciptaland, Batam</p></div></div>
      <dl className="divide-y rounded-xl border bg-card px-4"><InfoRow label="NIK" value={<span className="font-mono">{me.nik}</span>} /><InfoRow label="No. KK" value={<span className="font-mono">{me.noKK}</span>} /><InfoRow label="Telepon" value={me.telepon} /><InfoRow label="Pekerjaan" value={me.pekerjaan} /><InfoRow label="Anggota keluarga" value={`${1 + me.anggotaKK.length} jiwa`} /></dl>
      <section className="rounded-xl border bg-card p-4"><SectionTitle title="Anggota Keluarga" /><ul className="divide-y">{[{ id: "kk", nama: me.nama, hubungan: "Kepala Keluarga" }, ...me.anggotaKK].map((a) => <li key={a.id} className="flex items-center gap-3 py-2"><Avatar name={a.nama} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.nama}</span><span className="block text-xs text-muted-foreground">{a.hubungan}</span></span></li>)}</ul></section>
      <section className="rounded-xl border bg-card p-4"><SectionTitle title="Kontak RT" /><ul className="divide-y">{pengurus.slice(0, 3).map((p) => <li key={p.id} className="flex items-center gap-3 py-2"><Avatar name={p.nama} src={p.foto} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.nama}</span><span className="block text-xs text-muted-foreground">{p.jabatan} • {maskPhone(p.telepon)}</span></span>{p.telepon && <button aria-label={`WhatsApp ${p.nama}`} onClick={() => openWhatsApp(toWaNumber(p.telepon), `Halo ${p.jabatan} ${p.nama}, saya ${me.nama} (${me.noRumah}). `)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#25D366] hover:bg-[#25D366]/10"><MessageCircle className="h-4 w-4" /></button>}</li>)}</ul></section>
      <section className="rounded-xl border bg-card p-4"><SectionTitle title="Tautan RT 002" /><ul className="grid gap-2">{tautan.slice(0, 4).map((t) => <li key={t.id}><button onClick={() => openExternal(t.url)} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-3 text-left hover:bg-muted"><Link2 className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{t.judul}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button></li>)}</ul></section>
      <section className="rounded-xl border bg-card p-4">
        <SectionTitle title="Pengaturan" />
        <Switch id="wg-dark" checked={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} label="Mode gelap" />
        {canInstall && <Button variant="outline" fullWidth className="mt-2" leftIcon={<Download className="h-4 w-4" />} onClick={() => install()}>Install Sistem Informasi RT 002</Button>}
        
        {/* TOMBOL RESET CACHE TAMBAHAN */}
        <Button 
          variant="outline" 
          fullWidth 
          className="mt-2" 
          leftIcon={<RefreshCw className="h-4 w-4" />} 
          onClick={async () => {
            if (confirm("Hapus cache aplikasi dan muat ulang data terbaru?")) {
              toast.info("Memperbarui data...");
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
              }
              window.location.reload();
            }
          }}
        >
          Muat Ulang Data (Reset Cache)
        </Button>

        {/* TOMBOL RESET CACHE TAMBAHAN */}
        <Button 
          variant="outline" 
          fullWidth 
          className="mt-2" 
          leftIcon={<RefreshCw className="h-4 w-4" />} 
          onClick={async () => {
            if (confirm("Hapus cache aplikasi dan muat ulang data terbaru?")) {
              toast.info("Memperbarui data...");
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
              }
              window.location.reload();
            }
          }}
        >
          Muat Ulang Data (Reset Cache)
        </Button>
        {canSwitchAdmin && <Button variant="soft" fullWidth className="mt-2" leftIcon={<Sparkles className="h-4 w-4" />} onClick={onSwitchAdmin}>Beralih ke Tampilan Pengurus</Button>}
        <Button variant="ghost" fullWidth className="mt-2 text-destructive" leftIcon={<LogOut className="h-4 w-4" />} onClick={onLogout}>Keluar</Button>
        <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">{theme === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />} Sistem Informasi RT 002 • v1.0</p>
      </section>
    </div>
  );
}
