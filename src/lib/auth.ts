import { createHash, createHmac, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { users, warga } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/bootstrap";

const SECRET = process.env.AUTH_SECRET || "kas-rt-blok-mawar-secret-2026";
export const SESSION_COOKIE = "kasrt_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(8).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = createHash("sha256").update(salt + password).digest("hex");
  return check === hash;
}

export function signSession(userId: number): string {
  const payload = String(userId);
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function parseSession(token: string | undefined): number | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  const id = parseInt(payload, 10);
  return Number.isFinite(id) ? id : null;
}

export type SessionUser = {
  id: number;
  username: string;
  role: string;
  wargaId: number | null;
  nama: string;
  noRumah: string;
};

async function resolveUserId(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  // Credential token: "cred.<base64(username:password)>"
  // Diverifikasi terhadap DB setiap request — tidak butuh pertukaran token dari server.
  if (token.startsWith("cred.")) {
    try {
      const decoded = Buffer.from(token.slice(5), "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      if (idx <= 0) return null;
      const uname = decoded.slice(0, idx).toLowerCase().trim();
      const pass = decoded.slice(idx + 1);
      const rows = await db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.username, uname))
        .limit(1);
      if (rows.length === 0) return null;
      if (!verifyPassword(pass, rows[0].passwordHash)) return null;
      return rows[0].id;
    } catch {
      return null;
    }
  }
  // HMAC token: "<id>.<signature>"
  return parseSession(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  await ensureDb();
  // Token dicari dari beberapa jalur (proxy bisa menghapus sebagian header):
  let token: string | undefined;
  try {
    const hdrs = await headers();
    // 1) Header custom (paling jarang disaring)
    token = hdrs.get("x-auth-token") ?? undefined;
    // 2) Header internal dari middleware (berasal dari query param ?_auth=)
    if (!token) token = hdrs.get("x-middleware-auth") ?? undefined;
    // 3) Authorization: Bearer
    if (!token) {
      const auth = hdrs.get("authorization");
      if (auth?.toLowerCase().startsWith("bearer ")) {
        token = auth.slice(7).trim();
      }
    }
  } catch {
    // headers() tidak tersedia di konteks tertentu
  }
  // 4) Fallback: cookie
  if (!token) {
    const store = await cookies();
    token = store.get(SESSION_COOKIE)?.value;
  }
  const userId = await resolveUserId(token);
  if (!userId) return null;
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      wargaId: users.wargaId,
      nama: warga.nama,
      noRumah: warga.noRumah,
    })
    .from(users)
    .leftJoin(warga, eq(users.wargaId, warga.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (rows.length === 0) return null;
  const u = rows[0];
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    wargaId: u.wargaId,
    nama: u.nama ?? u.username,
    noRumah: u.noRumah ?? "-",
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
