import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// Koneksi dibuat LAZY (saat query pertama), bukan saat import.
// Penting agar `next build` tidak gagal ketika DATABASE_URL belum diset.
function sanitizeDatabaseUrl(raw: string): string {
  let url = raw.trim();
  // Hapus prefix "psql " dan tanda kutip yang tidak sengaja ikut ter-copy
  url = url.replace(/^psql\s+/i, "");
  url = url.replace(/^['"]|['"]$/g, "").trim();
  // node-postgres TIDAK mendukung channel binding — parameter ini membuat
  // autentikasi ke Neon gagal. Hapus otomatis.
  url = url.replace(/[?&]channel_binding=[^&]*/gi, (m) =>
    m.startsWith("?") ? "?" : ""
  );
  // Rapikan query string jika jadi "?&" atau berakhir "?"/"&"
  url = url.replace(/\?&/, "?").replace(/[?&]$/, "");
  return url;
}

function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
      throw new Error(
        "DATABASE_URL is required. Set it in your environment variables."
      );
    }
    const databaseUrl = sanitizeDatabaseUrl(rawUrl);
    // Database cloud (Neon, Supabase, Railway, Render, dll.) membutuhkan SSL.
    // Deteksi otomatis dari connection string.
    const needsSsl =
      /sslmode=require|neon\.tech|supabase\.co|render\.com|railway\.app|aivencloud\.com|amazonaws\.com|azure\.com|digitalocean\.com/i.test(
        databaseUrl
      );
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: databaseUrl,
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      connectionTimeoutMillis: 10000,
    });
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

// Proxy meneruskan semua akses ke pool asli yang dibuat on-demand.
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool();
    const value = real[prop as keyof Pool];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value;
  },
});

// drizzle() juga lazy — drizzle membaca properti pool saat inisialisasi.
let _db: NodePgDatabase | undefined;

function getDb(): NodePgDatabase {
  if (!_db) {
    _db = drizzle(getPool());
  }
  return _db;
}

export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    const real = getDb();
    const value = real[prop as keyof NodePgDatabase];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value;
  },
});
