"use client";

import React, { useState, useEffect } from "react";
import { ArrowDownLeft, Plus, Search, Receipt, Calendar, Filter, Download } from "lucide-react";
import { ModalCatatTransaksi } from "@/components/ModalCatatTransaksi";
import Link from "next/link";

export default function PemasukanPage() {
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [openModal, setOpenModal] = useState(false);

  const fetchPemasukan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transaksi?jenis=pemasukan");
      const data = await res.json();
      if (data.transaksi) {
        setTransaksi(data.transaksi);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPemasukan();
  }, []);

  const total = transaksi.reduce((acc, t) => acc + t.nominal, 0);

  const filtered = transaksi.filter((t) => {
    const matchCat = kategori === "Semua" || t.kategori === kategori;
    const matchSearch =
      !search ||
      t.keterangan.toLowerCase().includes(search.toLowerCase()) ||
      t.kodeTransaksi.toLowerCase().includes(search.toLowerCase()) ||
      (t.namaPihak && t.namaPihak.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Pemasukan Kas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan seluruh uang masuk, iuran bulanan warga, donasi dan pendapatan RT
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-200 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pemasukan Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Total Pemasukan 2026</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            Rp {total.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Akumulasi kas masuk tahun 2026</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Pemasukan Bulan Ini</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            Rp 450.000
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Periode berjalan April 2026</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4 text-purple-600" />
            <span>Jumlah Transaksi Masuk</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {transaksi.length} Transaksi
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Tercatat rapi di buku kas</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi pemasukan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Iuran Bulanan">Iuran Bulanan</option>
              <option value="Iuran Sampah">Iuran Sampah</option>
              <option value="Donasi Warga">Donasi Warga</option>
              <option value="Kas Lingkungan">Kas Lingkungan</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Tanggal</th>
                <th className="pb-3">Kode & Keterangan</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Penyetor / Pihak</th>
                <th className="pb-3">Metode</th>
                <th className="pb-3 text-right">Nominal</th>
                <th className="pb-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 pl-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {t.tanggal}
                  </td>
                  <td className="py-3.5 max-w-xs">
                    <p className="font-bold text-slate-800 leading-tight">
                      {t.keterangan}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {t.kodeTransaksi}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {t.kategori}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-700 font-semibold">
                    {t.namaPihak || "Warga Blok Mawar"}
                  </td>
                  <td className="py-3.5 text-slate-500 text-[11px]">
                    {t.metodePembayaran}
                  </td>
                  <td className="py-3.5 text-right font-black text-emerald-600 whitespace-nowrap">
                    + Rp {t.nominal.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 text-center">
                    <Link
                      href={`/kwitansi?kode=${t.kodeTransaksi}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold transition-colors"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>Kwitansi</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalCatatTransaksi
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={fetchPemasukan}
        defaultJenis="pemasukan"
      />
    </div>
  );
}
