import "server-only";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";

// Both adapters expose these Drizzle query methods. Interactive transactions are
// deliberately not exposed: Neon HTTP handles one atomic SQL statement per call.
type Database = Pick<NodePgDatabase, "select" | "insert" | "update" | "delete" | "execute">;
const globalDb = globalThis as typeof globalThis & { kasrtDb?: { url: string; client: Database; pool?: Pool } };
export function hasDatabase() { return Boolean(process.env.DATABASE_URL?.trim()); }

function client(): Database {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw Object.assign(new Error("Database belum dikonfigurasi."), { code: "DATABASE_NOT_CONFIGURED" });
  if (globalDb.kasrtDb?.url === url) return globalDb.kasrtDb.client;
  const parsed = new URL(url);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) throw Object.assign(new Error("Konfigurasi database tidak valid."), { code: "DATABASE_URL_INVALID" });
  if (parsed.hostname.endsWith(".neon.tech")) {
    neonConfig.fetchFunction = (input: Parameters<typeof fetch>[0], options?: RequestInit) => fetch(input, { ...options, signal: AbortSignal.timeout(12000) });
    const database = drizzleNeon(neon(url)) as unknown as Database;
    globalDb.kasrtDb = { url, client: database };
    return database;
  }
  const pool = new Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 8000, idleTimeoutMillis: 10000, statement_timeout: 12000 });
  pool.on("error", () => console.error("[database] idle connection unavailable"));
  const database = drizzlePg(pool);
  globalDb.kasrtDb = { url, client: database, pool };
  return database;
}

// Importing db never creates a pool or queries PostgreSQL during next build.
export const db = new Proxy({} as Database, {
  get(_target, property) {
    if (property === "then") return undefined;
    const instance = client();
    const value = Reflect.get(instance, property);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
