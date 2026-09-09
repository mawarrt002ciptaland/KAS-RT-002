import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, warga } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signSession } from "@/lib/auth";
import { ensureDb } from "@/lib/bootstrap";

// GET /api/auth/register?nik=xxx  -> verifikasi NIK
export async function GET(req: NextRequest) {
  try {
    await ensureDb();
  } catch {
    return NextResponse.json(
      { error: "Database tidak terjangkau. Periksa DATABASE_URL di hosting." },
      { status: 503 }
    );
  }
  const nik = req.nextUrl.searchParams.get("nik")?.trim();
  if (!nik) {
    return NextResponse.json({ error: "NIK wajib diisi" }, { status: 400 });
  }
  const rows = await db.select().from(warga).where(eq(warga.nik, nik)).limit(1);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "NIK tidak terdaftar di data warga. Hubungi Admin RT." },
      { status: 404 }
    );
  }
  const w = rows[0];
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.wargaId, w.id))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "NIK ini sudah memiliki akun. Silakan login." },
      { status: 409 }
    );
  }
  return NextResponse.json({
    warga: { id: w.id, nama: w.nama, noRumah: w.noRumah, nik: w.nik },
  });
}

// POST -> buat akun
export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const { nik, username, password } = await req.json();
    if (!nik || !username || !password) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }
    const uname = String(username).toLowerCase().trim();
    const rows = await db
      .select()
      .from(warga)
      .where(eq(warga.nik, String(nik).trim()))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "NIK tidak terdaftar" }, { status: 404 });
    }
    const w = rows[0];
    const hasAccount = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.wargaId, w.id))
      .limit(1);
    if (hasAccount.length > 0) {
      return NextResponse.json(
        { error: "NIK ini sudah memiliki akun" },
        { status: 409 }
      );
    }
    const dupe = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, uname))
      .limit(1);
    if (dupe.length > 0) {
      return NextResponse.json(
        { error: "Username sudah dipakai, pilih yang lain" },
        { status: 409 }
      );
    }
    const inserted = await db
      .insert(users)
      .values({
        username: uname,
        passwordHash: hashPassword(password),
        role: "warga",
        wargaId: w.id,
      })
      .returning();
    const token = signSession(inserted[0].id);
    return NextResponse.json(
      { ok: true, token },
      { headers: { "X-Auth-Token": token, "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
