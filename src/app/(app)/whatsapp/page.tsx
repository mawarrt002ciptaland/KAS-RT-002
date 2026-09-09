"use client";
import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import {
  Card,
  PageHeader,
  Badge,
  Spinner,
  EmptyState,
  Field,
  inputCls,
} from "@/components/ui";
import { rupiah, NAMA_BULAN } from "@/lib/format";

type Tagihan = {
  id: number;
  namaWarga: string;
  noRumah: string;
  telepon: string | null;
  namaIuran: string;
  bulan: number;
  tahun: number;
  nominal: number;
};

export default function WhatsAppPage() {
  const [rows, setRows] = useState<Tagihan[] | null>(null);
  const [template, setTemplate] = useState("");

  useEffect(() => {
    apiFetch("/api/tagihan?status=belum")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setRows(d.data || []));
    apiFetch("/api/settings")
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((d) => setTemplate(d.data?.pesanWa || ""));
  }, []);

  function buildPesan(t: Tagihan) {
    return template
      .replaceAll("{nama}", t.namaWarga)
      .replaceAll("{iuran}", t.namaIuran)
      .replaceAll("{periode}", `${NAMA_BULAN[t.bulan - 1]} ${t.tahun}`)
      .replaceAll("{nominal}", rupiah(t.nominal));
  }

  function waLink(t: Tagihan) {
    const phone = (t.telepon || "").replace(/\D/g, "").replace(/^0/, "62");
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildPesan(t))}`;
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="Kirim Pengingat WhatsApp"
        subtitle="Ingatkan warga dengan tagihan yang belum dibayar"
      />

      <Card className="mb-5 p-5">
        <Field label="Template Pesan (placeholder: {nama} {iuran} {periode} {nominal})">
          <textarea
            className={`${inputCls} min-h-24`}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
        </Field>
        <p className="mt-2 text-[11px] font-bold text-slate-400">
          💡 Template default dapat diubah permanen di menu Pengaturan.
        </p>
      </Card>

      <Card className="overflow-hidden">
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState text="🎉 Semua tagihan sudah lunas!" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-3">Warga</th>
                  <th className="px-5 py-3">Tagihan</th>
                  <th className="px-5 py-3 text-right">Nominal</th>
                  <th className="px-5 py-3">No. WA</th>
                  <th className="px-5 py-3 text-right">Kirim</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                          <MessageCircle size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-700">{t.namaWarga}</p>
                          <p className="text-[10px] font-bold text-slate-400">Rumah {t.noRumah}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-500">
                      {t.namaIuran} · {NAMA_BULAN[t.bulan - 1]} {t.tahun}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-extrabold text-rose-500">
                      {rupiah(t.nominal)}
                    </td>
                    <td className="px-5 py-3.5">
                      {t.telepon ? (
                        <Badge color="green">{t.telepon}</Badge>
                      ) : (
                        <Badge color="slate">Tidak ada nomor</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {t.telepon ? (
                        <a
                          href={waLink(t)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600"
                        >
                          <Send size={13} /> WhatsApp
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
