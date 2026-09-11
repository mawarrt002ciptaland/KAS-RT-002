"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Users,
  Building,
  CreditCard,
  MessageSquare,
  Shield,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Lock,
  Save,
  QrCode,
  X,
  UserCheck,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

function PengaturanContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "users" ? "users" : "identitas";
  const [activeTab, setActiveTab] = useState<"identitas" | "rekening" | "whatsapp" | "users">(
    initialTab as any
  );

  const [settings, setSettings] = useState<any>({
    namaRt: "RT 002 RW 014",
    perumahan: "Perumahan Ciptaland",
    blok: "Blok Mawar",
    ketuaRt: "Bambang Sudik Pamarto",
    noHpKetua: "081234567890",
    bendahara: "Ahmad Suryana",
    noHpBendahara: "081398765432",
    namaBank: "Bank Central Asia (BCA)",
    noRekening: "8720192831",
    atasNama: "KAS RT 002 BLOK MAWAR",
    iuranWajib: 50000,
    templateWaTagihan:
      "Yth. Bpk/Ibu [NAMA_WARGA] ([NO_RUMAH]), menginfokan iuran Kas RT 002 RW 014 Blok Mawar untuk bulan [BULAN] sebesar [NOMINAL]. Terima kasih!",
    templateWaKwitansi:
      "Terima kasih Bpk/Ibu [NAMA_WARGA], pembayaran iuran Kas RT 002 RW 014 untuk [BULAN] sebesar [NOMINAL] telah kami terima dengan No. Kwitansi [NO_KWITANSI].",
  });

  const [userList, setUserList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);

  // Add User Modal State
  const [openAddUser, setOpenAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "warga",
    phone: "",
    houseNumber: "",
    nik: "",
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/pengaturan");
      const data = await res.json();
      if (data.pengaturan) {
        setSettings(data.pengaturan);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/auth/users");
      const data = await res.json();
      if (data.users) {
        setUserList(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const handleUploadImage = async (
    file: File,
    folder: string,
    targetKey: "logoImage" | "qrisImage",
    setUploading: (value: boolean) => void
  ) => {
    try {
      setUploading(true);
      setSaveError("");
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload gambar");

      setSettings((prev: any) => ({ ...prev, [targetKey]: data.url }));
    } catch (err: any) {
      setSaveError(err.message || "Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Gagal menyimpan pengaturan");
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchSettings();
    } catch (e: any) {
      setSaveError(e.message || "Gagal menyimpan pengaturan");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.password || !newUserForm.name) {
      alert("Harap lengkapi username, nama, dan password");
      return;
    }

    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat user");

      setOpenAddUser(false);
      setNewUserForm({
        username: "",
        name: "",
        password: "",
        role: "warga",
        phone: "",
        houseNumber: "",
        nik: "",
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Hapus akun user ini?")) return;
    try {
      await fetch(`/api/auth/users?id=${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (e) {
      alert("Gagal menghapus user");
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-purple-50 text-purple-700 border-purple-200",
    ketua_rt: "bg-blue-50 text-blue-700 border-blue-200",
    bendahara: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warga: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin RT",
    ketua_rt: "Ketua RT",
    bendahara: "Bendahara RT",
    warga: "Warga",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Pengaturan Aplikasi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas RT, rekening pembayaran, template pesan, dan hak akses
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
          )}
          {saveError && (
            <div className="max-w-md px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-2xl">
              {saveError}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("identitas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "identitas"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Identitas Lingkungan RT</span>
        </button>

        <button
          onClick={() => setActiveTab("rekening")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "rekening"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekening & QRIS</span>
        </button>

        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "whatsapp"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Template Pesan WhatsApp</span>
        </button>

        {/* Note 4: Daftar Akun / User Management */}
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "users"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Daftar Akun & Hak Akses</span>
        </button>
      </div>

      {/* TAB 1: IDENTITAS RT */}
      {activeTab === "identitas" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 max-w-3xl">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Informasi Lingkungan Rukun Tetangga (RT)
          </h2>
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            Upload gambar logo dan QRIS akan disimpan ke storage server aplikasi, lalu URL-nya disimpan ke database Neon saat Anda klik <span className="font-bold">Simpan Perubahan</span>.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama RT & RW
              </label>
              <input
                type="text"
                value={settings.namaRt}
                onChange={(e) => setSettings({ ...settings, namaRt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Perumahan
              </label>
              <input
                type="text"
                value={settings.perumahan}
                onChange={(e) => setSettings({ ...settings, perumahan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Blok Perumahan
              </label>
              <input
                type="text"
                value={settings.blok}
                onChange={(e) => setSettings({ ...settings, blok: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Iuran Wajib Bulanan (Rp)
              </label>
              <input
                type="number"
                value={settings.iuranWajib}
                onChange={(e) => setSettings({ ...settings, iuranWajib: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Ketua RT
              </label>
              <input
                type="text"
                value={settings.ketuaRt}
                onChange={(e) => setSettings({ ...settings, ketuaRt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. HP / WA Ketua RT
              </label>
              <input
                type="text"
                value={settings.noHpKetua}
                onChange={(e) => setSettings({ ...settings, noHpKetua: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Bendahara RT
              </label>
              <input
                type="text"
                value={settings.bendahara}
                onChange={(e) => setSettings({ ...settings, bendahara: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. HP / WA Bendahara RT
              </label>
              <input
                type="text"
                value={settings.noHpBendahara}
                onChange={(e) => setSettings({ ...settings, noHpBendahara: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Upload Gambar Logo RT
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {settings.logoImage ? (
                    <img src={resolveMediaUrl(settings.logoImage)} alt="Logo RT" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingLogo ? "Uploading..." : "Pilih Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, "logo", "logoImage", setUploadingLogo);
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-2">PNG/JPG untuk identitas RT.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: REKENING & QRIS */}
      {activeTab === "rekening" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 max-w-3xl">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Rekening Pembayaran & QRIS Kas RT
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={settings.namaBank}
                  onChange={(e) => setSettings({ ...settings, namaBank: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={settings.noRekening}
                  onChange={(e) => setSettings({ ...settings, noRekening: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  value={settings.atasNama}
                  onChange={(e) => setSettings({ ...settings, atasNama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* QRIS Preview Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Pratinjau QRIS Kas RT</span>
              </span>
              {settings.logoImage && (
                <img
                  src={resolveMediaUrl(settings.logoImage)}
                  alt="Logo RT"
                  className="w-14 h-14 rounded-full border border-slate-200 bg-white object-cover mb-3"
                />
              )}
              <label className="relative cursor-pointer group block">
                <img
                  src={resolveMediaUrl(settings.qrisImage) || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=KAS-RT002-BLOKMAWAR"}
                  alt="QRIS RT"
                  className="w-40 h-40 rounded-xl border border-slate-200 bg-white p-1 shadow-sm object-cover"
                />
                <div className="absolute inset-0 rounded-xl bg-slate-900/0 group-hover:bg-slate-900/45 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold shadow-md transition-opacity">
                    <Upload className="w-4 h-4" />
                    {uploadingQris ? "Uploading..." : "Ganti Gambar QRIS"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file, "qris", "qrisImage", setUploadingQris);
                  }}
                />
              </label>
              <span className="text-[10px] text-slate-500 mt-2 font-mono">
                BCA: {settings.noRekening} a/n {settings.atasNama}
              </span>
              <p className="text-[10px] text-slate-400 mt-2">Klik gambar QRIS untuk mengganti langsung.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Rekening</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: WHATSAPP TEMPLATE */}
      {activeTab === "whatsapp" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 max-w-3xl">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Template Pesan Otomatis WhatsApp
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template Pesan Tagihan Iuran
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Variabel yang didukung: <span className="font-mono text-indigo-600">[NAMA_WARGA]</span>, <span className="font-mono text-indigo-600">[NO_RUMAH]</span>, <span className="font-mono text-indigo-600">[BULAN]</span>, <span className="font-mono text-indigo-600">[NOMINAL]</span>
            </p>
            <textarea
              rows={4}
              value={settings.templateWaTagihan}
              onChange={(e) => setSettings({ ...settings, templateWaTagihan: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template Bukti Penerimaan Kwitansi
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Variabel yang didukung: <span className="font-mono text-indigo-600">[NAMA_WARGA]</span>, <span className="font-mono text-indigo-600">[NO_KWITANSI]</span>, <span className="font-mono text-indigo-600">[BULAN]</span>, <span className="font-mono text-indigo-600">[NOMINAL]</span>
            </p>
            <textarea
              rows={4}
              value={settings.templateWaKwitansi}
              onChange={(e) => setSettings({ ...settings, templateWaKwitansi: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Template</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: NOTE 4: "Tambahkan kolom keterangan ' Daftar akun' (lihat contoh Screenshot Daftar Akun)" */}
      {activeTab === "users" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-800">
                Daftar Akun
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola akun pengguna (Bendahara, Ketua RT, Admin, dll.) atau daftarkan warga
              </p>
            </div>

            <button
              onClick={() => setOpenAddUser(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah User</span>
            </button>
          </div>

          {/* User Table matching Screenshot "Daftar Akun.png" */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Username</th>
                  <th className="pb-3">Nama & Alamat</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Keterangan / Terdaftar</th>
                  <th className="pb-3 text-right pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {userList.map((u) => {
                  const dateStr = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Terdaftar";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.avatar || "US"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">
                              @{u.username}
                            </span>
                            {u.nik && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                NIK: {u.nik}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {u.houseNumber ? `Rumah: ${u.houseNumber}` : "Sekretariat"} · {u.phone || "-"}
                        </p>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                            roleColors[u.role] || roleColors.warga
                          }`}
                        >
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>

                      <td className="py-3.5 text-slate-500 text-[11px]">
                        <p className="font-semibold text-slate-700">{dateStr}</p>
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3" />
                          <span>Status: Aktif</span>
                        </p>
                      </td>

                      <td className="py-3.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => alert(`Reset password untuk @${u.username}?`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Reset password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== "admin" && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH USER matching Screenshot "Daftar Akun.png" */}
      {openAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Tambah Akun Pengguna
                </h3>
                <p className="text-xs text-slate-500">
                  Buat akun untuk pengurus atau warga RT
                </p>
              </div>
              <button
                onClick={() => setOpenAddUser(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="budisantoso"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role Akses *
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="admin">Admin RT (Full Akses)</option>
                  <option value="ketua_rt">Ketua RT (Monitoring & Approval)</option>
                  <option value="bendahara">Bendahara RT (Kas, Iuran, Transaksi)</option>
                  <option value="warga">Warga RT (Lihat Tagihan & Kwitansi)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Rumah / Blok
                  </label>
                  <input
                    type="text"
                    placeholder="M-03"
                    value={newUserForm.houseNumber}
                    onChange={(e) => setNewUserForm({ ...newUserForm, houseNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. HP / WA
                  </label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenAddUser(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PengaturanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Memuat pengaturan...
        </div>
      }
    >
      <PengaturanContent />
    </Suspense>
  );
}
