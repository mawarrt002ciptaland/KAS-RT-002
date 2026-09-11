"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Calendar, Check, Search, CreditCard } from "lucide-react";
import { ModalBayarIuran } from "@/components/ModalBayarIuran";

export default function IuranMatrixPage() {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [tagihanList, setTagihanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [openBayar, setOpenBayar] = useState(false);

  const months = [
    "Januari 2026",
    "Februari 2026",
    "Maret 2026",
    "April 2026",
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resWarga, resTagihan] = await Promise.all([
        fetch("/api/warga"),
        fetch("/api/tagihan?bulan=Semua"),
      ]);

      const dataW = await resWarga.json();
      const dataT = await resTagihan.json();

      if (dataW.warga) setWargaList(dataW.warga);
      if (dataT.tagihan) setTagihanList(dataT.tagihan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatus = (wargaId: number, bulan: string) => {
    const bill = tagihanList.find(
      (t) => t.wargaId === wargaId && t.bulan.toLowerCase() === bulan.toLowerCase()
    );
    if (!bill) return { status: "lunas", bill: null }; // Default previous months lunas
    return { status: bill.status, bill };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Matriks Rekap Iuran Warga
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tabel pemantauan kepatuhan iuran kas dan sampah per kepala keluarga tahun 2026
        </p>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Rumah</th>
                <th className="pb-3">Kepala Keluarga</th>
                <th className="pb-3 text-center">Jan 2026</th>
                <th className="pb-3 text-center">Feb 2026</th>
                <th className="pb-3 text-center">Mar 2026</th>
                <th className="pb-3 text-center">Apr 2026</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {wargaList.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 pl-2 font-black text-indigo-700">
                    {w.noRumah}
                  </td>
                  <td className="py-3">
                    <p className="font-bold text-slate-800">{w.nama}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{w.nik}</span>
                  </td>

                  {months.map((m) => {
                    const { status, bill } = getStatus(w.id, m);
                    const isLunas = status === "lunas";

                    return (
                      <td key={m} className="py-3 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Lunas</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setOpenBayar(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                          >
                            <Clock className="w-3 h-3 text-rose-600" />
                            <span>Bayar</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalBayarIuran
        isOpen={openBayar}
        onClose={() => setOpenBayar(false)}
        onSuccess={fetchData}
        item={selectedBill}
      />
    </div>
  );
}
