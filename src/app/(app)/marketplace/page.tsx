"use client";
import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Send, Pencil, Trash2, Store } from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Modal,
  Field,
  inputCls,
  Spinner,
  EmptyState,
} from "@/components/ui";
import { useMe } from "@/components/AppShell";
import { rupiah } from "@/lib/format";

type Produk = {
  id: number;
  nama: string;
  harga: number;
  kategori: string;
  status: string;
  penjual: string;
  telepon: string | null;
  keterangan: string | null;
  warna: string;
  wargaId: number | null;
};

const WARNA: Record<string, { header: string; badge: string }> = {
  indigo: { header: "from-indigo-500 to-violet-600", badge: "bg-indigo-400" },
  amber: { header: "from-amber-400 to-orange-500", badge: "bg-amber-400" },
  emerald: { header: "from-emerald-400 to-teal-500", badge: "bg-emerald-400" },
  rose: { header: "from-rose-400 to-pink-500", badge: "bg-rose-400" },
  cyan: { header: "from-cyan-400 to-sky-500", badge: "bg-cyan-400" },
  violet: { header: "from-violet-500 to-purple-600", badge: "bg-violet-400" },
};

const empty = {
  nama: "",
  harga: "",
  kategori: "Jual",
  status: "tersedia",
  penjual: "",
  telepon: "",
  keterangan: "",
  warna: "indigo",
};

export default function MarketplacePage() {
  const me = useMe();
  const [rows, setRows] = useState<Produk[] | null>(null);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/produk");
    if (res.ok) setRows((await res.json()).data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditId(null);
    setForm({ ...empty, penjual: me?.nama || "", telepon: "" });
    setError("");
    setModal(true);
  }

  function openEdit(p: Produk) {
    setEditId(p.id);
    setForm({
      nama: p.nama,
      harga: String(p.harga),
      kategori: p.kategori,
      status: p.status,
      penjual: p.penjual,
      telepon: p.telepon || "",
      keterangan: p.keterangan || "",
      warna: p.warna,
    });
    setError("");
    setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await apiFetch(editId ? `/api/produk/${editId}` : "/api/produk", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, harga: Number(form.harga) || 0 }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan");
      return;
    }
    setModal(false);
    load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus produk ini?")) return;
    await apiFetch(`/api/produk/${id}`, { method: "DELETE" });
    load();
  }

  function waLink(p: Produk) {
    const phone = (p.telepon || "").replace(/\D/g, "").replace(/^0/, "62");
    const msg = `Halo ${p.penjual}, saya tertarik dengan "${p.nama}" (${rupiah(p.harga)}) di Marketplace Warga RT 002 Blok Mawar. Apakah masih tersedia?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  const canManage = (p: Produk) =>
    me?.role === "admin" || (me?.wargaId != null && p.wargaId === me.wargaId);

  const filtered = (rows || []).filter(
    (p) =>
      p.nama.toLowerCase().includes(q.toLowerCase()) ||
      p.penjual.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fade-up">
      <PageHeader
        title="Marketplace Warga"
        subtitle="Mendukung UMKM & ekonomi lokal antar warga"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Jual Produk
          </Button>
        }
      />

      <Card className="mb-5 p-4">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk atau penjual..."
            className={`${inputCls} pl-10`}
          />
        </div>
      </Card>

      {!rows ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState text="Belum ada produk. Jadilah penjual pertama!" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const c = WARNA[p.warna] || WARNA.indigo;
            return (
              <Card key={p.id} className="overflow-hidden">
                {/* Header berwarna */}
                <div
                  className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${c.header} px-4`}
                >
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-slate-700 shadow">
                    {rupiah(p.harga)}
                  </span>
                  <h3 className="text-center text-3xl font-extrabold text-white drop-shadow-md">
                    {p.nama.length > 20 ? p.nama.slice(0, 20) + "…" : p.nama}
                  </h3>
                  <span
                    className={`absolute bottom-3 right-4 rounded-full ${c.badge} px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow`}
                  >
                    {p.kategori}
                  </span>
                </div>

                <div className="p-5">
                  <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        p.status === "tersedia" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span
                      className={
                        p.status === "tersedia" ? "text-emerald-500" : "text-rose-400"
                      }
                    >
                      {p.status === "tersedia" ? "Tersedia" : "Habis"}
                    </span>
                  </p>
                  <h4 className="mt-1 text-lg font-extrabold text-slate-800">
                    {p.nama}
                  </h4>
                  {p.keterangan && (
                    <p className="text-xs font-medium text-slate-400">{p.keterangan}</p>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-500">
                      {p.penjual.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-slate-600">
                        {p.penjual}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        Penjual RT
                      </p>
                    </div>
                    {canManage(p) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => hapus(p.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {p.telepon ? (
                    <a
                      href={waLink(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-emerald-400/30 transition hover:bg-emerald-500"
                    >
                      <Send size={14} /> Hubungi Penjual
                    </a>
                  ) : (
                    <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">
                      <Store size={14} /> Kontak tidak tersedia
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? "Edit Produk" : "Jual Produk / Jasa"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Nama Produk / Jasa">
            <input
              className={inputCls}
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Nasi Uduk"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga (Rp)">
              <input
                type="number"
                className={inputCls}
                value={form.harga}
                onChange={(e) => setForm({ ...form, harga: e.target.value })}
                placeholder="10000"
              />
            </Field>
            <Field label="Kategori">
              <select
                className={inputCls}
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              >
                <option value="Jual">Jual</option>
                <option value="Jasa">Jasa</option>
                <option value="Donasi">Donasi</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Penjual">
              <input
                className={inputCls}
                value={form.penjual}
                onChange={(e) => setForm({ ...form, penjual: e.target.value })}
                placeholder="Nama Anda"
              />
            </Field>
            <Field label="No. WhatsApp">
              <input
                className={inputCls}
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </Field>
          </div>
          <Field label="Keterangan">
            <input
              className={inputCls}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Deskripsi singkat produk"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Warna Kartu">
              <select
                className={inputCls}
                value={form.warna}
                onChange={(e) => setForm({ ...form, warna: e.target.value })}
              >
                <option value="indigo">Ungu (Indigo)</option>
                <option value="amber">Oranye (Amber)</option>
                <option value="emerald">Hijau (Emerald)</option>
                <option value="rose">Merah Muda (Rose)</option>
                <option value="cyan">Biru (Cyan)</option>
                <option value="violet">Violet</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="tersedia">Tersedia</option>
                <option value="habis">Habis</option>
              </select>
            </Field>
          </div>
          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-500">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
