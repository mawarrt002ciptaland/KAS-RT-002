import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, warga } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getSessionUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      wargaId: users.wargaId,
      nama: warga.nama,
      noRumah: warga.noRumah,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(warga, eq(users.wargaId, warga.id))
    .orderBy(asc(users.id));
  return NextResponse.json({ data: rows });
}

// POST -> admin membuat akun baru (mis. bendahara, ketua RT, atau akun warga)
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  try {
    const body = await req.json();
    const uname = String(body.username || "").toLowerCase().trim();
    const password = String(body.password || "");
    const role = body.role === "admin" ? "admin" : "warga";
    const wargaId = body.wargaId ? Number(body.wargaId) : null;

    if (!uname || uname.length < 3) {
      return NextResponse.json(
        { error: "Username minimal 3 karakter" },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9_.]+$/.test(uname)) {
      return NextResponse.json(
        { error: "Username hanya boleh huruf kecil, angka, titik, dan underscore" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }
    const dupe = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, uname))
      .limit(1);
    if (dupe.length > 0) {
      return NextResponse.json(
        { error: "Username sudah dipakai" },
        { status: 409 }
      );
    }
    if (wargaId) {
      const taken = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.wargaId, wargaId))
        .limit(1);
      if (taken.length > 0) {
        return NextResponse.json(
          { error: "Warga tersebut sudah memiliki akun" },
          { status: 409 }
        );
      }
    }
    const inserted = await db
      .insert(users)
      .values({
        username: uname,
        passwordHash: hashPassword(password),
        role,
        wargaId,
      })
      .returning({ id: users.id });
    return NextResponse.json({ ok: true, id: inserted[0].id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
