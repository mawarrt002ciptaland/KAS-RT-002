"use client";
import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
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

type Warga = {
  id: number;
  nik: string;
  nama: string;
  noRumah: string;
  telepon: string | null;
  pekerjaan: string | null;
  status: string;
  username: string | null;
};

const empty = {
  nik: "",
  nama: "",
  noRumah: "",
  telepon: "",
  pekerjaan: "",
  status: "aktif",
};

export default function WargaPage() {
  const me = useMe();
  const isAdmin = me?.role === "admin";
  const [rows, setRows] = useState<Warga[] | null>(null);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/warga");
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

  function openEdit(w: Warga) {
    setEditId(w.id);
    setForm({
      nik: w.nik,
      nama: w.nama,
      noRumah: w.noRumah,
      telepon: w.telepon || "",
      pekerjaan: w.pekerjaan || "",
      status: w.status,
    });
    setError("");
    setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await apiFetch(editId ? `/api/warga/${editId}` : "/api/warga", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    if (!confirm("Hapus warga ini? Semua tagihan terkait ikut terhapus.")) return;
    await apiFetch(`/api/warga/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = (rows || []).filter(
    (w) =>
      w.nama.toLowerCase().includes(q.toLowerCase()) ||
      w.noRumah.toLowerCase().includes(q.toLowerCase()) ||
      w.nik.includes(q)
  );

  function doExport() {
    exportCsv(
      `data-warga-rt002-${new Date().toISOString().slice(0, 10)}`,
      ["No", "NIK", "Nama", "No Rumah", "Telepon", "Pekerjaan", "Status", "Username Akun"],
      filtered.map((w, i) => [
        i + 1,
        isAdmin ? w.nik : w.nik.slice(0, 6) + "**********",
        w.nama,
        w.noRumah,
        w.telepon || "",
        w.pekerjaan || "",
        w.status,
        w.username || "",
      ])
    );
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="Data Warga"
        subtitle="Kelola penghuni Blok Mawar RT 002"
        action={
          <>
            <Button variant="secondary" onClick={doExport}>
              <Download size={15} /> Export CSV
            </Button>
            {isAdmin && (
              <Button onClick={openAdd}>
                <Plus size={16} /> Tambah Warga
              </Button>
            )}
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, rumah, atau NIK..."
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        {!rows ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState text="Tidak ada data warga" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-3">Warga</th>
                  <th className="px-5 py-3">NIK</th>
                  <th className="px-5 py-3">Rumah</th>
                  <th className="px-5 py-3">Telepon</th>
                  <th className="px-5 py-3">Akun</th>
                  <th className="px-5 py-3">Status</th>
                  {isAdmin && <th className="px-5 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-slate-50 transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-extrabold text-indigo-500">
                          {w.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-700">{w.nama}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {w.pekerjaan || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-500">
                      {isAdmin ? w.nik : w.nik.slice(0, 6) + "••••••••"}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-600">
                      {w.noRumah}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-500">
                      {w.telepon || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {w.username ? (
                        <Badge color="indigo">@{w.username}</Badge>
                      ) : (
                        <Badge color="slate">Belum ada</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge color={w.status === "aktif" ? "green" : "red"}>
                        {w.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(w)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => hapus(w.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
        title={editId ? "Edit Warga" : "Tambah Warga"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="NIK">
            <input
              className={inputCls}
              value={form.nik}
              onChange={(e) => setForm({ ...form, nik: e.target.value })}
              placeholder="16 digit NIK"
            />
          </Field>
          <Field label="Nama Lengkap">
            <input
              className={inputCls}
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama warga"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="No. Rumah">
              <input
                className={inputCls}
                value={form.noRumah}
                onChange={(e) => setForm({ ...form, noRumah: e.target.value })}
                placeholder="M-01"
              />
            </Field>
            <Field label="Telepon / WA">
              <input
                className={inputCls}
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pekerjaan">
              <input
                className={inputCls}
                value={form.pekerjaan}
                onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
                placeholder="Opsional"
              />
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
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
