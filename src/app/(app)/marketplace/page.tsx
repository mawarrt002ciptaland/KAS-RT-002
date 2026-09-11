"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  MessageCircle,
  Tag,
  Home,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

export default function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    namaProduk: "",
    kategori: "Makanan & Minuman",
    harga: "",
    // Note 3: Tambahkan keterangan pilihan "Tersedia / Habis"
    status: "Tersedia",
    penjualNama: "",
    noRumah: "",
    noWhatsapp: "",
    deskripsi: "",
    gambarUrl: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUploadProductImage = async (file: File) => {
    try {
      setUploadingProduct(true);
      setFormError("");
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "products");

      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload gambar produk");

      setForm((prev) => ({ ...prev, gambarUrl: data.url }));
    } catch (err: any) {
      setFormError(err.message || "Gagal upload gambar produk");
    } finally {
      setUploadingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.namaProduk || !form.harga || !form.penjualNama || !form.noWhatsapp) {
      setFormError("Harap lengkapi formulir produk");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Gagal menyimpan");

      setOpenModal(false);
      setForm({
        namaProduk: "",
        kategori: "Makanan & Minuman",
        harga: "",
        status: "Tersedia",
        penjualNama: "",
        noRumah: "",
        noWhatsapp: "",
        deskripsi: "",
        gambarUrl: "",
      });
      fetchProducts();
    } catch (e: any) {
      setFormError(e.message || "Terjadi kesalahan saat memposting produk");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Tersedia" ? "Habis" : "Tersedia";
    try {
      await fetch("/api/marketplace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.namaProduk.toLowerCase().includes(search.toLowerCase()) ||
      p.penjualNama.toLowerCase().includes(search.toLowerCase());
    const matchKategori = kategori === "Semua" || p.kategori === kategori;
    const matchStatus = statusFilter === "Semua" || p.status === statusFilter;
    return matchSearch && matchKategori && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Marketplace Warga
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dukung UMKM & perputaran ekonomi lokal warga Blok Mawar RT 002 RW 014
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Pasang Produk Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari produk atau nama warga penjual..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter: Tersedia / Habis */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Ketersediaan</option>
            <option value="Tersedia">Hanya Tersedia</option>
            <option value="Habis">Hanya Habis</option>
          </select>

          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Makanan & Minuman">Makanan & Minuman</option>
            <option value="Jasa">Jasa & Servis</option>
            <option value="Sembako">Sembako</option>
            <option value="Kerajinan">Kerajinan</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => {
          const isTersedia = item.status === "Tersedia";
          const waPhone = item.noWhatsapp.replace(/[^0-9]/g, "");
          const waFormatted = waPhone.startsWith("0") ? "62" + waPhone.substring(1) : waPhone;
          const waMsg = encodeURIComponent(
            `Halo Bpk/Ibu ${item.penjualNama}, saya warga Blok Mawar RT 002. Saya berminat pesan/beli "${item.namaProduk}". Apakah stok masih ada?`
          );

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={resolveMediaUrl(item.gambarUrl) || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80"}
                    alt={item.namaProduk}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                      !isTersedia ? "grayscale contrast-75 opacity-75" : ""
                    }`}
                  />
                  {/* Status Badge - Tersedia vs Habis per Note 3 */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                        isTersedia
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {isTersedia ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tersedia</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Habis</span>
                        </>
                      )}
                    </span>
                  </div>

                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                    {item.kategori}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {item.namaProduk}
                  </h3>
                  <p className="text-base font-black text-indigo-600 mt-1">
                    Rp {item.harga.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.deskripsi || "Produk berkualitas persembahan warga Blok Mawar."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium truncate max-w-[150px]">
                        {item.penjualNama} ({item.noRumah})
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      title="Klik untuk ubah status Tersedia / Habis"
                      className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 underline"
                    >
                      Ubah Status
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Button */}
              <div className="p-4 pt-0">
                <a
                  href={`https://api.whatsapp.com/send?phone=${waFormatted}&text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isTersedia
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isTersedia ? "Beli via WhatsApp" : "Tanya Restock Warga"}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Pasang Produk Baru - Note 3 */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Pasang Produk Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Promosikan usaha Anda ke seluruh tetangga Blok Mawar
                </p>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                Gambar produk akan di-upload ke storage server aplikasi, lalu URL-nya disimpan ke database Neon saat produk dipublikasikan.
              </div>
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk / Jasa *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kripik Singkong Balado Renyah"
                  value={form.namaProduk}
                  onChange={(e) => setForm({ ...form, namaProduk: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Makanan & Minuman">Makanan & Minuman</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Kerajinan">Kerajinan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={form.harga}
                    onChange={(e) => setForm({ ...form, harga: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* NOTE 3: Pilihan Keterangan "Tersedia / Habis" */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status Ketersediaan Produk * (Note 3)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: "Tersedia" })}
                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border transition-all ${
                      form.status === "Tersedia"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tersedia (Ready)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: "Habis" })}
                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border transition-all ${
                      form.status === "Habis"
                        ? "bg-rose-50 text-rose-700 border-rose-500 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Habis (Sold Out)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Penjual *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bu Siti"
                    value={form.penjualNama}
                    onChange={(e) => setForm({ ...form, penjualNama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Rumah *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: M-08"
                    value={form.noRumah}
                    onChange={(e) => setForm({ ...form, noRumah: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Pemesanan *
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={form.noWhatsapp}
                  onChange={(e) => setForm({ ...form, noWhatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Singkat Produk
                </label>
                <textarea
                  rows={2}
                  placeholder="Ceritakan keunggulan produk Anda..."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Upload Gambar Produk
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                    {form.gambarUrl ? (
                      <img src={resolveMediaUrl(form.gambarUrl)} alt="Preview produk" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingProduct ? "Uploading..." : "Pilih Gambar"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadProductImage(file);
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-2">Upload foto produk/jasa agar tampil di katalog warga.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Pasang Produk"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
