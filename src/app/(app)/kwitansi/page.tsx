"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, MessageCircle } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

function KwitansiContent() {
  const searchParams = useSearchParams();
  const kode = searchParams.get("kode");
  const tagihanId = searchParams.get("tagihanId");

  const [receipt, setReceipt] = useState<any>({
    noKwitansi: "KW-202604-0012",
    tanggal: "06 April 2026",
    sudahTerimaDari: "Bayu Sudik Pamarto",
    noRumah: "Blok Mawar M-02",
    nominal: 50000,
    terbilang: "Lima Puluh Ribu Rupiah",
    untukPembayaran: "Iuran Kas RT & Retribusi Kebersihan Sampah Periode April 2026",
    metodePembayaran: "Transfer BCA / QRIS",
    status: "LUNAS",
    bendahara: "Ahmad Suryana",
    ketuaRt: "Bambang Sudik Pamarto",
    rt: "RT 002 RW 014",
    perumahan: "Perumahan Ciptaland",
    logoImage: "",
    namaBank: "Bank Central Asia (BCA)",
    noRekening: "8720192831",
    atasNama: "KAS RT 002 BLOK MAWAR",
    blok: "Blok Mawar",
  });

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        let url = "/api/kwitansi";
        if (tagihanId) url += `?tagihanId=${tagihanId}`;
        else if (kode) url += `?kode=${kode}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.kwitansi) {
          setReceipt(data.kwitansi);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchReceipt();
  }, [kode, tagihanId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWa = () => {
    const text = encodeURIComponent(
      `KWITANSI DIGITAL KAS RT\n-------------------------\nNo: ${receipt.noKwitansi}\nSudah Terima Dari: ${receipt.sudahTerimaDari} (${receipt.noRumah})\nNominal: Rp ${receipt.nominal?.toLocaleString("id-ID")}\nTerbilang: ${receipt.terbilang}\nUntuk: ${receipt.untukPembayaran}\nStatus: LUNAS (${receipt.metodePembayaran})\nBendahara: ${receipt.bendahara}\n\nTerima kasih atas partisipasi aktif warga ${receipt.blok} ${receipt.rt}.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kwitansi Digital</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bukti pembayaran sah kas {receipt.rt} {receipt.perumahan}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Kwitansi</span>
          </button>
          <button
            onClick={handleSendWa}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim ke WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 relative overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/60 rounded-bl-full pointer-events-none print:hidden"></div>

        <div className="border-b-2 border-slate-800 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {receipt.logoImage ? (
              <img
                src={resolveMediaUrl(receipt.logoImage)}
                alt="Logo RT"
                className="w-[58px] h-[58px] rounded-full border border-slate-200 object-cover bg-white"
              />
            ) : (
              <div className="w-[58px] h-[58px] rounded-full border border-slate-200 bg-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                RT
              </div>
            )}
            <div>
              <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
                PENGURUS {receipt.rt}
              </h2>
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                {receipt.perumahan} · {receipt.blok}
              </p>
              <p className="text-[10px] text-slate-500">
                Rek. Kas {receipt.namaBank} · {receipt.noRekening}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-black uppercase tracking-wider block">
              KWITANSI RESMI
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 mt-1 block">
              {receipt.noKwitansi}
            </span>
          </div>
        </div>

        <div className="py-6 space-y-4 text-xs">
          <div className="flex items-start gap-4">
            <span className="w-36 font-bold text-slate-500 uppercase tracking-wider shrink-0">Telah Diterima Dari :</span>
            <div className="flex-1 font-bold text-slate-900 text-sm border-b border-dashed border-slate-300 pb-1">
              {receipt.sudahTerimaDari} {receipt.noRumah ? `(${receipt.noRumah})` : ""}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="w-36 font-bold text-slate-500 uppercase tracking-wider shrink-0">Uang Sejumlah :</span>
            <div className="flex-1 italic font-semibold text-indigo-900 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
              &ldquo;{receipt.terbilang}&rdquo;
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="w-36 font-bold text-slate-500 uppercase tracking-wider shrink-0">Untuk Pembayaran :</span>
            <div className="flex-1 font-semibold text-slate-800 border-b border-dashed border-slate-300 pb-1 leading-relaxed">
              {receipt.untukPembayaran}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center gap-3 shadow-md w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah:</span>
            <span className="text-2xl font-black font-mono tracking-tight text-white">
              Rp {receipt.nominal?.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="px-4 py-2 border-2 border-emerald-600 rounded-2xl rotate-[-4deg] text-emerald-700 font-black text-center shadow-sm">
            <div className="text-[10px] tracking-widest uppercase">TERVERIFIKASI SAH</div>
            <div className="text-lg tracking-wider">L U N A S</div>
            <div className="text-[9px] font-medium font-mono">{receipt.metodePembayaran}</div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-slate-400 font-medium">Mengetahui,</p>
            <p className="font-bold text-slate-700">Ketua {receipt.rt}</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-slate-300 font-serif italic text-xs">Ttd Digital</span>
            </div>
            <p className="font-black text-slate-900 uppercase underline">{receipt.ketuaRt}</p>
          </div>

          <div>
            <p className="text-slate-400 font-medium">{receipt.perumahan}, {receipt.tanggal}</p>
            <p className="font-bold text-slate-700">Bendahara Penerima</p>
            <div className="h-16 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-indigo-200 bg-indigo-50/50 flex items-center justify-center text-indigo-700 font-bold text-xs">
                RT 002
              </div>
            </div>
            <p className="font-black text-slate-900 uppercase underline">{receipt.bendahara}</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-6">
          Kwitansi ini dihasilkan secara elektronik oleh Sistem Informasi Kas {receipt.rt} {receipt.blok} {receipt.perumahan} dan sah tanpa tanda tangan basah.
        </p>
      </div>
    </div>
  );
}

export default function KwitansiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat kwitansi...</div>}>
      <KwitansiContent />
    </Suspense>
  );
}
