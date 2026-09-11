"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Home,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { ModalTambahWarga } from "@/components/ModalTambahWarga";

export default function WargaPage() {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const fetchWarga = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/warga");
      const data = await res.json();
      if (data.warga) {
        setWargaList(data.warga);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus data warga: ${nama}?`)) return;
    try {
      await fetch(`/api/warga?id=${id}`, { method: "DELETE" });
      fetchWarga();
    } catch (e) {
      alert("Gagal menghapus warga");
    }
  };

  const filtered = wargaList.filter((w) => {
    const matchSearch =
      !search ||
      w.nama.toLowerCase().includes(search.toLowerCase()) ||
      w.nik.includes(search) ||
      w.noRumah.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const countTetap = wargaList.filter((w) => w.statusTinggal === "Tetap").length;
  const countKontrak = wargaList.filter((w) => w.statusTinggal === "Kontrak").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Warga Blok Mawar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Basis data kependudukan RT 002 RW 014 Perumahan Ciptaland
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Data Warga</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Kepala Keluarga
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {wargaList.length} KK
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Blok Mawar M-01 s/d M-12</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Warga Tetap
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {countTetap} KK
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Pemilik rumah sah</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Warga Kontrak
          </span>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {countKontrak} KK
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Penyewa terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Status Iuran
          </span>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            100% Aktif
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Kewajiban kas lingkungan</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIK, atau no. rumah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Table matching "Data Warga.png" */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Nama Warga</th>
                <th className="pb-3">NIK</th>
                <th className="pb-3">No. Rumah</th>
                <th className="pb-3">No. WhatsApp</th>
                <th className="pb-3">Status Tinggal</th>
                <th className="pb-3">Anggota KK</th>
                <th className="pb-3 text-right pr-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((w) => {
                const initials = w.nama
                  ? w.nama
                      .split(" ")
                      .map((s: string) => s[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "WR";

                const cleanPhone = w.noHp.replace(/[^0-9]/g, "");
                const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;

                return (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">
                            {w.nama}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {w.pekerjaan || "Wiraswasta"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 font-mono text-[11px] text-slate-600">
                      {w.nik}
                    </td>

                    <td className="py-3.5 font-bold text-slate-800">
                      {w.noRumah}
                    </td>

                    <td className="py-3.5">
                      <a
                        href={`https://api.whatsapp.com/send?phone=${waPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{w.noHp}</span>
                      </a>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          w.statusTinggal === "Tetap"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {w.statusTinggal}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-600 font-semibold">
                      {w.jumlahKeluarga} Jiwa
                    </td>

                    <td className="py-3.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDelete(w.id, w.nama)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus data warga"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalTambahWarga
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={fetchWarga}
      />
    </div>
  );
}
