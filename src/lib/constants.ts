import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, TrendingUp, TrendingDown, ReceiptText, Users, CalendarDays, FileText,
  BarChart3, Globe, ShoppingBag, MessageSquareWarning, Megaphone, Network, Send, Link2, Settings,
} from "lucide-react";

export type MenuKey =
  | "dashboard" | "pemasukan" | "pengeluaran" | "tagihan" | "warga" | "kegiatan" | "kwitansi"
  | "laporan" | "trafik" | "marketplace" | "pengaduan" | "pengumuman"
  | "struktur" | "whatsapp" | "tautan" | "pengaturan";

export interface MenuItem {
  key: MenuKey;
  label: string;
  icon: LucideIcon;
  group: "utama" | "organisasi";
  description: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "utama", description: "Ringkasan keuangan & aktivitas RT" },
  { key: "pemasukan", label: "Pemasukan", icon: TrendingUp, group: "utama", description: "Catat & kelola pemasukan kas RT" },
  { key: "pengeluaran", label: "Pengeluaran", icon: TrendingDown, group: "utama", description: "Catat & kelola pengeluaran kas RT" },
  { key: "tagihan", label: "Tagihan Warga", icon: ReceiptText, group: "utama", description: "Kelola tagihan iuran warga" },
  { key: "warga", label: "Data Warga", icon: Users, group: "utama", description: "Database kependudukan RT 002" },
  { key: "kegiatan", label: "Kegiatan Warga", icon: CalendarDays, group: "utama", description: "Agenda & kegiatan RT" },
  { key: "kwitansi", label: "Kwitansi", icon: FileText, group: "utama", description: "Cetak & kelola kwitansi" },
  { key: "laporan", label: "Laporan", icon: BarChart3, group: "utama", description: "Laporan keuangan & statistik" },
  { key: "trafik", label: "Trafik Website", icon: Globe, group: "utama", description: "Statistik pengunjung website" },
  { key: "marketplace", label: "Marketplace", icon: ShoppingBag, group: "utama", description: "Dagangan warga RT" },
  { key: "pengaduan", label: "Pengaduan Warga", icon: MessageSquareWarning, group: "utama", description: "Aduan & keluhan warga" },
  { key: "pengumuman", label: "Pengumuman", icon: Megaphone, group: "utama", description: "Pengumuman & info RT" },
  { key: "struktur", label: "Struktur Pengurus RT 002", icon: Network, group: "organisasi", description: "Struktur pengurus RT 002" },
  { key: "whatsapp", label: "WhatsApp Broadcast", icon: Send, group: "organisasi", description: "Kirim broadcast WhatsApp" },
  { key: "tautan", label: "Tautan & Kontak", icon: Link2, group: "organisasi", description: "Tautan & kontak penting" },
  { key: "pengaturan", label: "Pengaturan", icon: Settings, group: "organisasi", description: "Pengaturan sistem" },
];

export const MENU_LABEL = MENU_ITEMS.reduce((acc, m) => {
  acc[m.key] = m.label;
  return acc;
}, {} as Record<MenuKey, string>);

export const MENU_BY_KEY = MENU_ITEMS.reduce((acc, m) => {
  acc[m.key] = m;
  return acc;
}, {} as Record<MenuKey, MenuItem>);

export const KATEGORI_PEMASUKAN = [
  "Iuran Bulanan Warga", "Iuran Keamanan", "Iuran Kebersihan", "Donasi / Sumbangan",
  "Ganti Rugi", "Bantuan Eksternal", "Lain-lain",
];
export const KATEGORI_PENGELUARAN = [
  "Keamanan", "Fasilitas", "Kebersihan", "Operasional RT", "Sosial / Kematian",
  "Kegiatan Warga", "Pembangunan", "Perlengkapan", "Honor / Insentif", "Lain-lain",
];
export const KATEGORI_PENGADUAN = ["Keamanan", "Fasilitas", "Kebersihan", "Sosial", "Lainnya"];
export const KATEGORI_PENGUMUMAN = ["Umum", "Penting", "Mendesak", "Acara"];
export const KATEGORI_KEGIATAN = ["Sosial", "Keamanan", "Kebersihan", "Pertemuan", "Gotong Royong", "Olahraga"];
export const KATEGORI_MARKETPLACE = ["Makanan", "Jasa", "Barang", "Kuliner", "Otomotif", "Lainnya"];
export const KATEGORI_TAUTAN = ["Sosial Media", "Pemerintah", "Layanan", "Kontak", "Umum"];
export const METODE_BAYAR = ["Tunai", "Transfer", "QRIS"];
export const JENIS_TAGIHAN: { value: string; label: string; settingKey: string; kategori: string }[] = [
  { value: "iuran_bulanan", label: "Iuran Bulanan", settingKey: "iuran_bulanan", kategori: "Iuran Bulanan Warga" },
  { value: "iuran_keamanan", label: "Iuran Keamanan", settingKey: "iuran_keamanan", kategori: "Iuran Keamanan" },
  { value: "iuran_kebersihan", label: "Iuran Kebersihan", settingKey: "iuran_kebersihan", kategori: "Iuran Kebersihan" },
  { value: "lainnya", label: "Lainnya", settingKey: "", kategori: "Lain-lain" },
];
export const JENIS_TAGIHAN_LABEL = JENIS_TAGIHAN.reduce((a, j) => { a[j.value] = j.label; return a; }, {} as Record<string, string>);

export const RT_INFO = {
  rt: "002",
  rw: "014",
  blok: "Mawar",
  perumahan: "Ciptaland",
  kota: "Batam",
  provinsi: "Kepulauan Riau",
  namaLengkap: "RT 002 / RW 014 Blok Mawar Perumahan Ciptaland Batam",
  whatsappAdmin: "6281234567890",
  whatsappBendahara: "6282173735449",
  alamat: "Blok Mawar, Perumahan Ciptaland, Batam, Kepulauan Riau",
  pesanAduan: "Halo Admin RT 002, saya ingin menyampaikan aduan/informasi.",
};

/** Warga that is logged in when the app is in "Mode Warga" */
export const CURRENT_WARGA_ID = "w-06";

export const STATUS_LABEL: Record<string, string> = {
  selesai: "Selesai", pending: "Pending", belum_bayar: "Belum Bayar", telat: "Telat", lunas: "Lunas",
  aktif: "Aktif", arsip: "Arsip", baru: "Baru", proses: "Diproses", ditolak: "Ditolak",
  akan_datang: "Akan Datang", berlangsung: "Berlangsung", dibatalkan: "Dibatalkan",
  tersedia: "Tersedia", terjual: "Terjual", nonaktif: "Nonaktif", pindah: "Pindah", meninggal: "Meninggal",
  normal: "Normal", penting: "Penting", mendesak: "Mendesak", warga: "Warga", pengurus: "Pengurus", admin: "Admin",
  ketua: "Ketua", bendahara: "Bendahara",
};
