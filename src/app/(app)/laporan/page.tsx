"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function LaporanPage() {
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState("Tahun 2026");

  const [ringkasan, setRingkasan] = useState({
    saldo: 2170000,
    totalPemasukan: 3720000,
    totalPengeluaran: 1550000,
  });

  const [rekapIuran, setRekapIuran] = useState({
    totalTagihan: 900000,
    totalTerkumpul: 600000,
    totalTertunda: 300000,
    countLunas: 8,
    countBelumLunas: 4,
    persentase: 67,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTrx, resTagihan] = await Promise.all([
        fetch("/api/transaksi"),
        fetch("/api/tagihan?bulan=April 2026"),
      ]);

      const dataTrx = await resTrx.json();
      const dataTagihan = await resTagihan.json();

      if (Array.isArray(dataTrx?.transaksi)) {
        setTransaksiList(dataTrx.transaksi);
      } else {
        setTransaksiList([]);
      }

      if (dataTrx?.ringkasan) {
        setRingkasan({
          saldo: Number(dataTrx.ringkasan.saldo ?? 0),
          totalPemasukan: Number(dataTrx.ringkasan.totalPemasukan ?? 0),
          totalPengeluaran: Number(dataTrx.ringkasan.totalPengeluaran ?? 0),
        });
      }

      if (dataTagihan?.stats) {
        setRekapIuran({
          totalTagihan: Number(dataTagihan.stats.totalTarget ?? dataTagihan.stats.totalTagihan ?? 0),
          totalTerkumpul: Number(dataTagihan.stats.totalTerkumpul ?? 0),
          totalTertunda: Number(dataTagihan.stats.totalTertunda ?? 0),
          countLunas: Number(dataTagihan.stats.countLunas ?? 0),
          countBelumLunas: Number(dataTagihan.stats.countBelumLunas ?? 0),
          persentase: Number(dataTagihan.stats.persentase ?? 0),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransaksi = transaksiList.filter((item) => {
    const jenis = String(item?.jenis ?? "");
    const kategori = String(item?.kategori ?? "");
    const keterangan = String(item?.keterangan ?? "");
    const kodeTransaksi = String(item?.kodeTransaksi ?? "");
    const namaPihak = String(item?.namaPihak ?? "");

    const matchJenis = filterJenis === "Semua" || jenis === filterJenis;
    const matchKategori = filterKategori === "Semua" || kategori === filterKategori;
    const matchSearch =
      !search ||
      keterangan.toLowerCase().includes(search.toLowerCase()) ||
      kodeTransaksi.toLowerCase().includes(search.toLowerCase()) ||
      namaPihak.toLowerCase().includes(search.toLowerCase());

    return matchJenis && matchKategori && matchSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  if (loading && transaksiList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Keuangan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Memuat data laporan keuangan RT...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-56 rounded-3xl bg-white border border-slate-200/80 animate-pulse" />
          <div className="h-56 rounded-3xl bg-white border border-slate-200/80 animate-pulse" />
        </div>
        <div className="h-96 rounded-3xl bg-white border border-slate-200/80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan pertanggungjawaban kas Blok Mawar RT 002 RW 014 Perumahan Ciptaland
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={() => {
              const headers = ["Kode,Jenis,Kategori,Tanggal,Nominal,Keterangan,Pihak\n"];
              const rows = filteredTransaksi.map(
                (t) =>
                  `"${t.kodeTransaksi}","${t.jenis}","${t.kategori}","${t.tanggal}","${t.nominal}","${t.keterangan}","${t.namaPihak || ""}"`
              );
              const blob = new Blob([headers.concat(rows.join("\n")).join("")], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `Laporan_Kas_RT002_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* TWO TOP COLUMNS: Ringkasan Keuangan & Rekap Iuran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Ringkasan Keuangan */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Ringkasan Keuangan
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Posisi kas & akumulasi transaksi {periode}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {periode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Pemasukan
                </span>
                <span className="text-lg font-black text-emerald-600 mt-1 block">
                  Rp {ringkasan.totalPemasukan.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-slate-400">Iuran, donasi & kas masuk</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Pengeluaran
                </span>
                <span className="text-lg font-black text-rose-600 mt-1 block">
                  Rp {ringkasan.totalPengeluaran.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-slate-400">Kebersihan, keamanan, perbaikan</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
                  Saldo Kas Bersih Saat Ini
                </span>
                <span className="text-2xl font-black text-indigo-900 mt-0.5 block">
                  Rp {ringkasan.saldo.toLocaleString("id-ID")}
                </span>
              </div>
              <span className="px-3 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shadow-sm">
                Surplus Kas Sehat
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Rekap Iuran */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Rekap Iuran Warga
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Capaian kepatuhan iuran warga periode berjalan
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                April 2026
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Iuran Terkumpul
                  </span>
                  <span className="text-xs font-black text-emerald-700">
                    {rekapIuran.persentase}%
                  </span>
                </div>
                <span className="text-lg font-black text-emerald-700 mt-1 block">
                  Rp {rekapIuran.totalTerkumpul.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {rekapIuran.countLunas} warga telah melunasi
                </span>
              </div>

              <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                    Tagihan Tertunda
                  </span>
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <span className="text-lg font-black text-rose-600 mt-1 block">
                  Rp {rekapIuran.totalTertunda.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">
                  {rekapIuran.countBelumLunas} warga menunggu konfirmasi
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Target Penerimaan Iuran RT (12 KK)</span>
              <span className="font-bold text-slate-900">
                Rp {rekapIuran.totalTagihan.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTE 2: "Tambahkan 'Rincian Transaksi ' pada Halaman Laporan Keuangan (buat di bawah dua kolom Ringkasan Keuangan dan Rekap Iuran)." */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        {/* Header Rincian Transaksi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <span>Rincian Transaksi</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {filteredTransaksi.length} Catatan
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar kronologis seluruh arus kas masuk dan kas keluar RT 002 RW 014
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="pemasukan">Pemasukan (+)</option>
              <option value="pengeluaran">Pengeluaran (-)</option>
            </select>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Iuran Bulanan">Iuran Bulanan</option>
              <option value="Iuran Sampah">Iuran Sampah</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Fasilitas">Fasilitas</option>
              <option value="Sosial">Sosial</option>
            </select>
          </div>
        </div>

        {/* Detailed Table matching "Rincian Transaksi.png" */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Tanggal</th>
                <th className="pb-3">Kode & Uraian Transaksi</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Metode / Pihak</th>
                <th className="pb-3 text-right">Nominal</th>
                <th className="pb-3 text-center">Kwitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map((t) => {
                  const isPemasukan = t.jenis === "pemasukan";
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {t.tanggal}
                      </td>
                      <td className="py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              isPemasukan
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {isPemasukan ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {t.keterangan}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t.kodeTransaksi}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {t.kategori}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">
                        <p className="font-semibold">{t.namaPihak || "Warga RT 002"}</p>
                        <p className="text-[10px] text-slate-400">{t.metodePembayaran}</p>
                      </td>
                      <td className="py-3 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isPemasukan ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {isPemasukan ? "+" : "-"} Rp {t.nominal.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <Link
                          href={`/kwitansi?kode=${t.kodeTransaksi}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold transition-colors"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Kwitansi</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
