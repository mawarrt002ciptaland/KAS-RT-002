import { useMemo, useState } from "react";
import { BarChart3, Download, Printer, TrendingUp, TrendingDown, Wallet, Hash, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { useLoadState } from "@/hooks";
import { formatRupiah, formatTanggalID, toISODate, monthKey, BULAN_SHORT, formatTanggalLengkapID } from "@/lib/format";
import { downloadCSV, printHtmlDocument, escapeHtml, cn } from "@/lib/utils";
import { RT_INFO } from "@/lib/constants";
import { Button, Input, Select, Field, Badge } from "@/components/ui";
import { PageHeader, StatCard, RupiahText, SectionTitle, EmptyState, ErrorState, ListSkeleton, TableShell } from "@/components/shared";
import { CashFlowChart, BarList } from "@/components/charts";

export default function LaporanView() {
  const transaksi = useData((s) => s.transaksi);
  const tagihan = useData((s) => s.tagihan);
  const pengaturan = useData((s) => s.pengaturan);
  const { loading, error, refetch } = useLoadState();
  const year = new Date().getFullYear();
  const [dari, setDari] = useState(toISODate(new Date(year, 0, 1)));
  const [sampai, setSampai] = useState(toISODate(new Date()));
  const [jenis, setJenis] = useState("");
  const [applied, setApplied] = useState({ dari, sampai, jenis });

  const rows = useMemo(() => {
    const from = new Date(applied.dari + "T00:00:00").getTime();
    const to = new Date(applied.sampai + "T23:59:59").getTime();
    return transaksi.filter((t) => { const ts = new Date(t.tanggal).getTime(); return ts >= from && ts <= to && (!applied.jenis || t.jenis === applied.jenis); }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [transaksi, applied]);

  const pem = rows.filter((t) => t.jenis === "pemasukan").reduce((a, t) => a + t.nominal, 0);
  const peng = rows.filter((t) => t.jenis === "pengeluaran").reduce((a, t) => a + t.nominal, 0);

  const perBulan = useMemo(() => {
    const map = new Map<string, { label: string; pemasukan: number; pengeluaran: number }>();
    const start = new Date(applied.dari + "T00:00:00"); const end = new Date(applied.sampai + "T00:00:00");
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) map.set(monthKey(d), { label: `${BULAN_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, pemasukan: 0, pengeluaran: 0 });
    for (const t of rows) { const r = map.get(monthKey(t.tanggal)); if (r) r[t.jenis] += t.nominal; }
    return Array.from(map.values());
  }, [rows, applied]);

  const perKategori = (j: "pemasukan" | "pengeluaran") => {
    const m = new Map<string, number>();
    rows.filter((t) => t.jenis === j).forEach((t) => m.set(t.kategori, (m.get(t.kategori) ?? 0) + t.nominal));
    const total = Array.from(m.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(m.entries()).map(([label, value]) => ({ label, value, percent: Math.round((value / total) * 100) })).sort((a, b) => b.value - a.value);
  };
  const katPem = perKategori("pemasukan");
  const katPeng = perKategori("pengeluaran");
  const tagStats = ["lunas", "belum_bayar", "telat"].map((s) => ({ status: s, count: tagihan.filter((t) => t.status === s).length, sum: tagihan.filter((t) => t.status === s).reduce((a, t) => a + t.jumlah + t.denda, 0) }));

  function terapkan() {
    if (dari > sampai) return toast.error("Tanggal 'Dari' tidak boleh melebihi 'Sampai'");
    setApplied({ dari, sampai, jenis });
  }
  function exportCSV() {
    downloadCSV(`Laporan-Kas-RT002-${applied.dari}_${applied.sampai}.csv`, ["Tanggal", "Kode", "Jenis", "Kategori", "Keterangan", "Pihak", "Metode", "Nominal"], rows.map((t) => [formatTanggalID(t.tanggal), t.kode, t.jenis, t.kategori, t.keterangan, t.sumber ?? t.penerima ?? "", t.metode, t.nominal]));
    toast.success("File CSV diunduh");
  }
  function cetak() {
    const e = escapeHtml;
    const html = `<style>body{font-family:Segoe UI,Roboto,Arial,sans-serif;color:#14261d;padding:24px;-webkit-print-color-adjust:exact}h1{margin:0;color:#0b7a54}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}th,td{border:1px solid #cfe3d9;padding:6px 8px;text-align:left}th{background:#e9f6f0}.r{text-align:right}.sum{display:flex;gap:16px;margin:16px 0;flex-wrap:wrap}.sum div{border:1px solid #cfe3d9;border-radius:8px;padding:10px 14px;min-width:160px}.sum b{display:block;font-size:16px}</style>
    <h1>Laporan Kas ${e(pengaturan.nama_rt)}</h1><p>${e(RT_INFO.namaLengkap)}<br/>Periode ${e(formatTanggalID(applied.dari))} – ${e(formatTanggalID(applied.sampai))}${applied.jenis ? ` • ${applied.jenis}` : ""}</p>
    <div class="sum"><div>Pemasukan<b style="color:#0b7a54">${e(formatRupiah(pem))}</b></div><div>Pengeluaran<b style="color:#c0392b">${e(formatRupiah(peng))}</b></div><div>Saldo Periode<b>${e(formatRupiah(pem - peng))}</b></div><div>Transaksi<b>${rows.length}</b></div></div>
    <table><thead><tr><th>Tanggal</th><th>Kode</th><th>Jenis</th><th>Kategori</th><th>Keterangan</th><th class="r">Nominal</th></tr></thead><tbody>${rows.map((t) => `<tr><td>${e(formatTanggalID(t.tanggal))}</td><td>${e(t.kode)}</td><td>${t.jenis}</td><td>${e(t.kategori)}</td><td>${e(t.keterangan)}</td><td class="r">${t.jenis === "pemasukan" ? "+" : "−"}${e(formatRupiah(t.nominal))}</td></tr>`).join("")}</tbody></table>
    <p style="margin-top:24px;font-size:12px">Dicetak ${e(formatTanggalLengkapID(new Date()))} • Bendahara: ${e(pengaturan.nama_bendahara)}</p>`;
    printHtmlDocument("Laporan Kas RT 002", html, "Laporan-Kas-RT002.html");
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Laporan" description="Laporan keuangan & statistik RT 002" icon={<BarChart3 className="h-5 w-5" />} actions={<><Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCSV}>Unduh CSV</Button><Button leftIcon={<Printer className="h-4 w-4" />} onClick={cetak}>Cetak / PDF</Button></>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <Field label="Dari" htmlFor="lp-dari"><Input id="lp-dari" type="date" value={dari} onChange={(e) => setDari(e.target.value)} /></Field>
            <Field label="Sampai" htmlFor="lp-sampai"><Input id="lp-sampai" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} /></Field>
            <Field label="Jenis"><Select value={jenis} onChange={(e) => setJenis(e.target.value)} placeholder="Semua Jenis" options={[{ value: "pemasukan", label: "Pemasukan" }, { value: "pengeluaran", label: "Pengeluaran" }]} /></Field>
            <Button onClick={terapkan} fullWidth className="lg:w-auto">Terapkan</Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Pemasukan" tone="income" value={<RupiahText value={pem} />} icon={<TrendingUp className="h-5 w-5" />} />
            <StatCard title="Total Pengeluaran" tone="expense" value={<RupiahText value={peng} />} icon={<TrendingDown className="h-5 w-5" />} />
            <StatCard title="Saldo Periode" value={<RupiahText value={pem - peng} />} icon={<Wallet className="h-5 w-5" />} hint={`${formatTanggalID(applied.dari)} – ${formatTanggalID(applied.sampai)}`} />
            <StatCard title="Jumlah Transaksi" tone="neutral" value={`${rows.length} transaksi`} icon={<Hash className="h-5 w-5" />} />
          </div>

          <section>
            <SectionTitle title="Pemasukan vs Pengeluaran per Bulan" />
            <div className="rounded-xl border bg-card p-3 sm:p-4">{perBulan.length ? <CashFlowChart data={perBulan} /> : <EmptyState title="Tidak ada data" />}</div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4"><SectionTitle title="Pemasukan per Kategori" />{katPem.length ? <BarList items={katPem} /> : <p className="text-sm text-muted-foreground">Belum ada pemasukan pada periode ini.</p>}</div>
            <div className="rounded-xl border bg-card p-4"><SectionTitle title="Pengeluaran per Kategori" />{katPeng.length ? <BarList items={katPeng} colorIndex={3} /> : <p className="text-sm text-muted-foreground">Belum ada pengeluaran pada periode ini.</p>}</div>
          </section>

          <section>
            <SectionTitle title="Statistik Tagihan" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {tagStats.map((s) => (
                <div key={s.status} className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between"><Badge tone={s.status === "lunas" ? "success" : s.status === "telat" ? "destructive" : "warning"}>{s.status === "lunas" ? "Lunas" : s.status === "telat" ? "Telat" : "Belum Bayar"}</Badge><span className="text-2xl font-bold">{s.count}</span></div><p className="mt-2 text-sm text-muted-foreground">Nominal <span className="font-semibold text-foreground tabular">{formatRupiah(s.sum)}</span></p></div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle title="Transaksi Periode" action={<span className="text-xs text-muted-foreground">{rows.length} baris</span>} />
            {rows.length === 0 ? <EmptyState icon={<Calendar className="h-6 w-6" />} title="Belum ada transaksi" description="Tidak ada transaksi pada periode yang dipilih." /> : (
              <>
                <ul className="grid gap-2 md:hidden">
                  {rows.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-3">
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", t.jenis === "pemasukan" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>{t.jenis === "pemasukan" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{t.keterangan}</span><span className="block truncate text-xs text-muted-foreground">{t.kode} • {formatTanggalID(t.tanggal)} • {t.kategori}</span></span>
                      <span className={cn("shrink-0 text-sm font-bold tabular", t.jenis === "pemasukan" ? "text-success" : "text-destructive")}>{t.jenis === "pemasukan" ? "+" : "−"}{formatRupiah(t.nominal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="hidden md:block">
                  <TableShell>
                    <thead className="border-b bg-muted/40"><tr><th>Tanggal</th><th>Kode</th><th>Jenis</th><th>Kategori</th><th>Keterangan</th><th className="!text-right">Nominal</th></tr></thead>
                    <tbody className="divide-y">{rows.map((t) => <tr key={t.id}><td className="whitespace-nowrap">{formatTanggalID(t.tanggal)}</td><td className="whitespace-nowrap font-mono text-xs">{t.kode}</td><td><Badge tone={t.jenis === "pemasukan" ? "success" : "destructive"}>{t.jenis}</Badge></td><td className="whitespace-nowrap">{t.kategori}</td><td className="max-w-[300px] truncate">{t.keterangan}</td><td className={cn("whitespace-nowrap text-right font-bold tabular", t.jenis === "pemasukan" ? "text-success" : "text-destructive")}>{t.jenis === "pemasukan" ? "+" : "−"}{formatRupiah(t.nominal)}</td></tr>)}</tbody>
                  </TableShell>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
