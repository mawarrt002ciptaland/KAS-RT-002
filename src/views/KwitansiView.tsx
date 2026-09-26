import { useCallback, useMemo, useState } from "react";
import { FileText, Plus, Eye, Printer, Share2, Download, Wallet, Calendar, QrCode, Building2, Stamp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Kwitansi, Pengaturan } from "@/data/types";
import { useLoadState, usePendingSearch } from "@/hooks";
import { RT_INFO } from "@/lib/constants";
import { formatRupiah, formatTanggalID, formatTanggalLengkapID, toISODate } from "@/lib/format";
import { terbilangRupiah } from "@/lib/terbilang";
import { escapeHtml, printHtmlDocument, shareContent, downloadBlob } from "@/lib/utils";
import { Button, Input, Textarea, Field } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatCard, RupiahText, EmptyState, ErrorState, ListSkeleton, SearchInput, TableShell, IconButton, RupiahInput, FilterBar } from "@/components/shared";

export default function KwitansiView() {
  const kwitansi = useData((s) => s.kwitansi);
  const pengaturan = useData((s) => s.pengaturan);
  const addKwitansi = useData((s) => s.addKwitansi);
  const deleteKwitansi = useData((s) => s.deleteKwitansi);
  const { loading, error, refetch } = useLoadState();
  const [q, setQ] = useState(usePendingSearch("kwitansi"));
  const [detail, setDetail] = useState<Kwitansi | null>(null);
  const [del, setDel] = useState<Kwitansi | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ nominal: 0, pembayar: "", penerima: "", keterangan: "", tanggal: toISODate(new Date()) });

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...kwitansi].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).filter((k) => !s || [k.kode, k.keterangan, k.pembayar, k.penerima].some((x) => x?.toLowerCase().includes(s)));
  }, [kwitansi, q]);
  const totalNominal = kwitansi.reduce((a, k) => a + k.nominal, 0);
  const todayCount = kwitansi.filter((k) => toISODate(k.tanggal) === toISODate(new Date())).length;

  const doPrint = useCallback((k: Kwitansi) => {
    const r = printHtmlDocument(`Kwitansi ${k.kode}`, buildReceiptHtml(k, pengaturan), `Kwitansi-${k.kode}.html`);
    toast.success(r === "opened" ? "Kwitansi dibuka — pilih 'Simpan sebagai PDF' pada dialog cetak" : `File Kwitansi-${k.kode}.html diunduh`);
  }, [pengaturan]);
  const doDownload = useCallback((k: Kwitansi) => {
    downloadBlob(`Kwitansi-${k.kode}.html`, `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Kwitansi ${k.kode}</title></head><body>${buildReceiptHtml(k, pengaturan)}</body></html>`, "text/html;charset=utf-8");
    toast.success(`File Kwitansi-${k.kode}.html diunduh`);
  }, [pengaturan]);
  const doShare = useCallback(async (k: Kwitansi) => {
    const r = await shareContent({ title: `Kwitansi ${k.kode}`, text: `KWITANSI ${k.kode}\n${RT_INFO.namaLengkap}\n\nTelah terima dari: ${k.pembayar}\nUang sejumlah: ${formatRupiah(k.nominal)} (${terbilangRupiah(k.nominal)})\nUntuk pembayaran: ${k.keterangan}\nTanggal: ${formatTanggalLengkapID(k.tanggal)}\nDiterima oleh: ${k.penerima}` });
    if (r === "copied") toast.success("Detail kwitansi disalin ke clipboard");
    else if (r === "shared") toast.success("Kwitansi dibagikan");
  }, []);

  function submit() {
    if (form.nominal <= 0) return toast.error("Nominal wajib diisi");
    if (!form.pembayar.trim()) return toast.error("Nama pembayar wajib diisi");
    const k = addKwitansi({ tanggal: new Date(form.tanggal + "T09:00:00").toISOString(), nominal: form.nominal, pembayar: form.pembayar.trim(), penerima: form.penerima.trim() || pengaturan.nama_bendahara || "Bendahara RT 002", keterangan: form.keterangan.trim() || "Pembayaran" });
    toast.success(`Kwitansi ${k.kode} dibuat`);
    setCreateOpen(false);
    setForm({ nominal: 0, pembayar: "", penerima: "", keterangan: "", tanggal: toISODate(new Date()) });
    setDetail(k);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Kwitansi" description="Cetak & kelola kwitansi resmi RT 002" icon={<FileText className="h-5 w-5" />} actions={<Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Buat Kwitansi</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard title="Total Kwitansi" value={`${kwitansi.length} dokumen`} icon={<FileText className="h-5 w-5" />} />
            <StatCard title="Nilai Total" tone="income" value={<RupiahText value={totalNominal} />} icon={<Wallet className="h-5 w-5" />} />
            <StatCard title="Dibuat Hari Ini" tone="neutral" value={`${todayCount} kwitansi`} icon={<Calendar className="h-5 w-5" />} />
          </div>
          <FilterBar><SearchInput value={q} onChange={setQ} placeholder="Cari kode, pembayar, keterangan…" className="sm:!min-w-[300px]" /></FilterBar>
          {list.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title="Belum ada kwitansi" description="Kwitansi dibuat otomatis saat pemasukan/pelunasan tagihan, atau buat manual." action={<Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Buat Kwitansi</Button>} />
          ) : (
            <>
              <ul className="grid gap-3 md:hidden">
                {list.map((k) => (
                  <li key={k.id} className="min-w-0 overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2"><span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">{k.kode}</span><span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><Stamp className="h-3.5 w-3.5" />Resmi</span></div>
                    <p className="mt-2 text-xl font-extrabold tabular text-success break-anywhere">{formatRupiah(k.nominal)}</p>
                    <p className="text-sm text-muted-foreground">{formatTanggalID(k.tanggal)} • dari {k.pembayar}</p>
                    <p className="mt-1 line-clamp-2 text-sm">{k.keterangan}</p>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDetail(k)} aria-label="Lihat"><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => doPrint(k)} aria-label="Cetak"><Printer className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => doShare(k)} aria-label="Bagikan"><Share2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => doDownload(k)} aria-label="Unduh"><Download className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
                <TableShell>
                  <thead className="border-b bg-muted/40"><tr><th>Kode</th><th>Tanggal</th><th className="!text-right">Nominal</th><th>Pembayar</th><th>Penerima</th><th>Keterangan</th><th className="!text-right">Aksi</th></tr></thead>
                  <tbody className="divide-y">
                    {list.map((k) => (
                      <tr key={k.id} className="hover:bg-muted/30">
                        <td className="whitespace-nowrap font-mono text-xs font-bold text-primary">{k.kode}</td>
                        <td className="whitespace-nowrap">{formatTanggalID(k.tanggal)}</td>
                        <td className="whitespace-nowrap text-right font-bold tabular text-success">{formatRupiah(k.nominal)}</td>
                        <td className="max-w-[160px] truncate">{k.pembayar}</td>
                        <td className="max-w-[160px] truncate">{k.penerima}</td>
                        <td className="max-w-[240px] truncate" title={k.keterangan}>{k.keterangan}</td>
                        <td><div className="flex justify-end gap-1">
                          <IconButton icon={<Eye className="h-4 w-4" />} label="Lihat" onClick={() => setDetail(k)} />
                          <IconButton icon={<Printer className="h-4 w-4" />} label="Cetak / PDF" onClick={() => doPrint(k)} />
                          <IconButton icon={<Share2 className="h-4 w-4" />} label="Bagikan" onClick={() => doShare(k)} />
                          <IconButton icon={<Download className="h-4 w-4" />} label="Unduh" onClick={() => doDownload(k)} />
                          <IconButton icon={<Trash2 className="h-4 w-4" />} label="Hapus" tone="destructive" onClick={() => setDel(k)} />
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </TableShell>
              </div>
            </>
          )}
        </>
      )}

      {/* Receipt preview */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Pratinjau Kwitansi" description={detail?.kode} size="lg" bodyClassName="bg-muted/40 p-3 sm:p-6"
        footer={detail && <><Button variant="ghost" className="text-destructive sm:mr-auto" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDel(detail)}>Hapus</Button><Button variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={() => doShare(detail)}>Share</Button><Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => doPrint(detail)}>Print</Button><Button leftIcon={<Download className="h-4 w-4" />} onClick={() => doPrint(detail)}>Download PDF</Button></>}>
        {detail && <Receipt k={detail} p={pengaturan} />}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Kwitansi" description="Kwitansi manual (tanpa transaksi)" size="md" footer={<><Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button><Button onClick={submit} leftIcon={<Plus className="h-4 w-4" />}>Buat Kwitansi</Button></>}>
        <div className="space-y-4">
          <Field label="Nominal (Rp)" htmlFor="kw-nominal" required hint={form.nominal > 0 ? terbilangRupiah(form.nominal) : undefined}><RupiahInput id="kw-nominal" value={form.nominal} onChange={(n) => setForm({ ...form, nominal: n })} large /></Field>
          <Field label="Telah terima dari (pembayar)" htmlFor="kw-pembayar" required><Input id="kw-pembayar" value={form.pembayar} onChange={(e) => setForm({ ...form, pembayar: e.target.value })} placeholder="Nama warga / pihak" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Diterima oleh" htmlFor="kw-penerima" hint={`Default: ${pengaturan.nama_bendahara}`}><Input id="kw-penerima" value={form.penerima} onChange={(e) => setForm({ ...form, penerima: e.target.value })} placeholder={pengaturan.nama_bendahara} /></Field>
            <Field label="Tanggal" htmlFor="kw-tgl"><Input id="kw-tgl" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></Field>
          </div>
          <Field label="Untuk pembayaran" htmlFor="kw-ket"><Textarea id="kw-ket" rows={2} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Iuran bulanan Agustus 2026" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus kwitansi?" description={del?.kode} confirmLabel="Hapus" onConfirm={() => { if (del) { deleteKwitansi(del.id); setDetail(null); toast.success("Kwitansi dihapus"); } }} />
    </div>
  );
}

/* ---------------- Receipt (screen) ---------------- */
export function Receipt({ k, p }: { k: Kwitansi; p: Pengaturan }) {
  return (
    <article className="print-area mx-auto w-full max-w-[680px] overflow-hidden rounded-xl border border-primary/30 bg-white text-[#14261d] shadow-md">
      <header className="bg-[#0f9f6e] px-5 py-4 text-white sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">Sistem Informasi RT 002</p>
        <h2 className="mt-0.5 text-2xl font-extrabold tracking-[0.15em] sm:text-3xl">KWITANSI</h2>
        <p className="mt-1 text-xs text-white/90 sm:text-sm">{RT_INFO.namaLengkap}</p>
        <div className="mt-3 h-px bg-white/40" />
      </header>
      <div className="px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-[#0f9f6e]/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[11px] uppercase tracking-wide text-[#5b6b63]">No. Kwitansi</p><p className="font-mono text-base font-bold">{k.kode}</p></div>
          <div className="sm:text-right"><p className="text-[11px] uppercase tracking-wide text-[#5b6b63]">Tanggal</p><p className="font-semibold">{formatTanggalLengkapID(k.tanggal)}</p></div>
        </div>
        <dl className="mt-5 space-y-4 text-sm">
          <div><dt className="text-[11px] uppercase tracking-wide text-[#5b6b63]">Telah terima dari</dt><dd className="mt-0.5 text-base font-bold break-anywhere">{k.pembayar}</dd></div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[#5b6b63]">Uang sejumlah</dt>
            <dd className="mt-1 rounded-lg border-2 border-[#0f9f6e]/30 bg-[#0f9f6e]/5 px-4 py-3">
              <p className="italic text-[#33463c]">{terbilangRupiah(k.nominal)}</p>
              <p className="mt-1 text-2xl font-extrabold tabular text-[#0b7a54] break-anywhere sm:text-3xl">{formatRupiah(k.nominal)}</p>
            </dd>
          </div>
          <div><dt className="text-[11px] uppercase tracking-wide text-[#5b6b63]">Untuk pembayaran</dt><dd className="mt-0.5 whitespace-pre-wrap font-medium break-anywhere">{k.keterangan}</dd></div>
        </dl>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="text-xs text-[#33463c]">
            {p.qris_image ? (
              <div className="flex items-center gap-3"><img src={p.qris_image} alt="QRIS RT 002" className="h-28 w-28 rounded-lg border object-contain" /><p className="inline-flex items-center gap-1 font-medium"><QrCode className="h-4 w-4" />Scan QRIS untuk pembayaran</p></div>
            ) : (
              <div className="space-y-1.5">
                <p className="inline-flex items-center gap-1 font-semibold"><Building2 className="h-4 w-4" />Rekening RT 002</p>
                <p>{p.bank_nama} <span className="font-mono font-semibold">{p.bank_rekening}</span></p>
                <p>a.n. {p.bank_pemilik}</p>
                {p.qris_url && <p className="inline-flex items-center gap-1"><QrCode className="h-3.5 w-3.5" />QRIS: {p.qris_url}</p>}
              </div>
            )}
          </div>
          <div className="text-center text-sm sm:text-right">
            <p className="text-[11px] uppercase tracking-wide text-[#5b6b63]">Diterima oleh</p>
            <div className="mx-auto mt-1 flex h-16 items-end justify-center sm:ml-auto sm:mr-0 sm:w-48">{p.ttd_bendahara ? <img src={p.ttd_bendahara} alt="Tanda tangan" className="max-h-16 object-contain" /> : <span className="text-[10px] italic text-[#9aa8a1]">( tanda tangan )</span>}</div>
            <p className="mx-auto border-t border-[#14261d]/40 pt-1 font-bold sm:ml-auto sm:mr-0 sm:w-48">{k.penerima}</p>
            <p className="text-xs text-[#5b6b63]">Bendahara RT 002</p>
          </div>
        </div>
      </div>
      <footer className="flex flex-col gap-1 bg-[#0f9f6e] px-5 py-3 text-[11px] text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="inline-flex items-center gap-1"><Stamp className="h-3.5 w-3.5" />Dokumen sah diterbitkan Sistem Informasi RT 002</span>
        <span>Dicetak {formatTanggalID(new Date())}</span>
      </footer>
    </article>
  );
}

/* ---------------- Receipt HTML (print window / download) ---------------- */
export function buildReceiptHtml(k: Kwitansi, p: Pengaturan) {
  const e = escapeHtml;
  const pay = p.qris_image
    ? `<div style="display:flex;gap:12px;align-items:center"><img src="${p.qris_image}" alt="QRIS" style="width:110px;height:110px;border:1px solid #d7e5de;border-radius:8px;object-fit:contain"/><span>Scan QRIS untuk pembayaran</span></div>`
    : `<div><b>Rekening RT 002</b><br/>${e(p.bank_nama)} <b style="font-family:monospace">${e(p.bank_rekening)}</b><br/>a.n. ${e(p.bank_pemilik)}${p.qris_url ? `<br/>QRIS: ${e(p.qris_url)}` : ""}</div>`;
  return `<style>
  @page{margin:14mm}body{margin:0;background:#f3f7f5;font-family:"Plus Jakarta Sans",Segoe UI,Roboto,Arial,sans-serif;color:#14261d;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .r{max-width:680px;margin:20px auto;background:#fff;border:1px solid #b9dccd;border-radius:14px;overflow:hidden}
  .h{background:#0f9f6e;color:#fff;padding:18px 28px}.h small{letter-spacing:.2em;text-transform:uppercase;font-size:10px;opacity:.85}.h h1{margin:2px 0 4px;font-size:28px;letter-spacing:.15em}.h p{margin:0;font-size:13px;opacity:.95}
  .b{padding:22px 28px}.meta{display:flex;justify-content:space-between;gap:12px;border:1px dashed #86c9ae;border-radius:10px;padding:10px 14px;font-size:13px;flex-wrap:wrap}.l{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#5b6b63;margin:16px 0 3px}
  .amt{border:2px solid #9fd8c0;background:#f0faf5;border-radius:10px;padding:12px 16px}.amt i{color:#33463c}.amt b{display:block;font-size:28px;color:#0b7a54;margin-top:4px}
  .g{display:flex;justify-content:space-between;gap:24px;margin-top:24px;flex-wrap:wrap;font-size:12px}.sig{text-align:center;min-width:190px}.sig .sp{height:64px}.sig .n{border-top:1px solid #14261d66;padding-top:4px;font-weight:700;font-size:13px}
  .f{background:#0f9f6e;color:#fff;font-size:11px;padding:10px 28px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
  @media print{body{background:#fff}.r{margin:0;border-radius:0;border:none}}
  </style>
  <div class="r">
    <div class="h"><small>Sistem Informasi RT 002</small><h1>KWITANSI</h1><p>${e(RT_INFO.namaLengkap)}</p></div>
    <div class="b">
      <div class="meta"><div><div class="l" style="margin-top:0">No. Kwitansi</div><b style="font-family:monospace;font-size:15px">${e(k.kode)}</b></div><div style="text-align:right"><div class="l" style="margin-top:0">Tanggal</div><b>${e(formatTanggalLengkapID(k.tanggal))}</b></div></div>
      <div class="l">Telah terima dari</div><div style="font-size:16px;font-weight:700">${e(k.pembayar)}</div>
      <div class="l">Uang sejumlah</div><div class="amt"><i>${e(terbilangRupiah(k.nominal))}</i><b>${e(formatRupiah(k.nominal))}</b></div>
      <div class="l">Untuk pembayaran</div><div style="font-weight:600;white-space:pre-wrap">${e(k.keterangan)}</div>
      <div class="g">${pay}<div class="sig"><div class="l" style="margin-top:0">Diterima oleh</div><div class="sp">${p.ttd_bendahara ? `<img src="${p.ttd_bendahara}" style="max-height:64px" alt="ttd"/>` : ""}</div><div class="n">${e(k.penerima)}</div><div style="color:#5b6b63">Bendahara RT 002</div></div></div>
    </div>
    <div class="f"><span>Dokumen sah diterbitkan Sistem Informasi RT 002</span><span>Dicetak ${e(formatTanggalID(new Date()))}</span></div>
  </div>`;
}
