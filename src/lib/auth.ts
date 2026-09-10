import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db, hasDatabase } from "@/db";
import { authLimits, authSessions, authUsers, residents } from "@/db/schema";
import type { SessionUser } from "./auth-types";

export const SESSION_COOKIE = "kasrt_session_v2";
export const SIGNUP_COOKIE = "kasrt_signup_v2";
export class AuthError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const validToken = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);
export function secureEquals(a: string, b: string) { return timingSafeEqual(Buffer.from(tokenHash(a), "hex"), Buffer.from(tokenHash(b), "hex")); }
export const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });

function publicOrigin(request: NextRequest) {
  if (process.env.APP_ORIGIN) return new URL(process.env.APP_ORIGIN).origin;
  // Next.js/Cloudflare may use an internal URL behind their trusted reverse proxy.
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host).split(",")[0].trim();
  const protocol = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  return new URL(`${protocol}://${host}`).origin;
}
export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = publicOrigin(request);
  if ((origin && origin !== allowed) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new AuthError(403, "ORIGIN_DENIED", "Permintaan tidak diizinkan. Buka halaman dari alamat website yang sama.");
  }
}
export async function readJson(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new AuthError(415, "INVALID_FORMAT", "Format permintaan tidak didukung.");
  const raw = await request.text();
  if (raw.length > 10000) throw new AuthError(413, "TOO_LARGE", "Data terlalu besar.");
  try {
    const body: unknown = JSON.parse(raw);
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new AuthError(400, "INVALID_JSON", "Data formulir tidak valid."); }
}
export function cookieOptions(request: NextRequest, maxAge: number) {
  return { httpOnly: true, secure: publicOrigin(request).startsWith("https://"), sameSite: "lax" as const, path: "/", maxAge };
}
export async function setSession(request: NextRequest, response: NextResponse, userId: number, remember = false) {
  const previous = request.cookies.get(SESSION_COOKIE)?.value;
  if (previous && validToken(previous)) await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash(previous)));
  const token = newToken();
  const seconds = remember ? 7 * 86400 : 12 * 3600;
  await db.insert(authSessions).values({ tokenHash: tokenHash(token), userId, expiresAt: new Date(Date.now() + seconds * 1000) });
  response.cookies.set(SESSION_COOKIE, token, cookieOptions(request, seconds));
}
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !validToken(token) || !hasDatabase()) return null;
  const [row] = await db.select({
    id: authUsers.id, username: authUsers.username, name: authUsers.name, role: authUsers.role,
    residentId: authUsers.residentId, residentStatus: residents.status,
  }).from(authSessions)
    .innerJoin(authUsers, eq(authUsers.id, authSessions.userId))
    .leftJoin(residents, eq(residents.id, authUsers.residentId))
    .where(and(eq(authSessions.tokenHash, tokenHash(token)), gt(authSessions.expiresAt, new Date()), eq(authUsers.active, true)))
    .limit(1);
  if (!row || !["admin", "warga"].includes(row.role) || (row.role === "warga" && row.residentStatus !== "aktif")) return null;
  return { id: row.id, username: row.username, name: row.name, role: row.role, residentId: row.residentId };
}
export async function requireUser(adminOnly = false) {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401, "UNAUTHORIZED", "Sesi berakhir. Silakan login kembali.");
  if (adminOnly && user.role !== "admin") throw new AuthError(403, "FORBIDDEN", "Fitur ini hanya dapat diakses admin RT.");
  return user;
}
export async function hasAdmin() {
  const [admin] = await db.select({ id: authUsers.id }).from(authUsers).where(eq(authUsers.role, "admin")).limit(1);
  return Boolean(admin);
}
export async function limitAttempts(request: NextRequest, action: string, subject = "", max = 12) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const windowMs = 15 * 60 * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const key = tokenHash(`${action}:${ip}:${subject}:${bucket}`);
  const [result] = await db.insert(authLimits).values({ key, attempts: 1, expiresAt: new Date((bucket + 1) * windowMs) })
    .onConflictDoUpdate({ target: authLimits.key, set: { attempts: sql`${authLimits.attempts} + 1` } }).returning({ attempts: authLimits.attempts });
  if (result.attempts > max) throw new AuthError(429, "RATE_LIMITED", "Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.");
  // Bound the persistent counters without depending on a single worker instance.
  await db.delete(authLimits).where(lt(authLimits.expiresAt, new Date(Date.now() - windowMs)));
}
export function apiError(error: unknown) {
  if (error instanceof AuthError) return json({ ok: false, code: error.code, error: error.message }, error.status);
  // Never return raw SQL, the connection URL, NIK, or passwords to the client/log.
  console.error("[kasrt] Authentication/database operation unavailable.");
  return json({ ok: false, code: "DATABASE_UNAVAILABLE", error: "Layanan akun belum tersedia. Pengurus perlu memeriksa koneksi database dan migrasi. Silakan coba lagi nanti." }, 503);
}
