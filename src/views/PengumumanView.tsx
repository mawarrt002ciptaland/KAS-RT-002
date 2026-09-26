import { useCallback, useMemo, useState } from "react";
import { Megaphone, Plus, Archive, Trash2, Share2, Pin, Send, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Pengumuman } from "@/data/types";
import { useUI } from "@/store/ui";
import { useLoadState, usePendingCreate } from "@/hooks";
import { KATEGORI_PENGUMUMAN } from "@/lib/constants";
import { formatTanggalLengkapID, relativeTime, formatTanggalID } from "@/lib/format";
import { cn, shareContent } from "@/lib/utils";
import { Button, Input, Select, Textarea, Field, Tabs, Badge } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatusBadge, EmptyState, ErrorState, ListSkeleton, SearchInput, FilterBar } from "@/components/shared";

type SF = "aktif" | "arsip" | "semua";
const EMPTY = { judul: "", konten: "", kategori: "Umum", prioritas: "normal" as Pengumuman["prioritas"], penulis: "Sekretaris RT 002" };

export default function PengumumanView() {
  const pengumuman = useData((s) => s.pengumuman);
  const addPengumuman = useData((s) => s.addPengumuman);
  const updatePengumuman = useData((s) => s.updatePengumuman);
  const deletePengumuman = useData((s) => s.deletePengumuman);
  const navigate = useUI((s) => s.navigate);
  const { loading, error, refetch } = useLoadState();
  const [q, setQ] = useState("");
  const [sf, setSf] = useState<SF>("aktif");
  const [kat, setKat] = useState("");
  const [detail, setDetail] = useState<Pengumuman | null>(null);
  const [del, setDel] = useState<Pengumuman | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const openCreate = useCallback(() => { setEditId(null); setForm(EMPTY); setFormOpen(true); }, []);
  usePendingCreate("pengumuman", openCreate);

  const list = useMemo(() => { const s = q.trim().toLowerCase(); const order = { mendesak: 0, penting: 1, normal: 2 }; return pengumuman.filter((p) => (sf === "semua" || p.status === sf) && (!kat || p.kategori === kat) && (!s || [p.judul, p.konten].some((x) => x.toLowerCase().includes(s)))).sort((a, b) => (sf !== "arsip" ? order[a.prioritas] - order[b.prioritas] : 0) || new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()); }, [pengumuman, q, sf, kat]);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    if (!form.judul.trim() || form.konten.trim().length < 10) return toast.error("Judul dan isi pengumuman (min. 10 karakter) wajib diisi");
    if (editId) { updatePengumuman(editId, { ...form, judul: form.judul.trim(), konten: form.konten.trim() }); toast.success("Pengumuman diperbarui"); }
    else { addPengumuman({ ...form, judul: form.judul.trim(), konten: form.konten.trim(), status: "aktif", tanggal: new Date().toISOString() }); toast.success("Pengumuman diterbitkan"); }
    setFormOpen(false);
  }
  const share = (p: Pengumuman) => shareContent({ title: p.judul, text: `📢 *${p.judul}*\n\n${p.konten}\n\n— ${p.penulis ?? "Pengurus RT 002"} • ${formatTanggalID(p.tanggal)}` }).then((r) => r === "copied" && toast.success("Pengumuman disalin ke clipboard"));
  const prioTone = (p: Pengumuman["prioritas"]) => p === "mendesak" ? "border-l-destructive" : p === "penting" ? "border-l-warning" : "border-l-primary";

  return (
    <div className="space-y-5">
      <PageHeader title="Pengumuman" description="Pengumuman & informasi resmi RT 002" icon={<Megaphone className="h-5 w-5" />} actions={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Buat Pengumuman</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <Tabs value={sf} onChange={setSf} items={[{ value: "aktif", label: "Aktif", count: pengumuman.filter((p) => p.status === "aktif").length }, { value: "arsip", label: "Arsip", count: pengumuman.filter((p) => p.status === "arsip").length }, { value: "semua", label: "Semua" }]} />
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Cari pengumuman…" className="sm:!min-w-[260px]" />
            <Select value={kat} onChange={(e) => setKat(e.target.value)} placeholder="Semua Kategori" options={KATEGORI_PENGUMUMAN.map((k) => ({ value: k, label: k }))} aria-label="Filter kategori" />
          </FilterBar>
          {list.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-6 w-6" />} title="Belum ada pengumuman" description="Terbitkan pengumuman untuk warga RT 002." action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Buat Pengumuman</Button>} />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {list.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setDetail(p)} className={cn("card-hover w-full rounded-xl border border-l-4 bg-card p-4 text-left hover:border-primary/40", prioTone(p.prioritas))}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5">{p.prioritas !== "normal" && <StatusBadge status={p.prioritas} />}<Badge tone="muted">{p.kategori}</Badge>{p.status === "arsip" && <StatusBadge status="arsip" />}</div><h3 className="mt-1.5 text-[15px] font-semibold leading-snug break-anywhere">{p.judul}</h3></div>
                      {p.prioritas === "mendesak" && <Pin className="h-4 w-4 shrink-0 text-destructive" />}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.konten}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{p.penulis} • {relativeTime(p.tanggal)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Pengumuman" size="lg"
        footer={detail && <><Button variant="ghost" className="text-destructive sm:mr-auto" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDel(detail)}>Hapus</Button><Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => { setEditId(detail.id); setForm({ judul: detail.judul, konten: detail.konten, kategori: detail.kategori, prioritas: detail.prioritas, penulis: detail.penulis ?? "" }); setDetail(null); setFormOpen(true); }}>Edit</Button>{detail.status === "aktif" ? <Button variant="outline" leftIcon={<Archive className="h-4 w-4" />} onClick={() => { updatePengumuman(detail.id, { status: "arsip" }); toast.success("Diarsipkan"); setDetail(null); }}>Arsipkan</Button> : <Button variant="outline" onClick={() => { updatePengumuman(detail.id, { status: "aktif" }); setDetail(null); }}>Aktifkan</Button>}<Button variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={() => share(detail)}>Bagikan</Button><Button variant="whatsapp" leftIcon={<Send className="h-4 w-4" />} onClick={() => { navigate("whatsapp", { q: `📢 *${detail.judul}*\n\n${detail.konten}` }); }}>Broadcast WA</Button></>}>
        {detail && (
          <article className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5"><StatusBadge status={detail.prioritas} /><Badge tone="muted">{detail.kategori}</Badge><StatusBadge status={detail.status} /></div>
            <h3 className="text-xl font-bold leading-snug break-anywhere">{detail.judul}</h3>
            <p className="text-xs text-muted-foreground">{detail.penulis} • {formatTanggalLengkapID(detail.tanggal)}</p>
            <p className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-[15px] leading-relaxed">{detail.konten}</p>
          </article>
        )}
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "Edit Pengumuman" : "Buat Pengumuman"} size="lg" fullOnMobile footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button><Button onClick={submit} leftIcon={<Megaphone className="h-4 w-4" />}>{editId ? "Simpan" : "Terbitkan"}</Button></>}>
        <div className="space-y-4">
          <Field label="Judul" htmlFor="pg-judul" required><Input id="pg-judul" value={form.judul} onChange={(e) => set("judul", e.target.value)} placeholder="Pemberitahuan Kerja Bakti" /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kategori"><Select value={form.kategori} onChange={(e) => set("kategori", e.target.value)} options={KATEGORI_PENGUMUMAN.map((k) => ({ value: k, label: k }))} /></Field>
            <Field label="Prioritas"><Select value={form.prioritas} onChange={(e) => set("prioritas", e.target.value as Pengumuman["prioritas"])} options={[{ value: "normal", label: "Normal" }, { value: "penting", label: "Penting" }, { value: "mendesak", label: "Mendesak" }]} /></Field>
            <Field label="Penulis" htmlFor="pg-penulis"><Input id="pg-penulis" value={form.penulis} onChange={(e) => set("penulis", e.target.value)} /></Field>
          </div>
          <Field label="Isi pengumuman" htmlFor="pg-isi" required><Textarea id="pg-isi" rows={7} value={form.konten} onChange={(e) => set("konten", e.target.value)} placeholder="Mengumumkan kepada seluruh warga RT 002 Blok Mawar…" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus pengumuman?" description={del?.judul} confirmLabel="Hapus" onConfirm={() => { if (del) { deletePengumuman(del.id); setDetail(null); toast.success("Pengumuman dihapus"); } }} />
    </div>
  );
}
