import pg from "pg";
import { createHash, randomBytes } from "crypto";

const { Pool } = pg;
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});

function hashPassword(password) {
  const salt = randomBytes(8).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

const pad = (n) => String(n).padStart(2, "0");

async function main() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT COUNT(*)::int AS n FROM users");
    if (rows[0].n > 0) {
      console.log("Seed dilewati: data sudah ada.");
      return;
    }

    await client.query("BEGIN");

    // ===== Warga =====
    const wargaData = [
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
    const wargaIds = [];
    for (const [nik, nama, rumah, telp, kerja] of wargaData) {
      const r = await client.query(
        `INSERT INTO warga (nik, nama, no_rumah, telepon, pekerjaan, status)
         VALUES ($1,$2,$3,$4,$5,'aktif') RETURNING id`,
        [nik, nama, rumah, telp, kerja]
      );
      wargaIds.push(r.rows[0].id);
    }

    // ===== Users =====
    await client.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1,$2,'admin')`,
      ["admin", hashPassword("admin123")]
    );
    await client.query(
      `INSERT INTO users (username, password_hash, role, warga_id) VALUES ($1,$2,'warga',$3)`,
      ["budi", hashPassword("warga123"), wargaIds[0]]
    );

    // ===== Jenis Iuran =====
    const iuranData = [
      ["Iuran Kas Bulanan", 50000, "bulanan", "Iuran rutin kas RT setiap bulan"],
      ["Iuran Keamanan", 30000, "bulanan", "Honor petugas keamanan lingkungan"],
      ["Iuran Kebersihan", 20000, "bulanan", "Pengangkutan sampah & kebersihan"],
    ];
    const iuranIds = [];
    for (const [nama, nominal, periode, ket] of iuranData) {
      const r = await client.query(
        `INSERT INTO jenis_iuran (nama, nominal, periode, keterangan, aktif)
         VALUES ($1,$2,$3,$4,true) RETURNING id`,
        [nama, nominal, periode, ket]
      );
      iuranIds.push(r.rows[0].id);
    }

    // ===== Tagihan 3 bulan terakhir (Iuran Kas Bulanan) =====
    const now = new Date();
    for (let back = 2; back >= 0; back--) {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const bulan = d.getMonth() + 1;
      const tahun = d.getFullYear();
      for (let i = 0; i < wargaIds.length; i++) {
        // bulan lama: sebagian besar lunas; bulan ini: sebagian belum
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
          const namaBulan = [
            "Januari","Februari","Maret","April","Mei","Juni",
            "Juli","Agustus","September","Oktober","November","Desember",
          ][bulan - 1];
          await client.query(
            `INSERT INTO transaksi (jenis, kategori, keterangan, nominal, tanggal, tagihan_id)
             VALUES ('masuk','Iuran Kas Bulanan',$1,50000,$2,$3)`,
            [
              `Iuran Kas Bulanan ${namaBulan} ${tahun} - ${wargaData[i][1]}`,
              tglBayar,
              t.rows[0].id,
            ]
          );
        }
      }
    }

    // ===== Transaksi tambahan =====
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pm = pad(prev.getMonth() + 1);
    const py = prev.getFullYear();
    const extra = [
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

    // ===== Settings =====
    const settings = [
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
    for (const [key, value] of settings) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }

    await client.query("COMMIT");
    console.log("Seed berhasil! Login: admin/admin123 atau budi/warga123");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
