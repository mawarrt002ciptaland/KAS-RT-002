import { useMemo, useState } from "react";
import { Link2, Plus, ExternalLink, Trash2, Globe, MessageCircle, Landmark, Music2, Phone } from "lucide-react";

const Youtube = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" /></svg>
);
const Instagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Tautan } from "@/data/types";
import { useLoadState } from "@/hooks";
import { KATEGORI_TAUTAN, RT_INFO } from "@/lib/constants";
import { toWaNumber, maskPhone } from "@/lib/format";
import { cn, openExternal, openWhatsApp, isValidUrl } from "@/lib/utils";
import { Button, Input, Select, Textarea, Field, Tabs } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, SectionTitle, EmptyState, ErrorState, ListSkeleton, Avatar, IconButton } from "@/components/shared";

function brandOf(t: Tautan) {
  const u = t.url.toLowerCase();
  if (u.includes("youtube")) return { icon: Youtube, bg: "bg-[#ff0000]", cta: "Lihat Channel" };
  if (u.includes("instagram")) return { icon: Instagram, bg: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]", cta: "Lihat Profil" };
  if (u.includes("tiktok")) return { icon: Music2, bg: "bg-black", cta: "Lihat TikTok" };
  if (u.includes("wa.me") || u.includes("whatsapp")) return { icon: MessageCircle, bg: "bg-[#25D366]", cta: t.judul.toLowerCase().includes("grup") ? "Gabung Grup" : "Hubungi Admin" };
  if (t.kategori === "Pemerintah") return { icon: Landmark, bg: "bg-[#b45309]", cta: "Buka Portal" };
  return { icon: Globe, bg: "bg-primary", cta: "Kunjungi Website" };
}

export default function TautanView() {
  const tautan = useData((s) => s.tautan);
  const pengurus = useData((s) => s.pengurus);
  const addTautan = useData((s) => s.addTautan);
  const deleteTautan = useData((s) => s.deleteTautan);
  const { loading, error, refetch } = useLoadState();
  const [kat, setKat] = useState("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [del, setDel] = useState<Tautan | null>(null);
  const [f, setF] = useState({ judul: "", url: "", kategori: "Umum", deskripsi: "" });
  const list = useMemo(() => tautan.filter((t) => kat === "semua" || t.kategori === kat).sort((a, b) => a.urutan - b.urutan), [tautan, kat]);

  function submit() {
    if (!f.judul.trim() || !isValidUrl(f.url)) return toast.error("Judul dan URL (https://…) wajib diisi");
    addTautan({ judul: f.judul.trim(), url: f.url.trim(), kategori: f.kategori, deskripsi: f.deskripsi.trim() || undefined });
    toast.success("Tautan ditambahkan"); setFormOpen(false); setF({ judul: "", url: "", kategori: "Umum", deskripsi: "" });
  }
  const open = (t: Tautan) => (t.url.includes("wa.me") ? openWhatsApp(t.url.split("wa.me/")[1] ?? RT_INFO.whatsappAdmin, RT_INFO.pesanAduan) : openExternal(t.url));

  return (
    <div className="space-y-5">
      <PageHeader title="Tautan & Kontak" description="Tautan penting & kontak pengurus RT 002" icon={<Link2 className="h-5 w-5" />} actions={<Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Tambah Tautan</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <Button variant="whatsapp" fullWidth size="lg" leftIcon={<MessageCircle className="h-5 w-5" />} onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, RT_INFO.pesanAduan)}>💬 WhatsApp Aduan Warga</Button>
          <Tabs value={kat} onChange={setKat} items={[{ value: "semua", label: "Semua", count: tautan.length }, ...KATEGORI_TAUTAN.map((k) => ({ value: k, label: k, count: tautan.filter((t) => t.kategori === k).length }))]} />
          {list.length === 0 ? <EmptyState icon={<Link2 className="h-6 w-6" />} title="Belum ada tautan" action={<Button onClick={() => setFormOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Tambah Tautan</Button>} /> : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((t) => { const b = brandOf(t); return (
                <li key={t.id} className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm card-hover">
                  <div className="flex items-start gap-3 p-4">
                    <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", b.bg)}>{t.logo ? <img src={t.logo} alt="" className="h-full w-full rounded-xl object-cover" /> : <b.icon className="h-6 w-6" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug break-anywhere">{t.judul}</p>
                      <p className="text-xs text-muted-foreground">{t.kategori}</p>
                      {t.deskripsi && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.deskripsi}</p>}
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{t.url.replace(/^https?:\/\//, "")}</p>
                    </div>
                    <IconButton icon={<Trash2 className="h-4 w-4" />} label="Hapus" tone="destructive" onClick={() => setDel(t)} />
                  </div>
                  <div className="px-4 pb-4"><Button fullWidth variant={t.url.includes("wa.me") ? "whatsapp" : "outline"} leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => open(t)}>{b.cta}</Button></div>
                </li>
              ); })}
            </ul>
          )}
          <section>
            <SectionTitle title="Kontak Pengurus" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {pengurus.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-3"><Avatar name={p.nama} src={p.foto} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.nama}</span><span className="block truncate text-xs text-muted-foreground">{p.jabatan} • {maskPhone(p.telepon)}</span></span>{p.telepon && <><a href={`tel:${p.telepon}`} aria-label={`Telepon ${p.nama}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><Phone className="h-4 w-4" /></a><IconButton icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" tone="whatsapp" onClick={() => openWhatsApp(toWaNumber(p.telepon), `Halo ${p.jabatan} ${p.nama}, `)} /></>}</li>
              ))}
            </ul>
          </section>
        </>
      )}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Tambah Tautan" size="sm" footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button><Button onClick={submit}>Simpan</Button></>}>
        <div className="space-y-4">
          <Field label="Judul" htmlFor="tl-judul" required><Input id="tl-judul" value={f.judul} onChange={(e) => setF({ ...f, judul: e.target.value })} /></Field>
          <Field label="URL" htmlFor="tl-url" required><Input id="tl-url" type="url" inputMode="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" /></Field>
          <Field label="Kategori"><Select value={f.kategori} onChange={(e) => setF({ ...f, kategori: e.target.value })} options={KATEGORI_TAUTAN.map((k) => ({ value: k, label: k }))} /></Field>
          <Field label="Deskripsi" htmlFor="tl-desk"><Textarea id="tl-desk" rows={2} value={f.deskripsi} onChange={(e) => setF({ ...f, deskripsi: e.target.value })} /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus tautan?" description={del?.judul} confirmLabel="Hapus" onConfirm={() => { if (del) { deleteTautan(del.id); toast.success("Tautan dihapus"); } }} />
    </div>
  );
}
