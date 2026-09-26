import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, Users, ReceiptText, TrendingUp, TrendingDown, CalendarDays, Megaphone, MessageSquareWarning, FileText, Bell, CheckCheck, AlertTriangle, Plus, UserPlus, ArrowRight, Zap } from "lucide-react";
import { useUI } from "@/store/ui";
import { useData } from "@/data/store";
import { useEscape, useLockBodyScroll, useIsMobile, useDebounce } from "@/hooks";
import { formatRupiah, formatTanggalID, relativeTime, periodeLabel } from "@/lib/format";
import type { MenuKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Modal, Drawer } from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/shared";

/* ================= NOTIFICATIONS (derived from data) ================= */
export interface Notif { id: string; judul: string; pesan: string; waktu: string; tipe: "warning" | "info" | "danger" | "success"; view: MenuKey }

export function useNotifications() {
  const tagihan = useData((s) => s.tagihan);
  const pengaduan = useData((s) => s.pengaduan);
  const pengumuman = useData((s) => s.pengumuman);
  const kegiatan = useData((s) => s.kegiatan);
  const warga = useData((s) => s.warga);
  const readNotif = useUI((s) => s.readNotif);

  const items = useMemo<Notif[]>(() => {
    const out: Notif[] = [];
    const telat = tagihan.filter((t) => t.status === "telat");
    if (telat.length) out.push({ id: "tagihan-telat", judul: `${telat.length} tagihan telat bayar`, pesan: `Total ${formatRupiah(telat.reduce((a, t) => a + t.jumlah + t.denda, 0))} perlu ditindaklanjuti.`, waktu: new Date().toISOString(), tipe: "danger", view: "tagihan" });
    for (const p of pengaduan.filter((x) => x.status === "baru")) {
      out.push({ id: `adu-${p.id}`, judul: `Aduan baru: ${p.judul}`, pesan: `${p.kode} • ${p.pelapor}`, waktu: p.createdAt, tipe: "warning", view: "pengaduan" });
    }
    for (const p of pengumuman.filter((x) => x.status === "aktif" && x.prioritas === "mendesak")) {
      out.push({ id: `png-${p.id}`, judul: p.judul, pesan: "Pengumuman mendesak aktif", waktu: p.tanggal, tipe: "danger", view: "pengumuman" });
    }
    for (const k of kegiatan.filter((x) => x.status === "akan_datang").slice(0, 3)) {
      out.push({ id: `keg-${k.id}`, judul: `Kegiatan: ${k.judul}`, pesan: `${formatTanggalID(k.tanggalMulai)} • ${k.lokasi ?? "-"}`, waktu: k.createdAt, tipe: "info", view: "kegiatan" });
    }
    const belum = tagihan.filter((t) => t.status === "belum_bayar");
    if (belum.length) out.push({ id: "tagihan-belum", judul: `${belum.length} tagihan belum dibayar`, pesan: `${new Set(belum.map((b) => warga.find((w) => w.id === b.wargaId)?.noRumah)).size} rumah • ${periodeLabel(belum[0].periode)}`, waktu: new Date(Date.now() - 3600e3).toISOString(), tipe: "warning", view: "tagihan" });
    return out.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
  }, [tagihan, pengaduan, pengumuman, kegiatan, warga]);

  const unread = items.filter((i) => !readNotif.includes(i.id)).length;
  return { items, unread, readNotif };
}

export function NotificationSheet() {
  const open = useUI((s) => s.notifOpen);
  const setOpen = useUI((s) => s.setNotifOpen);
  const navigate = useUI((s) => s.navigate);
  const markRead = useUI((s) => s.markNotifRead);
  const isMobile = useIsMobile();
  const { items, unread, readNotif } = useNotifications();

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground">
        <span>{unread ? `${unread} belum dibaca` : "Semua sudah dibaca"}</span>
        {unread > 0 && <button onClick={() => markRead(items.map((i) => i.id))} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 font-semibold text-primary hover:bg-primary/10"><CheckCheck className="h-4 w-4" /> Tandai semua dibaca</button>}
      </div>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Belum ada notifikasi</li>}
        {items.map((n) => {
          const isRead = readNotif.includes(n.id);
          const tone = { warning: "bg-warning/25 text-warning-foreground dark:text-warning", info: "bg-info/15 text-info", danger: "bg-destructive/10 text-destructive", success: "bg-success/15 text-success" }[n.tipe];
          return (
            <li key={n.id}>
              <button onClick={() => { markRead([n.id]); navigate(n.view); setOpen(false); }} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/60", !isRead && "bg-primary/5")}>
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone)}>{n.tipe === "danger" ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm leading-snug break-anywhere", !isRead && "font-semibold")}>{n.judul}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.pesan}</span>
                  <span className="block text-[11px] text-muted-foreground">{relativeTime(n.waktu)}</span>
                </span>
                {!isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (isMobile) {
    return <Modal open={open} onClose={() => setOpen(false)} title="Notifikasi" bodyClassName="p-0 pb-safe" size="md">{body}</Modal>;
  }
  return <Drawer open={open} onClose={() => setOpen(false)} side="right" title="Notifikasi" className="w-[380px] bg-card">{body}</Drawer>;
}

/* ================= QUICK ACTIONS ================= */
export const QUICK_ACTIONS: { label: string; view: MenuKey; create: boolean; icon: typeof Plus; tone: string }[] = [
  { label: "Catat Pemasukan", view: "pemasukan", create: true, icon: TrendingUp, tone: "bg-success/15 text-success" },
  { label: "Catat Pengeluaran", view: "pengeluaran", create: true, icon: TrendingDown, tone: "bg-destructive/10 text-destructive" },
  { label: "Tambah Warga", view: "warga", create: true, icon: UserPlus, tone: "bg-primary/10 text-primary" },
  { label: "Buat Tagihan", view: "tagihan", create: true, icon: ReceiptText, tone: "bg-info/15 text-info" },
  { label: "Pengumuman", view: "pengumuman", create: true, icon: Megaphone, tone: "bg-warning/25 text-warning-foreground dark:text-warning" },
  { label: "Aduan Warga", view: "pengaduan", create: false, icon: MessageSquareWarning, tone: "bg-destructive/10 text-destructive" },
];

export function QuickActionsSheet() {
  const open = useUI((s) => s.quickOpen);
  const setOpen = useUI((s) => s.setQuickOpen);
  const navigate = useUI((s) => s.navigate);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Aksi Cepat" description="Pilih tindakan yang ingin dilakukan" size="md">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.label} onClick={() => { setOpen(false); navigate(a.view, { create: a.create }); }} className="card-hover flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center hover:border-primary/40">
            <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", a.tone)}><a.icon className="h-5 w-5" /></span>
            <span className="text-xs font-semibold leading-tight">{a.create && a.view !== "pengumuman" ? "+ " : ""}{a.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/** Floating quick action button (mobile/tablet admin) */
export function QuickFab() {
  const setOpen = useUI((s) => s.setQuickOpen);
  return (
    <button onClick={() => setOpen(true)} aria-label="Aksi cepat" className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:hidden bottom-safe-4">
      <Zap className="h-6 w-6" />
    </button>
  );
}

/* ================= GLOBAL SEARCH ================= */
type Result = { id: string; type: string; title: string; subtitle: string; view: MenuKey; icon: typeof Search; extra?: string; status?: string };

export function SearchOverlay() {
  const open = useUI((s) => s.searchOpen);
  const setOpen = useUI((s) => s.setSearchOpen);
  const navigate = useUI((s) => s.navigate);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 150).trim().toLowerCase();
  const data = useData();
  useEscape(() => setOpen(false), open);
  useLockBodyScroll(open);

  // "/" shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !open) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => { if (!open) setQ(""); }, [open]);

  const results = useMemo<Result[]>(() => {
    if (dq.length < 2) return [];
    const has = (...xs: (string | undefined | null)[]) => xs.some((x) => x?.toLowerCase().includes(dq));
    const out: Result[] = [];
    data.warga.filter((w) => has(w.nama, w.noRumah, w.telepon, w.nik)).slice(0, 5).forEach((w) => out.push({ id: w.id, type: "Warga", title: w.nama, subtitle: `${w.noRumah} • ${w.jabatan ?? "Kepala Keluarga"}`, view: "warga", icon: Users }));
    data.transaksi.filter((t) => has(t.kode, t.keterangan, t.kategori, t.penerima, t.sumber)).slice(0, 5).forEach((t) => out.push({ id: t.id, type: "Transaksi", title: t.keterangan, subtitle: `${t.kode} • ${formatTanggalID(t.tanggal)}`, extra: (t.jenis === "pemasukan" ? "+" : "−") + formatRupiah(t.nominal), view: t.jenis, icon: t.jenis === "pemasukan" ? TrendingUp : TrendingDown }));
    data.tagihan.filter((t) => { const w = data.warga.find((x) => x.id === t.wargaId); return has(t.kode, w?.nama, w?.noRumah, t.periode); }).slice(0, 5).forEach((t) => { const w = data.warga.find((x) => x.id === t.wargaId); out.push({ id: t.id, type: "Tagihan", title: `${w?.nama ?? "-"} — ${periodeLabel(t.periode)}`, subtitle: t.kode, extra: formatRupiah(t.jumlah), status: t.status, view: "tagihan", icon: ReceiptText }); });
    data.kegiatan.filter((k) => has(k.judul, k.lokasi, k.kategori)).slice(0, 4).forEach((k) => out.push({ id: k.id, type: "Kegiatan", title: k.judul, subtitle: `${formatTanggalID(k.tanggalMulai)} • ${k.lokasi ?? "-"}`, status: k.status, view: "kegiatan", icon: CalendarDays }));
    data.pengumuman.filter((p) => has(p.judul, p.konten)).slice(0, 4).forEach((p) => out.push({ id: p.id, type: "Pengumuman", title: p.judul, subtitle: formatTanggalID(p.tanggal), status: p.prioritas, view: "pengumuman", icon: Megaphone }));
    data.kwitansi.filter((k) => has(k.kode, k.keterangan, k.pembayar)).slice(0, 4).forEach((k) => out.push({ id: k.id, type: "Dokumen", title: k.kode, subtitle: k.keterangan ?? "-", extra: formatRupiah(k.nominal), view: "kwitansi", icon: FileText }));
    data.pengaduan.filter((p) => has(p.kode, p.judul, p.pelapor, p.lokasi)).slice(0, 4).forEach((p) => out.push({ id: p.id, type: "Pengaduan", title: p.judul, subtitle: `${p.kode} • ${p.pelapor}`, status: p.status, view: "pengaduan", icon: MessageSquareWarning }));
    return out;
  }, [dq, data]);

  const grouped = useMemo(() => {
    const m = new Map<string, Result[]>();
    results.forEach((r) => m.set(r.type, [...(m.get(r.type) ?? []), r]));
    return Array.from(m.entries());
  }, [results]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[75] flex flex-col sm:items-center sm:p-4 sm:pt-[8vh]" role="presentation">
      <div className="absolute inset-0 bg-black/55 animate-fade-in" onClick={() => setOpen(false)} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Pencarian" className="relative flex h-dvh w-full flex-col bg-card shadow-2xl animate-fade-in sm:h-auto sm:max-h-[75vh] sm:max-w-xl sm:rounded-2xl sm:animate-zoom-in">
        <div className="flex items-center gap-2 border-b px-3 py-2 pt-safe sm:px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search" placeholder="Cari warga, transaksi, tagihan, kegiatan, pengumuman, dokumen, pengaduan…" aria-label="Cari data" className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70" />
          <button onClick={() => setOpen(false)} className="touch-target flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup pencarian"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-safe">
          {dq.length < 2 ? (
            <div className="px-4 py-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cari di</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Warga", "Transaksi", "Tagihan", "Kegiatan", "Pengumuman", "Dokumen", "Pengaduan"].map((t) => <span key={t} className="rounded-full border px-3 py-1.5 text-xs font-medium">{t}</span>)}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Ketik minimal 2 huruf, misalnya <button onClick={() => setQ("Bayu")} className="font-semibold text-primary">“Bayu”</button>, <button onClick={() => setQ("lapkas")} className="font-semibold text-primary">“lapkas”</button>, atau <button onClick={() => setQ("ADU-2026")} className="font-semibold text-primary">“ADU-2026”</button>.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">Tidak ada hasil untuk “{q}”.</div>
          ) : (
            grouped.map(([type, rows]) => (
              <div key={type} className="py-2">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{type}</p>
                {rows.map((r) => (
                  <button key={`${r.type}-${r.id}`} onClick={() => { setOpen(false); navigate(r.view, { q: r.type === "Warga" || r.type === "Transaksi" || r.type === "Tagihan" || r.type === "Pengaduan" || r.type === "Dokumen" ? q.trim() : undefined }); }} className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/60">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><r.icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>
                    </span>
                    {r.status && <StatusBadge status={r.status} className="hidden sm:inline-flex" />}
                    {r.extra && <span className="shrink-0 text-xs font-semibold tabular">{r.extra}</span>}
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
        <div className="hidden items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground sm:flex">
          <span>Tekan <kbd className="rounded border px-1">Esc</kbd> untuk menutup</span>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Tutup</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
