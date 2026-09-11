import { pgTable, serial, varchar, text, integer, timestamp, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nik: varchar("nik", { length: 20 }),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 30 }).notNull().default("warga"), // 'admin', 'ketua_rt', 'bendahara', 'warga'
  phone: varchar("phone", { length: 25 }),
  houseNumber: varchar("house_number", { length: 30 }),
  avatar: text("avatar"),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const warga = pgTable("warga", {
  id: serial("id").primaryKey(),
  nik: varchar("nik", { length: 20 }).notNull().unique(),
  nama: varchar("nama", { length: 100 }).notNull(),
  noRumah: varchar("no_rumah", { length: 30 }).notNull(),
  noHp: varchar("no_hp", { length: 25 }).notNull(),
  statusTinggal: varchar("status_tinggal", { length: 30 }).default("Tetap").notNull(), // 'Tetap' | 'Kontrak' | 'Kost'
  jumlahKeluarga: integer("jumlah_keluarga").default(1).notNull(),
  pekerjaan: varchar("pekerjaan", { length: 100 }),
  statusIuran: varchar("status_iuran", { length: 30 }).default("Aktif").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transaksi = pgTable("transaksi", {
  id: serial("id").primaryKey(),
  kodeTransaksi: varchar("kode_transaksi", { length: 50 }).notNull().unique(),
  jenis: varchar("jenis", { length: 20 }).notNull(), // 'pemasukan' | 'pengeluaran'
  kategori: varchar("kategori", { length: 50 }).notNull(), // 'Iuran Bulanan', 'Iuran Sampah', 'Keamanan', 'Kebersihan', 'Fasilitas', etc.
  tanggal: varchar("tanggal", { length: 20 }).notNull(), // 'YYYY-MM-DD' or formatted string
  nominal: integer("nominal").notNull(),
  keterangan: text("keterangan").notNull(),
  metodePembayaran: varchar("metode_pembayaran", { length: 50 }).default("Transfer / QRIS"),
  wargaId: integer("warga_id"),
  namaPihak: varchar("nama_pihak", { length: 100 }),
  buktiUrl: text("bukti_url"),
  status: varchar("status", { length: 20 }).default("berhasil"),
  createdBy: varchar("created_by", { length: 50 }).default("Bendahara RT"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tagihan = pgTable("tagihan", {
  id: serial("id").primaryKey(),
  wargaId: integer("warga_id").notNull(),
  bulan: varchar("bulan", { length: 30 }).notNull(), // e.g. "April 2026"
  periode: varchar("periode", { length: 10 }).notNull(), // "2026-04"
  nominalKas: integer("nominal_kas").default(30000).notNull(),
  nominalSampah: integer("nominal_sampah").default(20000).notNull(),
  totalTagihan: integer("total_tagihan").default(50000).notNull(),
  status: varchar("status", { length: 20 }).default("belum_lunas").notNull(), // 'lunas' | 'belum_lunas'
  tanggalBayar: varchar("tanggal_bayar", { length: 30 }),
  metode: varchar("metode", { length: 50 }),
  buktiTransfer: text("bukti_transfer"),
  transaksiId: integer("transaksi_id"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  namaProduk: varchar("nama_produk", { length: 150 }).notNull(),
  kategori: varchar("kategori", { length: 50 }).notNull(),
  harga: integer("harga").notNull(),
  status: varchar("status", { length: 20 }).default("Tersedia").notNull(), // 'Tersedia' | 'Habis' - as requested in prompt!
  penjualNama: varchar("penjual_nama", { length: 100 }).notNull(),
  noRumah: varchar("no_rumah", { length: 30 }).notNull(),
  noWhatsapp: varchar("no_whatsapp", { length: 25 }).notNull(),
  deskripsi: text("deskripsi"),
  gambarUrl: text("gambar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pengaturan = pgTable("pengaturan", {
  id: serial("id").primaryKey(),
  namaRt: varchar("nama_rt", { length: 100 }).default("RT 002 RW 014"),
  perumahan: varchar("perumahan", { length: 100 }).default("Perumahan Ciptaland"),
  blok: varchar("blok", { length: 50 }).default("Blok Mawar"),
  ketuaRt: varchar("ketua_rt", { length: 100 }).default("Bambang Sudik Pamarto"),
  noHpKetua: varchar("no_hp_ketua", { length: 25 }).default("081234567890"),
  bendahara: varchar("bendahara", { length: 100 }).default("Ahmad Suryana"),
  noHpBendahara: varchar("no_hp_bendahara", { length: 25 }).default("081398765432"),
  namaBank: varchar("nama_bank", { length: 50 }).default("Bank Central Asia (BCA)"),
  noRekening: varchar("no_rekening", { length: 50 }).default("8720192831"),
  atasNama: varchar("atas_nama", { length: 100 }).default("KAS RT 002 BLOK MAWAR"),
  qrisImage: text("qris_image"),
  logoImage: text("logo_image"),
  iuranWajib: integer("iuran_wajib").default(50000),
  templateWaTagihan: text("template_wa_tagihan"),
  templateWaKwitansi: text("template_wa_kwitansi"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappLogs = pgTable("whatsapp_logs", {
  id: serial("id").primaryKey(),
  tujuanNama: varchar("tujuan_nama", { length: 100 }).notNull(),
  tujuanNomor: varchar("tujuan_nomor", { length: 25 }).notNull(),
  pesan: text("pesan").notNull(),
  status: varchar("status", { length: 20 }).default("terkirim").notNull(),
  tipe: varchar("tipe", { length: 30 }).default("Tagihan").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
