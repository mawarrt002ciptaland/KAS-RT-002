import cors from "cors";
import express from "express";
import { neon } from "@neondatabase/serverless";
import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT || 8787);
const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, "../dist");
const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.AUTH_SECRET || randomBytes(48).toString("base64url");
const sql = databaseUrl ? neon(databaseUrl) : null;
const sessionCookieName = "rt002_session";
const sessionLifetime = 60 * 60 * 24 * 7;
const adminRoles = new Set(["admin", "ketua", "bendahara", "pengurus"]);
const authRateLimit = new Map();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "6mb" }));

function requireDatabase(_req, res, next) {
  if (!sql) {
    return res.status(503).json({ error: "Database Neon belum dikonfigurasi pada server." });
  }
  next();
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((item) => item.trim()).filter(Boolean).map((item) => {
    const index = item.indexOf("=");
    return index < 0 ? [item, ""] : [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
  }));
}

function signSession(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + sessionLifetime })).toString("base64url");
  const signature = createHmac("sha256", authSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(token) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", authSecret).update(payload).digest();
  let received;
  try { received = Buffer.from(signature, "base64url"); } catch { return null; }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch {
    return null;
  }
}

function setSessionCookie(res, userId) {
  const production = process.env.NODE_ENV === "production";
  const sameSite = process.env.AUTH_COOKIE_SAMESITE || (production ? "None" : "Lax");
  const secure = production || String(sameSite).toLowerCase() === "none";
  const token = signSession(userId);
  res.cookie(sessionCookieName, token, { httpOnly: true, secure, sameSite, path: "/", maxAge: sessionLifetime * 1000 });
}

function clearSessionCookie(res) {
  const production = process.env.NODE_ENV === "production";
  const sameSite = process.env.AUTH_COOKIE_SAMESITE || (production ? "None" : "Lax");
  res.clearCookie(sessionCookieName, { httpOnly: true, secure: production || String(sameSite).toLowerCase() === "none", sameSite, path: "/" });
}

function safeUser(row) {
  return { id: String(row.id), email: String(row.email), nama: String(row.nama), role: String(row.role), wargaId: row.wargaId ?? null, telepon: row.telepon ?? null, foto: row.foto ?? null };
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (stored.startsWith("scrypt$")) {
    const [, salt, expectedHex] = stored.split("$");
    if (!salt || !expectedHex) return false;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  // Existing demo accounts use the repository seed's SHA-256 hash; upgrade them on successful sign-in.
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const actual = createHash("sha256").update(password).digest();
    const expected = Buffer.from(stored, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  return false;
}

async function requireUser(req, res, next) {
  if (!sql) return res.status(503).json({ error: "Database Neon belum dikonfigurasi pada server." });
  const token = parseCookies(req.headers.cookie)[sessionCookieName];
  const session = readSession(token);
  if (!session?.sub) return res.status(401).json({ error: "Silakan masuk untuk melanjutkan." });
  try {
    const rows = await sql`SELECT "id", "email", "nama", "role", "wargaId", "telepon", "foto", "status" FROM "User" WHERE "id" = ${session.sub} LIMIT 1`;
    const user = rows[0];
    if (!user || String(user.status).toLowerCase() !== "aktif") {
      clearSessionCookie(res);
      return res.status(401).json({ error: "Akun tidak aktif atau tidak ditemukan." });
    }
    req.user = safeUser(user);
    next();
  } catch (error) {
    console.error("Session lookup failed:", error);
    res.status(503).json({ error: "Sesi belum dapat diverifikasi." });
  }
}

function requireStaff(req, res, next) {
  if (!adminRoles.has(req.user?.role)) return res.status(403).json({ error: "Akses khusus pengurus RT." });
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Hanya administrator RT yang dapat mengelola akun pengurus." });
  next();
}

function requireTrustedOrigin(req, res, next) {
  const origin = req.get("Origin");
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: "Origin permintaan tidak diizinkan." });
  next();
}

function rateLimitAuth(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = authRateLimit.get(key);
  if (!current || current.until <= now) {
    authRateLimit.set(key, { count: 1, until: now + 15 * 60 * 1000 });
    return next();
  }
  if (current.count >= 12) return res.status(429).json({ error: "Terlalu banyak percobaan. Tunggu 15 menit, lalu coba lagi." });
  current.count++;
  next();
}

const editableEntities = {
  tagihan: { table: "Tagihan", columns: ["id", "kode", "wargaId", "jenis", "periode", "jumlah", "tanggalJatuhTempo", "status", "tanggalBayar", "metode", "denda", "keterangan"] },
  warga: { table: "Warga", columns: ["id", "nama", "nik", "noKK", "noRumah", "blok", "alamat", "telepon", "email", "jenisKelamin", "pekerjaan", "statusKawin", "agama", "role", "jabatan", "foto", "status", "tanggalBergabung"] },
  kegiatan: { table: "Kegiatan", columns: ["id", "judul", "deskripsi", "kategori", "tanggalMulai", "tanggalSelesai", "lokasi", "status", "fotoUrl", "jumlahPeserta"] },
  pengumuman: { table: "Pengumuman", columns: ["id", "judul", "konten", "kategori", "prioritas", "status", "penulis", "tanggal"] },
  pengaduan: { table: "Pengaduan", columns: ["id", "kode", "judul", "deskripsi", "kategori", "lokasi", "fotoUrl", "status", "pelapor", "wargaId", "tanggapan"] },
  kwitansi: { table: "Kwitansi", columns: ["id", "kode", "transaksiId", "tagihanId", "wargaId", "tanggal", "nominal", "penerima", "pembayar", "keterangan", "ttdUrl"] },
  pengurus: { table: "Pengurus", columns: ["id", "nama", "jabatan", "urutan", "telepon", "email", "foto", "periode", "bidang"] },
  tautan: { table: "Tautan", columns: ["id", "judul", "url", "kategori", "logo", "deskripsi", "urutan"] },
  marketplace: { table: "Marketplace", columns: ["id", "nama", "kategori", "harga", "deskripsi", "fotoUrl", "penjual", "telepon", "alamat", "kondisi", "status"] },
  anggota: { table: "AnggotaKK", columns: ["id", "wargaId", "nama", "nik", "jenisKelamin", "hubungan", "tanggalLahir"] },
};

function requireEntityWrite(req, res, next) {
  const entity = String(req.params.entity ?? "");
  if (adminRoles.has(req.user?.role)) return next();
  if (req.user?.role === "warga" && req.method === "POST" && ["pengaduan", "marketplace"].includes(entity)) return next();
  return res.status(403).json({ error: "Akun ini tidak memiliki akses untuk mengubah data tersebut." });
}

function paramValue(value) {
  if (value === undefined) return null;
  return value;
}

async function writeEntity(entity, body, user, updateOnly = false, id = null) {
  const config = editableEntities[entity];
  if (!config) return null;
  const hasUpdatedAt = !["AnggotaKK", "Kwitansi", "Tautan"].includes(config.table);
  const values = {};
  for (const column of config.columns) {
    if (column === "id" || body[column] !== undefined) values[column] = body[column];
  }
  if (!updateOnly && !values.id) values.id = randomUUID().replaceAll("-", "");
  if (!updateOnly && entity === "pengaduan" && user.role === "warga") {
    values.wargaId = user.wargaId;
    values.pelapor = user.nama;
    values.status = "baru";
    const year = new Date().getFullYear();
    const next = await sql`SELECT COALESCE(MAX(CAST(regexp_replace("kode", '^.*-', '') AS integer)), 0) + 1 AS next FROM "Pengaduan" WHERE "kode" LIKE ${`ADU-${year}-%`}`;
    values.kode = `ADU-${year}-${String(next[0]?.next ?? 1).padStart(6, "0")}`;
  }
  if (!updateOnly && entity === "marketplace" && user.role === "warga") {
    values.penjual = user.nama;
    values.telepon = user.telepon ?? "";
  }
  if (updateOnly) delete values.id;
  const entries = Object.entries(values);
  if (!entries.length && updateOnly) return null;

  if (updateOnly) {
    const setParts = entries.map(([column], index) => `"${column}" = $${index + 1}`);
    const params = entries.map(([, value]) => paramValue(value));
    if (hasUpdatedAt) setParts.push('"updatedAt" = now()');
    params.push(id);
    const rows = await sql.query(`UPDATE "${config.table}" SET ${setParts.join(", ")} WHERE "id" = $${params.length} RETURNING "id"`, params);
    return rows[0] ?? null;
  }

  const columns = entries.map(([column]) => `"${column}"`);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const params = entries.map(([, value]) => paramValue(value));
  const updateParts = entries.filter(([column]) => column !== "id").map(([column]) => `"${column}" = EXCLUDED."${column}"`);
  if (hasUpdatedAt) updateParts.push('"updatedAt" = now()');
  const conflict = updateParts.length ? `DO UPDATE SET ${updateParts.join(", ")}` : "DO NOTHING";
  const createdAt = hasUpdatedAt ? ', "createdAt", "updatedAt"' : ', "createdAt"';
  const createdValues = hasUpdatedAt ? ", now(), now()" : ", now()";
  const rows = await sql.query(`INSERT INTO "${config.table}" (${columns.join(", ")}${createdAt}) VALUES (${placeholders.join(", ")}${createdValues}) ON CONFLICT ("id") ${conflict} RETURNING "id"`, params);
  const savedId = rows[0]?.id ?? values.id;

  if (entity === "warga" && Array.isArray(body.anggotaKK)) {
    for (const member of body.anggotaKK) {
      if (!member?.nama) continue;
      await sql`INSERT INTO "AnggotaKK" ("id", "wargaId", "nama", "nik", "jenisKelamin", "hubungan", "tanggalLahir", "createdAt") VALUES (${member.id || randomUUID().replaceAll("-", "")}, ${savedId}, ${member.nama}, ${member.nik ?? null}, ${member.jenisKelamin ?? "L"}, ${member.hubungan ?? "Anggota"}, ${member.tanggalLahir ?? null}, now()) ON CONFLICT ("id") DO NOTHING`;
    }
  }
  return { id: savedId };
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

app.get("/api/auth/me", requireUser, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.post("/api/auth/login", rateLimitAuth, requireTrustedOrigin, requireDatabase, async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!email || !password) return res.status(400).json({ error: "Email dan password wajib diisi." });
  try {
    const rows = await sql`SELECT "id", "email", "password", "nama", "role", "wargaId", "telepon", "foto", "status" FROM "User" WHERE lower("email") = ${email} LIMIT 1`;
    const account = rows[0];
    if (!account || String(account.status).toLowerCase() !== "aktif" || !verifyPassword(password, account.password)) {
      return res.status(401).json({ error: "Email atau password tidak sesuai." });
    }
    if (/^[a-f0-9]{64}$/i.test(String(account.password))) {
      await sql`UPDATE "User" SET "password" = ${hashPassword(password)}, "lastLogin" = now(), "updatedAt" = now() WHERE "id" = ${account.id}`;
    } else {
      await sql`UPDATE "User" SET "lastLogin" = now(), "updatedAt" = now() WHERE "id" = ${account.id}`;
    }
    setSessionCookie(res, String(account.id));
    res.json({ ok: true, user: safeUser(account) });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(503).json({ error: "Login belum dapat diproses oleh server." });
  }
});

app.post("/api/auth/logout", requireTrustedOrigin, (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post("/api/auth/register/warga", rateLimitAuth, requireTrustedOrigin, requireDatabase, async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const nik = String(req.body?.nik ?? "").replace(/\D/g, "");
  const noKK = String(req.body?.noKK ?? "").replace(/\D/g, "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8 || nik.length !== 16 || noKK.length !== 16) {
    return res.status(400).json({ error: "Email valid, password minimal 8 karakter, NIK dan No. KK masing-masing 16 digit wajib diisi." });
  }
  try {
    const matches = await sql`SELECT "id", "nama", "noRumah", "telepon" FROM "Warga" WHERE "nik" = ${nik} AND "noKK" = ${noKK} AND COALESCE("status", 'aktif') = 'aktif' LIMIT 2`;
    if (matches.length !== 1) return res.status(400).json({ error: "NIK dan No. KK belum cocok dengan data aktif yang didaftarkan pengurus RT. Hubungi Sekretaris RT untuk verifikasi." });
    const warga = matches[0];
    const emailExists = await sql`SELECT "id" FROM "User" WHERE lower("email") = ${email} LIMIT 1`;
    const accountExists = await sql`SELECT "id" FROM "User" WHERE "wargaId" = ${warga.id} LIMIT 1`;
    if (emailExists.length) return res.status(409).json({ error: "Email sudah digunakan. Coba masuk atau gunakan email lain." });
    if (accountExists.length) return res.status(409).json({ error: "Akun untuk warga ini sudah terdaftar. Gunakan fitur masuk atau hubungi pengurus RT." });

    const id = randomUUID().replaceAll("-", "");
    const rows = await sql`
      INSERT INTO "User" ("id", "email", "password", "nama", "role", "wargaId", "telepon", "status", "lastLogin", "createdAt", "updatedAt")
      VALUES (${id}, ${email}, ${hashPassword(password)}, ${String(warga.nama)}, 'warga', ${warga.id}, ${warga.telepon ?? null}, 'aktif', now(), now(), now())
      RETURNING "id", "email", "nama", "role", "wargaId", "telepon", "foto"`;
    setSessionCookie(res, id);
    res.status(201).json({ ok: true, user: safeUser(rows[0]) });
  } catch (error) {
    console.error("Resident registration failed:", error);
    res.status(503).json({ error: "Pendaftaran belum dapat diproses oleh server." });
  }
});

app.get("/api/auth/users", requireUser, requireStaff, async (_req, res) => {
  try {
    const rows = await sql`SELECT "id", "email", "nama", "role", "wargaId", "telepon", "foto", "status", "lastLogin", "createdAt" FROM "User" ORDER BY "createdAt" DESC`;
    res.json({ ok: true, items: rows.map((row) => ({ ...safeUser(row), status: String(row.status ?? "aktif"), lastLogin: iso(row.lastLogin), createdAt: iso(row.createdAt) })) });
  } catch (error) {
    console.error("User list failed:", error);
    res.status(503).json({ error: "Daftar akun belum dapat dimuat." });
  }
});

app.post("/api/auth/users", requireTrustedOrigin, requireUser, requireAdmin, async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const nama = String(req.body?.nama ?? "").trim();
  const password = String(req.body?.password ?? "");
  const role = String(req.body?.role ?? "");
  const roles = new Set(["admin", "ketua", "bendahara", "pengurus"]);
  if (!nama || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8 || !roles.has(role)) {
    return res.status(400).json({ error: "Nama, email valid, role pengurus, dan password minimal 8 karakter wajib diisi. Akun warga mendaftar memakai NIK dan No. KK." });
  }
  try {
    const existing = await sql`SELECT "id" FROM "User" WHERE lower("email") = ${email} LIMIT 1`;
    if (existing.length) return res.status(409).json({ error: "Email sudah digunakan." });
    const id = randomUUID().replaceAll("-", "");
    const rows = await sql`
      INSERT INTO "User" ("id", "email", "password", "nama", "role", "wargaId", "telepon", "status", "createdAt", "updatedAt")
      VALUES (${id}, ${email}, ${hashPassword(password)}, ${nama}, ${role}, ${req.body?.wargaId ?? null}, ${req.body?.telepon ?? null}, 'aktif', now(), now())
      RETURNING "id", "email", "nama", "role", "wargaId", "telepon", "foto", "status", "lastLogin", "createdAt"`;
    const row = rows[0];
    res.status(201).json({ ok: true, item: { ...safeUser(row), status: String(row.status), lastLogin: iso(row.lastLogin), createdAt: iso(row.createdAt) } });
  } catch (error) {
    console.error("User creation failed:", error);
    res.status(503).json({ error: "Akun belum dapat dibuat." });
  }
});

app.patch("/api/auth/users/:id", requireTrustedOrigin, requireUser, requireAdmin, async (req, res) => {
  const id = req.params.id;
  const body = req.body ?? {};
  const allowed = ["nama", "role", "telepon", "status", "wargaId", "foto"];
  const updates = Object.entries(body).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  const validRoles = new Set(["admin", "ketua", "bendahara", "pengurus", "warga"]);
  if (body.role !== undefined && !validRoles.has(String(body.role))) return res.status(400).json({ error: "Peran akun tidak valid." });
  if (body.status !== undefined && !["aktif", "nonaktif"].includes(String(body.status))) return res.status(400).json({ error: "Status akun tidak valid." });
  if (typeof body.password === "string" && body.password.length >= 8) updates.push(["password", hashPassword(body.password)]);
  if (!updates.length) return res.status(400).json({ error: "Tidak ada perubahan akun yang valid." });
  try {
    const columns = new Map([["nama", '"nama"'], ["role", '"role"'], ["telepon", '"telepon"'], ["status", '"status"'], ["wargaId", '"wargaId"'], ["foto", '"foto"'], ["password", '"password"']]);
    const setSql = updates.map(([key], i) => `${columns.get(key)} = $${i + 1}`).join(", ");
    const values = updates.map(([, value]) => value);
    const rows = await sql.query(`UPDATE "User" SET ${setSql}, "updatedAt" = now() WHERE "id" = $${values.length + 1} RETURNING "id", "email", "nama", "role", "wargaId", "telepon", "foto", "status", "lastLogin", "createdAt"`, [...values, id]);
    if (!rows.length) return res.status(404).json({ error: "Akun tidak ditemukan." });
    const row = rows[0];
    res.json({ ok: true, item: { ...safeUser(row), status: String(row.status), lastLogin: iso(row.lastLogin), createdAt: iso(row.createdAt) } });
  } catch (error) {
    console.error("User update failed:", error);
    res.status(503).json({ error: "Akun belum dapat diperbarui." });
  }
});

app.delete("/api/auth/users/:id", requireTrustedOrigin, requireUser, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: "Akun yang sedang digunakan tidak dapat dihapus." });
  try {
    const target = await sql`SELECT "id", "role" FROM "User" WHERE "id" = ${req.params.id} LIMIT 1`;
    if (!target.length) return res.status(404).json({ error: "Akun tidak ditemukan." });
    if (target[0].role === "admin") {
      const admins = await sql`SELECT COUNT(*)::int AS count FROM "User" WHERE "role" = 'admin' AND "status" = 'aktif'`;
      if (Number(admins[0]?.count ?? 0) <= 1) return res.status(400).json({ error: "Admin aktif terakhir tidak dapat dihapus." });
    }
    await sql`DELETE FROM "User" WHERE "id" = ${req.params.id}`;
    res.json({ ok: true });
  } catch (error) {
    console.error("User deletion failed:", error);
    res.status(503).json({ error: "Akun belum dapat dihapus." });
  }
});

app.get("/api/health", requireDatabase, async (_req, res) => {
  try {
    const result = await sql`SELECT current_database() AS database, now() AS server_time`;
    res.json({ ok: true, database: result[0]?.database ?? "Neon", serverTime: iso(result[0]?.server_time) });
  } catch (error) {
    console.error("Neon health check failed:", error);
    res.status(503).json({ error: "Server belum dapat terhubung ke database Neon." });
  }
});

app.get("/api/sync", requireUser, async (req, res) => {
  try {
    const [transactions, bills, residents, members, activities, announcements, complaints, receipts, officials, links, marketplace, users, settings] = await Promise.all([
      sql`SELECT "id", "kode", "jenis", "tanggal", "kategori", "keterangan", "nominal", "penerima", "sumber", "buktiUrl", "metode", "status", "wargaId", "createdAt" FROM "Transaksi" ORDER BY "tanggal" DESC, "createdAt" DESC`,
      sql`SELECT "id", "kode", "wargaId", "jenis", "periode", "jumlah", "tanggalJatuhTempo", "status", "tanggalBayar", "metode", "denda", "keterangan", "createdAt" FROM "Tagihan" ORDER BY "periode" DESC, "createdAt" DESC`,
      sql`SELECT "id", "nama", "nik", "noKK", "noRumah", "blok", "alamat", "telepon", "email", "jenisKelamin", "pekerjaan", "statusKawin", "agama", "role", "jabatan", "foto", "status", "tanggalBergabung", "createdAt" FROM "Warga" ORDER BY "noRumah"`,
      sql`SELECT "id", "wargaId", "nama", "nik", "jenisKelamin", "hubungan", "tanggalLahir" FROM "AnggotaKK" ORDER BY "createdAt"`,
      sql`SELECT "id", "judul", "deskripsi", "kategori", "tanggalMulai", "tanggalSelesai", "lokasi", "status", "fotoUrl", "jumlahPeserta", "createdAt" FROM "Kegiatan" ORDER BY "tanggalMulai" DESC`,
      sql`SELECT "id", "judul", "konten", "kategori", "prioritas", "status", "penulis", "tanggal", "createdAt" FROM "Pengumuman" ORDER BY "tanggal" DESC`,
      sql`SELECT "id", "kode", "judul", "deskripsi", "kategori", "lokasi", "fotoUrl", "status", "pelapor", "wargaId", "tanggapan", "createdAt", "updatedAt" FROM "Pengaduan" ORDER BY "createdAt" DESC`,
      sql`SELECT "id", "kode", "transaksiId", "tagihanId", "wargaId", "tanggal", "nominal", "penerima", "pembayar", "keterangan", "ttdUrl", "createdAt" FROM "Kwitansi" ORDER BY "tanggal" DESC`,
      sql`SELECT "id", "nama", "jabatan", "urutan", "telepon", "email", "foto", "periode", "bidang" FROM "Pengurus" ORDER BY "urutan"`,
      sql`SELECT "id", "judul", "url", "kategori", "logo", "deskripsi", "urutan" FROM "Tautan" ORDER BY "urutan"`,
      sql`SELECT "id", "nama", "kategori", "harga", "deskripsi", "fotoUrl", "penjual", "telepon", "alamat", "kondisi", "status", "createdAt" FROM "Marketplace" ORDER BY "createdAt" DESC`,
      sql`SELECT "id", "email", "nama", "role", "wargaId", "telepon", "foto", "status", "lastLogin", "createdAt" FROM "User" ORDER BY "createdAt"`,
      sql`SELECT "key", "value" FROM "Pengaturan"`,
    ]);

    const isStaff = adminRoles.has(req.user.role);
    const residentId = req.user.wargaId ? String(req.user.wargaId) : "";
    const visibleResidents = isStaff ? residents : residents.filter((row) => String(row.id) === residentId);
    const visibleMemberIds = new Set(visibleResidents.map((row) => String(row.id)));
    const visibleTransactions = isStaff ? transactions : transactions.filter((row) => String(row.wargaId ?? "") === residentId);
    const visibleBills = isStaff ? bills : bills.filter((row) => String(row.wargaId ?? "") === residentId);
    const visibleComplaints = isStaff ? complaints : complaints.filter((row) => String(row.wargaId ?? "") === residentId);
    const visibleReceipts = isStaff ? receipts : receipts.filter((row) => String(row.wargaId ?? "") === residentId);
    const visibleUsers = isStaff ? users : users.filter((row) => String(row.id) === req.user.id);
    const publicSettings = settings.filter((row) => !/(password|secret|token|api_key)/i.test(String(row.key)));

    res.json({
      ok: true,
      source: "neon",
      synchronizedAt: new Date().toISOString(),
      items: {
        transaksi: visibleTransactions.map(mapTransaksi),
        tagihan: visibleBills.map(mapTagihan),
        warga: visibleResidents.map((resident) => mapWarga(resident, members.filter((member) => visibleMemberIds.has(String(member.wargaId))))),
        kegiatan: activities.map((row) => ({
          id: String(row.id), judul: String(row.judul ?? ""), deskripsi: String(row.deskripsi ?? ""), kategori: String(row.kategori ?? "Sosial"),
          tanggalMulai: iso(row.tanggalMulai), tanggalSelesai: iso(row.tanggalSelesai), lokasi: row.lokasi ?? undefined,
          status: String(row.status ?? "akan_datang"), fotoUrl: row.fotoUrl ?? undefined, jumlahPeserta: safeNumber(row.jumlahPeserta), createdAt: iso(row.createdAt),
        })),
        pengumuman: announcements.map((row) => ({
          id: String(row.id), judul: String(row.judul ?? ""), konten: String(row.konten ?? ""), kategori: String(row.kategori ?? "Umum"),
          prioritas: String(row.prioritas ?? "normal"), status: String(row.status ?? "aktif"), penulis: row.penulis ?? undefined,
          tanggal: iso(row.tanggal), createdAt: iso(row.createdAt),
        })),
        pengaduan: visibleComplaints.map((row) => ({
          id: String(row.id), kode: String(row.kode ?? ""), judul: String(row.judul ?? ""), deskripsi: String(row.deskripsi ?? ""),
          kategori: String(row.kategori ?? "Lainnya"), lokasi: row.lokasi ?? undefined, fotoUrl: row.fotoUrl ?? undefined,
          status: String(row.status ?? "baru"), pelapor: String(row.pelapor ?? "Warga"), wargaId: row.wargaId ?? undefined,
          tanggapan: row.tanggapan ?? undefined, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt),
        })),
        kwitansi: visibleReceipts.map((row) => ({
          id: String(row.id), kode: String(row.kode ?? ""), transaksiId: row.transaksiId ?? undefined, tagihanId: row.tagihanId ?? undefined,
          wargaId: row.wargaId ?? undefined, tanggal: iso(row.tanggal), nominal: safeNumber(row.nominal), penerima: row.penerima ?? undefined,
          pembayar: row.pembayar ?? undefined, keterangan: row.keterangan ?? undefined, createdAt: iso(row.createdAt),
        })),
        pengurus: officials.map((row) => ({
          id: String(row.id), nama: String(row.nama ?? ""), jabatan: String(row.jabatan ?? ""), urutan: safeNumber(row.urutan),
          telepon: row.telepon ?? undefined, email: row.email ?? undefined, foto: row.foto ?? undefined, periode: String(row.periode ?? ""), bidang: row.bidang ?? undefined,
        })),
        tautan: links.map((row) => ({
          id: String(row.id), judul: String(row.judul ?? ""), url: String(row.url ?? ""), kategori: String(row.kategori ?? "Umum"),
          logo: row.logo ?? undefined, deskripsi: row.deskripsi ?? undefined, urutan: safeNumber(row.urutan),
        })),
        marketplace: marketplace.map((row) => ({
          id: String(row.id), nama: String(row.nama ?? ""), kategori: String(row.kategori ?? "Lainnya"), harga: safeNumber(row.harga),
          deskripsi: String(row.deskripsi ?? ""), fotoUrl: row.fotoUrl ?? undefined, penjual: String(row.penjual ?? ""), telepon: String(row.telepon ?? ""),
          alamat: row.alamat ?? undefined, kondisi: String(row.kondisi ?? "baru"), status: String(row.status ?? "tersedia"), createdAt: iso(row.createdAt),
        })),
        users: visibleUsers.map((row) => ({
          id: String(row.id), email: String(row.email ?? ""), nama: String(row.nama ?? ""), role: String(row.role ?? "warga"),
          telepon: row.telepon ?? undefined, foto: row.foto ?? undefined, status: String(row.status ?? "aktif"), lastLogin: iso(row.lastLogin), createdAt: iso(row.createdAt),
        })),
        pengaturan: Object.fromEntries(publicSettings.map((row) => [String(row.key), String(row.value ?? "")])),
      },
      counts: { transaksi: visibleTransactions.length, tagihan: visibleBills.length, warga: visibleResidents.length, kegiatan: activities.length, pengumuman: announcements.length, pengaduan: visibleComplaints.length },
    });
  } catch (error) {
    console.error("Neon sync failed:", error);
    res.status(503).json({ error: "Data belum dapat disinkronkan dari Neon. Periksa tabel Transaksi, Tagihan, Warga, dan AnggotaKK." });
  }
});

app.post("/api/data/:entity", requireTrustedOrigin, requireUser, requireEntityWrite, async (req, res) => {
  const entity = String(req.params.entity);
  if (!editableEntities[entity]) return res.status(404).json({ error: "Jenis data tidak tersedia." });
  try {
    const item = await writeEntity(entity, req.body ?? {}, req.user);
    res.status(201).json({ ok: true, item });
  } catch (error) {
    console.error(`Create ${entity} failed:`, error);
    res.status(503).json({ error: "Data belum dapat disimpan ke database Neon." });
  }
});

app.patch("/api/data/:entity/:id", requireTrustedOrigin, requireUser, requireEntityWrite, async (req, res) => {
  const entity = String(req.params.entity);
  if (!editableEntities[entity]) return res.status(404).json({ error: "Jenis data tidak tersedia." });
  try {
    const item = await writeEntity(entity, req.body ?? {}, req.user, true, req.params.id);
    if (!item) return res.status(404).json({ error: "Data tidak ditemukan di Neon." });
    res.json({ ok: true, item });
  } catch (error) {
    console.error(`Update ${entity} failed:`, error);
    res.status(503).json({ error: "Data belum dapat diperbarui di Neon." });
  }
});

app.delete("/api/data/:entity/:id", requireTrustedOrigin, requireUser, requireEntityWrite, async (req, res) => {
  const entity = String(req.params.entity);
  const config = editableEntities[entity];
  if (!config) return res.status(404).json({ error: "Jenis data tidak tersedia." });
  try {
    const id = req.params.id;
    if (entity === "tagihan") await sql`DELETE FROM "Kwitansi" WHERE "tagihanId" = ${id}`;
    if (entity === "warga") {
      await sql`UPDATE "Transaksi" SET "wargaId" = NULL WHERE "wargaId" = ${id}`;
      await sql`UPDATE "Pengaduan" SET "wargaId" = NULL WHERE "wargaId" = ${id}`;
      await sql`UPDATE "Kwitansi" SET "wargaId" = NULL WHERE "wargaId" = ${id}`;
    }
    if (entity === "anggota") {
      const rows = await sql`DELETE FROM "AnggotaKK" WHERE "id" = ${id} RETURNING "id"`;
      if (!rows.length) return res.status(404).json({ error: "Anggota keluarga tidak ditemukan." });
      return res.json({ ok: true });
    }
    const rows = await sql.query(`DELETE FROM "${config.table}" WHERE "id" = $1 RETURNING "id"`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Data tidak ditemukan di Neon." });
    res.json({ ok: true });
  } catch (error) {
    console.error(`Delete ${entity} failed:`, error);
    res.status(503).json({ error: "Data belum dapat dihapus dari Neon." });
  }
});

app.patch("/api/pengaturan", requireTrustedOrigin, requireUser, requireStaff, async (req, res) => {
  try {
    const values = Object.entries(req.body ?? {}).filter(([key, value]) => /^[a-z0-9_]+$/i.test(key) && typeof value === "string");
    for (const [key, value] of values) {
      await sql`INSERT INTO "Pengaturan" ("id", "key", "value", "kategori", "createdAt", "updatedAt") VALUES (${randomUUID().replaceAll("-", "")}, ${key}, ${value}, 'umum', now(), now()) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = now()`;
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Settings update failed:", error);
    res.status(503).json({ error: "Pengaturan belum dapat disimpan ke Neon." });
  }
});

app.post("/api/transaksi", requireTrustedOrigin, requireUser, requireStaff, async (req, res) => {
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

app.delete("/api/transaksi/:id", requireTrustedOrigin, requireUser, requireStaff, async (req, res) => {
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
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") console.warn("AUTH_SECRET belum diatur; sesi akan terputus setelah server restart. Tetapkan secret stabil untuk production.");
});