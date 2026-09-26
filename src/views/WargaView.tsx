import { useCallback, useMemo, useState } from "react";
import { Users, Plus, Eye, Pencil, Trash2, Phone, MessageCircle, UserPlus, Home, Briefcase, X } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import type { Warga } from "@/data/types";
import { useLoadState, usePendingCreate, usePendingSearch } from "@/hooks";
import { formatTanggalID, maskPhone, toWaNumber } from "@/lib/format";
import { openWhatsApp } from "@/lib/utils";
import { Button, Input, Select, Field, Tabs, Badge } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, ListSkeleton, SearchInput, TableShell, IconButton, InfoRow, Avatar, FilterBar } from "@/components/shared";

type RoleFilter = "semua" | "warga" | "pengurus";
const EMPTY: Omit<Warga, "id" | "createdAt" | "anggotaKK" | "tanggalBergabung"> = { nama: "", nik: "", noKK: "", noRumah: "", blok: "Mawar", alamat: "", telepon: "", email: "", jenisKelamin: "L", pekerjaan: "", statusKawin: "Kawin", agama: "Islam", role: "warga", jabatan: "", status: "aktif" };

export default function WargaView() {
  const warga = useData((s) => s.warga);
  const addWarga = useData((s) => s.addWarga);
  const updateWarga = useData((s) => s.updateWarga);
  const deleteWarga = useData((s) => s.deleteWarga);
  const addAnggota = useData((s) => s.addAnggota);
  const deleteAnggota = useData((s) => s.deleteAnggota);
  const { loading, error, refetch } = useLoadState();

  const [q, setQ] = useState(usePendingSearch("warga"));
  const [role, setRole] = useState<RoleFilter>("semua");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Warga | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [del, setDel] = useState<Warga | null>(null);
  const openCreate = useCallback(() => { setEdit(null); setFormOpen(true); }, []);
  usePendingCreate("warga", openCreate);

  const detail = warga.find((w) => w.id === detailId) ?? null;
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return warga.filter((w) => (role === "semua" || w.role === role) && (!s || [w.nama, w.noRumah, w.telepon, w.nik, w.pekerjaan, w.jabatan].some((x) => x?.toLowerCase().includes(s)))).sort((a, b) => a.noRumah.localeCompare(b.noRumah, undefined, { numeric: true }));
  }, [warga, q, role]);
  const jiwa = warga.reduce((a, w) => a + 1 + w.anggotaKK.length, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Data Warga" description="Database kependudukan RT 002 Blok Mawar" icon={<Users className="h-5 w-5" />} actions={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Tambah Warga</Button>} />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Kepala Keluarga" value={`${warga.length} KK`} icon={<Home className="h-5 w-5" />} />
            <StatCard title="Jumlah Jiwa" tone="income" value={`${jiwa} jiwa`} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Pengurus" tone="info" value={`${warga.filter((w) => w.role === "pengurus").length} orang`} icon={<Briefcase className="h-5 w-5" />} />
            <StatCard title="Warga Aktif" tone="neutral" value={`${warga.filter((w) => w.status === "aktif").length} KK`} icon={<Users className="h-5 w-5" />} />
          </div>
          <Tabs value={role} onChange={setRole} items={[{ value: "semua", label: "Semua", count: warga.length }, { value: "warga", label: "Warga", count: warga.filter((w) => w.role === "warga").length }, { value: "pengurus", label: "Pengurus", count: warga.filter((w) => w.role === "pengurus").length }]} />
          <FilterBar><SearchInput value={q} onChange={setQ} placeholder="Cari nama, no. rumah, telepon, NIK…" className="sm:!min-w-[300px]" /></FilterBar>

          {filtered.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="Belum ada data warga" description="Tidak ada warga yang cocok dengan pencarian." action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Tambah Warga</Button>} />
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="grid gap-3 md:hidden">
                {filtered.map((w) => (
                  <li key={w.id} className="min-w-0 overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Avatar name={w.nama} src={w.foto} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold uppercase leading-snug break-anywhere">{w.nama}</p>
                        <p className="text-sm text-muted-foreground">{w.jabatan ?? "Kepala Keluarga"}</p>
                        <p className="text-sm font-medium">{w.noRumah}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{maskPhone(w.telepon)}</p>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setDetailId(w.id)}>Lihat</Button>
                      <Button variant="outline" size="sm" className="flex-1" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => { setEdit(w); setFormOpen(true); }}>Edit</Button>
                      {w.telepon && <Button variant="whatsapp" size="sm" aria-label="WhatsApp" onClick={() => openWhatsApp(toWaNumber(w.telepon), `Halo ${w.nama}, dari Pengurus RT 002 Blok Mawar.`)}><MessageCircle className="h-4 w-4" /></Button>}
                    </div>
                  </li>
                ))}
              </ul>
              {/* Table */}
              <div className="hidden md:block">
                <TableShell>
                  <thead className="border-b bg-muted/40"><tr><th>Nama</th><th>No. Rumah</th><th>Peran</th><th>Telepon</th><th>Pekerjaan</th><th>Anggota</th><th>Status</th><th className="!text-right">Aksi</th></tr></thead>
                  <tbody className="divide-y">
                    {filtered.map((w) => (
                      <tr key={w.id} className="hover:bg-muted/30">
                        <td><div className="flex items-center gap-2"><Avatar name={w.nama} src={w.foto} size="sm" /><div className="min-w-0"><p className="truncate font-semibold">{w.nama}</p><p className="truncate text-xs text-muted-foreground">{w.nik ?? "-"}</p></div></div></td>
                        <td className="whitespace-nowrap font-medium">{w.noRumah}</td>
                        <td className="whitespace-nowrap">{w.jabatan ? <Badge tone="primary">{w.jabatan}</Badge> : <Badge tone="muted">Kepala Keluarga</Badge>}</td>
                        <td className="whitespace-nowrap tabular">{maskPhone(w.telepon)}</td>
                        <td className="whitespace-nowrap">{w.pekerjaan ?? "-"}</td>
                        <td className="whitespace-nowrap">{1 + w.anggotaKK.length} jiwa</td>
                        <td><StatusBadge status={w.status} /></td>
                        <td><div className="flex justify-end gap-1">
                          <IconButton icon={<Eye className="h-4 w-4" />} label="Lihat" onClick={() => setDetailId(w.id)} />
                          <IconButton icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={() => { setEdit(w); setFormOpen(true); }} />
                          {w.telepon && <IconButton icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" tone="whatsapp" onClick={() => openWhatsApp(toWaNumber(w.telepon), `Halo ${w.nama}, dari Pengurus RT 002 Blok Mawar.`)} />}
                          <IconButton icon={<Trash2 className="h-4 w-4" />} label="Hapus" tone="destructive" onClick={() => setDel(w)} />
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </TableShell>
              </div>
            </>
          )}
        </>
      )}

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Profil Warga" size="lg"
        footer={detail && <><Button variant="ghost" className="text-destructive sm:mr-auto" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDel(detail)}>Hapus</Button><Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => { setEdit(detail); setFormOpen(true); }}>Edit</Button>{detail.telepon && <Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={() => openWhatsApp(toWaNumber(detail.telepon), `Halo ${detail.nama}, dari Pengurus RT 002 Blok Mawar.`)}>WhatsApp</Button>}</>}>
        {detail && <WargaDetail w={detail} onAddAnggota={(a) => { addAnggota(detail.id, a); toast.success("Anggota keluarga ditambahkan"); }} onDeleteAnggota={(id) => { deleteAnggota(detail.id, id); toast.success("Anggota dihapus"); }} />}
      </Modal>

      <WargaForm open={formOpen} onClose={() => setFormOpen(false)} initial={edit} onSubmit={(data) => { if (edit) { updateWarga(edit.id, data); toast.success("Data warga diperbarui"); } else { addWarga(data); toast.success("Warga baru ditambahkan"); } }} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus data warga?" description={<>Data <b>{del?.nama}</b> ({del?.noRumah}) beserta anggota keluarganya akan dihapus.</>} confirmLabel="Hapus" onConfirm={() => { if (del) { deleteWarga(del.id); setDetailId(null); toast.success("Data warga dihapus"); } }} />
    </div>
  );
}

function WargaDetail({ w, onAddAnggota, onDeleteAnggota }: { w: Warga; onAddAnggota: (a: { nama: string; hubungan: string; jenisKelamin: "L" | "P"; nik?: string }) => void; onDeleteAnggota: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [a, setA] = useState({ nama: "", hubungan: "Anak", jenisKelamin: "L" as "L" | "P", nik: "" });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
        <Avatar name={w.nama} src={w.foto} size="xl" className="h-16 w-16 text-xl" />
        <div className="min-w-0"><p className="text-lg font-bold leading-tight break-anywhere">{w.nama}</p><p className="text-sm text-muted-foreground">{w.jabatan ?? "Kepala Keluarga"} • {w.noRumah}</p><div className="mt-1 flex flex-wrap gap-1"><StatusBadge status={w.status} /><StatusBadge status={w.role} /></div></div>
      </div>
      <dl className="divide-y rounded-xl border px-4">
        <InfoRow label="NIK" value={<span className="font-mono">{w.nik ?? "-"}</span>} />
        <InfoRow label="No. KK" value={<span className="font-mono">{w.noKK ?? "-"}</span>} />
        <InfoRow label="Alamat" value={w.alamat} />
        <InfoRow label="Telepon" value={w.telepon ? <a href={`tel:${w.telepon}`} className="text-primary underline-offset-2 hover:underline">{w.telepon}</a> : "-"} />
        <InfoRow label="Email" value={w.email || "-"} />
        <InfoRow label="Jenis Kelamin" value={w.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"} />
        <InfoRow label="Pekerjaan" value={w.pekerjaan} />
        <InfoRow label="Status Kawin" value={w.statusKawin} />
        <InfoRow label="Agama" value={w.agama} />
        <InfoRow label="Bergabung" value={formatTanggalID(w.tanggalBergabung)} />
      </dl>
      <div>
        <div className="mb-2 flex items-center justify-between"><h3 className="text-base font-semibold">Anggota Keluarga ({1 + w.anggotaKK.length} jiwa)</h3><Button size="sm" variant="soft" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAdding((v) => !v)}>Tambah</Button></div>
        {adding && (
          <div className="mb-3 grid gap-2 rounded-xl border bg-muted/30 p-3 sm:grid-cols-2">
            <Input placeholder="Nama lengkap" value={a.nama} onChange={(e) => setA({ ...a, nama: e.target.value })} aria-label="Nama anggota" />
            <Input placeholder="NIK (opsional)" inputMode="numeric" value={a.nik} onChange={(e) => setA({ ...a, nik: e.target.value })} aria-label="NIK" />
            <Select value={a.hubungan} onChange={(e) => setA({ ...a, hubungan: e.target.value })} options={["Istri", "Suami", "Anak", "Orang Tua", "Famili Lain"].map((h) => ({ value: h, label: h }))} aria-label="Hubungan" />
            <Select value={a.jenisKelamin} onChange={(e) => setA({ ...a, jenisKelamin: e.target.value as "L" | "P" })} options={[{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }]} aria-label="Jenis kelamin" />
            <div className="flex gap-2 sm:col-span-2"><Button size="sm" onClick={() => { if (!a.nama.trim()) return toast.error("Nama wajib diisi"); onAddAnggota({ ...a, nik: a.nik || undefined }); setA({ nama: "", hubungan: "Anak", jenisKelamin: "L", nik: "" }); setAdding(false); }}>Simpan</Button><Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Batal</Button></div>
          </div>
        )}
        <ul className="divide-y rounded-xl border">
          <li className="flex items-center gap-3 px-4 py-2.5"><Avatar name={w.nama} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{w.nama}</p><p className="text-xs text-muted-foreground">Kepala Keluarga • {w.jenisKelamin === "L" ? "L" : "P"}</p></div></li>
          {w.anggotaKK.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-2.5"><Avatar name={m.nama} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{m.nama}</p><p className="text-xs text-muted-foreground">{m.hubungan} • {m.jenisKelamin}{m.nik ? ` • ${m.nik}` : ""}</p></div><IconButton icon={<X className="h-4 w-4" />} label="Hapus anggota" tone="destructive" onClick={() => onDeleteAnggota(m.id)} /></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WargaForm({ open, onClose, initial, onSubmit }: { open: boolean; onClose: () => void; initial: Warga | null; onSubmit: (d: typeof EMPTY) => void }) {
  const [f, setF] = useState<typeof EMPTY>(EMPTY);
  const [key, setKey] = useState<string | null>(null);
  // re-init when opening with different record
  const k = open ? (initial?.id ?? "new") : null;
  if (k !== key) { setKey(k); if (k) setF(initial ? { ...EMPTY, ...initial, nik: initial.nik ?? "", noKK: initial.noKK ?? "", alamat: initial.alamat ?? "", telepon: initial.telepon ?? "", email: initial.email ?? "", pekerjaan: initial.pekerjaan ?? "", jabatan: initial.jabatan ?? "" } : EMPTY); }
  const set = <K extends keyof typeof EMPTY>(kk: K, v: (typeof EMPTY)[K]) => setF((x) => ({ ...x, [kk]: v }));
  function submit() {
    if (!f.nama.trim() || !f.noRumah.trim()) return toast.error("Nama dan No. Rumah wajib diisi");
    if (f.telepon && !/^0\d{8,13}$/.test(f.telepon.replace(/\D/g, ""))) return toast.error("Format nomor telepon tidak valid (contoh: 0812xxxxxxx)");
    onSubmit({ ...f, nama: f.nama.trim(), noRumah: f.noRumah.trim(), alamat: f.alamat || `${f.noRumah}, Blok Mawar, Perumahan Ciptaland, Batam`, nik: f.nik || undefined, noKK: f.noKK || undefined, telepon: f.telepon || undefined, email: f.email || undefined, pekerjaan: f.pekerjaan || undefined, jabatan: f.role === "pengurus" ? f.jabatan || undefined : undefined });
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Data Warga" : "Tambah Warga"} size="lg" fullOnMobile footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={submit}>{initial ? "Simpan Perubahan" : "Simpan Warga"}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" htmlFor="wf-nama" required className="sm:col-span-2"><Input id="wf-nama" value={f.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Bapak/Ibu …" autoComplete="name" /></Field>
        <Field label="NIK" htmlFor="wf-nik"><Input id="wf-nik" inputMode="numeric" maxLength={16} value={f.nik} onChange={(e) => set("nik", e.target.value.replace(/\D/g, ""))} placeholder="16 digit" /></Field>
        <Field label="No. KK" htmlFor="wf-kk"><Input id="wf-kk" inputMode="numeric" maxLength={16} value={f.noKK} onChange={(e) => set("noKK", e.target.value.replace(/\D/g, ""))} placeholder="16 digit" /></Field>
        <Field label="No. Rumah" htmlFor="wf-rumah" required><Input id="wf-rumah" value={f.noRumah} onChange={(e) => set("noRumah", e.target.value)} placeholder="Mawar 58" /></Field>
        <Field label="Telepon / WhatsApp" htmlFor="wf-tel"><Input id="wf-tel" type="tel" inputMode="tel" value={f.telepon} onChange={(e) => set("telepon", e.target.value)} placeholder="0812xxxxxxxx" autoComplete="tel" /></Field>
        <Field label="Email" htmlFor="wf-email"><Input id="wf-email" type="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@email.com" autoComplete="email" /></Field>
        <Field label="Pekerjaan" htmlFor="wf-kerja"><Input id="wf-kerja" value={f.pekerjaan} onChange={(e) => set("pekerjaan", e.target.value)} /></Field>
        <Field label="Jenis kelamin"><Select value={f.jenisKelamin} onChange={(e) => set("jenisKelamin", e.target.value as "L" | "P")} options={[{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }]} /></Field>
        <Field label="Status kawin"><Select value={f.statusKawin} onChange={(e) => set("statusKawin", e.target.value)} options={["Kawin", "Belum Kawin", "Cerai Hidup", "Cerai Mati"].map((s) => ({ value: s, label: s }))} /></Field>
        <Field label="Agama"><Select value={f.agama} onChange={(e) => set("agama", e.target.value)} options={["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"].map((s) => ({ value: s, label: s }))} /></Field>
        <Field label="Peran"><Select value={f.role} onChange={(e) => set("role", e.target.value as Warga["role"])} options={[{ value: "warga", label: "Warga" }, { value: "pengurus", label: "Pengurus" }]} /></Field>
        {f.role === "pengurus" && <Field label="Jabatan" htmlFor="wf-jab"><Input id="wf-jab" value={f.jabatan} onChange={(e) => set("jabatan", e.target.value)} placeholder="Koordinator …" /></Field>}
        <Field label="Status"><Select value={f.status} onChange={(e) => set("status", e.target.value as Warga["status"])} options={[{ value: "aktif", label: "Aktif" }, { value: "pindah", label: "Pindah" }, { value: "meninggal", label: "Meninggal" }]} /></Field>
        <Field label="Alamat" htmlFor="wf-alamat" className="sm:col-span-2"><Input id="wf-alamat" value={f.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="Otomatis dari No. Rumah bila kosong" /></Field>
      </div>
    </Modal>
  );
}
