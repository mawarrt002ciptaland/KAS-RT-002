"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Users, CheckCircle2, Phone, Sparkles, History } from "lucide-react";

export default function WhatsappPage() {
  const [recipientType, setRecipientType] = useState("all");
  const [pesan, setPesan] = useState(
    "Yth. Seluruh Warga RT 002 RW 014 Blok Mawar,\n\nKami menginfokan kegiatan Kerja Bakti Lingkungan dan Fogging akan dilaksanakan pada hari Minggu pagi pukul 07.00 WIB. Dimohon kehadiran dan partisipasi aktif seluruh warga. Terima kasih!"
  );
  const [logs, setLogs] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/whatsapp");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesan.trim()) return;

    setSending(true);
    try {
      const targetName =
        recipientType === "all"
          ? "Semua Warga Blok Mawar"
          : recipientType === "belum_lunas"
          ? "Warga Belum Lunas Iuran"
          : "Grup WA RT 002";

      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tujuanNama: targetName,
          tujuanNomor: "Grup WhatsApp RT",
          pesan,
          tipe: "Broadcast",
        }),
      });

      const data = await res.json();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchLogs();

      // Open WhatsApp Web with text
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
    } catch (e) {
      alert("Gagal mengirim broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          WhatsApp Broadcast & Notifikasi
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kirim pengumuman, tagihan iuran, dan informasi penting ke warga Blok Mawar RT 002
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Kirim Pesan Broadcast Masal</span>
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Penerima
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRecipientType("all")}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    recipientType === "all"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Semua Warga (12 KK)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType("belum_lunas");
                    setPesan(
                      "Yth. Bpk/Ibu Warga Blok Mawar, mengingatkan kembali untuk iuran kas RT dan sampah bulan April 2026 sebesar Rp 50.000. Pembayaran via transfer BCA 8720192831 a.n KAS RT 002 BLOK MAWAR. Terima kasih 🙏"
                    );
                  }}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    recipientType === "belum_lunas"
                      ? "bg-rose-50 border-rose-500 text-rose-800 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Warga Belum Lunas
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType("custom")}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    recipientType === "custom"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Grup WhatsApp RT
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Isi Pesan WhatsApp
              </label>
              <textarea
                rows={6}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Pesan akan langsung diarahkan ke WhatsApp Web / Desktop
              </span>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? "Memproses..." : "Kirim via WhatsApp"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* WhatsApp Preview Bubble & Logs (1 col) */}
        <div className="space-y-4">
          {/* Chat Bubble Preview */}
          <div className="bg-[#EFEAE2] p-4 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Pratinjau Tampilan Pesan
            </span>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-800 whitespace-pre-wrap leading-relaxed relative">
              {pesan}
              <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                10:30 ✓✓
              </div>
            </div>
          </div>

          {/* Broadcast Log */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Riwayat Pengiriman</span>
            </h3>

            <div className="space-y-2.5">
              {logs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.tujuanNama}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Terkirim
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {log.pesan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
