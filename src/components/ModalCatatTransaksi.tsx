"use client";

import React, { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultJenis?: "pemasukan" | "pengeluaran";
}

export function ModalCatatTransaksi({ isOpen, onClose, onSuccess, defaultJenis = "pemasukan" }: ModalProps) {
  const [jenis, setJenis] = useState<"pemasukan" | "pengeluaran">(defaultJenis);
  const [kategori, setKategori] = useState(defaultJenis === "pemasukan" ? "Iuran Bulanan" : "Kebersihan");
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [keterangan, setKeterangan] = useState("");
  const [namaPihak, setNamaPihak] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("Transfer / QRIS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || Number(nominal) <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }
    if (!keterangan.trim()) {
      setError("Keterangan transaksi wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis,
          kategori,
          nominal: Number(nominal),
          tanggal,
          keterangan,
          namaPihak,
          metodePembayaran,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800">Catat Transaksi Baru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kas RT 002 RW 014 Blok Mawar Ciptaland
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Jenis Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setJenis("pemasukan");
                  setKategori("Iuran Bulanan");
                }}
                className={`py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all border ${
                  jenis === "pemasukan"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Pemasukan (+)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setJenis("pengeluaran");
                  setKategori("Kebersihan");
                }}
                className={`py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all border ${
                  jenis === "pengeluaran"
                    ? "bg-rose-50 text-rose-700 border-rose-500 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran (-)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {jenis === "pemasukan" ? (
                  <>
                    <option value="Iuran Bulanan">Iuran Bulanan</option>
                    <option value="Iuran Sampah">Iuran Sampah</option>
                    <option value="Donasi Warga">Donasi Warga</option>
                    <option value="Kas Lingkungan">Kas Lingkungan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </>
                ) : (
                  <>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Keamanan">Keamanan</option>
                    <option value="Fasilitas">Fasilitas</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Operasional RT">Operasional RT</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                placeholder="50000"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Uraian</label>
            <input
              type="text"
              placeholder="Contoh: Perawatan portal keamanan RFID, Iuran warga April..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pihak / Warga</label>
              <input
                type="text"
                placeholder="Contoh: Bayu Sudik (M-02)"
                value={namaPihak}
                onChange={(e) => setNamaPihak(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Metode Bayar</label>
              <select
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Transfer / QRIS">Transfer / QRIS</option>
                <option value="Tunai">Tunai (Cash)</option>
                <option value="Transfer BCA">Transfer BCA</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Menyimpan..." : "Simpan Transaksi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
