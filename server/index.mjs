import cors from "cors";
import express from "express";
import { neon } from "@neondatabase/serverless";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT || 8787);
const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, "../dist");
const databaseUrl = process.env.DATABASE_URL;
const adminApiKey = process.env.ADMIN_API_KEY;
const sql = databaseUrl ? neon(databaseUrl) : null;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "6mb" }));

function requireDatabase(_req, res, next) {
  if (!sql) {
    return res.status(503).json({ error: "Database Neon belum dikonfigurasi pada server." });
  }
  next();
}

function requireAdminApiKey(req, res, next) {
  if (!adminApiKey) {
    return res.status(503).json({ error: "ADMIN_API_KEY belum dikonfigurasi pada server." });
  }
  const received = Buffer.from(String(req.get("X-RT-Admin-Key") || ""));
  const expected = Buffer.from(adminApiKey);
  const valid = received.length === expected.length && timingSafeEqual(received, expected);
  if (!valid) return res.status(401).json({ error: "Kunci akses database tidak valid. Atur kunci admin pada Pengaturan → Database (Neon)." });
  next();
}

function iso(value) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00.000Z`;
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized) ? normalized : `${normalized}Z`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

function safeNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function mapTransaksi(row) {
  return {
    id: String(row.id),
    kode: String(row.kode ?? ""),
    jenis: String(row.jenis ?? "pengeluaran").toLowerCase() === "pemasukan" ? "pemasukan" : "pengeluaran",
    tanggal: iso(row.tanggal),
    kategori: String(row.kategori ?? "Lain-lain"),
    keterangan: String(row.keterangan ?? "-"),
    nominal: safeNumber(row.nominal),
    penerima: row.penerima ?? undefined,
    sumber: row.sumber ?? undefined,
    buktiUrl: row.buktiUrl ?? undefined,
    metode: String(row.metode ?? "Tunai"),
    status: ["pending", "menunggu"].includes(String(row.status ?? "").toLowerCase()) ? "pending" : "selesai",
    wargaId: row.wargaId ?? undefined,
    createdAt: iso(row.createdAt) ?? iso(row.tanggal),
  };
}

function mapTagihan(row) {
  const status = String(row.status ?? "belum_bayar").toLowerCase();
  return {
    id: String(row.id),
    kode: String(row.kode ?? ""),
    wargaId: String(row.wargaId ?? ""),
    jenis: String(row.jenis ?? "lainnya"),
    periode: String(row.periode ?? ""),
    jumlah: safeNumber(row.jumlah),
    tanggalJatuhTempo: iso(row.tanggalJatuhTempo),
    status: status === "lunas" ? "lunas" : status === "telat" ? "telat" : "belum_bayar",
    tanggalBayar: iso(row.tanggalBayar),
    metode: row.metode ?? undefined,
    denda: safeNumber(row.denda),
    keterangan: row.keterangan ?? undefined,
    createdAt: iso(row.createdAt),
  };
}

function mapWarga(row, anggota) {
  return {
    id: String(row.id),
    nama: String(row.nama ?? "Warga"),
    nik: row.nik ?? undefined,
    noKK: row.noKK ?? undefined,
    noRumah: String(row.noRumah ?? "-"),
    blok: String(row.blok ?? "Mawar"),
    alamat: row.alamat ?? undefined,
    telepon: row.telepon ?? undefined,
    email: row.email ?? undefined,
    jenisKelamin: row.jenisKelamin === "P" ? "P" : "L",
    pekerjaan: row.pekerjaan ?? undefined,
    statusKawin: String(row.statusKawin ?? "-"),
    agama: String(row.agama ?? "-"),
    role: row.role === "pengurus" || row.role === "admin" ? row.role : "warga",
    jabatan: row.jabatan ?? undefined,
    foto: row.foto ?? undefined,
    status: ["pindah", "meninggal"].includes(String(row.status ?? "").toLowerCase()) ? row.status : "aktif",
    tanggalBergabung: iso(row.tanggalBergabung) ?? iso(row.createdAt),
    createdAt: iso(row.createdAt),
    anggotaKK: anggota
      .filter((member) => String(member.wargaId) === String(row.id))
      .map((member) => ({
        id: String(member.id),
        nama: String(member.nama ?? "Anggota"),
        nik: member.nik ?? undefined,
        jenisKelamin: member.jenisKelamin === "P" ? "P" : "L",
        hubungan: String(member.hubungan ?? "Anggota"),
        tanggalLahir: iso(member.tanggalLahir),
      })),
  };
}

app.get("/api/health", requireDatabase, async (_req, res) => {
  try {
    const result = await sql`SELECT current_database() AS database, now() AS server_time`;
    res.json({ ok: true, database: result[0]?.database ?? "Neon", serverTime: iso(result[0]?.server_time) });
  } catch (error) {
    console.error("Neon health check failed:", error);
    res.status(503).json({ error: "Server belum dapat terhubung ke database Neon." });
  }
});

app.get("/api/sync", requireDatabase, requireAdminApiKey, async (_req, res) => {
  try {
    const [transactions, bills, residents, members] = await Promise.all([
      sql`SELECT "id", "kode", "jenis", "tanggal", "kategori", "keterangan", "nominal", "penerima", "sumber", "buktiUrl", "metode", "status", "wargaId", "createdAt" FROM "Transaksi" ORDER BY "tanggal" DESC, "createdAt" DESC`,
      sql`SELECT "id", "kode", "wargaId", "jenis", "periode", "jumlah", "tanggalJatuhTempo", "status", "tanggalBayar", "metode", "denda", "keterangan", "createdAt" FROM "Tagihan" ORDER BY "periode" DESC, "createdAt" DESC`,
      sql`SELECT "id", "nama", "nik", "noKK", "noRumah", "blok", "alamat", "telepon", "email", "jenisKelamin", "pekerjaan", "statusKawin", "agama", "role", "jabatan", "foto", "status", "tanggalBergabung", "createdAt" FROM "Warga" ORDER BY "noRumah"`,
      sql`SELECT "id", "wargaId", "nama", "nik", "jenisKelamin", "hubungan", "tanggalLahir" FROM "AnggotaKK" ORDER BY "createdAt"`,
    ]);

    res.json({
      ok: true,
      source: "neon",
      synchronizedAt: new Date().toISOString(),
      items: {
        transaksi: transactions.map(mapTransaksi),
        tagihan: bills.map(mapTagihan),
        warga: residents.map((resident) => mapWarga(resident, members)),
      },
      counts: { transaksi: transactions.length, tagihan: bills.length, warga: residents.length },
    });
  } catch (error) {
    console.error("Neon sync failed:", error);
    res.status(503).json({ error: "Data belum dapat disinkronkan dari Neon. Periksa tabel Transaksi, Tagihan, Warga, dan AnggotaKK." });
  }
});

app.post("/api/transaksi", requireDatabase, requireAdminApiKey, async (req, res) => {
  const body = req.body ?? {};
  if (!body.kode || !["pemasukan", "pengeluaran"].includes(body.jenis) || !body.tanggal || !body.kategori || !body.keterangan || !Number.isFinite(Number(body.nominal)) || Number(body.nominal) <= 0) {
    return res.status(400).json({ error: "Data transaksi belum lengkap atau nominal tidak valid." });
  }
  try {
    const id = String(body.id || randomUUID().replaceAll("-", "").slice(0, 24));
    const result = await sql`
      INSERT INTO "Transaksi" ("id", "kode", "jenis", "tanggal", "kategori", "keterangan", "nominal", "penerima", "sumber", "buktiUrl", "metode", "status", "wargaId", "createdAt", "updatedAt")
      VALUES (${id}, ${body.kode}, ${body.jenis}, ${body.tanggal}, ${body.kategori}, ${body.keterangan}, ${Number(body.nominal)}, ${body.penerima ?? null}, ${body.sumber ?? null}, ${body.buktiUrl ?? null}, ${body.metode ?? "Tunai"}, ${body.status === "pending" ? "pending" : "selesai"}, ${body.wargaId ?? null}, now(), now())
      ON CONFLICT ("kode") DO UPDATE SET
        "jenis" = EXCLUDED."jenis", "tanggal" = EXCLUDED."tanggal", "kategori" = EXCLUDED."kategori",
        "keterangan" = EXCLUDED."keterangan", "nominal" = EXCLUDED."nominal", "penerima" = EXCLUDED."penerima",
        "sumber" = EXCLUDED."sumber", "buktiUrl" = EXCLUDED."buktiUrl", "metode" = EXCLUDED."metode",
        "status" = EXCLUDED."status", "wargaId" = EXCLUDED."wargaId", "updatedAt" = now()
      RETURNING "id", "kode", "jenis", "tanggal", "kategori", "keterangan", "nominal", "penerima", "sumber", "buktiUrl", "metode", "status", "wargaId", "createdAt"`;
    res.status(201).json({ ok: true, item: mapTransaksi(result[0]) });
  } catch (error) {
    console.error("Neon transaction insert failed:", error);
    res.status(503).json({ error: "Transaksi belum berhasil disimpan ke Neon." });
  }
});

app.delete("/api/transaksi/:id", requireDatabase, requireAdminApiKey, async (req, res) => {
  try {
    await sql`DELETE FROM "Kwitansi" WHERE "transaksiId" = ${req.params.id}`;
    const result = await sql`DELETE FROM "Transaksi" WHERE "id" = ${req.params.id} RETURNING "id"`;
    if (!result.length) return res.status(404).json({ error: "Transaksi tidak ditemukan di Neon." });
    res.json({ ok: true });
  } catch (error) {
    console.error("Neon transaction delete failed:", error);
    res.status(503).json({ error: "Transaksi belum berhasil dihapus dari Neon." });
  }
});

app.use(express.static(distDir, { index: false, maxAge: "1h" }));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"), (error) => error && next(error));
});

app.use((error, _req, res, _next) => {
  console.error("API error:", error);
  res.status(500).json({ error: "Terjadi gangguan saat memproses permintaan." });
});

app.listen(port, () => {
  console.log(`Sistem Informasi RT 002 berjalan di port ${port}`);
  if (!databaseUrl) console.warn("DATABASE_URL belum diatur; endpoint Neon akan memberi status 503.");
  if (!adminApiKey) console.warn("ADMIN_API_KEY belum diatur; sinkronisasi dan perubahan transaksi akan ditolak.");
});