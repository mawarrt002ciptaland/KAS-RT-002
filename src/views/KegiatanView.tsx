import { useCallback, useMemo, useState } from "react";
import { CalendarDays, Plus, MapPin, Users, Clock, Trash2, ChevronRight, CheckCircle2, Share2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Kegiatan } from "@/data/types";
import { useLoadState, usePendingCreate } from "@/hooks";
import { KATEGORI_KEGIATAN } from "@/lib/constants";
import { BULAN_SHORT, formatTanggalLengkapID, formatTanggalID, toISODate, relativeTime } from "@/lib/format";
import { cn, shareContent } from "@/lib/utils";
import { Button, Input, Select, Textarea, Field, Tabs, Badge } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatusBadge, EmptyState, ErrorState, ListSkeleton, InfoRow, FileUploadField, type UploadValue } from "@/components/shared";

type SF = "semua" | "akan_datang" | "berlangsung" | "selesai";

function DateBadge({ date, size = "sm", status }: { date: string; size?: "sm" | "lg"; status: Kegiatan["status"] }) {
  const d = new Date(date);
  const tone = { akan_datang: "bg-primary text-primary-foreground", berlangsung: "bg-success text-success-foreground", selesai: "bg-muted text-muted-foreground", dibatalkan: "bg-destructive/10 text-destructive border border-destructive/30" }[status];
  return (
    <div className={cn("flex shrink-0 flex-col items-center justify-center rounded-xl leading-none", tone, size === "lg" ? "h-16 w-16" : "h-12 w-12")} aria-hidden>
      <span className={cn("font-extrabold", size === "lg" ? "text-2xl" : "text-lg")}>{d.getDate()}</span>
      <span className={cn("font-semibold uppercase", size === "lg" ? "text-[11px]" : "text-[10px]")}>{BULAN_SHORT[d.getMonth()]}</span>
    </div>
  );
}

const EMPTY_FORM = { judul: "", kategori: "Sosial", tanggalMulai: "", jam: "07:00", tanggalSelesai: "", lokasi: "", deskripsi: "", jumlahPeserta: 0, status: "akan_datang" as Kegiatan["status"], foto: null as UploadValue | null };

export default function KegiatanView() {
  const kegiatan = useData((s) => s.kegiatan);
  const addKegiatan = useData((s) => s.addKegiatan);
  const updateKegiatan = useData((s) => s.updateKegiatan);
  const deleteKegiatan = useData((s) => s.deleteKegiatan);
  const { loading, error, refetch } = useLoadState();
  const [sf, setSf] = useState<SF>("semua");
  const [kat, setKat] = useState("");
  const [detail, setDetail] = useState<Kegiatan | null>(null);
  const [del, setDel] = useState<Kegiatan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const openCreate = useCallback(() => { setEditId(null); setForm({ ...EMPTY_FORM, tanggalMulai: toISODate(new Date()) }); setFormOpen(true); }, []);
  usePendingCreate("kegiatan", openCreate);

  const list = useMemo(() => kegiatan.filter((k) => (sf === "semua" || k.status === sf) && (!kat || k.kategori === kat)).sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime()), [kegiatan, sf, kat]);
  const featured = useMemo(() => (sf === "semua" || sf === "akan_datang") ? [...kegiatan].filter((k) => k.status === "akan_datang").sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime())[0] : undefined, [kegiatan, sf]);
  const set = <K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openEdit(k: Kegiatan) {
    setEditId(k.id);
    setForm({ judul: k.judul, kategori: k.kategori, tanggalMulai: toISODate(k.tanggalMulai), jam: k.jam ?? "07:00", tanggalSelesai: k.tanggalSelesai ? toISODate(k.tanggalSelesai) : "", lokasi: k.lokasi ?? "", deskripsi: k.deskripsi, jumlahPeserta: k.jumlahPeserta, status: k.status, foto: k.fotoUrl ? { url: k.fotoUrl, name: "foto", type: "image/jpeg", size: 0 } : null });
    setDetail(null);
    setFormOpen(true);
  }
  function submit() {
    if (!form.judul.trim() || !form.tanggalMulai) return toast.error("Judul dan tanggal mulai wajib diisi");
    const payload = { judul: form.judul.trim(), kategori: form.kategori, tanggalMulai: new Date(`${form.tanggalMulai}T${form.jam || "07:00"}:00`).toISOString(), tanggalSelesai: form.tanggalSelesai ? new Date(form.tanggalSelesai + "T12:00:00").toISOString() : undefined, jam: form.jam, lokasi: form.lokasi.trim() || undefined, deskripsi: form.deskripsi.trim() || `${form.judul.trim()} akan dilaksanakan di ${form.lokasi || "lingkungan RT 002"}.`, jumlahPeserta: form.jumlahPeserta, status: form.status, fotoUrl: form.foto?.url };
    if (editId) { updateKegiatan(editId, payload); toast.success("Kegiatan diperbarui"); } else { addKegiatan(payload); toast.success("Kegiatan ditambahkan"); }
    setFormOpen(false);
  }
  const share = (k: Kegiatan) => shareContent({ title: k.judul, text: `📅 ${k.judul}\n${formatTanggalLengkapID(k.tanggalMulai)}${k.jam ? ` pukul ${k.jam}` : ""}\n📍 ${k.lokasi ?? "-"}\n\n${k.deskripsi}\n\n— Pengurus RT 002 Blok Mawar` }).then((r) => r === "copied" && toast.success("Detail kegiatan disalin"));

  return (
    <div className="space-y-5">
      <PageHeader title="Kegiatan Warga" description="Agenda & kegiatan RT 002 Blok Mawar" icon={<CalendarDays className="h-5 w-5" />} actions={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Tambah Kegiatan</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Tabs value={sf} onChange={setSf} className="min-w-0 flex-1" items={[{ value: "semua", label: "Semua", count: kegiatan.length }, { value: "akan_datang", label: "Akan Datang", count: kegiatan.filter((k) => k.status === "akan_datang").length }, { value: "berlangsung", label: "Berlangsung" }, { value: "selesai", label: "Selesai", count: kegiatan.filter((k) => k.status === "selesai").length }]} />
            <div className="sm:w-52"><Select value={kat} onChange={(e) => setKat(e.target.value)} placeholder="Semua Kategori" options={KATEGORI_KEGIATAN.map((k) => ({ value: k, label: k }))} aria-label="Filter kategori" /></div>
          </div>

          {featured && !kat && (
            <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
              <div className="flex gap-4">
                <DateBadge date={featured.tanggalMulai} size="lg" status={featured.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Kegiatan Mendatang</p>
                  <h3 className="mt-0.5 text-lg font-bold leading-snug break-anywhere sm:text-xl">{featured.judul}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <Badge tone="primary">{featured.kategori}</Badge>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTanggalLengkapID(featured.tanggalMulai)}{featured.jam ? ` • ${featured.jam}` : ""}</span>
                    {featured.lokasi && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{featured.lokasi}</span>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{featured.deskripsi}</p>
                  <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => setDetail(featured)}>Lihat Detail</Button><Button size="sm" variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={() => share(featured)}>Bagikan</Button></div>
                </div>
              </div>
            </section>
          )}

          {list.length === 0 ? (
            <EmptyState icon={sf === "selesai" ? <CheckCircle2 className="h-6 w-6" /> : <CalendarDays className="h-6 w-6" />} title="Belum ada kegiatan" description="Tambahkan agenda kegiatan warga RT 002." action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Tambah Kegiatan</Button>} />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {list.map((k) => (
                <li key={k.id}>
                  <button onClick={() => setDetail(k)} className="card-hover flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left hover:border-primary/40">
                    <DateBadge date={k.tanggalMulai} status={k.status} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2"><span className="text-[15px] font-semibold leading-snug break-anywhere">{k.judul}</span><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /></span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5"><Badge tone="muted">{k.kategori}</Badge><StatusBadge status={k.status} /></span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatTanggalID(k.tanggalMulai)}{k.jam ? ` • ${k.jam}` : ""}</span>
                        {k.lokasi && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{k.lokasi}</span>}
                        {k.jumlahPeserta > 0 && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{k.jumlahPeserta} peserta</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Kegiatan" size="lg"
        footer={detail && <><Button variant="ghost" className="text-destructive sm:mr-auto" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDel(detail)}>Hapus</Button><Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(detail)}>Edit</Button><Button variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={() => share(detail)}>Bagikan</Button>{detail.status === "akan_datang" && <Button leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={() => { updateKegiatan(detail.id, { status: "selesai", tanggalSelesai: new Date().toISOString() }); toast.success("Kegiatan ditandai selesai"); setDetail(null); }}>Tandai Selesai</Button>}</>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start gap-4"><DateBadge date={detail.tanggalMulai} size="lg" status={detail.status} /><div className="min-w-0"><h3 className="text-lg font-bold leading-snug break-anywhere">{detail.judul}</h3><div className="mt-1 flex flex-wrap gap-1.5"><Badge tone="primary">{detail.kategori}</Badge><StatusBadge status={detail.status} /></div></div></div>
            {detail.fotoUrl && <img src={detail.fotoUrl} alt={detail.judul} className="max-h-64 w-full rounded-xl border object-cover" />}
            <p className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">{detail.deskripsi}</p>
            <dl className="divide-y rounded-xl border px-4">
              <InfoRow label="Waktu" value={`${formatTanggalLengkapID(detail.tanggalMulai)}${detail.jam ? ` • ${detail.jam} WIB` : ""}`} />
              {detail.tanggalSelesai && <InfoRow label="Selesai" value={formatTanggalLengkapID(detail.tanggalSelesai)} />}
              <InfoRow label="Lokasi" value={detail.lokasi ?? "-"} />
              <InfoRow label="Peserta" value={`${detail.jumlahPeserta} orang`} />
              <InfoRow label="Dibuat" value={relativeTime(detail.createdAt)} />
            </dl>
          </div>
        )}
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "Edit Kegiatan" : "Tambah Kegiatan"} size="lg" fullOnMobile footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button><Button onClick={submit}>Simpan Kegiatan</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Judul kegiatan" htmlFor="kg-judul" required className="sm:col-span-2"><Input id="kg-judul" value={form.judul} onChange={(e) => set("judul", e.target.value)} placeholder="Kerja Bakti Bersih Lingkungan" /></Field>
          <Field label="Kategori"><Select value={form.kategori} onChange={(e) => set("kategori", e.target.value)} options={KATEGORI_KEGIATAN.map((k) => ({ value: k, label: k }))} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => set("status", e.target.value as Kegiatan["status"])} options={[{ value: "akan_datang", label: "Akan Datang" }, { value: "berlangsung", label: "Berlangsung" }, { value: "selesai", label: "Selesai" }, { value: "dibatalkan", label: "Dibatalkan" }]} /></Field>
          <Field label="Tanggal mulai" htmlFor="kg-tgl" required><Input id="kg-tgl" type="date" value={form.tanggalMulai} onChange={(e) => set("tanggalMulai", e.target.value)} /></Field>
          <Field label="Jam" htmlFor="kg-jam"><Input id="kg-jam" type="time" value={form.jam} onChange={(e) => set("jam", e.target.value)} /></Field>
          <Field label="Tanggal selesai" htmlFor="kg-tgl2"><Input id="kg-tgl2" type="date" value={form.tanggalSelesai} onChange={(e) => set("tanggalSelesai", e.target.value)} /></Field>
          <Field label="Perkiraan peserta" htmlFor="kg-peserta"><Input id="kg-peserta" type="number" inputMode="numeric" min={0} value={form.jumlahPeserta} onChange={(e) => set("jumlahPeserta", Number(e.target.value))} /></Field>
          <Field label="Lokasi" htmlFor="kg-lok" className="sm:col-span-2"><Input id="kg-lok" value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)} placeholder="Pos RT 002 / Taman Mawar" /></Field>
          <Field label="Deskripsi" htmlFor="kg-desk" className="sm:col-span-2"><Textarea id="kg-desk" rows={4} value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} /></Field>
          <div className="sm:col-span-2"><FileUploadField value={form.foto} onChange={(v) => set("foto", v)} accept="image/*" label="Foto kegiatan (opsional)" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus kegiatan ini?" description={del?.judul} confirmLabel="Hapus" onConfirm={() => { if (del) { deleteKegiatan(del.id); setDetail(null); toast.success("Kegiatan dihapus"); } }} />
    </div>
  );
}
