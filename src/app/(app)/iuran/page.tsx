"use client";
import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
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
import { rupiah } from "@/lib/format";

type Iuran = {
  id: number;
  nama: string;
  nominal: number;
  periode: string;
  keterangan: string | null;
  aktif: boolean;
};

const empty = {
  nama: "",
  nominal: "",
  periode: "bulanan",
  keterangan: "",
  aktif: true,
};

export default function IuranPage() {
  const [rows, setRows] = useState<Iuran[] | null>(null);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/iuran");
    if (res.ok) setRows((await res.json()).data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditId(null);
    setForm({ ...empty });
    setError("");
    setModal(true);
  }

  function openEdit(r: Iuran) {
    setEditId(r.id);
    setForm({
      nama: r.nama,
      nominal: String(r.nominal),
      periode: r.periode,
      keterangan: r.keterangan || "",
      aktif: r.aktif,
    });
    setError("");
    setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await apiFetch(editId ? `/api/iuran/${editId}` : "/api/iuran", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, nominal: Number(form.nominal) }),
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
    if (!confirm("Hapus jenis iuran ini? Tagihan terkait ikut terhapus.")) return;
    await apiFetch(`/api/iuran/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="Jenis Iuran"
        subtitle="Kategori iuran kas warga"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Tambah Jenis Iuran
          </Button>
        }
      />

      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState text="Belum ada jenis iuran" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Layers size={20} />
                </div>
                <Badge color={r.aktif ? "green" : "slate"}>
                  {r.aktif ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
              <h3 className="mt-4 text-base font-extrabold text-slate-800">
                {r.nama}
              </h3>
              <p className="text-xs font-bold text-slate-400">
                {r.periode === "bulanan" ? "Iuran Bulanan" : "Iuran Insidental"}
              </p>
              <p className="mt-3 text-xl font-extrabold text-indigo-500">
                {rupiah(r.nominal)}
              </p>
              {r.keterangan && (
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {r.keterangan}
                </p>
              )}
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => openEdit(r)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-xs font-extrabold text-slate-500 hover:bg-indigo-50 hover:text-indigo-500"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => hapus(r.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-xs font-extrabold text-slate-500 hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? "Edit Jenis Iuran" : "Tambah Jenis Iuran"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Nama Iuran">
            <input
              className={inputCls}
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Iuran Kas Bulanan"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nominal (Rp)">
              <input
                type="number"
                className={inputCls}
                value={form.nominal}
                onChange={(e) => setForm({ ...form, nominal: e.target.value })}
                placeholder="50000"
              />
            </Field>
            <Field label="Periode">
              <select
                className={inputCls}
                value={form.periode}
                onChange={(e) => setForm({ ...form, periode: e.target.value })}
              >
                <option value="bulanan">Bulanan</option>
                <option value="insidental">Insidental</option>
              </select>
            </Field>
          </div>
          <Field label="Keterangan">
            <input
              className={inputCls}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Opsional"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={form.aktif}
              onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
              className="h-4 w-4 accent-indigo-500"
            />
            Iuran aktif
          </label>
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
