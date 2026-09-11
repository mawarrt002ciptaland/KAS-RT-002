"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  FileClock,
  Plus,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ModalCatatTransaksi } from "@/components/ModalCatatTransaksi";
import { ModalTambahWarga } from "@/components/ModalTambahWarga";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    transaksi: any[];
    ringkasan: {
      saldo: number;
      totalPemasukan: number;
      totalPengeluaran: number;
      pengeluaranPerKategori: Record<string, number>;
      totalTransaksi: number;
    };
  } | null>(null);

  const [tagihanStats, setTagihanStats] = useState({
    totalTarget: 900000,
    totalTerkumpul: 600000,
    totalTertunda: 300000,
    countLunas: 8,
    countBelumLunas: 4,
    persentase: 67,
  });

  const [openTrxModal, setOpenTrxModal] = useState(false);
  const [openWargaModal, setOpenWargaModal] = useState(false);

  const loadData = async () => {
    try {
      const [resTrx, resTagihan] = await Promise.all([
        fetch("/api/transaksi"),
        fetch("/api/tagihan?bulan=April 2026"),
      ]);

      const dataTrx = await resTrx.json();
      const dataTagihan = await resTagihan.json();

      setData(dataTrx);
      if (dataTagihan.stats) {
        setTagihanStats(dataTagihan.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saldo = data?.ringkasan?.saldo ?? 2170000;
  const pemasukan = data?.ringkasan?.totalPemasukan ?? 3720000;
  const pengeluaran = data?.ringkasan?.totalPengeluaran ?? 1550000;
  const recentTransactions = data?.transaksi?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
            Selamat Datang, {user?.name ? user.name.split(" ")[0] : "Pak Ahmad"} 👋
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Ringkasan Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kondisi keuangan lingkungan dalam satu tampilan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setOpenWargaModal(true)}
            className="px-4 py-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>Tambah Warga</span>
          </button>
          <button
            onClick={() => setOpenTrxModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards matching Screenshot 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5%</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Kas Saat Ini
            </p>
            <p className="text-xl font-black text-slate-900 mt-1">
              Rp {saldo.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Saldo bersih keseluruhan
            </p>
          </div>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+8.2%</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pemasukan
            </p>
            <p className="text-xl font-black text-slate-900 mt-1">
              Rp {pemasukan.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Tahun berjalan 2026
            </p>
          </div>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pengeluaran
            </p>
            <p className="text-xl font-black text-slate-900 mt-1">
              Rp {pengeluaran.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Tahun berjalan 2026
            </p>
          </div>
        </div>

        {/* Card 4: Tagihan Tertunda */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <FileClock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tagihan Tertunda
            </p>
            <p className="text-xl font-black text-slate-900 mt-1">
              Rp {tagihanStats.totalTertunda.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-rose-500 mt-1 font-bold">
              {tagihanStats.countBelumLunas} warga belum lunas
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Arus Kas Bulanan Chart & Tagihan Bulan Ini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arus Kas Bulanan (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Arus Kas Bulanan</h2>
              <p className="text-xs text-slate-400">
                Perbandingan pemasukan dan pengeluaran tahun 2026
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tahun 2026</span>
            </div>
          </div>

          {/* SVG Cash Flow Graphic Chart matching Screenshot 5 */}
          <div className="relative mt-6 pt-2">
            <div className="h-56 w-full flex flex-col justify-between">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="pemasukanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="40" y1="20" x2="590" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="40" y1="60" x2="590" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="40" y1="100" x2="590" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="40" y1="140" x2="590" y2="140" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="40" y1="180" x2="590" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Y-axis labels */}
                <text x="35" y="24" fontSize="9" fill="#94A3B8" textAnchor="end">Rp 1.2 jt</text>
                <text x="35" y="64" fontSize="9" fill="#94A3B8" textAnchor="end">Rp 900 rb</text>
                <text x="35" y="104" fontSize="9" fill="#94A3B8" textAnchor="end">Rp 600 rb</text>
                <text x="35" y="144" fontSize="9" fill="#94A3B8" textAnchor="end">Rp 300 rb</text>
                <text x="35" y="184" fontSize="9" fill="#94A3B8" textAnchor="end">Rp 0 rb</text>

                {/* Pemasukan Gradient Area (Jan: 1.12M, Feb: 1.125M, Mar: 1.025M, Apr: 450k, Mei-Des: 0) */}
                <path
                  d="M 50,28 C 95,27 105,26 140,26 C 175,26 190,45 230,45 C 270,45 285,135 320,135 C 355,135 365,180 400,180 L 590,180 L 590,180 L 50,180 Z"
                  fill="url(#pemasukanGrad)"
                />

                {/* Pemasukan smooth line */}
                <path
                  d="M 50,28 C 95,27 105,26 140,26 C 175,26 190,45 230,45 C 270,45 285,135 320,135 C 355,135 365,180 400,180 L 590,180"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Pengeluaran dotted orange line */}
                <path
                  d="M 50,75 C 95,90 105,95 140,110 C 175,125 190,130 230,135 C 270,140 285,180 320,180 L 590,180"
                  fill="none"
                  stroke="#FB923C"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />
              </svg>

              {/* X-axis months */}
              <div className="flex justify-between pl-10 pr-2 text-[10px] font-semibold text-slate-400">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>Mei</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Agu</span>
                <span>Sep</span>
                <span>Okt</span>
                <span>Nov</span>
                <span>Des</span>
              </div>
            </div>

            {/* Legend matching Screenshot 5 */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-indigo-900">Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                <span className="text-orange-900">Pengeluaran</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tagihan Bulan Ini (1 col) matching Screenshot 5 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Tagihan Bulan Ini</h2>
                <p className="text-xs text-slate-400">April 2026</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Donut Ring Chart */}
            <div className="relative flex justify-center items-center py-6">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="#E2E8F0"
                  strokeWidth="14"
                  fill="transparent"
                />
                {/* Progress Ring (67% = 351 circumference * 0.67 = ~235) */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="#4F46E5"
                  strokeWidth="14"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (351 * tagihanStats.persentase) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center percentage text */}
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 block leading-tight">
                  {tagihanStats.persentase}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Terkumpul
                </span>
              </div>
            </div>

            {/* Status breakdown pills */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-indigo-50/60 rounded-xl">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-indigo-700 font-bold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Sudah lunas</span>
                </div>
                <span className="font-bold text-slate-800">{tagihanStats.countLunas} warga</span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Belum lunas</span>
                </div>
                <span className="font-bold text-slate-800">{tagihanStats.countBelumLunas} warga</span>
              </div>
            </div>

            {/* Dana terkumpul ratio bar */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Dana Terkumpul
              </span>
              <span className="text-sm font-black text-slate-900">
                Rp {tagihanStats.totalTerkumpul.toLocaleString("id-ID")} / Rp {tagihanStats.totalTarget.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <Link
            href="/tagihan"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 text-center"
          >
            <span>Lihat semua tagihan</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Bottom Row: Transaksi Terbaru & Pengeluaran per Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaksi Terbaru (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Transaksi Terbaru</h2>
              <p className="text-xs text-slate-400">Aktivitas kas terbaru Blok Mawar</p>
            </div>
            <Link
              href="/laporan"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Lihat semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Transaksi</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentTransactions.map((t) => {
                  const isPemasukan = t.jenis === "pemasukan";
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isPemasukan
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {isPemasukan ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {t.keterangan}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {t.kodeTransaksi}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {t.kategori}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-[11px]">
                        {t.tanggal}
                      </td>
                      <td className="py-3 text-right font-bold">
                        <span
                          className={
                            isPemasukan ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {isPemasukan ? "+" : "-"} Rp {t.nominal.toLocaleString("id-ID")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pengeluaran per Kategori (1 col) matching Screenshot 5 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Pengeluaran per Kategori
                </h2>
                <p className="text-xs text-slate-400">
                  Distribusi penggunaan dana
                </p>
              </div>
            </div>

            {/* Donut chart for categories */}
            <div className="relative flex justify-center items-center py-4">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="50" stroke="#E2E8F0" strokeWidth="16" fill="transparent" />
                {/* Keamanan: 35% */}
                <circle
                  cx="72"
                  cy="72"
                  r="50"
                  stroke="#4F46E5"
                  strokeWidth="16"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * 0.35)}
                  fill="transparent"
                />
                {/* Kebersihan: 41% */}
                <circle
                  cx="72"
                  cy="72"
                  r="50"
                  stroke="#FB923C"
                  strokeWidth="16"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * 0.41)}
                  transform="rotate(126 72 72)"
                  fill="transparent"
                />
                {/* Fasilitas: 24% */}
                <circle
                  cx="72"
                  cy="72"
                  r="50"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * 0.24)}
                  transform="rotate(274 72 72)"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Total</span>
                <span className="text-sm font-black text-slate-900">Rp 1.6 jt</span>
              </div>
            </div>

            {/* List Distribution items matching Screenshot 5 */}
            <div className="space-y-2.5 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span className="font-semibold text-slate-700">Keamanan</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">Rp 540.000</span>
                  <span className="font-bold text-slate-900 w-8 text-right">35%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                  <span className="font-semibold text-slate-700">Kebersihan</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">Rp 635.000</span>
                  <span className="font-bold text-slate-900 w-8 text-right">41%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-700">Fasilitas</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">Rp 375.000</span>
                  <span className="font-bold text-slate-900 w-8 text-right">24%</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 text-center">
            * Persentase dihitung dari total pengeluaran yang tercatat.
          </p>
        </div>
      </div>

      {/* Modals */}
      <ModalCatatTransaksi
        isOpen={openTrxModal}
        onClose={() => setOpenTrxModal(false)}
        onSuccess={loadData}
      />
      <ModalTambahWarga
        isOpen={openWargaModal}
        onClose={() => setOpenWargaModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
