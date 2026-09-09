"use client";
import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";
import { exportCsv } from "@/lib/csv";
import {
  Card,
  PageHeader,
  Button,
  inputCls,
  Spinner,
  EmptyState,
  Badge,
} from "@/components/ui";
import { rupiah, tanggalID, NAMA_BULAN } from "@/lib/format";

type Trx = {
  id: number;
  jenis: string;
  kategori: string;
  keterangan: string;
  nominal: number;
  tanggal: string;
};

type Laporan = {
  data: Trx[];
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
};

export default function LaporanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(0);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [lap, setLap] = useState<Laporan | null>(null);

  const load = useCallback(async () => {
    setLap(null);
    const res = await apiFetch(`/api/laporan?tahun=${tahun}&bulan=${bulan}`);
    if (res.ok) setLap(await res.json());
  }, [tahun, bulan]);

  useEffect(() => {
    load();
  }, [load]);

  const periodeLabel = bulan ? `${NAMA_BULAN[bulan - 1]} ${tahun}` : `Tahun ${tahun}`;

  function doExport() {
    if (!lap) return;
    const suffix = bulan
      ? `${NAMA_BULAN[bulan - 1].toLowerCase()}-${tahun}`
      : `tahun-${tahun}`;
    exportCsv(
      `laporan-kas-rt002-${suffix}`,
      ["No", "Tanggal", "Keterangan", "Kategori", "Pemasukan (Rp)", "Pengeluaran (Rp)"],
      [
        ...lap.data.map((t, i) => [
          i + 1,
          tanggalID(t.tanggal),
          t.keterangan,
          t.kategori,
          t.jenis === "masuk" ? Number(t.nominal) : "",
          t.jenis === "keluar" ? Number(t.nominal) : "",
        ]),
        ["", "", "", "TOTAL", lap.totalMasuk, lap.totalKeluar],
        ["", "", "", "SALDO AWAL", lap.saldoAwal, ""],
        ["", "", "", "SALDO AKHIR", lap.saldoAkhir, ""],
      ]
    );
  }

  return (
    <div className="fade-up">
      <div className="no-print">
        <PageHeader
          title="Laporan Keuangan"
          subtitle="Rekap kas per periode — transparan untuk seluruh warga"
          action={
            <>
              <Button variant="secondary" onClick={doExport} disabled={!lap}>
                <Download size={15} /> Export CSV
              </Button>
              <Button onClick={() => window.print()}>
                <Printer size={15} /> Cetak Laporan
              </Button>
            </>
          }
        />

        <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
          <select
            className={`${inputCls} !w-auto`}
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
          >
            <option value={0}>Semua Bulan (1 Tahun)</option>
            {NAMA_BULAN.map((b, i) => (
              <option key={i} value={i + 1}>{b}</option>
            ))}
          </select>
          <select
            className={`${inputCls} !w-auto`}
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Card>
      </div>

      {!lap ? (
        <Spinner />
      ) : (
        <div className="print-area">
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-xl font-extrabold">LAPORAN KEUANGAN KAS RT</h1>
            <p className="text-sm font-bold">
              Blok Mawar RT 002 RW 014 · Perumahan Ciptaland · Periode {periodeLabel}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Saldo Awal", value: lap.saldoAwal, color: "text-slate-700" },
              { label: "Total Pemasukan", value: lap.totalMasuk, color: "text-emerald-500" },
              { label: "Total Pengeluaran", value: lap.totalKeluar, color: "text-rose-500" },
              { label: "Saldo Akhir", value: lap.saldoAkhir, color: "text-indigo-500" },
            ].map((s) => (
              <Card key={s.label} className="p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {s.label}
                </p>
                <p className={`mt-1 text-lg font-extrabold ${s.color}`}>
                  {rupiah(s.value)}
                </p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-extrabold text-slate-800">
                Rincian Transaksi — {periodeLabel}
              </h2>
            </div>
            {lap.data.length === 0 ? (
              <EmptyState text="Tidak ada transaksi pada periode ini" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      <th className="px-5 py-3">Tanggal</th>
                      <th className="px-5 py-3">Keterangan</th>
                      <th className="px-5 py-3">Kategori</th>
                      <th className="px-5 py-3 text-right">Masuk</th>
                      <th className="px-5 py-3 text-right">Keluar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lap.data.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 font-bold text-slate-500">
                          {tanggalID(t.tanggal)}
                        </td>
                        <td className="px-5 py-3 font-extrabold text-slate-700">
                          {t.keterangan}
                        </td>
                        <td className="px-5 py-3">
                          <Badge color={t.jenis === "masuk" ? "green" : "amber"}>
                            {t.kategori}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-extrabold text-emerald-500">
                          {t.jenis === "masuk" ? rupiah(t.nominal) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-extrabold text-rose-500">
                          {t.jenis === "keluar" ? rupiah(t.nominal) : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-extrabold">
                      <td colSpan={3} className="px-5 py-3 text-slate-700">TOTAL</td>
                      <td className="px-5 py-3 text-right text-emerald-600">
                        {rupiah(lap.totalMasuk)}
                      </td>
                      <td className="px-5 py-3 text-right text-rose-600">
                        {rupiah(lap.totalKeluar)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
