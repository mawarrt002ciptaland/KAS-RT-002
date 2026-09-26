import { useCallback, useMemo, useState } from "react";
import { ShoppingBag, Plus, MessageCircle, MapPin, Trash2, CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Marketplace } from "@/data/types";
import { useLoadState, usePendingCreate } from "@/hooks";
import { KATEGORI_MARKETPLACE } from "@/lib/constants";
import { formatRupiah, relativeTime, toWaNumber } from "@/lib/format";
import { cn, openWhatsApp } from "@/lib/utils";
import { Button, Input, Select, Textarea, Field, Tabs, Badge } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatusBadge, EmptyState, ErrorState, ListSkeleton, SearchInput, RupiahInput, InfoRow, FileUploadField, Avatar, type UploadValue } from "@/components/shared";

const EMOJI: Record<string, string> = { Makanan: "🍱", Jasa: "🛠️", Barang: "📦", Kuliner: "🍰", Otomotif: "🚗", Lainnya: "🛍️" };
const GRAD: Record<string, string> = { Makanan: "from-orange-200 to-amber-100", Jasa: "from-sky-200 to-cyan-100", Barang: "from-violet-200 to-fuchsia-100", Kuliner: "from-pink-200 to-rose-100", Otomotif: "from-slate-300 to-zinc-100", Lainnya: "from-emerald-200 to-lime-100" };
const EMPTY = { nama: "", kategori: "Kuliner", harga: 0, deskripsi: "", penjual: "", telepon: "", alamat: "", kondisi: "baru" as Marketplace["kondisi"], foto: null as UploadValue | null };

export default function MarketplaceView() {
  const items = useData((s) => s.marketplace);
  const warga = useData((s) => s.warga);
  const addMarketplace = useData((s) => s.addMarketplace);
  const updateMarketplace = useData((s) => s.updateMarketplace);
  const deleteMarketplace = useData((s) => s.deleteMarketplace);
  const { loading, error, refetch } = useLoadState();
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("semua");
  const [detail, setDetail] = useState<Marketplace | null>(null);
  const [del, setDel] = useState<Marketplace | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const openCreate = useCallback(() => { setForm(EMPTY); setFormOpen(true); }, []);
  usePendingCreate("marketplace", openCreate);

  const list = useMemo(() => { const s = q.trim().toLowerCase(); return items.filter((m) => (kat === "semua" || m.kategori === kat) && (!s || [m.nama, m.penjual, m.deskripsi, m.kategori].some((x) => x.toLowerCase().includes(s)))).sort((a, b) => (a.status === "terjual" ? 1 : 0) - (b.status === "terjual" ? 1 : 0)); }, [items, q, kat]);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));
  function submit() {
    if (!form.nama.trim() || form.harga <= 0 || !form.penjual.trim() || !form.telepon.trim()) return toast.error("Nama, harga, penjual, dan telepon wajib diisi");
    addMarketplace({ nama: form.nama.trim(), kategori: form.kategori, harga: form.harga, deskripsi: form.deskripsi.trim(), penjual: form.penjual.trim(), telepon: form.telepon.trim(), alamat: form.alamat || undefined, kondisi: form.kondisi, fotoUrl: form.foto?.url });
    toast.success("Produk ditayangkan di Marketplace");
    setFormOpen(false);
  }
  const hubungi = (m: Marketplace) => openWhatsApp(toWaNumber(m.telepon), `Halo ${m.penjual}, saya tertarik dengan "${m.nama}" (${formatRupiah(m.harga)}) di Marketplace RT 002. Apakah masih tersedia?`);

  return (
    <div className="space-y-5">
      <PageHeader title="Marketplace" description="Dagangan & jasa warga RT 002 Blok Mawar" icon={<ShoppingBag className="h-5 w-5" />} actions={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Pasang Iklan</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <SearchInput value={q} onChange={setQ} placeholder="Cari produk, jasa, penjual…" />
          <Tabs value={kat} onChange={setKat} items={[{ value: "semua", label: "Semua", count: items.length }, ...KATEGORI_MARKETPLACE.map((k) => ({ value: k, label: `${EMOJI[k]} ${k}`, count: items.filter((m) => m.kategori === k).length }))]} />
          {list.length === 0 ? (
            <EmptyState icon={<Store className="h-6 w-6" />} title="Belum ada produk" description="Pasang iklan dagangan atau jasa warga." action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Pasang Iklan</Button>} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((m) => (
                <li key={m.id} className={cn("min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm card-hover", m.status === "terjual" && "opacity-70")}>
                  <button onClick={() => setDetail(m)} className="block w-full text-left">
                    <div className={cn("relative flex h-36 items-center justify-center bg-gradient-to-br text-5xl", GRAD[m.kategori] ?? GRAD.Lainnya)}>
                      {m.fotoUrl ? <img src={m.fotoUrl} alt={m.nama} className="h-full w-full object-cover" /> : <span aria-hidden>{EMOJI[m.kategori] ?? "🛍️"}</span>}
                      <span className="absolute left-2 top-2"><StatusBadge status={m.status} /></span>
                      {m.kondisi === "bekas" && <span className="absolute right-2 top-2"><Badge tone="warning">Bekas</Badge></span>}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-[15px] font-semibold">{m.nama}</p>
                      <p className="mt-0.5 text-lg font-extrabold tabular text-primary">{formatRupiah(m.harga)}{m.kategori === "Jasa" && <span className="text-xs font-normal text-muted-foreground"> /mulai</span>}</p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground"><Avatar name={m.penjual} size="sm" className="h-5 w-5 text-[9px]" />{m.penjual} • {m.alamat}</p>
                    </div>
                  </button>
                  <div className="flex gap-2 px-3 pb-3">
                    <Button variant="whatsapp" size="sm" className="flex-1" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={() => hubungi(m)} disabled={m.status === "terjual"}>Hubungi</Button>
                    <Button variant="outline" size="sm" onClick={() => setDetail(m)}>Detail</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.nama} size="md"
        footer={detail && <><Button variant="ghost" className="text-destructive sm:mr-auto" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDel(detail)}>Hapus</Button>{detail.status === "tersedia" ? <Button variant="outline" leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={() => { updateMarketplace(detail.id, { status: "terjual" }); toast.success("Ditandai terjual"); setDetail(null); }}>Tandai Terjual</Button> : <Button variant="outline" onClick={() => { updateMarketplace(detail.id, { status: "tersedia" }); setDetail(null); }}>Tersedia Lagi</Button>}<Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={() => hubungi(detail)}>Hubungi Penjual</Button></>}>
        {detail && (
          <div className="space-y-4">
            <div className={cn("flex h-48 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-6xl", GRAD[detail.kategori] ?? GRAD.Lainnya)}>{detail.fotoUrl ? <img src={detail.fotoUrl} alt={detail.nama} className="h-full w-full object-cover" /> : <span aria-hidden>{EMOJI[detail.kategori]}</span>}</div>
            <div className="flex flex-wrap items-center gap-2"><p className="text-2xl font-extrabold tabular text-primary">{formatRupiah(detail.harga)}</p><StatusBadge status={detail.status} /><Badge tone="muted">{detail.kategori}</Badge><Badge tone={detail.kondisi === "baru" ? "success" : "warning"}>{detail.kondisi === "baru" ? "Baru" : "Bekas"}</Badge></div>
            <p className="text-sm leading-relaxed">{detail.deskripsi}</p>
            <dl className="divide-y rounded-xl border px-4"><InfoRow label="Penjual" value={detail.penjual} /><InfoRow label="Alamat" value={<span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{detail.alamat ?? "-"}, Blok Mawar</span>} /><InfoRow label="Telepon" value={detail.telepon} /><InfoRow label="Ditayangkan" value={relativeTime(detail.createdAt)} /></dl>
          </div>
        )}
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Pasang Iklan" description="Produk atau jasa warga RT 002" size="lg" fullOnMobile footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button><Button onClick={submit}>Tayangkan</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama produk / jasa" htmlFor="mk-nama" required className="sm:col-span-2"><Input id="mk-nama" value={form.nama} onChange={(e) => set("nama", e.target.value)} /></Field>
          <Field label="Kategori"><Select value={form.kategori} onChange={(e) => set("kategori", e.target.value)} options={KATEGORI_MARKETPLACE.map((k) => ({ value: k, label: `${EMOJI[k]} ${k}` }))} /></Field>
          <Field label="Harga (Rp)" htmlFor="mk-harga" required><RupiahInput id="mk-harga" value={form.harga} onChange={(n) => set("harga", n)} /></Field>
          <Field label="Penjual" required><Select value={form.penjual} onChange={(e) => { const w = warga.find((x) => x.nama === e.target.value); set("penjual", e.target.value); if (w) { set("telepon", w.telepon ?? ""); set("alamat", w.noRumah); } }} placeholder="Pilih warga" options={warga.map((w) => ({ value: w.nama, label: `${w.nama} — ${w.noRumah}` }))} /></Field>
          <Field label="Telepon / WhatsApp" htmlFor="mk-tel" required><Input id="mk-tel" type="tel" inputMode="tel" value={form.telepon} onChange={(e) => set("telepon", e.target.value)} /></Field>
          <Field label="Kondisi">
            <div className="grid grid-cols-2 gap-2">{(["baru", "bekas"] as const).map((k) => <button key={k} type="button" onClick={() => set("kondisi", k)} className={cn("min-h-[44px] rounded-xl border text-sm font-medium capitalize", form.kondisi === k ? "border-primary bg-primary/10 text-primary" : "bg-card")}>{k}</button>)}</div>
          </Field>
          <Field label="Alamat" htmlFor="mk-alamat"><Input id="mk-alamat" value={form.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="Mawar 08" /></Field>
          <Field label="Deskripsi" htmlFor="mk-desk" className="sm:col-span-2"><Textarea id="mk-desk" value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} /></Field>
          <div className="sm:col-span-2"><FileUploadField value={form.foto} onChange={(v) => set("foto", v)} accept="image/*" label="Foto produk" /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus iklan?" description={del?.nama} confirmLabel="Hapus" onConfirm={() => { if (del) { deleteMarketplace(del.id); setDetail(null); toast.success("Iklan dihapus"); } }} />
    </div>
  );
}
