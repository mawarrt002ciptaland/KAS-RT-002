"use client";
import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  RotateCcw,
  Wallet,
  Send,
  Copy,
} from "lucide-react";
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
import { rupiah, tanggalID, NAMA_BULAN, todayISO } from "@/lib/format";

type Tagihan = {
  id: number;
  wargaId: number;
  namaWarga: string;
  noRumah: string;
  jenisIuranId: number;
  namaIuran: string;
  bulan: number;
  tahun: number;
  nominal: number;
  status: string;
  tanggalBayar: string | null;
  metode: string | null;
};

type Iuran = { id: number; nama: string; nominal: number; aktif: boolean };

export default function TagihanPage() {
  const me = useMe();
  const isAdmin = me?.role === "admin";
  const now = new Date();
  const [rows, setRows] = useState<Tagihan[] | null>(null);
  const [iuranList, setIuranList] = useState<Iuran[]>([]);
  const [fBulan, setFBulan] = useState(0);
  const [fTahun, setFTahun] = useState(now.getFullYear());
  const [fStatus, setFStatus] = useState("");
  const [genModal, setGenModal] = useState(false);
  const [gen, setGen] = useState({
    jenisIuranId: "",
    bulan: String(now.getMonth() + 1),
    tahun: String(now.getFullYear()),
  });
  const [bayarModal, setBayarModal] = useState<Tagihan | null>(null);
  const [bayarForm, setBayarForm] = useState({ tanggal: todayISO(), metode: "Tunai" });
  const [kwitansi, setKwitansi] = useState<Tagihan | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState<Tagihan | null>(null);
  const [pengaturan, setPengaturan] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (fBulan) p.set("bulan", String(fBulan));
    if (fTahun) p.set("tahun", String(fTahun));
    if (fStatus) p.set("status", fStatus);
    const res = await apiFetch(`/api/tagihan?${p}`);
    if (res.ok) setRows((await res.json()).data);
  }, [fBulan, fTahun, fStatus]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiFetch("/api/iuran")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setIuranList(d.data || []));
    apiFetch("/api/settings")
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((d) => setPengaturan(d.data || {}));
  }, []);

  function copyRekening() {
    const rek = pengaturan.rekening || "";
    const angka = rek.replace(/\D+/g, " ").trim().split(/\s+/).sort((a, b) => b.length - a.length)[0] || rek;
    navigator.clipboard?.writeText(angka).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function waKonfirmasi(t: Tagihan) {
    const phone = (pengaturan.teleponBendahara || "")
      .replace(/\D/g, "")
      .replace(/^0/, "62");
    const msg = `Assalamu'alaikum ${pengaturan.namaBendahara || "Bendahara RT"}, saya ${t.namaWarga} (Rumah ${t.noRumah}) sudah melakukan pembayaran transfer untuk ${t.namaIuran} periode ${NAMA_BULAN[t.bulan - 1]} ${t.tahun} sebesar ${rupiah(t.nominal)}. Mohon dicek dan dikonfirmasi. Terima kasih 🙏`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await apiFetch("/api/tagihan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gen),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(data.error || "Gagal membuat tagihan");
      return;
    }
    setGenModal(false);
    alert(`Berhasil membuat ${data.created} tagihan baru (${data.skipped} sudah ada, dilewati).`);
    load();
  }

  async function bayar(e: React.FormEvent) {
    e.preventDefault();
    if (!bayarModal) return;
    setSaving(true);
    await apiFetch(`/api/tagihan/${bayarModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "bayar", ...bayarForm }),
    });
    setSaving(false);
    setBayarModal(null);
    load();
  }

  async function batalLunas(id: number) {
    if (!confirm("Batalkan status lunas? Transaksi pemasukan terkait akan dihapus.")) return;
    await apiFetch(`/api/tagihan/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "batal" }),
    });
    load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus tagihan ini?")) return;
    await apiFetch(`/api/tagihan/${id}`, { method: "DELETE" });
    load();
  }

  const totalBelum = (rows || [])
    .filter((r) => r.status === "belum")
    .reduce((a, b) => a + Number(b.nominal), 0);

  return (
    <div className="fade-up">
      <PageHeader
        title={isAdmin ? "Tagihan Iuran" : "Tagihan Saya"}
        subtitle="Kelola tagihan iuran warga per periode"
        action={
          isAdmin && (
            <Button onClick={() => { setMsg(""); setGenModal(true); }}>
              <Plus size={16} /> Generate Tagihan
            </Button>
          )
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
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className={`${inputCls} !w-auto`}
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="belum">Belum Bayar</option>
          <option value="lunas">Lunas</option>
        </select>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Total Belum Dibayar
          </p>
          <p className="text-lg font-extrabold text-rose-500">{rupiah(totalBelum)}</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState text="Tidak ada tagihan pada periode ini" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-3">Warga</th>
                  <th className="px-5 py-3">Iuran</th>
                  <th className="px-5 py-3">Periode</th>
                  <th className="px-5 py-3 text-right">Nominal</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-extrabold text-slate-700">{t.namaWarga}</p>
                      <p className="text-[10px] font-bold text-slate-400">Rumah {t.noRumah}</p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-500">{t.namaIuran}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-bold text-slate-500">
                      {NAMA_BULAN[t.bulan - 1]} {t.tahun}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-extrabold text-slate-700">
                      {rupiah(t.nominal)}
                    </td>
                    <td className="px-5 py-3.5">
                      {t.status === "lunas" ? (
                        <Badge color="green">✓ Lunas</Badge>
                      ) : (
                        <Badge color="red">Belum Bayar</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        {t.status === "lunas" ? (
                          <>
                            <button
                              onClick={() => setKwitansi(t)}
                              title="Cetak kwitansi"
                              className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500"
                            >
                              <Printer size={15} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => batalLunas(t.id)}
                                title="Batalkan lunas"
                                className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
                              >
                                <RotateCcw size={15} />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setPayModal(t)}
                              title="Bayar via transfer/QRIS"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-600"
                            >
                              <Wallet size={13} /> Bayar
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setBayarForm({ tanggal: todayISO(), metode: "Tunai" });
                                  setBayarModal(t);
                                }}
                                title="Tandai lunas"
                                className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                          </>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => hapus(t.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Generate modal */}
      <Modal open={genModal} onClose={() => setGenModal(false)} title="Generate Tagihan Massal">
        <form onSubmit={generate} className="space-y-4">
          <p className="rounded-xl bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-500">
            Tagihan akan dibuat untuk semua warga berstatus aktif. Warga yang sudah punya tagihan periode sama akan dilewati.
          </p>
          <Field label="Jenis Iuran">
            <select
              className={inputCls}
              value={gen.jenisIuranId}
              onChange={(e) => setGen({ ...gen, jenisIuranId: e.target.value })}
            >
              <option value="">Pilih jenis iuran...</option>
              {iuranList.filter((i) => i.aktif).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nama} — {rupiah(i.nominal)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bulan">
              <select
                className={inputCls}
                value={gen.bulan}
                onChange={(e) => setGen({ ...gen, bulan: e.target.value })}
              >
                {NAMA_BULAN.map((b, i) => (
                  <option key={i} value={i + 1}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Tahun">
              <input
                type="number"
                className={inputCls}
                value={gen.tahun}
                onChange={(e) => setGen({ ...gen, tahun: e.target.value })}
              />
            </Field>
          </div>
          {msg && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-500">{msg}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setGenModal(false)}>Batal</Button>
            <Button type="submit" disabled={saving || !gen.jenisIuranId}>
              {saving ? "Memproses..." : "Generate Sekarang"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bayar modal */}
      <Modal
        open={!!bayarModal}
        onClose={() => setBayarModal(null)}
        title="Konfirmasi Pembayaran"
      >
        {bayarModal && (
          <form onSubmit={bayar} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-extrabold text-slate-700">{bayarModal.namaWarga}</p>
              <p className="text-xs font-bold text-slate-400">
                {bayarModal.namaIuran} · {NAMA_BULAN[bayarModal.bulan - 1]} {bayarModal.tahun}
              </p>
              <p className="mt-2 text-xl font-extrabold text-indigo-500">
                {rupiah(bayarModal.nominal)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal Bayar">
                <input
                  type="date"
                  className={inputCls}
                  value={bayarForm.tanggal}
                  onChange={(e) => setBayarForm({ ...bayarForm, tanggal: e.target.value })}
                />
              </Field>
              <Field label="Metode">
                <select
                  className={inputCls}
                  value={bayarForm.metode}
                  onChange={(e) => setBayarForm({ ...bayarForm, metode: e.target.value })}
                >
                  <option>Tunai</option>
                  <option>Transfer Bank</option>
                  <option>QRIS</option>
                  <option>E-Wallet</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBayarModal(null)}>Batal</Button>
              <Button type="submit" variant="success" disabled={saving}>
                {saving ? "Memproses..." : "Tandai Lunas"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal pembayaran transfer/QRIS */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title="💳 Pembayaran Transfer / QRIS"
      >
        {payModal && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-indigo-50/70 p-4 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                Total yang harus dibayar
              </p>
              <p className="text-3xl font-extrabold text-indigo-600">
                {rupiah(payModal.nominal)}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {payModal.namaIuran} · {NAMA_BULAN[payModal.bulan - 1]}{" "}
                {payModal.tahun} · {payModal.namaWarga}
              </p>
            </div>

            {pengaturan.qrisPembayaran ? (
              <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-4 text-center">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Scan QRIS di bawah ini
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pengaturan.qrisPembayaran}
                  alt="QRIS Pembayaran"
                  className="mx-auto max-h-64 rounded-xl object-contain"
                />
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-xs font-bold text-amber-600">
                Gambar QRIS belum diunggah. Admin dapat menambahkannya di menu
                Pengaturan.
              </p>
            )}

            {pengaturan.rekening && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Atau transfer ke rekening
                  </p>
                  <p className="truncate text-sm font-extrabold text-slate-700">
                    {pengaturan.rekening}
                  </p>
                </div>
                <button
                  onClick={copyRekening}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-indigo-500 shadow-sm border border-slate-200 hover:bg-indigo-50"
                >
                  <Copy size={13} /> {copied ? "Tersalin ✓" : "Salin"}
                </button>
              </div>
            )}

            <p className="text-center text-[11px] font-semibold text-slate-400">
              Setelah transfer, kirim bukti pembayaran ke Bendahara RT agar tagihan
              ditandai lunas.
            </p>

            {pengaturan.teleponBendahara ? (
              <a
                href={waKonfirmasi(payModal)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
              >
                <Send size={16} /> Konfirmasi via WhatsApp Bendahara
              </a>
            ) : (
              <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-xs font-bold text-slate-400">
                Nomor WhatsApp Bendahara belum diatur di Pengaturan.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Kwitansi modal */}
      <Modal
        open={!!kwitansi}
        onClose={() => setKwitansi(null)}
        title="Kwitansi Pembayaran"
        wide
      >
        {kwitansi && (
          <div>
            <div className="print-area rounded-2xl border-2 border-dashed border-indigo-200 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-lg font-extrabold text-indigo-600">KWITANSI PEMBAYARAN</p>
                  <p className="text-xs font-bold text-slate-400">
                    Blok Mawar RT 002 RW 014 · Perumahan Ciptaland
                  </p>
                </div>
                <p className="text-xs font-extrabold text-slate-400">
                  No. KW-{String(kwitansi.id).padStart(5, "0")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 py-5 text-sm">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Diterima dari</p>
                  <p className="font-extrabold text-slate-700">{kwitansi.namaWarga}</p>
                  <p className="text-xs font-bold text-slate-400">Rumah {kwitansi.noRumah}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Untuk pembayaran</p>
                  <p className="font-extrabold text-slate-700">
                    {kwitansi.namaIuran} — {NAMA_BULAN[kwitansi.bulan - 1]} {kwitansi.tahun}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Tanggal bayar</p>
                  <p className="font-extrabold text-slate-700">{tanggalID(kwitansi.tanggalBayar)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Metode</p>
                  <p className="font-extrabold text-slate-700">{kwitansi.metode || "Tunai"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-5 py-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">Jumlah dibayar</p>
                <p className="text-2xl font-extrabold text-indigo-600">{rupiah(kwitansi.nominal)}</p>
              </div>
              <p className="mt-4 text-center text-[10px] font-bold text-slate-300">
                Dokumen ini dicetak otomatis oleh Sistem KAS RT — sah tanpa tanda tangan basah.
              </p>
            </div>
            <div className="no-print mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setKwitansi(null)}>Tutup</Button>
              <Button onClick={() => window.print()}>
                <Printer size={15} /> Cetak
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
