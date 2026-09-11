"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  CreditCard,
  Search,
  Receipt,
} from "lucide-react";
import { ModalBayarIuran } from "@/components/ModalBayarIuran";
import Link from "next/link";

export default function TagihanPage() {
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalTarget: 900000,
    totalTerkumpul: 600000,
    totalTertunda: 300000,
    countLunas: 8,
    countBelumLunas: 4,
    persentase: 67,
  });
  const [bulan, setBulan] = useState("April 2026");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({
    namaRt: "RT 002 RW 014",
    blok: "Blok Mawar",
    namaBank: "Bank Central Asia (BCA)",
    noRekening: "8720192831",
    atasNama: "KAS RT 002 BLOK MAWAR",
  });

  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [openBayarModal, setOpenBayarModal] = useState(false);

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tagihan?bulan=${encodeURIComponent(bulan)}`);
      const data = await res.json();
      if (data.tagihan) {
        setTagihan(data.tagihan);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/pengaturan");
      const data = await res.json();
      if (data.pengaturan) setSettings(data.pengaturan);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTagihan();
    fetchSettings();
  }, [bulan]);

  const filtered = tagihan.filter((item) => {
    const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
    const matchSearch =
      !search ||
      (item.wargaNama && item.wargaNama.toLowerCase().includes(search.toLowerCase())) ||
      (item.wargaNoRumah && item.wargaNoRumah.toLowerCase().includes(search.toLowerCase())) ||
      (item.wargaNik && item.wargaNik.includes(search));
    return matchStatus && matchSearch;
  });

  const handleSendWaReminder = (item: any) => {
    const cleanPhone = (item.wargaNoHp || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;
    const msg = encodeURIComponent(
      `Yth. Bpk/Ibu ${item.wargaNama} (${item.wargaNoRumah}), menginfokan tagihan kas ${settings.namaRt} ${settings.blok} periode ${item.bulan} sebesar Rp ${item.totalTagihan.toLocaleString("id-ID")}. Pembayaran via transfer ${settings.namaBank} ${settings.noRekening} a.n ${settings.atasNama}. Terima kasih 🙏`
    );
    window.open(`https://api.whatsapp.com/send?phone=${waPhone}&text=${msg}`, "_blank");
  };

  const handleGenerateNextMonth = async () => {
    const nextBulan = prompt("Masukkan nama bulan tagihan baru (contoh: Mei 2026):", "Mei 2026");
    if (!nextBulan) return;

    try {
      const res = await fetch("/api/tagihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulan: nextBulan }),
      });
      const data = await res.json();
      alert(data.message || "Tagihan berhasil digenerate!");
      setBulan(nextBulan);
    } catch (e) {
      alert("Gagal membuat tagihan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tagihan & Iuran Warga</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen tagihan rutin kas RT dan retribusi kebersihan warga {settings.blok}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateNextMonth}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Tagihan Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Penerimaan</span>
          <p className="text-xl font-black text-slate-900 mt-1">Rp {stats.totalTarget?.toLocaleString("id-ID")}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total tagihan 12 KK</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dana Terkumpul</span>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{stats.persentase}%</span>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-1">Rp {stats.totalTerkumpul?.toLocaleString("id-ID")}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{stats.countLunas} warga telah melunasi</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tagihan Tertunda</span>
          <p className="text-xl font-black text-rose-600 mt-1">Rp {stats.totalTertunda?.toLocaleString("id-ID")}</p>
          <p className="text-[11px] text-rose-500 font-bold mt-0.5">{stats.countBelumLunas} warga belum lunas</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Periode Bulan</span>
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="April 2026">April 2026</option>
            <option value="Maret 2026">Maret 2026</option>
            <option value="Februari 2026">Februari 2026</option>
            <option value="Januari 2026">Januari 2026</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama warga, nomor rumah, atau NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="Semua">Semua Status</option>
              <option value="lunas">Sudah Lunas</option>
              <option value="belum_lunas">Belum Lunas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Warga & Rumah</th>
                <th className="pb-3">Kas RT</th>
                <th className="pb-3">Sampah</th>
                <th className="pb-3">Total Tagihan</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Waktu Bayar / Metode</th>
                <th className="pb-3 text-right pr-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((item) => {
                const isLunas = item.status === "lunas";
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {item.wargaNama ? item.wargaNama.substring(0, 2).toUpperCase() : "WR"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{item.wargaNama}</p>
                          <span className="text-[11px] text-indigo-600 font-semibold">{item.wargaNoRumah}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600">Rp {item.nominalKas.toLocaleString("id-ID")}</td>
                    <td className="py-3.5 text-slate-600">Rp {item.nominalSampah.toLocaleString("id-ID")}</td>
                    <td className="py-3.5 font-black text-slate-900">Rp {item.totalTagihan.toLocaleString("id-ID")}</td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isLunas ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isLunas ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-rose-600" />}
                        <span>{isLunas ? "Lunas" : "Belum Lunas"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 text-[11px]">
                      {isLunas ? (
                        <div>
                          <p className="font-semibold text-slate-700">{item.tanggalBayar || "Tercatat"}</p>
                          <p className="text-[10px] text-slate-400">{item.metode || "Transfer BCA"}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Menunggu konfirmasi</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-2">
                        {!isLunas ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBill(item);
                                setOpenBayarModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </button>
                            <button
                              onClick={() => handleSendWaReminder(item)}
                              title="Kirim Pengingat WhatsApp"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <Link
                            href={`/kwitansi?tagihanId=${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Kwitansi</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalBayarIuran isOpen={openBayarModal} onClose={() => setOpenBayarModal(false)} onSuccess={fetchTagihan} item={selectedBill} />
    </div>
  );
}
