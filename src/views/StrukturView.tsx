import { useMemo, useState } from "react";
import { Network, Plus, Phone, MessageCircle, Pencil, Trash2, Crown, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Pengurus } from "@/data/types";
import { useLoadState } from "@/hooks";
import { maskPhone, toWaNumber } from "@/lib/format";
import { cn, openWhatsApp, isValidUrl } from "@/lib/utils";
import { Button, Input, Field, Badge } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, EmptyState, ErrorState, ListSkeleton, Avatar, FileUploadField, IconButton, type UploadValue } from "@/components/shared";

const EMPTY = { nama: "", jabatan: "", bidang: "", telepon: "", email: "", periode: "2024-2027", foto: null as UploadValue | null, fotoUrl: "" };

function PengurusCard({ p, tier, onEdit, onDelete }: { p: Pengurus; tier: 1 | 2 | 3; onEdit: () => void; onDelete: () => void }) {
  const wa = () => p.telepon ? openWhatsApp(toWaNumber(p.telepon), `Halo ${p.jabatan} ${p.nama}, `) : toast.error("Nomor tidak tersedia");
  return (
    <div className={cn("relative min-w-0 rounded-2xl border bg-card p-4 text-center shadow-sm card-hover", tier === 1 && "border-primary/40 bg-gradient-to-b from-primary/10 to-card sm:p-6")}>
      {tier === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground"><Crown className="mr-1 inline h-3 w-3" />Ketua</span>}
      <Avatar name={p.nama} src={p.foto} size={tier === 1 ? "xl" : "lg"} className={cn("mx-auto", tier === 1 ? "h-24 w-24 text-2xl ring-4 ring-primary/20" : "h-16 w-16 text-lg ring-2 ring-primary/10")} />
      <p className={cn("mt-3 font-bold leading-tight break-anywhere", tier === 1 ? "text-lg" : "text-[15px]")}>{p.nama}</p>
      <p className="text-sm font-medium text-primary">{p.jabatan}</p>
      {p.bidang && <Badge tone="muted" className="mt-1.5">{p.bidang}</Badge>}
      <p className="mt-2 text-xs text-muted-foreground tabular">{maskPhone(p.telepon)}</p>
      <div className="mt-3 flex justify-center gap-1">
        {p.telepon && <a href={`tel:${p.telepon}`} aria-label={`Telepon ${p.nama}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><Phone className="h-4 w-4" /></a>}
        <IconButton icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" tone="whatsapp" onClick={wa} />
        <IconButton icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={onEdit} />
        <IconButton icon={<Trash2 className="h-4 w-4" />} label="Hapus" tone="destructive" onClick={onDelete} />
      </div>
    </div>
  );
}

export default function StrukturView() {
  const pengurus = useData((s) => s.pengurus);
  const pengaturan = useData((s) => s.pengaturan);
  const addPengurus = useData((s) => s.addPengurus);
  const updatePengurus = useData((s) => s.updatePengurus);
  const deletePengurus = useData((s) => s.deletePengurus);
  const { loading, error, refetch } = useLoadState();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [del, setDel] = useState<Pengurus | null>(null);

  const sorted = useMemo(() => [...pengurus].sort((a, b) => a.urutan - b.urutan), [pengurus]);
  const ketua = sorted.find((p) => /ketua/i.test(p.jabatan));
  const tier2 = sorted.filter((p) => p !== ketua && /(sekretaris|bendahara|wakil)/i.test(p.jabatan));
  const tier3 = sorted.filter((p) => p !== ketua && !tier2.includes(p));
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openCreate() { setEditId(null); setForm({ ...EMPTY, periode: pengaturan.periode_pengurus || "2024-2027" }); setFormOpen(true); }
  function openEdit(p: Pengurus) { setEditId(p.id); setForm({ nama: p.nama, jabatan: p.jabatan, bidang: p.bidang ?? "", telepon: p.telepon ?? "", email: p.email ?? "", periode: p.periode, foto: p.foto ? { url: p.foto, name: "foto", type: "image/jpeg", size: 0 } : null, fotoUrl: "" }); setFormOpen(true); }
  function submit() {
    if (!form.nama.trim() || !form.jabatan.trim()) return toast.error("Nama dan jabatan wajib diisi");
    const foto = form.foto?.url || (isValidUrl(form.fotoUrl) ? form.fotoUrl : undefined);
    const payload = { nama: form.nama.trim(), jabatan: form.jabatan.trim(), bidang: form.bidang.trim() || undefined, telepon: form.telepon.trim() || undefined, email: form.email.trim() || undefined, periode: form.periode, foto };
    if (editId) { updatePengurus(editId, payload); toast.success("Data pengurus diperbarui"); } else { addPengurus({ ...payload, urutan: pengurus.length + 1 }); toast.success("Pengurus ditambahkan"); }
    setFormOpen(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Struktur Pengurus RT 002" description={`Periode ${pengaturan.periode_pengurus} • Blok Mawar Ciptaland`} icon={<Network className="h-5 w-5" />} actions={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Tambah Pengurus</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : sorted.length === 0 ? (
        <EmptyState icon={<Network className="h-6 w-6" />} title="Belum ada pengurus" action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Tambah Pengurus</Button>} />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-4 text-center sm:p-6">
            <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary"><Sparkles className="h-3.5 w-3.5" />Bagan Organisasi</p>
            <h2 className="mt-1 text-fluid-h3 font-extrabold">Pengurus RT 002 / RW 014</h2>
            <p className="text-sm text-muted-foreground">Blok Mawar • Perumahan Ciptaland • Batam</p>
          </div>
          {ketua && <div className="mx-auto max-w-sm pt-3"><PengurusCard p={ketua} tier={1} onEdit={() => openEdit(ketua)} onDelete={() => setDel(ketua)} /></div>}
          {tier2.length > 0 && (
            <div>
              <div className="mx-auto h-6 w-px bg-border" aria-hidden />
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sekretariat & Keuangan</p>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">{tier2.map((p) => <PengurusCard key={p.id} p={p} tier={2} onEdit={() => openEdit(p)} onDelete={() => setDel(p)} />)}</div>
            </div>
          )}
          {tier3.length > 0 && (
            <div>
              <div className="mx-auto h-6 w-px bg-border" aria-hidden />
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><Shield className="mr-1 inline h-3.5 w-3.5" />Koordinator Bidang</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{tier3.map((p) => <PengurusCard key={p.id} p={p} tier={3} onEdit={() => openEdit(p)} onDelete={() => setDel(p)} />)}</div>
            </div>
          )}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "Edit Pengurus" : "Tambah Pengurus"} size="md" footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button><Button onClick={submit}>Simpan</Button></>}>
        <div className="space-y-4">
          <div className="flex items-center gap-4"><Avatar name={form.nama || "?"} src={form.foto?.url || (isValidUrl(form.fotoUrl) ? form.fotoUrl : undefined)} size="xl" className="h-20 w-20 text-xl" /><div className="min-w-0 flex-1"><FileUploadField value={form.foto} onChange={(v) => set("foto", v)} accept="image/*" label="Foto pengurus" compact /></div></div>
          <Field label="Atau tempel URL foto" htmlFor="pg-url"><Input id="pg-url" type="url" inputMode="url" value={form.fotoUrl} onChange={(e) => set("fotoUrl", e.target.value)} placeholder="https://…" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" htmlFor="pg-nama" required className="sm:col-span-2"><Input id="pg-nama" value={form.nama} onChange={(e) => set("nama", e.target.value)} /></Field>
            <Field label="Jabatan" htmlFor="pg-jab" required><Input id="pg-jab" value={form.jabatan} onChange={(e) => set("jabatan", e.target.value)} placeholder="Koordinator Keamanan" /></Field>
            <Field label="Bidang" htmlFor="pg-bidang"><Input id="pg-bidang" value={form.bidang} onChange={(e) => set("bidang", e.target.value)} placeholder="Keamanan" /></Field>
            <Field label="Telepon / WhatsApp" htmlFor="pg-tel"><Input id="pg-tel" type="tel" inputMode="tel" value={form.telepon} onChange={(e) => set("telepon", e.target.value)} /></Field>
            <Field label="Email" htmlFor="pg-email"><Input id="pg-email" type="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Periode" htmlFor="pg-periode"><Input id="pg-periode" value={form.periode} onChange={(e) => set("periode", e.target.value)} /></Field>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus pengurus?" description={`${del?.nama} — ${del?.jabatan}`} confirmLabel="Hapus" onConfirm={() => { if (del) { deletePengurus(del.id); toast.success("Pengurus dihapus"); } }} />
    </div>
  );
}
