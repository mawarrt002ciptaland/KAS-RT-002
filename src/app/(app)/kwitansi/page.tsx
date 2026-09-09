"use client";
import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";
import { Printer, ReceiptText, CheckCircle2 } from "lucide-react";
import { Card, PageHeader, Button, inputCls, Spinner } from "@/components/ui";
import { rupiah, tanggalID, NAMA_BULAN } from "@/lib/format";
import { terbilang } from "@/lib/terbilang";

type Tagihan = {
  id: number;
  namaWarga: string;
  noRumah: string;
  namaIuran: string;
  bulan: number;
  tahun: number;
  nominal: number;
  status: string;
  tanggalBayar: string | null;
  metode: string | null;
};

export default function KwitansiPage() {
  const [rows, setRows] = useState<Tagihan[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pengaturan, setPengaturan] = useState<Record<string, string>>({});

  useEffect(() => {
    apiFetch("/api/tagihan?status=lunas")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => {
        setRows(d.data || []);
        if ((d.data || []).length > 0) setSelectedId(d.data[0].id);
      });
    apiFetch("/api/settings")
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((d) => setPengaturan(d.data || {}));
  }, []);

  const t = (rows || []).find((r) => r.id === selectedId) || null;

  return (
    <div className="fade-up">
      <div className="no-print">
        <PageHeader
          title="Kwitansi"
          subtitle="Dokumen bukti pembayaran sah"
          action={
            t && (
              <Button onClick={() => window.print()}>
                <Printer size={15} /> Cetak
              </Button>
            )
          }
        />

        <Card className="mb-6 p-4">
          <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            Pilih Pembayaran (Tagihan Lunas)
          </label>
          {!rows ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <p className="py-3 text-sm font-bold text-slate-400">
              Belum ada tagihan lunas. Tandai tagihan sebagai lunas terlebih dahulu di
              menu Tagihan.
            </p>
          ) : (
            <select
              className={inputCls}
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.namaWarga} — {r.namaIuran} {NAMA_BULAN[r.bulan - 1]} {r.tahun} (
                  {rupiah(r.nominal)})
                </option>
              ))}
            </select>
          )}
        </Card>
      </div>

      {t && (
        <div className="print-area relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white p-8 shadow-[0_2px_30px_rgba(100,116,139,0.12)] md:p-10">
          {/* Watermark centang */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
            <CheckCircle2 size={420} className="text-emerald-500" />
          </div>

          {/* Header */}
          <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-400/40">
                <ReceiptText size={26} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  KWITANSI RESMI
                </h2>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-500">
                  Sistem Kas Digital RT
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="mb-1 inline-block rounded-full border border-slate-200 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                No: KW-{String(t.id).padStart(5, "0")}
              </span>
              <p className="text-lg font-extrabold text-slate-800">RT 002 / RW 014</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {pengaturan.namaRt || "Blok Mawar"} ·{" "}
                {pengaturan.namaPerumahan || "Perumahan Ciptaland"}
              </p>
            </div>
          </div>

          {/* Isi */}
          <div className="relative space-y-6 py-8">
            <div className="grid grid-cols-1 gap-1 md:grid-cols-[180px_1fr] md:items-end">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Diterima dari
              </p>
              <p className="border-b border-slate-200 pb-1 text-xl font-extrabold text-slate-800">
                {t.namaWarga}
                <span className="ml-2 text-xs font-bold text-slate-400">
                  (Rumah {t.noRumah})
                </span>
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1 md:grid-cols-[180px_1fr] md:items-end">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Uang sejumlah
              </p>
              <p className="border-b border-slate-200 pb-1 text-lg font-extrabold italic text-slate-700">
                {terbilang(t.nominal)}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1 md:grid-cols-[180px_1fr] md:items-end">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Untuk keperluan
              </p>
              <p className="border-b border-slate-200 pb-1 text-base font-extrabold text-slate-700">
                Pembayaran {t.namaIuran} periode {NAMA_BULAN[t.bulan - 1]} {t.tahun}
                {t.metode ? ` · via ${t.metode}` : ""}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative flex flex-wrap items-end justify-between gap-6 pt-4">
            <div className="rounded-2xl bg-indigo-50/80 px-6 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                Total Terbayar
              </p>
              <p className="text-3xl font-extrabold text-indigo-600">
                {rupiah(t.nominal)}
              </p>
              <span className="mt-1 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                ✓ Lunas
              </span>
            </div>
            <div className="text-right">
              <p className="mb-10 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                {tanggalID(t.tanggalBayar)}
              </p>
              <div className="relative inline-block">
                <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rotate-12 rounded-full border-4 border-emerald-200 opacity-60" />
                <p className="text-lg font-extrabold uppercase tracking-wide text-slate-700">
                  {pengaturan.namaBendahara || "Bendahara RT"}
                </p>
                <div className="mt-1 h-0.5 w-full bg-gradient-to-r from-indigo-300 to-transparent" />
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Bendahara RT
                </p>
              </div>
            </div>
          </div>

          <p className="relative mt-8 border-t border-slate-100 pt-4 text-center text-[10px] font-bold text-slate-300">
            Kwitansi ini dihasilkan secara otomatis oleh Sistem KAS RT Digital dan
            merupakan bukti pembayaran yang sah.
          </p>
        </div>
      )}
    </div>
  );
}
