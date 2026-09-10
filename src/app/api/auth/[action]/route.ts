import { NextRequest } from "next/server";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db, hasDatabase } from "@/db";
import { authSessions, authUsers, residents, signupChecks } from "@/db/schema";
import { apiError, AuthError, cookieOptions, getSessionUser, hasAdmin, json, limitAttempts, newToken, readJson, requireSameOrigin, secureEquals, SESSION_COOKIE, setSession, SIGNUP_COOKIE, tokenHash, validToken } from "@/lib/auth";
import { hashPassword, validPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ action: string }> };
const field = (body: Record<string, unknown>, name: string) => typeof body[name] === "string" ? body[name] as string : "";
const usernameOf = (body: Record<string, unknown>) => field(body, "username").trim().toLowerCase();
function validateAccount(body: Record<string, unknown>) {
  const username = usernameOf(body);
  const password = field(body, "password");
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) throw new AuthError(400, "INVALID_USERNAME", "Username harus 3–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung.");
  if (!validPassword(password)) throw new AuthError(400, "WEAK_PASSWORD", "Password harus 10–128 karakter dan mengandung huruf serta angka.");
  if (password !== field(body, "confirmPassword")) throw new AuthError(400, "PASSWORD_MISMATCH", "Konfirmasi password tidak sama.");
  return { username, password };
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    if (action === "status") {
      if (!hasDatabase()) return json({ ok: false, ready: false, hasAdmin: false, setupEnabled: false, error: "Database belum dikonfigurasi oleh pengurus." }, 503);
      const configured = await hasAdmin();
      return json({ ok: true, ready: true, hasAdmin: configured, setupEnabled: !configured && Boolean(process.env.ADMIN_SETUP_KEY) });
    }
    if (action === "me") {
      const user = await getSessionUser();
      return user ? json({ ok: true, user }) : json({ ok: false, error: "Belum login." }, 401);
    }
    return json({ ok: false, error: "Endpoint tidak ditemukan." }, 404);
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    requireSameOrigin(request);
    const { action } = await context.params;
    if (action === "logout") {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (token && validToken(token)) await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash(token)));
      const response = json({ ok: true, redirect: "/login" });
      response.cookies.set(SESSION_COOKIE, "", cookieOptions(request, 0));
      response.cookies.set(SIGNUP_COOKIE, "", cookieOptions(request, 0));
      return response;
    }
    const body = await readJson(request);
    await limitAttempts(request, "auth-ip", "", 50);
    if (action === "login") {
      const username = usernameOf(body);
      const password = field(body, "password");
      if (!username || !password || username.length > 32 || password.length > 128) throw new AuthError(400, "INVALID_CREDENTIALS", "Isi username dan password dengan benar.");
      await limitAttempts(request, "login", username, 10);
      const [user] = await db.select().from(authUsers).where(eq(authUsers.username, username)).limit(1);
      const matches = await verifyPassword(password, user?.passwordHash ?? "");
      if (!matches || !user?.active) throw new AuthError(401, "INVALID_CREDENTIALS", "Username atau password salah.");
      if (user.role === "warga") {
        const [resident] = await db.select({ status: residents.status }).from(residents).where(eq(residents.id, user.residentId ?? -1)).limit(1);
        if (resident?.status !== "aktif") throw new AuthError(403, "ACCOUNT_INACTIVE", "Akun belum aktif. Hubungi pengurus RT.");
      }
      const response = json({ ok: true, redirect: "/dashboard", user: { id: user.id, username: user.username, name: user.name, role: user.role, residentId: user.residentId } });
      await setSession(request, response, user.id, body.remember === true);
      return response;
    }
    if (action === "verify-nik") {
      await limitAttempts(request, "verify-nik", "", 10);
      const nik = field(body, "nik").trim();
      if (!/^\d{16}$/.test(nik)) throw new AuthError(400, "INVALID_NIK", "NIK harus tepat 16 digit angka.");
      const [resident] = await db.select({ id: residents.id, name: residents.name, address: residents.address }).from(residents)
        .leftJoin(authUsers, eq(authUsers.residentId, residents.id))
        .where(and(eq(residents.nik, nik), eq(residents.status, "aktif"), isNull(authUsers.id))).limit(1);
      if (!resident) throw new AuthError(400, "NIK_UNAVAILABLE", "NIK tidak tersedia untuk pendaftaran. Pastikan NIK sudah terdaftar, aktif, dan belum memiliki akun. Hubungi pengurus RT bila perlu.");
      await db.delete(signupChecks).where(lt(signupChecks.expiresAt, new Date()));
      const token = newToken();
      await db.insert(signupChecks).values({ tokenHash: tokenHash(token), residentId: resident.id, expiresAt: new Date(Date.now() + 10 * 60000) });
      const response = json({ ok: true, resident: { name: resident.name.split(" ").map(part => part.slice(0, 2) + "•••").join(" "), address: resident.address.replace(/\d/g, "•"), maskedNik: "•••• •••• •••• " + nik.slice(-4) } });
      response.cookies.set(SIGNUP_COOKIE, token, cookieOptions(request, 600));
      return response;
    }
    if (action === "register") {
      await limitAttempts(request, "register", "", 10);
      const { username, password } = validateAccount(body);
      const token = request.cookies.get(SIGNUP_COOKIE)?.value;
      if (!token || !validToken(token)) throw new AuthError(400, "VERIFY_FIRST", "Verifikasi NIK terlebih dahulu.");
      const [verified] = await db.select({ residentId: residents.id, name: residents.name }).from(signupChecks)
        .innerJoin(residents, eq(residents.id, signupChecks.residentId))
        .where(and(eq(signupChecks.tokenHash, tokenHash(token)), gt(signupChecks.expiresAt, new Date()), eq(residents.status, "aktif"))).limit(1);
      if (!verified) throw new AuthError(400, "VERIFICATION_EXPIRED", "Verifikasi sudah kedaluwarsa. Silakan periksa NIK kembali.");
      const passwordHash = await hashPassword(password);
      const [created] = await db.insert(authUsers).values({ username, passwordHash, name: verified.name, role: "warga", residentId: verified.residentId })
        .onConflictDoNothing().returning({ id: authUsers.id });
      if (!created) throw new AuthError(409, "ACCOUNT_EXISTS", "Username sudah digunakan atau NIK sudah mempunyai akun. Pilih username lain atau login.");
      await db.delete(signupChecks).where(eq(signupChecks.residentId, verified.residentId));
      const response = json({ ok: true, redirect: "/dashboard", message: "Akun warga berhasil dibuat." }, 201);
      response.cookies.set(SIGNUP_COOKIE, "", cookieOptions(request, 0));
      await setSession(request, response, created.id);
      return response;
    }
    if (action === "setup") {
      await limitAttempts(request, "admin-setup", "", 5);
      const key = process.env.ADMIN_SETUP_KEY;
      if (!key || key.length < 32 || !secureEquals(field(body, "setupKey"), key)) throw new AuthError(403, "INVALID_SETUP_KEY", "Kunci penyiapan admin tidak valid atau belum dikonfigurasi.");
      if (await hasAdmin()) throw new AuthError(409, "ALREADY_CONFIGURED", "Admin sudah tersedia. Gunakan halaman login.");
      const { username, password } = validateAccount(body);
      const name = field(body, "name").trim();
      if (name.length < 3 || name.length > 80) throw new AuthError(400, "INVALID_NAME", "Nama pengurus harus 3–80 karakter.");
      const [admin] = await db.insert(authUsers).values({ username, passwordHash: await hashPassword(password), name, role: "admin", bootstrap: true })
        .onConflictDoNothing().returning({ id: authUsers.id });
      if (!admin) throw new AuthError(409, "ALREADY_CONFIGURED", "Username atau admin awal sudah terdaftar.");
      const response = json({ ok: true, redirect: "/dashboard" }, 201);
      await setSession(request, response, admin.id);
      return response;
    }
    return json({ ok: false, error: "Endpoint tidak ditemukan." }, 404);
  } catch (error) { return apiError(error); }
}
