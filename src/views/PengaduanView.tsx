import { useCallback, useMemo, useState } from "react";
import { MessageSquareWarning, Plus, MapPin, Camera, Paperclip, CheckCircle2, Trash2, Send, Clock, Inbox, LocateFixed, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Pengaduan } from "@/data/types";
import { useLoadState, usePendingCreate, usePendingSearch } from "@/hooks";
import { KATEGORI_PENGADUAN, RT_INFO } from "@/lib/constants";
import { relativeTime, formatTanggalLengkapID, toWaNumber } from "@/lib/format";
import { cn, openWhatsApp } from "@/lib/utils";
import { Button, Input, Select, Textarea, Field, Tabs, Badge } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, ListSkeleton, SearchInput, InfoRow, FileUploadField, Avatar, FilterBar, type UploadValue } from "@/components/shared";

type SF = "semua" | "baru" | "proses" | "selesai" | "ditolak";

export default function PengaduanView() {
  const pengaduan = useData((s) => s.pengaduan);
  const warga = useData((s) => s.warga);
  const updatePengaduan = useData((s) => s.updatePengaduan);
  const deletePengaduan = useData((s) => s.deletePengaduan);
  const { loading, error, refetch } = useLoadState();
  const [q, setQ] = useState(usePendingSearch("pengaduan"));
  const [sf, setSf] = useState<SF>("semua");
  const [detail, setDetail] = useState<Pengaduan | null>(null);
  const [tanggapan, setTanggapan] = useState("");
  const [del, setDel] = useState<Pengaduan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const openCreate = useCallback(() => setFormOpen(true), []);
  usePendingCreate("pengaduan", openCreate);

  const list = useMemo(() => { const s = q.trim().toLowerCase(); return pengaduan.filter((p) => (sf === "semua" || p.status === sf) && (!s || [p.kode, p.judul, p.pelapor, p.lokasi, p.kategori].some((x) => x?.toLowerCase().includes(s)))).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }, [pengaduan, q, sf]);
  const count = (s: string) => pengaduan.filter((p) => p.status === s).length;

  function setStatus(p: Pengaduan, status: Pengaduan["status"]) {
    updatePengaduan(p.id, { status, tanggapan: tanggapan.trim() || p.tanggapan });
    toast.success(`Status aduan ${p.kode} → ${status.toUpperCase()}`);
    setDetail({ ...p, status, tanggapan: tanggapan.trim() || p.tanggapan });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Pengaduan Warga" description="Aduan & keluhan warga RT 002" icon={<MessageSquareWarning className="h-5 w-5" />} actions={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Buat Aduan</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Aduan Baru" tone="info" value={`${count("baru")} aduan`} icon={<Inbox className="h-5 w-5" />} />
            <StatCard title="Diproses" tone="warning" value={`${count("proses")} aduan`} icon={<Clock className="h-5 w-5" />} />
            <StatCard title="Selesai" tone="income" value={`${count("selesai")} aduan`} icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatCard title="Total" tone="neutral" value={`${pengaduan.length} aduan`} icon={<MessageSquareWarning className="h-5 w-5" />} />
          </div>
          <Tabs value={sf} onChange={setSf} items={[{ value: "semua", label: "Semua", count: pengaduan.length }, { value: "baru", label: "Baru", count: count("baru") }, { value: "proses", label: "Diproses", count: count("proses") }, { value: "selesai", label: "Selesai", count: count("selesai") }, { value: "ditolak", label: "Ditolak" }]} />
          <FilterBar><SearchInput value={q} onChange={setQ} placeholder="Cari kode aduan, judul, pelapor…" className="sm:!min-w-[300px]" /></FilterBar>
          {list.length === 0 ? (
            <EmptyState icon={<MessageSquareWarning className="h-6 w-6" />} title="Belum ada pengaduan" description="Aduan warga akan tampil di sini." action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Buat Aduan</Button>} />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {list.map((p) => (
                <li key={p.id}>
                  <button onClick={() => { setDetail(p); setTanggapan(p.tanggapan ?? ""); }} className="card-hover flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left hover:border-primary/40">
                    <Avatar name={p.pelapor} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2"><span className="text-[15px] font-semibold leading-snug break-anywhere">{p.judul}</span><StatusBadge status={p.status} /></span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground"><span className="font-mono font-semibold text-primary">{p.kode}</span><span>•</span><Badge tone="muted">{p.kategori}</Badge><span>•</span><span>{relativeTime(p.createdAt)}</span></span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{p.pelapor}{p.lokasi ? ` • 📍 ${p.lokasi}` : ""}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Aduan" description={detail?.kode} size="lg"
        footer={detail && <><Button variant="ghost" className="text-destructive sm:mr-auto" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDel(detail)}>Hapus</Button>{detail.status === "baru" && <Button variant="outline" onClick={() => setStatus(detail, "ditolak")}>Tolak</Button>}{detail.status !== "selesai" && detail.status !== "proses" && <Button variant="outline" onClick={() => setStatus(detail, "proses")}>Proses</Button>}{detail.status !== "selesai" && <Button leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setStatus(detail, "selesai")}>Selesaikan</Button>}</>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start gap-3"><Avatar name={detail.pelapor} size="lg" /><div className="min-w-0"><h3 className="text-lg font-bold leading-snug break-anywhere">{detail.judul}</h3><div className="mt-1 flex flex-wrap gap-1.5"><StatusBadge status={detail.status} /><Badge tone="muted">{detail.kategori}</Badge></div></div></div>
            {detail.fotoUrl && <img src={detail.fotoUrl} alt="Foto aduan" className="max-h-64 w-full rounded-xl border object-cover" />}
            <p className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">{detail.deskripsi}</p>
            <dl className="divide-y rounded-xl border px-4">
              <InfoRow label="Pelapor" value={detail.pelapor} />
              <InfoRow label="Lokasi" value={detail.lokasi ?? "-"} />
              <InfoRow label="Dilaporkan" value={formatTanggalLengkapID(detail.createdAt)} />
              <InfoRow label="Diperbarui" value={relativeTime(detail.updatedAt)} />
            </dl>
            <Field label="Tanggapan pengurus" htmlFor="adu-tgp" hint="Tanggapan tersimpan saat status diubah"><Textarea id="adu-tgp" value={tanggapan} onChange={(e) => setTanggapan(e.target.value)} placeholder="Tuliskan tindak lanjut…" /></Field>
            {(() => { const w = warga.find((x) => x.id === detail.wargaId); return w?.telepon ? <Button variant="whatsapp" fullWidth leftIcon={<MessageCircle className="h-4 w-4" />} onClick={() => openWhatsApp(toWaNumber(w.telepon), `Halo ${w.nama}, terkait aduan ${detail.kode} "${detail.judul}" — status saat ini: ${detail.status.toUpperCase()}. ${tanggapan || ""}`.trim())}>Hubungi Pelapor via WhatsApp</Button> : null; })()}
          </div>
        )}
      </Modal>

      <PengaduanFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus aduan?" description={del?.kode} confirmLabel="Hapus" onConfirm={() => { if (del) { deletePengaduan(del.id); setDetail(null); toast.success("Aduan dihapus"); } }} />
    </div>
  );
}

/* =============== Reusable complaint form (admin + warga) =============== */
export function PengaduanFormModal({ open, onClose, pelaporFixed }: { open: boolean; onClose: () => void; pelaporFixed?: { nama: string; wargaId: string } }) {
  const warga = useData((s) => s.warga);
  const addPengaduan = useData((s) => s.addPengaduan);
  const [f, setF] = useState({ kategori: "", judul: "", deskripsi: "", lokasi: "", pelaporId: pelaporFixed?.wargaId ?? "", foto: null as UploadValue | null });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Pengaduan | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  function reset() { setF({ kategori: "", judul: "", deskripsi: "", lokasi: "", pelaporId: pelaporFixed?.wargaId ?? "", foto: null }); setResult(null); }
  function close() { onClose(); setTimeout(reset, 250); }

  function ambilLokasi() {
    if (!navigator.geolocation) return toast.error("Perangkat tidak mendukung lokasi");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { set("lokasi", `${f.lokasi ? f.lokasi + " — " : ""}GPS ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`); setLocating(false); toast.success("Lokasi ditambahkan"); },
      () => { setLocating(false); toast.error("Tidak dapat mengambil lokasi. Isi manual."); },
      { timeout: 8000 },
    );
  }
  async function submit() {
    if (!f.kategori || !f.judul.trim() || f.deskripsi.trim().length < 10) return toast.error("Kategori, judul, dan deskripsi (min. 10 karakter) wajib diisi");
    const w = pelaporFixed ? warga.find((x) => x.id === pelaporFixed.wargaId) : warga.find((x) => x.id === f.pelaporId);
    const pelapor = pelaporFixed?.nama ?? w?.nama;
    if (!pelapor) return toast.error("Pilih pelapor");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const p = addPengaduan({ kategori: f.kategori, judul: f.judul.trim(), deskripsi: f.deskripsi.trim(), lokasi: f.lokasi.trim() || undefined, fotoUrl: f.foto?.url, pelapor, wargaId: w?.id });
    setSaving(false);
    setResult(p);
    toast.success(`Aduan ${p.kode} terkirim`);
  }

  return (
    <Modal open={open} onClose={close} title={result ? "Aduan Terkirim" : "Buat Aduan"} description={result ? undefined : "Sampaikan keluhan atau laporan Anda"} size="md" fullOnMobile={!result}
      footer={result ? <><Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, `Halo Admin RT 002, saya baru saja mengirim aduan ${result.kode}: "${result.judul}". Mohon ditindaklanjuti. Terima kasih.`)}>Kabari Admin via WhatsApp</Button><Button onClick={close}>Selesai</Button></> : <><Button variant="outline" onClick={close}>Batal</Button><Button onClick={submit} loading={saving} leftIcon={<Send className="h-4 w-4" />} size="lg" fullWidth className="sm:h-11 sm:w-auto">Kirim Aduan</Button></>}>
      {result ? (
        <div className="py-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"><CheckCircle2 className="h-9 w-9" /></span>
          <p className="mt-4 text-sm text-muted-foreground">Nomor laporan Anda</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-primary break-anywhere">Aduan #{result.kode}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm">Status: <StatusBadge status={result.status} /></div>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">Simpan nomor laporan ini untuk memantau tindak lanjut. Pengurus RT akan merespons secepatnya.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {!pelaporFixed && <Field label="Pelapor" required><Select value={f.pelaporId} onChange={(e) => set("pelaporId", e.target.value)} placeholder="Pilih warga pelapor" options={warga.map((w) => ({ value: w.id, label: `${w.nama} — ${w.noRumah}` }))} /></Field>}
          <Field label="Kategori" required>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup">{KATEGORI_PENGADUAN.map((k) => <button key={k} type="button" role="radio" aria-checked={f.kategori === k} onClick={() => set("kategori", k)} className={cn("min-h-[44px] rounded-xl border px-3 text-sm font-medium", f.kategori === k ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted")}>{k}</button>)}</div>
          </Field>
          <Field label="Judul" htmlFor="adu-judul" required><Input id="adu-judul" value={f.judul} onChange={(e) => set("judul", e.target.value)} placeholder="Lampu jalan depan Mawar 08 mati" /></Field>
          <Field label="Deskripsi" htmlFor="adu-desk" required hint="Jelaskan kondisi, waktu kejadian, dan dampaknya"><Textarea id="adu-desk" rows={4} value={f.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} /></Field>
          <FileUploadField value={f.foto} onChange={(v) => set("foto", v)} accept="image/*,.pdf" label="Foto / lampiran" compact />
          <Field label="Lokasi" htmlFor="adu-lok">
            <div className="flex gap-2">
              <Input id="adu-lok" value={f.lokasi} onChange={(e) => set("lokasi", e.target.value)} placeholder="Jalan Mawar depan no 08" leftIcon={<MapPin className="h-4 w-4" />} />
              <Button type="button" variant="outline" size="icon" aria-label="Ambil lokasi saat ini" onClick={ambilLokasi} loading={locating}><LocateFixed className="h-4 w-4" /></Button>
            </div>
          </Field>
          <p className="flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Camera className="h-3.5 w-3.5" />Kamera</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Lokasi</span><span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />Lampiran</span> tersedia untuk melengkapi laporan.</p>
        </div>
      )}
    </Modal>
  );
}
