import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signSession, verifyPassword } from "@/lib/auth";
import { ensureDb } from "@/lib/bootstrap";

export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, String(username).toLowerCase().trim()))
      .limit(1);
    if (rows.length === 0 || !verifyPassword(password, rows[0].passwordHash)) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }
    const user = rows[0];
    const token = signSession(user.id);
    // Tidak memakai Set-Cookie: proxy preview dapat merusak respons ber-cookie,
    // dan cookie diblokir di iframe. Token dikirim via body + header.
    return NextResponse.json(
      {
        ok: true,
        token,
        user: { id: user.id, username: user.username, role: user.role },
      },
      { headers: { "X-Auth-Token": token, "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
