import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  timestamp,
  date,
  boolean,
} from "drizzle-orm/pg-core";

export const warga = pgTable("warga", {
  id: serial("id").primaryKey(),
  nik: text("nik").notNull().unique(),
  nama: text("nama").notNull(),
  noRumah: text("no_rumah").notNull(),
  telepon: text("telepon").default(""),
  pekerjaan: text("pekerjaan").default(""),
  status: text("status").notNull().default("aktif"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("warga"), // admin | warga
  wargaId: integer("warga_id").references(() => warga.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jenisIuran = pgTable("jenis_iuran", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  nominal: bigint("nominal", { mode: "number" }).notNull(),
  periode: text("periode").notNull().default("bulanan"), // bulanan | insidental
  keterangan: text("keterangan").default(""),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tagihan = pgTable("tagihan", {
  id: serial("id").primaryKey(),
  wargaId: integer("warga_id")
    .notNull()
    .references(() => warga.id, { onDelete: "cascade" }),
  jenisIuranId: integer("jenis_iuran_id")
    .notNull()
    .references(() => jenisIuran.id, { onDelete: "cascade" }),
  bulan: integer("bulan").notNull(),
  tahun: integer("tahun").notNull(),
  nominal: bigint("nominal", { mode: "number" }).notNull(),
  status: text("status").notNull().default("belum"), // belum | lunas
  tanggalBayar: date("tanggal_bayar"),
  metode: text("metode").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transaksi = pgTable("transaksi", {
  id: serial("id").primaryKey(),
  jenis: text("jenis").notNull(), // masuk | keluar
  kategori: text("kategori").notNull().default("Umum"),
  keterangan: text("keterangan").notNull(),
  nominal: bigint("nominal", { mode: "number" }).notNull(),
  tanggal: date("tanggal").notNull(),
  tagihanId: integer("tagihan_id").references(() => tagihan.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const produk = pgTable("produk", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  harga: bigint("harga", { mode: "number" }).notNull(),
  kategori: text("kategori").notNull().default("Jual"), // Jual | Jasa | Donasi
  status: text("status").notNull().default("tersedia"), // tersedia | habis
  penjual: text("penjual").notNull(),
  telepon: text("telepon").default(""),
  keterangan: text("keterangan").default(""),
  warna: text("warna").notNull().default("indigo"),
  wargaId: integer("warga_id").references(() => warga.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
