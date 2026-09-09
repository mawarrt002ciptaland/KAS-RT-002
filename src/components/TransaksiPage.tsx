"use client";
import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle, Download } from "lucide-react";
import { exportCsv } from "@/lib/csv";
import {
  Card,
  PageHeader,
  Button,
  Modal,
  Field,
  inputCls,
  Badge,
  Spinner,
  EmptyState,
} from "@/components/ui";
import { useMe } from "@/components/AppShell";
import { rupiah, tanggalID, todayISO, NAMA_BULAN } from "@/lib/format";

type Trx = {
  id: number;
  jenis: string;
  kategori: string;
  keterangan: string;
  nominal: number;
  tanggal: string;
  tagihanId: number | null;
};

export default function TransaksiPage({ jenis }: { jenis: "masuk" | "keluar" }) {
  const me = useMe();
  const isAdmin = me?.role === "admin";
  const isMasuk = jenis === "masuk";
  const [rows, setRows] = useState<Trx[] | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    kategori: "",
    keterangan: "",
    nominal: "",
    tanggal: todayISO(),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [fBulan, setFBulan] = useState(0); // 0 = semua bulan
  const [fTahun, setFTahun] = useState(0); // 0 = semua tahun

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/transaksi?jenis=${jenis}`);
    if (res.ok) setRows((await res.json()).data);
  }, [jenis]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await apiFetch("/api/transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        jenis,
        nominal: Number(form.nominal),
        kategori: form.kategori || (isMasuk ? "Pemasukan Lain" : "Umum"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan");
      return;
    }
    setModal(false);
    setForm({ kategori: "", keterangan: "", nominal: "", tanggal: todayISO() });
    load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus transaksi ini?")) return;
    await apiFetch(`/api/transaksi/${id}`, { method: "DELETE" });
    load();
  }

  // Filter periode bulan/tahun
  const filtered = (rows || []).filter((t) => {
    const d = new Date(t.tanggal);
    if (fBulan && d.getMonth() + 1 !== fBulan) return false;
    if (fTahun && d.getFullYear() !== fTahun) return false;
    return true;
  });

  const total = filtered.reduce((a, b) => a + Number(b.nominal), 0);

  const periodeLabel = [
    fBulan ? NAMA_BULAN[fBulan - 1] : "",
    fTahun ? String(fTahun) : "",
  ]
    .filter(Boolean)
    .join(" ") || "Semua Periode";

  function doExport() {
    const label = isMasuk ? "pemasukan" : "pengeluaran";
    const suffix = [
      fBulan ? NAMA_BULAN[fBulan - 1].toLowerCase() : "semua-bulan",
      fTahun ? String(fTahun) : "semua-tahun",
    ].join("-");
    exportCsv(
      `${label}-kas-rt002-${suffix}`,
      ["No", "Tanggal", "Keterangan", "Kategori", "Nominal (Rp)"],
      [
        ...filtered.map((t, i) => [
          i + 1,
          tanggalID(t.tanggal),
          t.keterangan,
          t.kategori,
          Number(t.nominal),
        ]),
        ["", "", "TOTAL", "", total],
      ]
    );
  }

  return (
    <div className="fade-up">
      <PageHeader
        title={isMasuk ? "Pemasukan Kas" : "Pengeluaran Kas"}
        subtitle={
          isMasuk
            ? "Semua dana yang masuk ke kas RT"
            : "Semua dana yang keluar dari kas RT"
        }
        action={
          <>
            <Button variant="secondary" onClick={doExport}>
              <Download size={15} /> Export CSV
            </Button>
            {isAdmin && (
              <Button
                onClick={() => {
                  setError("");
                  setModal(true);
                }}
                variant={isMasuk ? "success" : "danger"}
              >
                <Plus size={16} /> Catat {isMasuk ? "Pemasukan" : "Pengeluaran"}
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
        <select
          className={`${inputCls} !w-auto`}
          value={fBulan}
          onChange={(e) => setFBulan(Number(e.target.value))}
        >
          <option value={0}>Semua Bulan</option>
          {NAMA_BULAN.map((b, i) => (
            <option key={i} value={i + 1}>{b}</option>
          ))}
        </select>
        <select
          className={`${inputCls} !w-auto`}
          value={fTahun}
          onChange={(e) => setFTahun(Number(e.target.value))}
        >
          <option value={0}>Semua Tahun</option>
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
          {periodeLabel} · {filtered.length} transaksi
        </span>
      </Card>

      <Card className="mb-5 flex items-center justify-between p-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Total {isMasuk ? "Pemasukan" : "Pengeluaran"}
          </p>
          <p
            className={`mt-1 text-2xl font-extrabold ${
              isMasuk ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {rupiah(total)}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${
            isMasuk
              ? "bg-emerald-500 shadow-emerald-500/30"
              : "bg-rose-500 shadow-rose-500/30"
          }`}
        >
          {isMasuk ? <ArrowDownCircle size={22} /> : <ArrowUpCircle size={22} />}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {!rows ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            text={`Tidak ada ${isMasuk ? "pemasukan" : "pengeluaran"} pada periode ini`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Keterangan</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3 text-right">Nominal</th>
                  {isAdmin && <th className="px-5 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 transition hover:bg-slate-50/60"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-bold text-slate-500">
                      {tanggalID(t.tanggal)}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-700">
                      {t.keterangan}
                      {t.tagihanId && (
                        <span className="ml-2 text-[10px] font-bold text-indigo-400">
                          (dari tagihan)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge color={isMasuk ? "green" : "amber"}>
                        {t.kategori}
                      </Badge>
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-3.5 text-right font-extrabold ${
                        isMasuk ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {isMasuk ? "+" : "−"} {rupiah(t.nominal)}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => hapus(t.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Catat ${isMasuk ? "Pemasukan" : "Pengeluaran"}`}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Keterangan">
            <input
              className={inputCls}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder={
                isMasuk ? "Contoh: Donasi warga" : "Contoh: Beli lampu jalan"
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nominal (Rp)">
              <input
                type="number"
                className={inputCls}
                value={form.nominal}
                onChange={(e) => setForm({ ...form, nominal: e.target.value })}
                placeholder="100000"
              />
            </Field>
            <Field label="Tanggal">
              <input
                type="date"
                className={inputCls}
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Kategori">
            <select
              className={inputCls}
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            >
              <option value="">Pilih kategori...</option>
              {isMasuk ? (
                <>
                  <option>Donasi</option>
                  <option>Sumbangan Acara</option>
                  <option>Denda</option>
                  <option>Pemasukan Lain</option>
                </>
              ) : (
                <>
                  <option>Keamanan</option>
                  <option>Kebersihan</option>
                  <option>Perbaikan Fasilitas</option>
                  <option>Acara Warga</option>
                  <option>Sosial</option>
                  <option>Umum</option>
                </>
              )}
            </select>
          </Field>
          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-500">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving} variant={isMasuk ? "success" : "danger"}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
