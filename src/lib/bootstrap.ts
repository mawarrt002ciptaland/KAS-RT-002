import { pool } from "@/db";
import { createHash, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(8).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS warga (
      id SERIAL PRIMARY KEY,
      nik TEXT NOT NULL UNIQUE,
      nama TEXT NOT NULL,
      no_rumah TEXT NOT NULL,
      telepon TEXT DEFAULT '',
      pekerjaan TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'aktif',
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'warga',
      warga_id INTEGER REFERENCES warga(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS jenis_iuran (
      id SERIAL PRIMARY KEY,
      nama TEXT NOT NULL,
      nominal BIGINT NOT NULL,
      periode TEXT NOT NULL DEFAULT 'bulanan',
      keterangan TEXT DEFAULT '',
      aktif BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS tagihan (
      id SERIAL PRIMARY KEY,
      warga_id INTEGER NOT NULL REFERENCES warga(id) ON DELETE CASCADE,
      jenis_iuran_id INTEGER NOT NULL REFERENCES jenis_iuran(id) ON DELETE CASCADE,
      bulan INTEGER NOT NULL,
      tahun INTEGER NOT NULL,
      nominal BIGINT NOT NULL,
      status TEXT NOT NULL DEFAULT 'belum',
      tanggal_bayar DATE,
      metode TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS transaksi (
      id SERIAL PRIMARY KEY,
      jenis TEXT NOT NULL,
      kategori TEXT NOT NULL DEFAULT 'Umum',
      keterangan TEXT NOT NULL,
      nominal BIGINT NOT NULL,
      tanggal DATE NOT NULL,
      tagihan_id INTEGER REFERENCES tagihan(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS produk (
      id SERIAL PRIMARY KEY,
      nama TEXT NOT NULL,
      harga BIGINT NOT NULL,
      kategori TEXT NOT NULL DEFAULT 'Jual',
      status TEXT NOT NULL DEFAULT 'tersedia',
      penjual TEXT NOT NULL,
      telepon TEXT DEFAULT '',
      keterangan TEXT DEFAULT '',
      warna TEXT NOT NULL DEFAULT 'indigo',
      warga_id INTEGER REFERENCES warga(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `);
}

async function seedData() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM users");
  if (rows[0].n > 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const wargaData: [string, string, string, string, string][] = [
      ["3201010101010001", "Budi Santoso", "M-01", "081234567801", "Karyawan Swasta"],
      ["3201010101010002", "Siti Aminah", "M-02", "081234567802", "Wiraswasta"],
      ["3201010101010003", "Ahmad Fauzi", "M-03", "081234567803", "PNS"],
      ["3201010101010004", "Dewi Lestari", "M-04", "081234567804", "Guru"],
      ["3201010101010005", "Joko Priyono", "M-05", "081234567805", "Karyawan Swasta"],
      ["3201010101010006", "Rina Marlina", "M-06", "081234567806", "Ibu Rumah Tangga"],
      ["3201010101010007", "Hendra Wijaya", "M-07", "081234567807", "Pedagang"],
      ["3201010101010008", "Fitri Handayani", "M-08", "081234567808", "Perawat"],
      ["3201010101010009", "Agus Salim", "M-09", "081234567809", "Sopir"],
      ["3201010101010010", "Maya Puspita", "M-10", "081234567810", "Dosen"],
    ];
    const wargaIds: number[] = [];
    for (const [nik, nama, rumah, telp, kerja] of wargaData) {
      const r = await client.query(
        `INSERT INTO warga (nik, nama, no_rumah, telepon, pekerjaan, status)
         VALUES ($1,$2,$3,$4,$5,'aktif')
         ON CONFLICT (nik) DO UPDATE SET nama = EXCLUDED.nama
         RETURNING id`,
        [nik, nama, rumah, telp, kerja]
      );
      wargaIds.push(r.rows[0].id);
    }

    await client.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1,$2,'admin')
       ON CONFLICT (username) DO NOTHING`,
      ["admin", hashPassword("admin123")]
    );
    await client.query(
      `INSERT INTO users (username, password_hash, role, warga_id) VALUES ($1,$2,'warga',$3)
       ON CONFLICT (username) DO NOTHING`,
      ["budi", hashPassword("warga123"), wargaIds[0]]
    );

    const iuranData: [string, number, string, string][] = [
      ["Iuran Kas Bulanan", 50000, "bulanan", "Iuran rutin kas RT setiap bulan"],
      ["Iuran Keamanan", 30000, "bulanan", "Honor petugas keamanan lingkungan"],
      ["Iuran Kebersihan", 20000, "bulanan", "Pengangkutan sampah & kebersihan"],
    ];
    const iuranIds: number[] = [];
    for (const [nama, nominal, periode, ket] of iuranData) {
      const r = await client.query(
        `INSERT INTO jenis_iuran (nama, nominal, periode, keterangan, aktif)
         VALUES ($1,$2,$3,$4,true) RETURNING id`,
        [nama, nominal, periode, ket]
      );
      iuranIds.push(r.rows[0].id);
    }

    const now = new Date();
    for (let back = 2; back >= 0; back--) {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const bulan = d.getMonth() + 1;
      const tahun = d.getFullYear();
      for (let i = 0; i < wargaIds.length; i++) {
        const lunas = back === 0 ? i < 4 : i < 8;
        const tglBayar = `${tahun}-${pad(bulan)}-${pad(5 + (i % 20))}`;
        const t = await client.query(
          `INSERT INTO tagihan (warga_id, jenis_iuran_id, bulan, tahun, nominal, status, tanggal_bayar, metode)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [
            wargaIds[i],
            iuranIds[0],
            bulan,
            tahun,
            50000,
            lunas ? "lunas" : "belum",
            lunas ? tglBayar : null,
            lunas ? (i % 2 === 0 ? "Tunai" : "Transfer Bank") : "",
          ]
        );
        if (lunas) {
          await client.query(
            `INSERT INTO transaksi (jenis, kategori, keterangan, nominal, tanggal, tagihan_id)
             VALUES ('masuk','Iuran Kas Bulanan',$1,50000,$2,$3)`,
            [
              `Iuran Kas Bulanan ${NAMA_BULAN[bulan - 1]} ${tahun} - ${wargaData[i][1]}`,
              tglBayar,
              t.rows[0].id,
            ]
          );
        }
      }
    }

    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pm = pad(prev.getMonth() + 1);
    const py = prev.getFullYear();
    const extra: [string, string, string, number, string][] = [
      ["masuk", "Donasi", "Donasi pembangunan pos ronda - Hamba Allah", 500000, `${py}-${pm}-10`],
      ["masuk", "Sumbangan Acara", "Sumbangan acara 17 Agustus", 750000, `${py}-${pm}-15`],
      ["keluar", "Keamanan", "Honor petugas keamanan bulanan", 400000, `${py}-${pm}-28`],
      ["keluar", "Kebersihan", "Retribusi pengangkutan sampah", 250000, `${py}-${pm}-27`],
      ["keluar", "Perbaikan Fasilitas", "Perbaikan lampu jalan blok mawar", 175000, `${y}-${m}-03`],
      ["keluar", "Sosial", "Santunan warga sakit", 300000, `${y}-${m}-05`],
    ];
    for (const [jenis, kategori, ket, nominal, tgl] of extra) {
      await client.query(
        `INSERT INTO transaksi (jenis, kategori, keterangan, nominal, tanggal)
         VALUES ($1,$2,$3,$4,$5)`,
        [jenis, kategori, ket, nominal, tgl]
      );
    }

    const settingsData: [string, string][] = [
      ["namaRt", "Blok Mawar RT 002 RW 014"],
      ["namaPerumahan", "Perumahan Ciptaland"],
      ["namaKetua", "Bpk. H. Sutrisno"],
      ["namaBendahara", "Ibu Ratna Sari"],
      ["teleponBendahara", "081298765432"],
      ["rekening", "BCA 8830012345 a.n. Kas RT 002 Blok Mawar"],
      [
        "pesanWa",
        "Assalamu'alaikum Bapak/Ibu {nama}, kami informasikan tagihan {iuran} periode {periode} sebesar {nominal} belum dibayarkan. Mohon segera melakukan pembayaran ke Bendahara RT. Terima kasih 🙏 - Pengurus RT 002 Blok Mawar",
      ],
    ];
    for (const [key, value] of settingsData) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }

    // Contoh produk marketplace
    const produkData: [string, number, string, string, string, string, string][] = [
      ["Nasi Uduk Bu Rina", 10000, "Jual", "Rina Marlina", "081234567806", "Nasi uduk komplit, pesan H-1", "amber"],
      ["Jasa Pembuatan Website", 500000, "Jasa", "Hendra Wijaya", "081234567807", "Website UMKM & company profile", "indigo"],
    ];
    for (const [nama, harga, kategori, penjual, telp, ket, warna] of produkData) {
      await client.query(
        `INSERT INTO produk (nama, harga, kategori, penjual, telepon, keterangan, warna)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [nama, harga, kategori, penjual, telp, ket, warna]
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

const globalForBootstrap = globalThis as typeof globalThis & {
  __kasRtBootstrap?: Promise<void>;
};

export function ensureDb(): Promise<void> {
  if (!globalForBootstrap.__kasRtBootstrap) {
    globalForBootstrap.__kasRtBootstrap = (async () => {
      await createTables();
      await seedData();
    })().catch((e) => {
      // reset so next request retries
      globalForBootstrap.__kasRtBootstrap = undefined;
      throw e;
    });
  }
  return globalForBootstrap.__kasRtBootstrap;
}
