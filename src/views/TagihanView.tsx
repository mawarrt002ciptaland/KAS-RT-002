import { useCallback, useMemo, useState } from "react";
import { ReceiptText, Plus, CheckCircle2, Clock, AlertTriangle, MessageCircle, Trash2, Wallet, Check, Users } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Tagihan } from "@/data/types";
import { useLoadState, usePendingCreate, usePendingSearch } from "@/hooks";
import { JENIS_TAGIHAN, JENIS_TAGIHAN_LABEL, METODE_BAYAR } from "@/lib/constants";
import { formatRupiah, formatTanggalID, toISODate, periodeLabel, monthKey } from "@/lib/format";
import { cn, openWhatsApp } from "@/lib/utils";
import { toWaNumber } from "@/lib/format";
import { Button, Input, Select, Textarea, Field, Tabs } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatCard, RupiahText, StatusBadge, EmptyState, ErrorState, ListSkeleton, SearchInput, TableShell, IconButton, RupiahInput, FilterBar, Avatar } from "@/components/shared";

type StatusFilter = "semua" | "belum_bayar" | "telat" | "lunas";

export default function TagihanView() {
  const tagihan = useData((s) => s.tagihan);
  const warga = useData((s) => s.warga);
  const pengaturan = useData((s) => s.pengaturan);
  const addTagihanBulk = useData((s) => s.addTagihanBulk);
  const bayarTagihan = useData((s) => s.bayarTagihan);
  const deleteTagihan = useData((s) => s.deleteTagihan);
  const { loading, error, refetch } = useLoadState();

  const [q, setQ] = useState(usePendingSearch("tagihan"));
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [periode, setPeriode] = useState("");
  const [bayar, setBayar] = useState<Tagihan | null>(null);
  const [metode, setMetode] = useState("Tunai");
  const [del, setDel] = useState<Tagihan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const openCreate = useCallback(() => setCreateOpen(true), []);
  usePendingCreate("tagihan", openCreate);

  const wargaMap = useMemo(() => new Map(warga.map((w) => [w.id, w])), [warga]);
  const periodes = useMemo(() => Array.from(new Set(tagihan.map((t) => t.periode))).sort().reverse(), [tagihan]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tagihan
      .filter((t) => (status === "semua" || t.status === status) && (!periode || t.periode === periode))
      .filter((t) => { if (!s) return true; const w = wargaMap.get(t.wargaId); return [t.kode, w?.nama, w?.noRumah, t.periode, JENIS_TAGIHAN_LABEL[t.jenis]].some((x) => x?.toLowerCase().includes(s)); })
      .sort((a, b) => (a.status === "lunas" ? 1 : 0) - (b.status === "lunas" ? 1 : 0) || b.periode.localeCompare(a.periode));
  }, [tagihan, status, periode, q, wargaMap]);

  const counts = { lunas: tagihan.filter((t) => t.status === "lunas").length, belum: tagihan.filter((t) => t.status === "belum_bayar").length, telat: tagihan.filter((t) => t.status === "telat").length };
  const tunggakan = tagihan.filter((t) => t.status !== "lunas").reduce((a, t) => a + t.jumlah + t.denda, 0);

  function ingatkan(t: Tagihan) {
    const w = wargaMap.get(t.wargaId);
    if (!w?.telepon) return toast.error("Nomor WhatsApp warga tidak tersedia");
    openWhatsApp(toWaNumber(w.telepon), `Assalamu'alaikum / Selamat ${new Date().getHours() < 15 ? "siang" : "sore"} ${w.nama},\n\nKami dari Pengurus RT 002 Blok Mawar mengingatkan tagihan ${JENIS_TAGIHAN_LABEL[t.jenis]} periode ${periodeLabel(t.periode)} sebesar ${formatRupiah(t.jumlah + t.denda)} (${t.kode}) yang jatuh tempo ${formatTanggalID(t.tanggalJatuhTempo)}.\n\nPembayaran dapat dilakukan tunai ke Bendahara, transfer ${pengaturan.bank_nama} ${pengaturan.bank_rekening} a.n. ${pengaturan.bank_pemilik}, atau QRIS.\n\nTerima kasih 🙏`);
  }

  async function konfirmasiBayar() {
    if (!bayar) return;
    try {
      const r = await bayarTagihan(bayar.id, metode);
      if (r) toast.success(`Tagihan ${bayar.kode} lunas • Kwitansi ${r.kwitansi.kode} dibuat`);
      setBayar(null);
    } catch {
      toast.error("Pembayaran belum dapat disimpan. Coba lagi.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Tagihan Warga" description="Kelola tagihan iuran warga RT 002" icon={<ReceiptText className="h-5 w-5" />} actions={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Buat Tagihan</Button>} />

      {loading ? <ListSkeleton rows={3} /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Tunggakan" tone="warning" value={<RupiahText value={tunggakan} />} icon={<Wallet className="h-5 w-5" />} hint={`${counts.belum + counts.telat} tagihan belum lunas`} />
            <StatCard title="Lunas" tone="income" value={`${counts.lunas} tagihan`} icon={<CheckCircle2 className="h-5 w-5" />} hint={`dari ${tagihan.length} tagihan`} />
            <StatCard title="Belum Bayar" tone="neutral" value={`${counts.belum} tagihan`} icon={<Clock className="h-5 w-5" />} />
            <StatCard title="Telat" tone="expense" value={`${counts.telat} tagihan`} icon={<AlertTriangle className="h-5 w-5" />} hint="Lewat jatuh tempo" />
          </div>

          <Tabs value={status} onChange={setStatus} items={[{ value: "semua", label: "Semua", count: tagihan.length }, { value: "belum_bayar", label: "Belum Bayar", count: counts.belum }, { value: "telat", label: "Telat", count: counts.telat }, { value: "lunas", label: "Lunas", count: counts.lunas }]} />
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Cari nama warga, no. rumah, kode…" className="sm:!min-w-[260px]" />
            <Select value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="Semua Periode" options={periodes.map((p) => ({ value: p, label: periodeLabel(p) }))} aria-label="Filter periode" />
          </FilterBar>

          {filtered.length === 0 ? (
            <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="Belum ada tagihan" description={tagihan.length ? "Tidak ada tagihan yang cocok dengan filter." : "Buat tagihan iuran untuk warga."} action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Buat Tagihan</Button>} />
          ) : (
            <>
              <ul className="grid gap-3 md:hidden">
                {filtered.map((t) => {
                  const w = wargaMap.get(t.wargaId);
                  return (
                    <li key={t.id} className="min-w-0 overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Avatar name={w?.nama} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold">{w?.nama ?? "-"}</p>
                          <p className="text-sm text-muted-foreground">{w?.noRumah} • {JENIS_TAGIHAN_LABEL[t.jenis]}</p>
                          <p className="text-sm text-muted-foreground">{periodeLabel(t.periode)} • Jatuh tempo {formatTanggalID(t.tanggalJatuhTempo)}</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div><p className="text-lg font-bold tabular">{formatRupiah(t.jumlah + t.denda)}</p><p className="font-mono text-xs text-muted-foreground">{t.kode}</p></div>
                        {t.status === "lunas" && t.tanggalBayar && <p className="text-xs text-success">Dibayar {formatTanggalID(t.tanggalBayar)} • {t.metode}</p>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {t.status !== "lunas" ? (
                          <>
                            <Button size="sm" className="flex-1" leftIcon={<Check className="h-4 w-4" />} onClick={() => { setBayar(t); setMetode("Tunai"); }}>Tandai Lunas</Button>
                            <Button size="sm" variant="whatsapp" aria-label="Ingatkan via WhatsApp" onClick={() => ingatkan(t)}><MessageCircle className="h-4 w-4" /></Button>
                          </>
                        ) : <span className="flex-1" />}
                        <Button size="sm" variant="ghost" className="text-destructive" aria-label="Hapus" onClick={() => setDel(t)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden md:block">
                <TableShell>
                  <thead className="border-b bg-muted/40"><tr><th>Kode</th><th>Warga</th><th>Jenis</th><th>Periode</th><th>Jatuh Tempo</th><th className="!text-right">Jumlah</th><th>Status</th><th className="!text-right">Aksi</th></tr></thead>
                  <tbody className="divide-y">
                    {filtered.map((t) => {
                      const w = wargaMap.get(t.wargaId);
                      return (
                        <tr key={t.id} className="hover:bg-muted/30">
                          <td className="whitespace-nowrap font-mono text-xs">{t.kode}</td>
                          <td><div className="flex items-center gap-2"><Avatar name={w?.nama} size="sm" /><div className="min-w-0"><p className="truncate font-medium">{w?.nama}</p><p className="text-xs text-muted-foreground">{w?.noRumah}</p></div></div></td>
                          <td className="whitespace-nowrap">{JENIS_TAGIHAN_LABEL[t.jenis]}</td>
                          <td className="whitespace-nowrap">{periodeLabel(t.periode)}</td>
                          <td className="whitespace-nowrap">{formatTanggalID(t.tanggalJatuhTempo)}</td>
                          <td className="whitespace-nowrap text-right font-bold tabular">{formatRupiah(t.jumlah + t.denda)}</td>
                          <td><StatusBadge status={t.status} />{t.status === "lunas" && t.tanggalBayar && <p className="mt-0.5 text-[11px] text-muted-foreground">{formatTanggalID(t.tanggalBayar)} • {t.metode}</p>}</td>
                          <td>
                            <div className="flex justify-end gap-1">
                              {t.status !== "lunas" && <IconButton icon={<Check className="h-4 w-4" />} label="Tandai lunas" tone="primary" onClick={() => { setBayar(t); setMetode("Tunai"); }} />}
                              {t.status !== "lunas" && <IconButton icon={<MessageCircle className="h-4 w-4" />} label="Ingatkan via WhatsApp" tone="whatsapp" onClick={() => ingatkan(t)} />}
                              <IconButton icon={<Trash2 className="h-4 w-4" />} label="Hapus" tone="destructive" onClick={() => setDel(t)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableShell>
              </div>
            </>
          )}
        </>
      )}

      {/* Bayar modal */}
      <Modal open={!!bayar} onClose={() => setBayar(null)} title="Tandai Lunas" description={bayar?.kode} size="sm"
        footer={<><Button variant="outline" onClick={() => setBayar(null)}>Batal</Button><Button onClick={konfirmasiBayar} leftIcon={<Check className="h-4 w-4" />}>Konfirmasi Lunas</Button></>}>
        {bayar && (
          <div className="space-y-4">
            <div className="rounded-xl bg-success/10 p-4 text-center"><p className="text-xs text-muted-foreground">{wargaMap.get(bayar.wargaId)?.nama} • {periodeLabel(bayar.periode)}</p><p className="mt-1 text-2xl font-extrabold tabular text-success">{formatRupiah(bayar.jumlah + bayar.denda)}</p></div>
            <Field label="Metode pembayaran">
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {METODE_BAYAR.map((m) => <button key={m} type="button" role="radio" aria-checked={metode === m} onClick={() => setMetode(m)} className={cn("min-h-[44px] rounded-xl border text-sm font-medium", metode === m ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted")}>{m}</button>)}
              </div>
            </Field>
            <p className="text-xs text-muted-foreground">Pemasukan & kwitansi akan dibuat otomatis.</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus tagihan?" description={<>Tagihan <span className="font-mono font-semibold">{del?.kode}</span> akan dihapus.</>} confirmLabel="Hapus" onConfirm={() => { if (del) { deleteTagihan(del.id); toast.success("Tagihan dihapus"); } }} />

      <CreateTagihanModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(inputs) => { const n = addTagihanBulk(inputs); toast.success(n ? `${n} tagihan berhasil dibuat` : "Tagihan sudah ada untuk periode tersebut"); }} />
    </div>
  );
}

function CreateTagihanModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (inputs: Parameters<ReturnType<typeof useData.getState>["addTagihanBulk"]>[0]) => void }) {
  const warga = useData((s) => s.warga);
  const pengaturan = useData((s) => s.pengaturan);
  const [mode, setMode] = useState<"semua" | "satu">("semua");
  const [wargaId, setWargaId] = useState("");
  const [jenis, setJenis] = useState("iuran_bulanan");
  const [periode, setPeriode] = useState(monthKey(new Date()));
  const [jumlah, setJumlah] = useState(Number(pengaturan.iuran_bulanan) || 25000);
  const [jatuhTempo, setJatuhTempo] = useState(() => { const d = new Date(); return toISODate(new Date(d.getFullYear(), d.getMonth(), 10)); });
  const [keterangan, setKeterangan] = useState("");
  const aktif = warga.filter((w) => w.status === "aktif");

  function changeJenis(v: string) {
    setJenis(v);
    const j = JENIS_TAGIHAN.find((x) => x.value === v);
    if (j?.settingKey && pengaturan[j.settingKey]) setJumlah(Number(pengaturan[j.settingKey]));
  }
  function submit() {
    if (!periode || jumlah <= 0 || !jatuhTempo) return toast.error("Periode, jumlah, dan jatuh tempo wajib diisi");
    const targets = mode === "semua" ? aktif : aktif.filter((w) => w.id === wargaId);
    if (!targets.length) return toast.error("Pilih warga terlebih dahulu");
    onCreate(targets.map((w) => ({ wargaId: w.id, jenis, periode, jumlah, tanggalJatuhTempo: new Date(jatuhTempo + "T09:00:00").toISOString(), keterangan: keterangan || `${JENIS_TAGIHAN_LABEL[jenis]} ${periodeLabel(periode)}` })));
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title="Buat Tagihan" description="Terbitkan tagihan iuran untuk warga" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={submit} leftIcon={<Plus className="h-4 w-4" />}>Terbitkan {mode === "semua" ? `(${aktif.length} warga)` : ""}</Button></>}>
      <div className="space-y-4">
        <Field label="Penerima tagihan">
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            <button type="button" role="radio" aria-checked={mode === "semua"} onClick={() => setMode("semua")} className={cn("flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-sm font-medium", mode === "semua" ? "border-primary bg-primary/10 text-primary" : "bg-card")}><Users className="h-4 w-4" />Semua warga</button>
            <button type="button" role="radio" aria-checked={mode === "satu"} onClick={() => setMode("satu")} className={cn("flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-sm font-medium", mode === "satu" ? "border-primary bg-primary/10 text-primary" : "bg-card")}>Satu warga</button>
          </div>
        </Field>
        {mode === "satu" && <Field label="Warga" required><Select value={wargaId} onChange={(e) => setWargaId(e.target.value)} placeholder="Pilih warga" options={aktif.map((w) => ({ value: w.id, label: `${w.nama} — ${w.noRumah}` }))} /></Field>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jenis tagihan" required><Select value={jenis} onChange={(e) => changeJenis(e.target.value)} options={JENIS_TAGIHAN.map((j) => ({ value: j.value, label: j.label }))} /></Field>
          <Field label="Periode" htmlFor="tg-periode" required><Input id="tg-periode" type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} /></Field>
          <Field label="Jumlah (Rp)" htmlFor="tg-jumlah" required><RupiahInput id="tg-jumlah" value={jumlah} onChange={setJumlah} /></Field>
          <Field label="Jatuh tempo" htmlFor="tg-jt" required><Input id="tg-jt" type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} /></Field>
        </div>
        <Field label="Keterangan" htmlFor="tg-ket"><Textarea id="tg-ket" rows={2} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder={`${JENIS_TAGIHAN_LABEL[jenis]} ${periodeLabel(periode)}`} /></Field>
      </div>
    </Modal>
  );
}
