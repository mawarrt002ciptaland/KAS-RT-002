import { useCallback, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Plus, Eye, Trash2, Calendar, Tag, AlignLeft, Wallet, User, Paperclip, ClipboardCheck, ChevronLeft, ChevronRight, Check, FileText, Hash, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Jenis, Transaksi } from "@/data/types";
import { useUI } from "@/store/ui";
import { useLoadState, usePendingCreate, usePendingSearch, useIsMobile } from "@/hooks";
import { KATEGORI_PEMASUKAN, KATEGORI_PENGELUARAN, METODE_BAYAR } from "@/lib/constants";
import { formatRupiah, formatTanggalID, formatTanggalLengkapID, toISODate, monthKey, periodeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { terbilangRupiah } from "@/lib/terbilang";
import { Button, Input, Select, Textarea, Field, Badge } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatCard, RupiahText, StatusBadge, EmptyState, ErrorState, ListSkeleton, SearchInput, TableShell, IconButton, RupiahInput, FileUploadField, InfoRow, FilterBar, type UploadValue } from "@/components/shared";

export function PemasukanView() { return <TransaksiView jenis="pemasukan" />; }
export function PengeluaranView() { return <TransaksiView jenis="pengeluaran" />; }

function TransaksiView({ jenis }: { jenis: Jenis }) {
  const isPem = jenis === "pemasukan";
  const all = useData((s) => s.transaksi);
  const kwitansi = useData((s) => s.kwitansi);
  const deleteTransaksi = useData((s) => s.deleteTransaksi);
  const addKwitansi = useData((s) => s.addKwitansi);
  const pengaturan = useData((s) => s.pengaturan);
  const navigate = useUI((s) => s.navigate);
  const { loading, error, refetch } = useLoadState();

  const [q, setQ] = useState(usePendingSearch(jenis));
  const [kategori, setKategori] = useState("");
  const [bulan, setBulan] = useState("");
  const [detail, setDetail] = useState<Transaksi | null>(null);
  const [del, setDel] = useState<Transaksi | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const openWizard = useCallback(() => setWizardOpen(true), []);
  usePendingCreate(jenis, openWizard);

  const list = useMemo(() => all.filter((t) => t.jenis === jenis).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()), [all, jenis]);
  const months = useMemo(() => Array.from(new Set(list.map((t) => monthKey(t.tanggal)))).sort().reverse(), [list]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter((t) => (!kategori || t.kategori === kategori) && (!bulan || monthKey(t.tanggal) === bulan) && (!s || [t.kode, t.keterangan, t.kategori, t.penerima, t.sumber].some((x) => x?.toLowerCase().includes(s))));
  }, [list, q, kategori, bulan]);

  const total = list.reduce((a, t) => a + t.nominal, 0);
  const thisMonth = list.filter((t) => monthKey(t.tanggal) === monthKey(new Date())).reduce((a, t) => a + t.nominal, 0);
  const avg = list.length ? Math.round(total / list.length) : 0;
  const kategoriList = isPem ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;
  const title = isPem ? "Pemasukan" : "Pengeluaran";
  const Icon = isPem ? TrendingUp : TrendingDown;

  function buatKwitansi(t: Transaksi) {
    const exists = kwitansi.find((k) => k.transaksiId === t.id);
    if (exists) { toast.info(`Kwitansi ${exists.kode} sudah ada`); navigate("kwitansi", { q: exists.kode }); return; }
    const k = addKwitansi({ transaksiId: t.id, wargaId: t.wargaId, tanggal: t.tanggal, nominal: t.nominal, penerima: pengaturan.nama_bendahara || "Bendahara RT 002", pembayar: t.sumber ?? t.penerima ?? "Warga RT 002", keterangan: t.keterangan });
    toast.success(`Kwitansi ${k.kode} dibuat`);
    setDetail(null);
    navigate("kwitansi", { q: k.kode });
  }

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={isPem ? "Catat & kelola pemasukan kas RT 002" : "Catat & kelola pengeluaran kas RT 002"} icon={<Icon className="h-5 w-5" />} actions={<Button onClick={openWizard} leftIcon={<Plus className="h-4 w-4" />}>Catat {title}</Button>} />

      {loading ? <ListSkeleton rows={3} /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={`Total ${title}`} tone={isPem ? "income" : "expense"} value={<RupiahText value={total} />} icon={<Icon className="h-5 w-5" />} hint="Seluruh periode" />
            <StatCard title="Jumlah Transaksi" tone="neutral" value={`${list.length} transaksi`} icon={<Hash className="h-5 w-5" />} hint={`${filtered.length} ditampilkan`} />
            <StatCard title="Bulan Ini" tone={isPem ? "income" : "expense"} value={<RupiahText value={thisMonth} />} icon={<Calendar className="h-5 w-5" />} hint={periodeLabel(monthKey(new Date()))} />
            <StatCard title="Rata-rata / Transaksi" tone="default" value={<RupiahText value={avg} />} icon={<Wallet className="h-5 w-5" />} />
          </div>

          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder={`Cari kode, keterangan, ${isPem ? "sumber" : "penerima"}…`} className="sm:!min-w-[260px]" />
            <Select value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="Semua Kategori" options={kategoriList.map((k) => ({ value: k, label: k }))} aria-label="Filter kategori" />
            <Select value={bulan} onChange={(e) => setBulan(e.target.value)} placeholder="Semua Bulan" options={months.map((m) => ({ value: m, label: periodeLabel(m) }))} aria-label="Filter bulan" />
            {(q || kategori || bulan) && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setKategori(""); setBulan(""); }}>Reset</Button>}
          </FilterBar>

          {filtered.length === 0 ? (
            <EmptyState icon={<Icon className="h-6 w-6" />} title={list.length ? "Tidak ada transaksi yang cocok" : `Belum ada ${title.toLowerCase()}`} description={list.length ? "Coba ubah kata kunci atau filter." : `Mulai catat ${title.toLowerCase()} kas RT.`} action={<Button onClick={openWizard} leftIcon={<Plus className="h-4 w-4" />}>Catat {title}</Button>} />
          ) : (
            <>
              {/* MOBILE: cards */}
              <ul className="grid gap-3 md:hidden">
                {filtered.map((t) => (
                  <li key={t.id} className="min-w-0 overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold leading-snug break-anywhere">{t.keterangan}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{t.kategori}</p>
                        <p className="text-sm text-muted-foreground">{formatTanggalID(t.tanggal)}</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn("text-lg font-bold tabular break-anywhere", isPem ? "text-success" : "text-destructive")}>{isPem ? "+ " : "- "}{formatRupiah(t.nominal)}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{t.kode}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setDetail(t)}>Detail</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" aria-label="Hapus" onClick={() => setDel(t)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* DESKTOP/TABLET: table (scrolls inside container only) */}
              <div className="hidden md:block">
                <TableShell>
                  <thead className="border-b bg-muted/40">
                    <tr><th>Tanggal</th><th>Kode</th><th>Keterangan</th><th>Kategori</th><th>{isPem ? "Sumber" : "Penerima"}</th><th className="!text-right">Nominal</th><th>Status</th><th className="!text-right">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="whitespace-nowrap">{formatTanggalID(t.tanggal)}</td>
                        <td className="whitespace-nowrap font-mono text-xs">{t.kode}</td>
                        <td className="max-w-[280px]"><p className="truncate font-medium" title={t.keterangan}>{t.keterangan}</p>{t.buktiUrl && <span className="text-[11px] text-muted-foreground"><Paperclip className="mr-0.5 inline h-3 w-3" />bukti</span>}</td>
                        <td className="whitespace-nowrap"><Badge tone="muted">{t.kategori}</Badge></td>
                        <td className="max-w-[160px] truncate">{isPem ? t.sumber : t.penerima}</td>
                        <td className={cn("whitespace-nowrap text-right font-bold tabular", isPem ? "text-success" : "text-destructive")}>{isPem ? "+" : "−"}{formatRupiah(t.nominal)}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <IconButton icon={<Eye className="h-4 w-4" />} label="Lihat detail" onClick={() => setDetail(t)} />
                            {isPem && <IconButton icon={<FileText className="h-4 w-4" />} label="Buat kwitansi" tone="primary" onClick={() => buatKwitansi(t)} />}
                            <IconButton icon={<Trash2 className="h-4 w-4" />} label="Hapus" tone="destructive" onClick={() => setDel(t)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/30">
                    <tr><td colSpan={5} className="text-right text-xs font-semibold uppercase text-muted-foreground">Total ditampilkan</td><td className={cn("text-right font-bold tabular", isPem ? "text-success" : "text-destructive")}>{formatRupiah(filtered.reduce((a, t) => a + t.nominal, 0))}</td><td colSpan={2} /></tr>
                  </tfoot>
                </TableShell>
              </div>
            </>
          )}
        </>
      )}

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Transaksi" description={detail?.kode} size="md"
        footer={detail && (
          <>
            <Button variant="ghost" className="text-destructive sm:mr-auto" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => { setDel(detail); }}>Hapus</Button>
            {isPem && <Button variant="outline" leftIcon={<FileText className="h-4 w-4" />} onClick={() => buatKwitansi(detail)}>Kwitansi</Button>}
            <Button onClick={() => setDetail(null)}>Tutup</Button>
          </>
        )}>
        {detail && (
          <div className="space-y-4">
            <div className={cn("rounded-xl p-4 text-center", isPem ? "bg-success/10" : "bg-destructive/10")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
              <p className={cn("mt-1 text-2xl font-extrabold tabular break-anywhere", isPem ? "text-success" : "text-destructive")}>{isPem ? "+ " : "- "}{formatRupiah(detail.nominal)}</p>
              <p className="mt-1 text-xs italic text-muted-foreground">{terbilangRupiah(detail.nominal)}</p>
            </div>
            <dl className="divide-y">
              <InfoRow label="Keterangan" value={detail.keterangan} />
              <InfoRow label="Kategori" value={detail.kategori} />
              <InfoRow label="Tanggal" value={formatTanggalLengkapID(detail.tanggal)} />
              <InfoRow label={isPem ? "Sumber" : "Penerima"} value={isPem ? detail.sumber : detail.penerima} />
              <InfoRow label="Metode" value={detail.metode} />
              <InfoRow label="Status" value={<StatusBadge status={detail.status} />} />
              <InfoRow label="Kode" value={<span className="font-mono">{detail.kode}</span>} />
            </dl>
            {detail.buktiUrl && (
              <div>
                <p className="mb-1.5 text-sm font-medium">Bukti Transaksi</p>
                {detail.buktiUrl.startsWith("data:image") ? <img src={detail.buktiUrl} alt="Bukti transaksi" className="max-h-72 w-full rounded-xl border object-contain" /> : <a href={detail.buktiUrl} download={detail.buktiNama} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 text-sm font-medium"><FileText className="h-4 w-4 text-primary" />{detail.buktiNama ?? "Unduh bukti"}</a>}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus transaksi ini?" description={<>Transaksi <span className="font-mono font-semibold">{del?.kode}</span> ({del && formatRupiah(del.nominal)}) akan dihapus permanen beserta kwitansinya.</>} confirmLabel="Hapus" onConfirm={async () => { if (!del) return; try { await deleteTransaksi(del.id); toast.success("Transaksi dihapus"); setDetail(null); } catch { toast.error("Transaksi belum dapat dihapus dari Neon."); } }} />

      <TransaksiWizard jenis={jenis} open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}

/* ===================== MULTI-STEP WIZARD ===================== */
type FieldKey = "tanggal" | "kategori" | "keterangan" | "nominal" | "pihak" | "bukti" | "review";
const FIELD_META: Record<FieldKey, { label: string; icon: typeof Calendar }> = {
  tanggal: { label: "Tanggal", icon: Calendar },
  kategori: { label: "Kategori", icon: Tag },
  keterangan: { label: "Keterangan", icon: AlignLeft },
  nominal: { label: "Nominal", icon: Wallet },
  pihak: { label: "Pihak", icon: User },
  bukti: { label: "Bukti", icon: Paperclip },
  review: { label: "Review", icon: ClipboardCheck },
};
const MOBILE_STEPS: FieldKey[][] = [["tanggal"], ["kategori"], ["keterangan"], ["nominal"], ["pihak"], ["bukti"], ["review"]];
const DESKTOP_STEPS: FieldKey[][] = [["tanggal", "kategori", "keterangan"], ["nominal", "pihak"], ["bukti"], ["review"]];

export function TransaksiWizard({ jenis, open, onClose }: { jenis: Jenis; open: boolean; onClose: () => void }) {
  const isPem = jenis === "pemasukan";
  const isMobile = useIsMobile();
  const addTransaksi = useData((s) => s.addTransaksi);
  const addKwitansi = useData((s) => s.addKwitansi);
  const pengaturan = useData((s) => s.pengaturan);
  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => ({ tanggal: toISODate(new Date()), kategori: "", keterangan: "", nominal: 0, pihak: "", metode: "Tunai", bukti: null as UploadValue | null, buatKwitansi: isPem }));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const kategoriList = isPem ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;
  const pihakLabel = isPem ? "Sumber Dana" : "Penerima";

  const reset = () => { setStep(0); setErrors({}); setForm({ tanggal: toISODate(new Date()), kategori: "", keterangan: "", nominal: 0, pihak: "", metode: "Tunai", bukti: null, buatKwitansi: isPem }); };
  const close = () => { onClose(); setTimeout(reset, 250); };
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function validate(fields: FieldKey[]) {
    const e: Partial<Record<FieldKey, string>> = {};
    for (const f of fields) {
      if (f === "tanggal" && !form.tanggal) e.tanggal = "Tanggal wajib diisi";
      if (f === "kategori" && !form.kategori) e.kategori = "Pilih kategori";
      if (f === "keterangan" && form.keterangan.trim().length < 3) e.keterangan = "Keterangan minimal 3 karakter";
      if (f === "nominal" && form.nominal <= 0) e.nominal = "Nominal harus lebih dari 0";
      if (f === "pihak" && !form.pihak.trim()) e.pihak = `${pihakLabel} wajib diisi`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  const next = () => { if (validate(steps[step])) setStep((s) => Math.min(steps.length - 1, s + 1)); };
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function save() {
    if (!validate(["tanggal", "kategori", "keterangan", "nominal", "pihak"])) { setStep(0); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 250));
      const t = await addTransaksi({
        jenis,
        tanggal: new Date(form.tanggal + "T09:00:00").toISOString(),
        kategori: form.kategori,
        keterangan: form.keterangan.trim(),
        nominal: form.nominal,
        penerima: isPem ? undefined : form.pihak.trim(),
        sumber: isPem ? form.pihak.trim() : undefined,
        metode: form.metode,
        buktiUrl: form.bukti?.url,
        buktiNama: form.bukti?.name,
      });
      if (isPem && form.buatKwitansi) {
        const k = addKwitansi({ transaksiId: t.id, tanggal: t.tanggal, nominal: t.nominal, penerima: pengaturan.nama_bendahara || "Bendahara RT 002", pembayar: form.pihak.trim(), keterangan: t.keterangan });
        toast.success(`${isPem ? "Pemasukan" : "Pengeluaran"} ${t.kode} tersimpan • Kwitansi ${k.kode}`);
      } else {
        toast.success(`${isPem ? "Pemasukan" : "Pengeluaran"} ${t.kode} berhasil disimpan`);
      }
      close();
    } catch {
      toast.error("Transaksi belum dapat disimpan ke Neon. Coba sinkronkan ulang lalu ulangi.");
    } finally {
      setSaving(false);
    }
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const totalSteps = steps.length;

  const renderField = (f: FieldKey) => {
    switch (f) {
      case "tanggal":
        return <Field key={f} label="Tanggal transaksi" htmlFor="wz-tanggal" required error={errors.tanggal}><Input id="wz-tanggal" type="date" value={form.tanggal} max={toISODate(new Date(Date.now() + 86400000 * 366))} onChange={(e) => set("tanggal", e.target.value)} data-autofocus /></Field>;
      case "kategori":
        return (
          <Field key={f} label="Kategori" required error={errors.kategori}>
            {isMobile ? (
              <div className="grid grid-cols-1 gap-2" role="radiogroup">
                {kategoriList.map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={form.kategori === k} onClick={() => set("kategori", k)} className={cn("flex min-h-[48px] items-center justify-between rounded-xl border px-4 text-left text-[15px] font-medium", form.kategori === k ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted")}>{k}{form.kategori === k && <Check className="h-4 w-4" />}</button>
                ))}
              </div>
            ) : (
              <Select value={form.kategori} onChange={(e) => set("kategori", e.target.value)} placeholder="Pilih kategori" options={kategoriList.map((k) => ({ value: k, label: k }))} />
            )}
          </Field>
        );
      case "keterangan":
        return <Field key={f} label="Keterangan" htmlFor="wz-ket" required error={errors.keterangan} hint="Contoh: Upah sebar lapkas"><Textarea id="wz-ket" value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} placeholder={isPem ? "Iuran bulanan warga Agustus 2026" : "Upah sebar lapkas"} rows={isMobile ? 4 : 3} /></Field>;
      case "nominal":
        return (
          <Field key={f} label="Nominal (Rp)" htmlFor="wz-nominal" required error={errors.nominal} hint={form.nominal > 0 ? `${formatRupiah(form.nominal)} — ${terbilangRupiah(form.nominal)}` : "Masukkan angka tanpa titik, format otomatis"}>
            <RupiahInput id="wz-nominal" value={form.nominal} onChange={(n) => set("nominal", n)} large={isMobile} />
            <div className="mt-2 flex flex-wrap gap-2">
              {[25000, 50000, 100000, 500000].map((n) => <button key={n} type="button" onClick={() => set("nominal", n)} className="min-h-[36px] rounded-full border px-3 text-xs font-medium hover:bg-muted">{formatRupiah(n)}</button>)}
            </div>
          </Field>
        );
      case "pihak":
        return (
          <div key={f} className="space-y-4">
            <Field label={pihakLabel} htmlFor="wz-pihak" required error={errors.pihak}><Input id="wz-pihak" value={form.pihak} onChange={(e) => set("pihak", e.target.value)} placeholder={isPem ? "Warga RT 002 / Donatur" : "Bendahara RT / Tukang"} data-autofocus /></Field>
            <Field label="Metode pembayaran">
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {METODE_BAYAR.map((m) => <button key={m} type="button" role="radio" aria-checked={form.metode === m} onClick={() => set("metode", m)} className={cn("flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border text-sm font-medium", form.metode === m ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted")}><CreditCard className="h-4 w-4" />{m}</button>)}
              </div>
            </Field>
          </div>
        );
      case "bukti":
        return <FileUploadField key={f} value={form.bukti} onChange={(v) => set("bukti", v)} label="Bukti transaksi (opsional)" />;
      case "review":
        return (
          <div key={f} className="space-y-3">
            <div className={cn("rounded-xl p-4 text-center", isPem ? "bg-success/10" : "bg-destructive/10")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{isPem ? "Pemasukan" : "Pengeluaran"}</p>
              <p className={cn("mt-1 text-2xl font-extrabold tabular break-anywhere", isPem ? "text-success" : "text-destructive")}>{formatRupiah(form.nominal)}</p>
              <p className="mt-1 text-xs italic text-muted-foreground">{terbilangRupiah(form.nominal)}</p>
            </div>
            <dl className="divide-y rounded-xl border px-4">
              <InfoRow label="Tanggal" value={formatTanggalLengkapID(form.tanggal)} />
              <InfoRow label="Kategori" value={form.kategori} />
              <InfoRow label="Keterangan" value={form.keterangan} />
              <InfoRow label={pihakLabel} value={form.pihak} />
              <InfoRow label="Metode" value={form.metode} />
              <InfoRow label="Bukti" value={form.bukti ? form.bukti.name : "Tidak ada"} />
            </dl>
            {form.bukti?.type.startsWith("image/") && <img src={form.bukti.url} alt="Bukti" className="max-h-40 w-full rounded-xl border object-contain" />}
            {isPem && (
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-2">
                <input type="checkbox" checked={form.buatKwitansi} onChange={(e) => set("buatKwitansi", e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
                <span className="text-sm font-medium">Buat kwitansi otomatis</span>
              </label>
            )}
          </div>
        );
    }
  };

  return (
    <Modal open={open} onClose={close} fullOnMobile size="lg" title={`Catat ${isPem ? "Pemasukan" : "Pengeluaran"}`} description={`Langkah ${step + 1} dari ${totalSteps} — ${current.map((c) => FIELD_META[c].label).join(", ")}`}
      footer={
        <>
          {step > 0 ? <Button variant="outline" onClick={back} leftIcon={<ChevronLeft className="h-4 w-4" />} className="sm:mr-auto">Kembali</Button> : <Button variant="ghost" onClick={close} className="sm:mr-auto">Batal</Button>}
          {isLast ? (
            <Button onClick={save} loading={saving} leftIcon={<Check className="h-4 w-4" />} size="lg" className="sm:h-11">Simpan</Button>
          ) : (
            <Button onClick={next} size="lg" className="sm:h-11">Lanjut <ChevronRight className="h-4 w-4" /></Button>
          )}
        </>
      }>
      {/* Progress */}
      <ol className="mb-5 flex items-center gap-1.5" aria-label="Progres langkah">
        {steps.map((s, i) => {
          const Ico = FIELD_META[s[0]].icon;
          return (
            <li key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className={cn("h-1.5 w-full rounded-full", i < step ? "bg-success" : i === step ? "bg-primary" : "bg-muted")} />
              <span className={cn("hidden items-center gap-1 text-[10px] font-medium sm:flex", i === step ? "text-primary" : "text-muted-foreground")}><Ico className="h-3 w-3" />{s.map((x) => FIELD_META[x].label).join(" · ")}</span>
            </li>
          );
        })}
      </ol>
      <div className="space-y-5">{current.map(renderField)}</div>
    </Modal>
  );
}
