import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await pool.query(`
    TRUNCATE TABLE whatsapp_logs, products, tagihan, transaksi, warga, users, pengaturan RESTART IDENTITY CASCADE;
  `);

  // Insert Pengaturan
  await pool.query(`
    INSERT INTO pengaturan (nama_rt, perumahan, blok, ketua_rt, no_hp_ketua, bendahara, no_hp_bendahara, nama_bank, no_rekening, atas_nama, qris_image, logo_image, iuran_wajib, template_wa_tagihan, template_wa_kwitansi)
    VALUES (
      'RT 002 RW 014',
      'Perumahan Ciptaland',
      'Blok Mawar',
      'Bambang Sudik Pamarto',
      '081234567890',
      'Ahmad Suryana',
      '081398765432',
      'Bank Central Asia (BCA)',
      '8720192831',
      'KAS RT 002 BLOK MAWAR',
      'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226590014ID.LINKAJA.WWW01189360091100214002021587201928315204581253033605802ID5919KAS%20RT%20002%20BLOK%20MAWAR6009TANGERANG61051515462070703A0163048B5A',
      '/logo-ciptaland.png',
      50000,
      'Yth. Bpk/Ibu [NAMA_WARGA] ([NO_RUMAH]), menginfokan iuran Kas RT 002 RW 014 Blok Mawar untuk bulan [BULAN] sebesar [NOMINAL]. Pembayaran via Transfer BCA 8720192831 a.n KAS RT 002 BLOK MAWAR atau QRIS. Terima kasih!',
      'Terima kasih Bpk/Ibu [NAMA_WARGA], pembayaran iuran Kas RT 002 RW 014 untuk [BULAN] sebesar [NOMINAL] telah kami terima dengan No. Kwitansi [NO_KWITANSI]. Bukti sah tercatat di sistem KAS RT.'
    );
  `);

  // Insert Warga (12 residents in Blok Mawar M-01 to M-12)
  const wargaList = [
    { nik: "3201140102850001", nama: "Bambang Sudik Pamarto", noRumah: "M-01", noHp: "081234567890", statusTinggal: "Tetap", jml: 4, pekerjaan: "Wiraswasta" },
    { nik: "3201141208920003", nama: "Bayu Sudik Pamarto", noRumah: "M-02", noHp: "081298765431", statusTinggal: "Tetap", jml: 3, pekerjaan: "Pegawai BUMN" },
    { nik: "3201140504900002", nama: "Ahmad Suryana", noRumah: "M-03", noHp: "081398765432", statusTinggal: "Tetap", jml: 3, pekerjaan: "Akuntan" },
    { nik: "3201140903890006", nama: "Hendro Wijaya", noRumah: "M-04", noHp: "081211223344", statusTinggal: "Tetap", jml: 4, pekerjaan: "Teknisi Elektronik" },
    { nik: "3201142007880004", nama: "Gusti Adi Pratama", noRumah: "M-05", noHp: "081322334455", statusTinggal: "Tetap", jml: 2, pekerjaan: "Karyawan Swasta" },
    { nik: "3201141806930007", nama: "Dedi Kurniawan", noRumah: "M-06", noHp: "081344556677", statusTinggal: "Tetap", jml: 3, pekerjaan: "Guru" },
    { nik: "3201142211870008", nama: "Rian Hidayat", noRumah: "M-07", noHp: "081255667788", statusTinggal: "Tetap", jml: 5, pekerjaan: "Wiraswasta" },
    { nik: "3201141510950005", nama: "Siti Aminah", noRumah: "M-08", noHp: "081366778899", statusTinggal: "Tetap", jml: 2, pekerjaan: "Dokter Gigi" },
    { nik: "3201140501910009", nama: "Maya Anggraeni", noRumah: "M-09", noHp: "081277889900", statusTinggal: "Kontrak", jml: 2, pekerjaan: "Desainer Grafis" },
    { nik: "3201141112840010", nama: "Eko Prasetyo", noRumah: "M-10", noHp: "081388990011", statusTinggal: "Tetap", jml: 4, pekerjaan: "PNS" },
    { nik: "3201142805960011", nama: "Fauzan Azim", noRumah: "M-11", noHp: "081299001122", statusTinggal: "Tetap", jml: 1, pekerjaan: "Software Engineer" },
    { nik: "3201141709920012", nama: "Dimas Setiawan", noRumah: "M-12", noHp: "081311002233", statusTinggal: "Kontrak", jml: 3, pekerjaan: "Manajer Pemasaran" }
  ];

  for (const w of wargaList) {
    await pool.query(`
      INSERT INTO warga (nik, nama, no_rumah, no_hp, status_tinggal, jumlah_keluarga, pekerjaan)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [w.nik, w.nama, w.noRumah, w.noHp, w.statusTinggal, w.jml, w.pekerjaan]);
  }

  // Insert Users
  // Admin, Ketua RT, Bendahara, and resident accounts (Bayu, Gusti Adi, Siti)
  const usersList = [
    { nik: null, username: "admin", password: "admin123", name: "Administrator RT", role: "admin", phone: "081100000001", houseNumber: "Sekretariat", avatar: "AD" },
    { nik: "3201140102850001", username: "ketuart", password: "ketua123", name: "Bambang Sudik Pamarto", role: "ketua_rt", phone: "081234567890", houseNumber: "M-01", avatar: "BP" },
    { nik: "3201140504900002", username: "bendahara", password: "bendahara123", name: "Ahmad Suryana", role: "bendahara", phone: "081398765432", houseNumber: "M-03", avatar: "AS" },
    { nik: "3201141208920003", username: "bayu", password: "warga123", name: "Bayu Sudik Pamarto", role: "warga", phone: "081298765431", houseNumber: "M-02", avatar: "BY" },
    { nik: "3201142007880004", username: "gustiadi1", password: "warga123", name: "Gusti Adi Pratama", role: "warga", phone: "081322334455", houseNumber: "M-05", avatar: "GA" },
    { nik: "3201141510950005", username: "siti", password: "warga123", name: "Siti Aminah", role: "warga", phone: "081366778899", houseNumber: "M-08", avatar: "SA" }
  ];

  for (const u of usersList) {
    await pool.query(`
      INSERT INTO users (nik, username, password, name, role, phone, house_number, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [u.nik, u.username, u.password, u.name, u.role, u.phone, u.houseNumber, u.avatar]);
  }

  // Insert Transaksi
  // Total Pemasukan: Rp 3.720.000
  // Total Pengeluaran: Rp 1.550.000
  // Saldo: Rp 2.170.000 (Matches Dashboard screenshot!)
  const transaksiList = [
    { kode: "TRX-00001", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-01-15", nominal: 1120000, keterangan: "Iuran kas dan sampah warga bulan Januari 2026 (12 KK)", metode: "Transfer / QRIS", nama: "Warga Blok Mawar" },
    { kode: "TRX-00002", jenis: "pengeluaran", kategori: "Kebersihan", tanggal: "2026-01-28", nominal: 450000, keterangan: "Gaji petugas kebersihan & angkut sampah bulan Januari", metode: "Tunai", nama: "Pak Mamat" },
    { kode: "TRX-00003", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-02-12", nominal: 1125000, keterangan: "Iuran kas dan sampah warga bulan Februari 2026", metode: "Transfer / QRIS", nama: "Warga Blok Mawar" },
    { kode: "TRX-00004", jenis: "pengeluaran", kategori: "Fasilitas", tanggal: "2026-02-22", nominal: 185000, keterangan: "Peralatan kerja bakti dan peremajaan cat marka jalan", metode: "Transfer / QRIS", nama: "Toko Besi Berkah" },
    { kode: "TRX-00005", jenis: "pengeluaran", kategori: "Sosial", tanggal: "2026-02-27", nominal: 300000, keterangan: "Konsumsi rapat warga RT triwulan 1 & snack", metode: "Tunai", nama: "Katering Bu Ani" },
    { kode: "TRX-00006", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-03-08", nominal: 750000, keterangan: "Pembayaran iuran warga Maret (termin 1)", metode: "Transfer / QRIS", nama: "Warga Blok Mawar" },
    { kode: "TRX-00007", jenis: "pemasukan", kategori: "Iuran Sampah", tanggal: "2026-03-10", nominal: 275000, keterangan: "Iuran sampah tambahan & retribusi kebersihan Maret", metode: "Transfer / QRIS", nama: "Koordinator Lingkungan" },
    { kode: "TRX-00008", jenis: "pengeluaran", kategori: "Keamanan", tanggal: "2026-03-16", nominal: 240000, keterangan: "Perawatan portal keamanan, oli hidrolik & remote RFID", metode: "Transfer / QRIS", nama: "Teknisi Gate Security" },
    { kode: "TRX-00009", jenis: "pengeluaran", kategori: "Fasilitas", tanggal: "2026-03-25", nominal: 375000, keterangan: "Penggantian lampu penerangan jalan gang Blok Mawar (5 titik LED)", metode: "Transfer / QRIS", nama: "Toko Listrik Terang" },
    { kode: "TRX-00010", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-04-06", nominal: 450000, keterangan: "Pembayaran awal April (Sebagian warga lunas iuran)", metode: "Transfer / QRIS", nama: "Warga Blok Mawar" }
  ];

  for (const t of transaksiList) {
    await pool.query(`
      INSERT INTO transaksi (kode_transaksi, jenis, kategori, tanggal, nominal, keterangan, metode_pembayaran, nama_pihak, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'berhasil', 'Ahmad Suryana (Bendahara)')
    `, [t.kode, t.jenis, t.kategori, t.tanggal, t.nominal, t.keterangan, t.metode, t.nama]);
  }

  // Insert Tagihan for April 2026
  // 12 residents: 8 lunas (Rp 600.000), 4 belum lunas (Rp 300.000)
  // Total dana: Rp 900.000. 67% terkumpul! Exactly matches screenshot 5!
  const residentsRes = await pool.query(`SELECT id, nama, no_rumah FROM warga ORDER BY id ASC`);
  const residents = residentsRes.rows;

  for (let i = 0; i < residents.length; i++) {
    const isLunas = i < 8; // First 8 lunas, last 4 belum lunas
    const r = residents[i];
    await pool.query(`
      INSERT INTO tagihan (warga_id, bulan, periode, nominal_kas, nominal_sampah, total_tagihan, status, tanggal_bayar, metode, catatan)
      VALUES (
        $1,
        'April 2026',
        '2026-04',
        30000,
        20000,
        50000,
        $2,
        $3,
        $4,
        $5
      )
    `, [
      r.id,
      isLunas ? "lunas" : "belum_lunas",
      isLunas ? "06 Apr 2026 10:15" : null,
      isLunas ? "Transfer BCA" : null,
      isLunas ? "Lunas tepat waktu" : "Tagihan April 2026"
    ]);
  }

  // Also insert March 2026 bills (all lunas)
  for (let i = 0; i < residents.length; i++) {
    const r = residents[i];
    await pool.query(`
      INSERT INTO tagihan (warga_id, bulan, periode, nominal_kas, nominal_sampah, total_tagihan, status, tanggal_bayar, metode, catatan)
      VALUES (
        $1,
        'Maret 2026',
        '2026-03',
        30000,
        20000,
        50000,
        'lunas',
        '10 Mar 2026 14:00',
        'Transfer BCA',
        'Lunas'
      )
    `, [r.id]);
  }

  // Insert Products for Marketplace
  // Includes status 'Tersedia' and 'Habis' per Note 3
  const productsList = [
    {
      nama: "Katering Tumpeng Mini & Snack Box Bu Ani",
      kategori: "Makanan & Minuman",
      harga: 25000,
      status: "Tersedia",
      penjual: "Siti Aminah (Bu Ani)",
      rumah: "Blok Mawar M-08",
      wa: "081366778899",
      deskripsi: "Menerima pesanan tumpeng mini untuk ulang tahun, syukuran, dan arisan. Enak, higienis, porsi pas.",
      gambar: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"
    },
    {
      nama: "Madu Hutan Murni Blok Mawar (500ml)",
      kategori: "Makanan & Minuman",
      harga: 85000,
      status: "Tersedia",
      penjual: "Hendro Wijaya",
      rumah: "Blok Mawar M-04",
      wa: "081211223344",
      deskripsi: "Madu murni alami tanpa campuran pemanis buatan. Sangat baik untuk imunitas keluarga.",
      gambar: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80"
    },
    {
      nama: "Jasa Servis AC & Cuci AC Rumah Bergaransi",
      kategori: "Jasa",
      harga: 75000,
      status: "Tersedia",
      penjual: "Dedi Kurniawan",
      rumah: "Blok Mawar M-06",
      wa: "081344556677",
      deskripsi: "Cuci AC 1/2 - 2 PK, tambah freon, perbaikan kelistrikan AC. Pengerjaan rapi dan bergaransi 30 hari.",
      gambar: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80"
    },
    {
      nama: "Kripik Singkong Balado & Balado Keju Renyah",
      kategori: "Makanan & Minuman",
      harga: 15000,
      status: "Tersedia",
      penjual: "Maya Anggraeni",
      rumah: "Blok Mawar M-09",
      wa: "081277889900",
      deskripsi: "Camilan renyah homemade tanpa bahan pengawet. Tersedia rasa balado pedas manis dan keju gurih.",
      gambar: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80"
    },
    {
      nama: "Beras Ramos Cianjur Super 5 Kg",
      kategori: "Sembako",
      harga: 72000,
      status: "Habis", // Demo status Habis
      penjual: "Bayu Sudik Pamarto",
      rumah: "Blok Mawar M-02",
      wa: "081298765431",
      deskripsi: "Beras pulen, putih bersih alami tanpa pemutih. Stok saat ini sedang menunggu panen baru.",
      gambar: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80"
    },
    {
      nama: "Telur Ayam Negeri Fresh Per Rak (30 Butir)",
      kategori: "Sembako",
      harga: 55000,
      status: "Tersedia",
      penjual: "Gusti Adi Pratama",
      rumah: "Blok Mawar M-05",
      wa: "081322334455",
      deskripsi: "Telur ayam segar langsung dari peternakan, cangkang tebal dan kualitas terjamin.",
      gambar: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80"
    }
  ];

  for (const p of productsList) {
    await pool.query(`
      INSERT INTO products (nama_produk, kategori, harga, status, penjual_nama, no_rumah, no_whatsapp, deskripsi, gambar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [p.nama, p.kategori, p.harga, p.status, p.penjual, p.rumah, p.wa, p.deskripsi, p.gambar]);
  }

  // Insert Whatsapp Broadcast Logs
  const waLogs = [
    { nama: "Bayu Sudik Pamarto (M-02)", nomor: "081298765431", pesan: "Tagihan Kas RT Bulan April 2026 sebesar Rp 50.000", status: "terkirim", tipe: "Tagihan" },
    { nama: "Gusti Adi Pratama (M-05)", nomor: "081322334455", pesan: "Kwitansi Pembayaran No KW-202604-001 terkirim via WhatsApp", status: "terkirim", tipe: "Kwitansi" },
    { nama: "Semua Warga Blok Mawar", nomor: "Grup WA RT 002", pesan: "Undangan Kerja Bakti Lingkungan Minggu pagi 07:00 WIB", status: "terkirim", tipe: "Pengumuman" }
  ];

  for (const log of waLogs) {
    await pool.query(`
      INSERT INTO whatsapp_logs (tujuan_nama, tujuan_nomor, pesan, status, tipe)
      VALUES ($1, $2, $3, $4, $5)
    `, [log.nama, log.nomor, log.pesan, log.status, log.tipe]);
  }

  console.log("✅ Seed completed successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
