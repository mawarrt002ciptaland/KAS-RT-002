export type Jenis = "pemasukan" | "pengeluaran";

export interface AnggotaKK {
  id: string;
  nama: string;
  nik?: string;
  jenisKelamin: "L" | "P";
  hubungan: string; // Kepala Keluarga / Istri / Suami / Anak / Famili Lain
  tanggalLahir?: string;
}

export interface Warga {
  id: string;
  nama: string;
  nik?: string;
  noKK?: string;
  noRumah: string;
  blok: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  jenisKelamin: "L" | "P";
  pekerjaan?: string;
  statusKawin: string;
  agama: string;
  role: "warga" | "pengurus" | "admin";
  jabatan?: string;
  foto?: string;
  status: "aktif" | "pindah" | "meninggal";
  tanggalBergabung: string;
  createdAt: string;
  anggotaKK: AnggotaKK[];
}

export interface Transaksi {
  id: string;
  kode: string;
  jenis: Jenis;
  tanggal: string; // ISO
  kategori: string;
  keterangan: string;
  nominal: number;
  penerima?: string;
  sumber?: string;
  buktiUrl?: string;
  buktiNama?: string;
  metode: string; // Tunai / Transfer / QRIS
  status: "selesai" | "pending";
  wargaId?: string;
  createdAt: string;
}

export interface Tagihan {
  id: string;
  kode: string;
  wargaId: string;
  jenis: string; // iuran_bulanan / iuran_keamanan / iuran_kebersihan / lainnya
  periode: string; // "2026-08"
  jumlah: number;
  tanggalJatuhTempo: string;
  status: "belum_bayar" | "lunas" | "telat";
  tanggalBayar?: string;
  metode?: string;
  denda: number;
  keterangan?: string;
  createdAt: string;
}

export interface Kegiatan {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  jam?: string;
  lokasi?: string;
  status: "akan_datang" | "berlangsung" | "selesai" | "dibatalkan";
  fotoUrl?: string;
  jumlahPeserta: number;
  createdAt: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  konten: string;
  kategori: string;
  prioritas: "normal" | "penting" | "mendesak";
  status: "aktif" | "arsip";
  penulis?: string;
  tanggal: string;
  createdAt: string;
}

export interface Pengaduan {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  lokasi?: string;
  fotoUrl?: string;
  status: "baru" | "proses" | "selesai" | "ditolak";
  pelapor: string;
  wargaId?: string;
  tanggapan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Kwitansi {
  id: string;
  kode: string;
  transaksiId?: string;
  tagihanId?: string;
  wargaId?: string;
  tanggal: string;
  nominal: number;
  penerima?: string;
  pembayar?: string;
  keterangan?: string;
  createdAt: string;
}

export interface Pengurus {
  id: string;
  nama: string;
  jabatan: string;
  urutan: number;
  telepon?: string;
  email?: string;
  foto?: string;
  periode: string;
  bidang?: string;
}

export interface Tautan {
  id: string;
  judul: string;
  url: string;
  kategori: string;
  logo?: string;
  deskripsi?: string;
  urutan: number;
}

export interface Marketplace {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  deskripsi: string;
  fotoUrl?: string;
  penjual: string;
  telepon: string;
  alamat?: string;
  kondisi: "baru" | "bekas";
  status: "tersedia" | "terjual";
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  nama: string;
  role: "admin" | "ketua" | "bendahara" | "pengurus" | "warga";
  telepon?: string;
  foto?: string;
  status: "aktif" | "nonaktif";
  lastLogin?: string;
  createdAt: string;
}

export interface TrafikRow {
  tanggal: string;
  pageViews: number;
  visitors: number;
  sessions: number;
  device: "mobile" | "desktop" | "tablet";
  referrer: string;
  page: string;
}

export type Pengaturan = Record<string, string>;

export interface DataBundle {
  warga: Warga[];
  transaksi: Transaksi[];
  tagihan: Tagihan[];
  kegiatan: Kegiatan[];
  pengumuman: Pengumuman[];
  pengaduan: Pengaduan[];
  kwitansi: Kwitansi[];
  pengurus: Pengurus[];
  tautan: Tautan[];
  marketplace: Marketplace[];
  users: User[];
  pengaturan: Pengaturan;
}

export interface NeonDashboardSnapshot {
  summary: {
    saldo: number;
    totalPemasukan: number;
    totalPengeluaran: number;
    tagihanBelumLunas: number;
    tagihanTelat: number;
    nominalTunggakan: number;
    tagihanLunas: number;
    totalWarga: number;
    totalJiwa: number;
  };
  cashFlow: { label: string; pemasukan: number; pengeluaran: number }[];
  expenseByCategory: { kategori: string; nominal: number; percent: number }[];
  recentTransaksi: Transaksi[];
}
