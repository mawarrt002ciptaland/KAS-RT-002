-- ============================================================================
--  SISTEM INFORMASI RT 002 — BLOK MAWAR CIPTALAND (RT 002 / RW 014, Batam)
--  Seed transaksi kas: PENGELUARAN Januari s.d. Agustus 2026 (sumber: Rekap Kas RT)
--
--  Target  : Neon (PostgreSQL) → tabel "Transaksi" sesuai prisma/schema.prisma
--  Cara    : Neon Console → pilih Project & Branch → SQL Editor → paste SELURUH
--            isi file ini → Run. Aman dijalankan berulang (UPSERT berdasarkan "kode").
--
--  Catatan :
--   • Format baris mengikuti rekap: (kode, jenis, kategori, tanggal, nominal,
--     keterangan, metode, penerima, status, sumber).
--   • status 'berhasil' disimpan sebagai 'selesai' (nilai standar schema:
--     selesai / pending). Hapus CASE di bagian B bila ingin tetap 'berhasil'.
--   • tanggal disimpan pukul 12:00 agar hari tidak bergeser saat konversi zona waktu.
--   • id dibuat deterministik (format mirip cuid, 25 karakter) dari kode.
--   • Baris PEMASUKAN bisa ditambahkan ke daftar VALUES yang sama
--     (kode TRX-PEM-YYYYMM-NNN, jenis 'pemasukan') — lihat template bagian C.
--   • Penjumlahan baris MARET 2026 = 19.266.300, sedangkan judul rekap 18.906.300
--     (selisih 360.000). Data dimuat apa adanya — mohon dicek kembali.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- A. STRUKTUR TABEL (dilewati otomatis bila sudah dibuat oleh `prisma db push`)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Transaksi" (
  "id"          TEXT PRIMARY KEY,
  "kode"        TEXT NOT NULL,
  "jenis"       TEXT NOT NULL,                      -- pemasukan / pengeluaran
  "tanggal"     TIMESTAMP(3) NOT NULL,
  "kategori"    TEXT NOT NULL,
  "keterangan"  TEXT NOT NULL,
  "nominal"     INTEGER NOT NULL,
  "penerima"    TEXT,
  "sumber"      TEXT,
  "buktiUrl"    TEXT,
  "metode"      TEXT NOT NULL DEFAULT 'Tunai',      -- Tunai / Transfer / QRIS
  "status"      TEXT NOT NULL DEFAULT 'selesai',    -- selesai / pending
  "wargaId"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Transaksi_kode_key" ON "Transaksi" ("kode");

-- ────────────────────────────────────────────────────────────────────────────
-- B. DATA PENGELUARAN 2026 (UPSERT — boleh dijalankan berulang)
-- ────────────────────────────────────────────────────────────────────────────
WITH data ("kode", "jenis", "kategori", "tanggal", "nominal", "keterangan", "metode", "penerima", "status", "sumber") AS (
  VALUES
  -- JANUARI 2026 (Total: 12.387.800)
  ('TRX-PENG-202601-001', 'pengeluaran', 'Keamanan', '2026-01-31', 193300, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-002', 'pengeluaran', 'Keamanan', '2026-01-31', 300000, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-003', 'pengeluaran', 'Keamanan', '2026-01-31', 2500000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-004', 'pengeluaran', 'Keamanan', '2026-01-31', 2500000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-005', 'pengeluaran', 'Keamanan', '2026-01-31', 2500000, 'Gaji Security Pak Yogi', 'Tunai', 'Pak Yogi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-006', 'pengeluaran', 'Kebersihan', '2026-01-31', 2000000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-007', 'pengeluaran', 'Fasilitas', '2026-01-31', 203500, 'Token fasum', 'Tunai', 'PLN / Token', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-008', 'pengeluaran', 'Operasional RT', '2026-01-31', 100000, 'Insentif pengutip ruko', 'Tunai', 'Pengutip Ruko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-009', 'pengeluaran', 'Operasional RT', '2026-01-31', 200000, 'Insentif Korlap', 'Tunai', 'Korlap', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-010', 'pengeluaran', 'Operasional RT', '2026-01-31', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-011', 'pengeluaran', 'Operasional RT', '2026-01-31', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-012', 'pengeluaran', 'Operasional RT', '2026-01-31', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-013', 'pengeluaran', 'Fasilitas', '2026-01-31', 25000, 'Buku besar security', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-014', 'pengeluaran', 'Sosial', '2026-01-31', 200000, 'Uang minum + rokok untuk lori sampah', 'Tunai', 'Lori Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-015', 'pengeluaran', 'Sosial', '2026-01-31', 200000, 'Dansos sakit mawar 133', 'Tunai', 'Warga Mawar 133', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-016', 'pengeluaran', 'Fasilitas', '2026-01-31', 50000, 'Gembok gardu', 'Tunai', 'Toko Bangunan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-017', 'pengeluaran', 'Fasilitas', '2026-01-31', 17000, 'Bola lampu samping pos', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-018', 'pengeluaran', 'Operasional RT', '2026-01-31', 10000, 'ATK pengutip ruko', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-019', 'pengeluaran', 'Konsumsi', '2026-01-31', 200000, 'Konsumsi rapat dengan mitratel (kue & sanford) + bersihkan fasum', 'Tunai', 'Konsumsi Rapat', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-020', 'pengeluaran', 'Fasilitas', '2026-01-31', 39000, '3 bola lampu fasum', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202601-021', 'pengeluaran', 'Sosial', '2026-01-31', 200000, 'Dansos sakit anak mawar 50', 'Tunai', 'Warga Mawar 50', 'berhasil', 'Rekap Kas RT'),

  -- FEBRUARI 2026 (Total: 16.895.900)
  ('TRX-PENG-202602-001', 'pengeluaran', 'Keamanan', '2026-02-28', 195300, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-002', 'pengeluaran', 'Keamanan', '2026-02-28', 133500, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-003', 'pengeluaran', 'Keamanan', '2026-02-28', 2500000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-004', 'pengeluaran', 'Keamanan', '2026-02-28', 2500000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-005', 'pengeluaran', 'Keamanan', '2026-02-28', 2500000, 'Gaji Security Pak Yogi', 'Tunai', 'Pak Yogi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-006', 'pengeluaran', 'Kebersihan', '2026-02-28', 2000000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-007', 'pengeluaran', 'Fasilitas', '2026-02-28', 203500, 'Token fasum', 'Tunai', 'PLN / Token', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-008', 'pengeluaran', 'Operasional RT', '2026-02-28', 100000, 'Insentif pengutip ruko', 'Tunai', 'Pengutip Ruko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-009', 'pengeluaran', 'Operasional RT', '2026-02-28', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-010', 'pengeluaran', 'Operasional RT', '2026-02-28', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-011', 'pengeluaran', 'Operasional RT', '2026-02-28', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-012', 'pengeluaran', 'Fasilitas', '2026-02-28', 25000, 'Buku besar security', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-013', 'pengeluaran', 'Sosial', '2026-02-28', 1500000, 'Dansos kemalangan (meninggal dunia) mawar 193A', 'Tunai', 'Warga Mawar 193A', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-014', 'pengeluaran', 'Operasional RT', '2026-02-28', 20000, 'Buat kartu kutipan keamanan', 'Tunai', 'Percetakan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-015', 'pengeluaran', 'Konsumsi', '2026-02-28', 170000, 'Konsumsi rapat perangkat', 'Tunai', 'Konsumsi Rapat', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-016', 'pengeluaran', 'Fasilitas', '2026-02-28', 100000, 'Tali bendera pos security', 'Tunai', 'Toko Bendera', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-017', 'pengeluaran', 'Fasilitas', '2026-02-28', 1300000, 'Upah tukang semenisasi gudang 18 hari', 'Tunai', 'Tukang', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-018', 'pengeluaran', 'Fasilitas', '2026-02-28', 1457000, 'Bahan perbaikan gudang (semen 9 sak, pasir 1 lori, batu coral, dll)', 'Tunai', 'Toko Material', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-019', 'pengeluaran', 'Fasilitas', '2026-02-28', 15000, 'Sapu lidi', 'Tunai', 'Toko Alat Kebersihan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-020', 'pengeluaran', 'Operasional RT', '2026-02-28', 57500, 'Materai 5 pcs', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-021', 'pengeluaran', 'Operasional RT', '2026-02-28', 150000, 'Admin bank pertahun', 'Transfer / QRIS', 'Bank', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-022', 'pengeluaran', 'Operasional RT', '2026-02-28', 330000, 'Cetak stiker logo RT 02 Mawar', 'Tunai', 'Percetakan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-023', 'pengeluaran', 'Operasional RT', '2026-02-28', 200000, 'Upah design logo stiker', 'Tunai', 'Designer', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-024', 'pengeluaran', 'Operasional RT', '2026-02-28', 56500, 'Baterai toa', 'Tunai', 'Toko Elektronik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-025', 'pengeluaran', 'Keamanan', '2026-02-28', 252600, 'Kaos security lengan panjang 3 pcs', 'Tunai', 'Konveksi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202602-026', 'pengeluaran', 'Keamanan', '2026-02-28', 180000, 'Kaos security lengan pendek 3 pcs', 'Tunai', 'Konveksi', 'berhasil', 'Rekap Kas RT'),

  -- MARET 2026 (Judul rekap: 18.906.300 — penjumlahan baris di bawah = 19.266.300, selisih 360.000: mohon dicek)
  ('TRX-PENG-202603-001', 'pengeluaran', 'Keamanan', '2026-03-31', 191300, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-002', 'pengeluaran', 'Keamanan', '2026-03-31', 201500, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-003', 'pengeluaran', 'Keamanan', '2026-03-31', 2500000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-004', 'pengeluaran', 'Keamanan', '2026-03-31', 2500000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-005', 'pengeluaran', 'Keamanan', '2026-03-31', 2500000, 'Gaji Security Pak Yogi', 'Tunai', 'Pak Yogi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-006', 'pengeluaran', 'Operasional RT', '2026-03-31', 50000, 'Upah sebar lapkas', 'Tunai', 'Petugas Sebar Lapkas', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-007', 'pengeluaran', 'Kebersihan', '2026-03-31', 2000000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-008', 'pengeluaran', 'Fasilitas', '2026-03-31', 203500, 'Token fasum', 'Tunai', 'PLN / Token', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-009', 'pengeluaran', 'Operasional RT', '2026-03-31', 100000, 'Insentif pengutip ruko', 'Tunai', 'Pengutip Ruko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-010', 'pengeluaran', 'Operasional RT', '2026-03-31', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-011', 'pengeluaran', 'Operasional RT', '2026-03-31', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-012', 'pengeluaran', 'Operasional RT', '2026-03-31', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-013', 'pengeluaran', 'Operasional RT', '2026-03-31', 265000, 'Tinta printer', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-014', 'pengeluaran', 'Fasilitas', '2026-03-31', 1650000, 'Inventaris RT: Meja 3 buah', 'Tunai', 'Toko Furniture', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-015', 'pengeluaran', 'Konsumsi', '2026-03-31', 350000, 'Bukber perangkat RT, humas, dan security', 'Tunai', 'Konsumsi Bukber', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-016', 'pengeluaran', 'Operasional RT', '2026-03-31', 200000, 'THR pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-017', 'pengeluaran', 'Operasional RT', '2026-03-31', 70000, 'Fotokopi lapkas 3 bulan', 'Tunai', 'Fotokopi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-018', 'pengeluaran', 'Fasilitas', '2026-03-31', 50000, 'Gembok portal', 'Tunai', 'Toko Bangunan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-019', 'pengeluaran', 'Konsumsi', '2026-03-31', 1219000, 'Minuman hari raya perangkat, humas, security, dan pengakut sampah', 'Tunai', 'Konsumsi Hari Raya', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-020', 'pengeluaran', 'Fasilitas', '2026-03-31', 1200000, 'Perbaikan tenda + pengecatan', 'Tunai', 'Tukang / Cat', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-021', 'pengeluaran', 'Operasional RT', '2026-03-31', 36000, 'Amplop 2 kotak', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-022', 'pengeluaran', 'Keamanan', '2026-03-31', 1020000, 'Untuk penambahan THR security', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-023', 'pengeluaran', 'Fasilitas', '2026-03-31', 500000, 'Upah potong rumput taman + bensin dan bersih fasum', 'Tunai', 'Petugas Kebersihan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-024', 'pengeluaran', 'Konsumsi', '2026-03-31', 500000, 'Konsumsi rapat warga pembentukan panitia pemilihan RT 02: Bakso 50 porsi', 'Tunai', 'Pedagang Bakso', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-025', 'pengeluaran', 'Konsumsi', '2026-03-31', 400000, 'Sanford gelas 2 dus', 'Tunai', 'Toko Minuman', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-026', 'pengeluaran', 'Konsumsi', '2026-03-31', 30000, 'Gelas plastik kopi teh', 'Tunai', 'Toko Plastik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-027', 'pengeluaran', 'Konsumsi', '2026-03-31', 50000, 'Kopi dan teh 2 teko', 'Tunai', 'Warung', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-028', 'pengeluaran', 'Operasional RT', '2026-03-31', 30000, 'Baterai mic', 'Tunai', 'Toko Elektronik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202603-029', 'pengeluaran', 'Sosial', '2026-03-31', 500000, 'Sumbangan untuk posyandu RW 14', 'Tunai', 'Posyandu RW 14', 'berhasil', 'Rekap Kas RT'),

  -- APRIL 2026 (Total: 16.238.200 — 23 item cocok 100%)
  ('TRX-PENG-202604-001', 'pengeluaran', 'Keamanan', '2026-04-30', 199200, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-002', 'pengeluaran', 'Keamanan', '2026-04-30', 200000, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-003', 'pengeluaran', 'Keamanan', '2026-04-30', 2500000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-004', 'pengeluaran', 'Keamanan', '2026-04-30', 2500000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-005', 'pengeluaran', 'Keamanan', '2026-04-30', 2500000, 'Gaji Security Pak Yogi', 'Tunai', 'Pak Yogi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-006', 'pengeluaran', 'Operasional RT', '2026-04-30', 30000, 'Fotokopi lapkas', 'Tunai', 'Fotokopi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-007', 'pengeluaran', 'Operasional RT', '2026-04-30', 50000, 'Upah sebar lapkas', 'Tunai', 'Petugas Sebar Lapkas', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-008', 'pengeluaran', 'Kebersihan', '2026-04-30', 2000000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-009', 'pengeluaran', 'Fasilitas', '2026-04-30', 203500, 'Token fasum', 'Tunai', 'PLN / Token', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-010', 'pengeluaran', 'Operasional RT', '2026-04-30', 100000, 'Insentif pengutip ruko', 'Tunai', 'Pengutip Ruko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-011', 'pengeluaran', 'Operasional RT', '2026-04-30', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-012', 'pengeluaran', 'Operasional RT', '2026-04-30', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-013', 'pengeluaran', 'Operasional RT', '2026-04-30', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-014', 'pengeluaran', 'Konsumsi', '2026-04-30', 100000, 'Konsumsi rapat dengan mitratel dan developer', 'Tunai', 'Konsumsi Rapat', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-015', 'pengeluaran', 'Fasilitas', '2026-04-30', 148000, 'Kipas angin security', 'Tunai', 'Toko Elektronik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-016', 'pengeluaran', 'Operasional RT', '2026-04-30', 100000, 'Fotokopi KK warga', 'Tunai', 'Fotokopi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-017', 'pengeluaran', 'Fasilitas', '2026-04-30', 25000, 'Buku besar security', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-018', 'pengeluaran', 'Operasional RT', '2026-04-30', 3102500, 'Biaya pemilihan RT 002', 'Tunai', 'Panitia Pemilihan RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-019', 'pengeluaran', 'Sosial', '2026-04-30', 300000, 'Iuran posyandu RW Januari s.d Juni 2026', 'Tunai', 'Posyandu RW', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-020', 'pengeluaran', 'Konsumsi', '2026-04-30', 200000, 'Konsumsi peresmian posyandu', 'Tunai', 'Posyandu RW', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-021', 'pengeluaran', 'Sosial', '2026-04-30', 200000, 'Dansos sakit Mawar 76', 'Tunai', 'Warga Mawar 76', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-022', 'pengeluaran', 'Sosial', '2026-04-30', 200000, 'Dansos sakit Mawar 108', 'Tunai', 'Warga Mawar 108', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202604-023', 'pengeluaran', 'Fasilitas', '2026-04-30', 630000, 'Inventaris RT tangga oranye', 'Tunai', 'Toko Bangunan', 'berhasil', 'Rekap Kas RT'),

  -- MEI 2026 (Total: 11.940.265)
  ('TRX-PENG-202605-001', 'pengeluaran', 'Keamanan', '2026-05-31', 199165, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-002', 'pengeluaran', 'Keamanan', '2026-05-31', 189500, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-003', 'pengeluaran', 'Keamanan', '2026-05-31', 2600000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-004', 'pengeluaran', 'Keamanan', '2026-05-31', 2600000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-005', 'pengeluaran', 'Keamanan', '2026-05-31', 1500000, 'Gaji Security Pak Yogi', 'Tunai', 'Pak Yogi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-006', 'pengeluaran', 'Operasional RT', '2026-05-31', 64000, 'Fotokopi lapkas', 'Tunai', 'Fotokopi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-007', 'pengeluaran', 'Operasional RT', '2026-05-31', 50000, 'Upah sebar lapkas', 'Tunai', 'Petugas Sebar Lapkas', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-008', 'pengeluaran', 'Kebersihan', '2026-05-31', 1100000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-009', 'pengeluaran', 'Operasional RT', '2026-05-31', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-010', 'pengeluaran', 'Operasional RT', '2026-05-31', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-011', 'pengeluaran', 'Operasional RT', '2026-05-31', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-012', 'pengeluaran', 'Fasilitas', '2026-05-31', 2228200, 'Biaya pelantikan RT 002', 'Tunai', 'Panitia Pelantikan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-013', 'pengeluaran', 'Sosial', '2026-05-31', 200000, 'Dansos sakit Mawar 140', 'Tunai', 'Warga Mawar 140', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-014', 'pengeluaran', 'Operasional RT', '2026-05-31', 24000, 'Admin Bank Riau', 'Transfer / QRIS', 'Bank Riau', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-015', 'pengeluaran', 'Konsumsi', '2026-05-31', 210400, 'Konsumsi rapat warga (sanford, arang, jeruk, kacang, ubi, tisu, dll)', 'Tunai', 'Konsumsi Rapat', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202605-016', 'pengeluaran', 'Fasilitas', '2026-05-31', 25000, 'Kain Pel Pos', 'Tunai', 'Toko Kebersihan', 'berhasil', 'Rekap Kas RT'),

  -- JUNI 2026 (Total: 11.143.079)
  ('TRX-PENG-202606-001', 'pengeluaran', 'Keamanan', '2026-06-30', 207079, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-002', 'pengeluaran', 'Keamanan', '2026-06-30', 217500, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-003', 'pengeluaran', 'Keamanan', '2026-06-30', 3000000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-004', 'pengeluaran', 'Keamanan', '2026-06-30', 3000000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-005', 'pengeluaran', 'Kebersihan', '2026-06-30', 1100000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-006', 'pengeluaran', 'Fasilitas', '2026-06-30', 203500, 'Token fasum', 'Tunai', 'PLN / Token', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-007', 'pengeluaran', 'Operasional RT', '2026-06-30', 200000, 'Insentif Korlap', 'Tunai', 'Korlap', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-008', 'pengeluaran', 'Operasional RT', '2026-06-30', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-009', 'pengeluaran', 'Operasional RT', '2026-06-30', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-010', 'pengeluaran', 'Operasional RT', '2026-06-30', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-011', 'pengeluaran', 'Fasilitas', '2026-06-30', 47500, 'Buku besar security', 'Tunai', 'Toko ATK', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-012', 'pengeluaran', 'Sosial', '2026-06-30', 200000, 'Dansos sakit Mawar 216', 'Tunai', 'Warga Mawar 216', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-013', 'pengeluaran', 'Fasilitas', '2026-06-30', 982500, 'Material perbaikan jalan depan Mawar 47 (semen, batu, pasir, dll)', 'Tunai', 'Toko Material', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-014', 'pengeluaran', 'Sosial', '2026-06-30', 200000, 'Dansos sakit Mawar 151', 'Tunai', 'Warga Mawar 151', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-015', 'pengeluaran', 'Fasilitas', '2026-06-30', 125000, 'Bola lampu jalan depan Mawar 140', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-016', 'pengeluaran', 'Fasilitas', '2026-06-30', 150000, 'Bola lampu pos jaga 2 pcs', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-017', 'pengeluaran', 'Sosial', '2026-06-30', 200000, 'Dansos sakit Mawar 91', 'Tunai', 'Warga Mawar 91', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-018', 'pengeluaran', 'Sosial', '2026-06-30', 200000, 'Dansos sakit anak Mawar 142', 'Tunai', 'Warga Mawar 142', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-019', 'pengeluaran', 'Fasilitas', '2026-06-30', 85000, 'Plang RT', 'Tunai', 'Pembuat Plang', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202606-020', 'pengeluaran', 'Keamanan', '2026-06-30', 75000, 'Benderan Pos Jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),

  -- JULI 2026 (Total: 11.311.483)
  ('TRX-PENG-202607-001', 'pengeluaran', 'Keamanan', '2026-07-31', 216971, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-002', 'pengeluaran', 'Keamanan', '2026-07-31', 368500, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-003', 'pengeluaran', 'Keamanan', '2026-07-31', 3000000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-004', 'pengeluaran', 'Keamanan', '2026-07-31', 3000000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-005', 'pengeluaran', 'Kebersihan', '2026-07-31', 1100000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-006', 'pengeluaran', 'Fasilitas', '2026-07-31', 203500, 'Token fasum', 'Tunai', 'PLN / Token', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-007', 'pengeluaran', 'Operasional RT', '2026-07-31', 200000, 'Insentif Korlap', 'Tunai', 'Korlap', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-008', 'pengeluaran', 'Operasional RT', '2026-07-31', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-009', 'pengeluaran', 'Operasional RT', '2026-07-31', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-010', 'pengeluaran', 'Operasional RT', '2026-07-31', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-011', 'pengeluaran', 'Keamanan', '2026-07-31', 40000, 'Extension pos jaga', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-012', 'pengeluaran', 'Fasilitas', '2026-07-31', 100000, 'Bola lampu jalan belakang fasum', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-013', 'pengeluaran', 'Operasional RT', '2026-07-31', 65000, 'Stempel untuk panitia HUT RI', 'Tunai', 'Percetakan Stempel', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-014', 'pengeluaran', 'Konsumsi', '2026-07-31', 143000, 'Konsumsi rapat warga dan panitia HUT RI (Sanford 1 dus, Rambutan 4 kg, Kacang kulit 1 bks)', 'Tunai', 'Konsumsi Rapat', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-015', 'pengeluaran', 'Fasilitas', '2026-07-31', 1154000, 'Material goro perbaikan jalan depan Mawar 59 (pasir, besi, batu granit, semen)', 'Tunai', 'Toko Material', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-016', 'pengeluaran', 'Kegiatan Warga', '2026-07-31', 333912, 'Seragam voli putra 8 pcs', 'Tunai', 'Konveksi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-017', 'pengeluaran', 'Kegiatan Warga', '2026-07-31', 336600, 'Seragam voli putri 8 pcs', 'Tunai', 'Konveksi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202607-018', 'pengeluaran', 'Sosial', '2026-07-31', 100000, 'Sumbangan sakit untuk Pak Joko Sutopo (FKTW Tiban Indah)', 'Tunai', 'Pak Joko Sutopo', 'berhasil', 'Rekap Kas RT'),

  -- AGUSTUS 2026 (Total: 14.586.820)
  ('TRX-PENG-202608-001', 'pengeluaran', 'Keamanan', '2026-08-31', 230820, 'Listrik pos jaga', 'Tunai', 'Pos Jaga', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-002', 'pengeluaran', 'Keamanan', '2026-08-31', 274000, 'Konsumsi security (isi ulang galon, gula, kopi)', 'Tunai', 'Security RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-003', 'pengeluaran', 'Keamanan', '2026-08-31', 3000000, 'Gaji Security Pak Eko', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-004', 'pengeluaran', 'Keamanan', '2026-08-31', 3000000, 'Gaji Security Pak Amad', 'Tunai', 'Pak Amad', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-005', 'pengeluaran', 'Kebersihan', '2026-08-31', 1100000, 'Retribusi sampah', 'Tunai', 'Pengangkut Sampah', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-006', 'pengeluaran', 'Operasional RT', '2026-08-31', 200000, 'Insentif Korlap', 'Tunai', 'Korlap', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-007', 'pengeluaran', 'Operasional RT', '2026-08-31', 400000, 'Insentif pengutip perumahan', 'Tunai', 'Pengutip Perumahan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-008', 'pengeluaran', 'Operasional RT', '2026-08-31', 200000, 'Insentif sekretaris', 'Tunai', 'Sekretaris RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-009', 'pengeluaran', 'Operasional RT', '2026-08-31', 350000, 'Insentif bendahara', 'Tunai', 'Bendahara RT', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-010', 'pengeluaran', 'Fasilitas', '2026-08-31', 15000, 'Sapu lidi', 'Tunai', 'Toko Alat Kebersihan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-011', 'pengeluaran', 'Sosial', '2026-08-31', 300000, 'Iuran posyandu RW bulan Juli s.d Desember 2026', 'Tunai', 'Posyandu RW 14', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-012', 'pengeluaran', 'Sosial', '2026-08-31', 200000, 'Dansos sakit Mawar 67', 'Tunai', 'Warga Mawar 67', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-013', 'pengeluaran', 'Kegiatan Warga', '2026-08-31', 122000, 'Minum untuk pemain voli', 'Tunai', 'Konsumsi Voli', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-014', 'pengeluaran', 'Operasional RT', '2026-08-31', 400000, 'Cetak kartu kutipan keamanan 200 pcs', 'Tunai', 'Percetakan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-015', 'pengeluaran', 'Fasilitas', '2026-08-31', 55000, 'Alat pemotong kabel (tang)', 'Tunai', 'Toko Bangunan', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-016', 'pengeluaran', 'Fasilitas', '2026-08-31', 200000, 'Bola lampu 2 pcs (dekat fasum & Mawar 93)', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-017', 'pengeluaran', 'Kegiatan Warga', '2026-08-31', 127000, 'Minum untuk pemain voli', 'Tunai', 'Konsumsi Voli', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-018', 'pengeluaran', 'Fasilitas', '2026-08-31', 675000, 'Bola lampu 5 pcs, kabel, dan terminal untuk fasum', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-019', 'pengeluaran', 'Fasilitas', '2026-08-31', 1044000, 'Lampu sorot 2 pcs, dll', 'Tunai', 'Toko Listrik', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-020', 'pengeluaran', 'Operasional RT', '2026-08-31', 50000, 'Bensin Pak Eko beli lampu', 'Tunai', 'Pak Eko', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-021', 'pengeluaran', 'Fasilitas', '2026-08-31', 700000, 'Kabel supreme 2 rol', 'Tunai', 'Toko Kabel', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-022', 'pengeluaran', 'Kegiatan Warga', '2026-08-31', 1550000, 'Dana untuk Hut RI RT 02 Mawar', 'Tunai', 'Panitia HUT RI', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-023', 'pengeluaran', 'Sosial', '2026-08-31', 200000, 'Dansos sakit Mawar 81', 'Tunai', 'Warga Mawar 81', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-024', 'pengeluaran', 'Operasional RT', '2026-08-31', 144000, 'Fc lapkas Mei s.d Juli', 'Tunai', 'Fotokopi', 'berhasil', 'Rekap Kas RT'),
  ('TRX-PENG-202608-025', 'pengeluaran', 'Operasional RT', '2026-08-31', 50000, 'Upah sebar lapkas', 'Tunai', 'Petugas Sebar Lapkas', 'berhasil', 'Rekap Kas RT')
)
INSERT INTO "Transaksi"
  ("id", "kode", "jenis", "tanggal", "kategori", "keterangan", "nominal",
   "penerima", "sumber", "metode", "status", "createdAt", "updatedAt")
SELECT
  'c' || substr(md5('rt002:' || d."kode"), 1, 24)          AS "id",        -- deterministik, mirip cuid
  d."kode",
  d."jenis",
  (d."tanggal")::date + interval '12 hours'                 AS "tanggal",
  d."kategori",
  d."keterangan",
  d."nominal",
  d."penerima",
  d."sumber",
  d."metode",
  CASE WHEN d."status" = 'berhasil' THEN 'selesai' ELSE d."status" END AS "status",
  NOW(),
  NOW()
FROM data d
ON CONFLICT ("kode") DO UPDATE SET
  "jenis"      = EXCLUDED."jenis",
  "tanggal"    = EXCLUDED."tanggal",
  "kategori"   = EXCLUDED."kategori",
  "keterangan" = EXCLUDED."keterangan",
  "nominal"    = EXCLUDED."nominal",
  "penerima"   = EXCLUDED."penerima",
  "sumber"     = EXCLUDED."sumber",
  "metode"     = EXCLUDED."metode",
  "status"     = EXCLUDED."status",
  "updatedAt"  = NOW();

COMMIT;

-- ────────────────────────────────────────────────────────────────────────────
-- C. TEMPLATE PEMASUKAN (opsional) — hapus tanda "-- " lalu isi nominal & keterangan.
--    Struktur & kolom sama persis dengan bagian B; kode TRX-PEM-YYYYMM-NNN.
-- ────────────────────────────────────────────────────────────────────────────
-- BEGIN;
-- WITH data ("kode", "jenis", "kategori", "tanggal", "nominal", "keterangan", "metode", "penerima", "status", "sumber") AS (
--   VALUES
--   ('TRX-PEM-202601-001', 'pemasukan', 'Lain-lain',       '2026-01-01', 0, 'Saldo awal kas tahun 2026',                 'Tunai', 'Bendahara RT', 'berhasil', 'Kas Tahun 2025'),
--   ('TRX-PEM-202601-002', 'pemasukan', 'Iuran Keamanan',  '2026-01-31', 0, 'Kutipan keamanan perumahan Januari 2026',  'Tunai', 'Bendahara RT', 'berhasil', 'Warga RT 002'),
--   ('TRX-PEM-202601-003', 'pemasukan', 'Iuran Keamanan',  '2026-01-31', 0, 'Kutipan keamanan ruko Januari 2026',       'Tunai', 'Bendahara RT', 'berhasil', 'Pemilik Ruko'),
--   ('TRX-PEM-202601-004', 'pemasukan', 'Iuran Kebersihan','2026-01-31', 0, 'Iuran sampah Januari 2026',                'Tunai', 'Bendahara RT', 'berhasil', 'Warga RT 002')
-- )
-- INSERT INTO "Transaksi" ("id","kode","jenis","tanggal","kategori","keterangan","nominal","penerima","sumber","metode","status","createdAt","updatedAt")
-- SELECT 'c' || substr(md5('rt002:' || d."kode"), 1, 24), d."kode", d."jenis", (d."tanggal")::date + interval '12 hours',
--        d."kategori", d."keterangan", d."nominal", d."penerima", d."sumber", d."metode",
--        CASE WHEN d."status" = 'berhasil' THEN 'selesai' ELSE d."status" END, NOW(), NOW()
-- FROM data d
-- ON CONFLICT ("kode") DO UPDATE SET "jenis" = EXCLUDED."jenis", "tanggal" = EXCLUDED."tanggal", "kategori" = EXCLUDED."kategori",
--   "keterangan" = EXCLUDED."keterangan", "nominal" = EXCLUDED."nominal", "penerima" = EXCLUDED."penerima", "sumber" = EXCLUDED."sumber",
--   "metode" = EXCLUDED."metode", "status" = EXCLUDED."status", "updatedAt" = NOW();
-- COMMIT;

-- ────────────────────────────────────────────────────────────────────────────
-- D. VERIFIKASI (jalankan satu per satu di SQL Editor)
-- ────────────────────────────────────────────────────────────────────────────
-- D1. Rekap pengeluaran per bulan
--     Ekspektasi: 2026-01 12.387.800 | 2026-02 16.895.900 | 2026-03 19.266.300 | 2026-04 16.238.200
--                 2026-05 11.940.265 | 2026-06 11.143.079 | 2026-07 11.311.483 | 2026-08 14.586.820
--                 Total 178 baris = 113.769.847
SELECT to_char("tanggal", 'YYYY-MM') AS bulan,
       COUNT(*)                        AS jumlah_transaksi,
       SUM("nominal")                  AS total_pengeluaran
FROM   "Transaksi"
WHERE  "jenis" = 'pengeluaran' AND "kode" LIKE 'TRX-PENG-2026%'
GROUP  BY 1
ORDER  BY 1;

-- D2. Pengeluaran per kategori Agustus 2026 (= donut "Pengeluaran per Kategori" di dashboard)
--     Ekspektasi: Keamanan 6.504.820 (44,6%) | Fasilitas 2.689.000 (18,4%) | Kegiatan Warga 1.799.000 (12,3%)
--                 Operasional RT 1.794.000 (12,3%) | Kebersihan 1.100.000 (7,5%) | Sosial 700.000 (4,8%) — Total 14.586.820
SELECT "kategori",
       SUM("nominal") AS total,
       ROUND(100.0 * SUM("nominal") / SUM(SUM("nominal")) OVER (), 1) AS persen
FROM   "Transaksi"
WHERE  "jenis" = 'pengeluaran'
  AND  "tanggal" >= TIMESTAMP '2026-08-01' AND "tanggal" < TIMESTAMP '2026-09-01'
GROUP  BY 1
ORDER  BY 2 DESC;

-- D3. Saldo kas keseluruhan (pemasukan − pengeluaran)
SELECT COALESCE(SUM(CASE WHEN "jenis" = 'pemasukan' THEN "nominal" ELSE -"nominal" END), 0) AS saldo_kas,
       SUM(CASE WHEN "jenis" = 'pemasukan'   THEN "nominal" ELSE 0 END) AS total_pemasukan,
       SUM(CASE WHEN "jenis" = 'pengeluaran' THEN "nominal" ELSE 0 END) AS total_pengeluaran
FROM   "Transaksi";

-- ────────────────────────────────────────────────────────────────────────────
-- E. ROLLBACK (opsional) — hapus semua baris yang dimuat oleh skrip ini
-- ────────────────────────────────────────────────────────────────────────────
-- DELETE FROM "Transaksi" WHERE "kode" LIKE 'TRX-PENG-2026__-___';
