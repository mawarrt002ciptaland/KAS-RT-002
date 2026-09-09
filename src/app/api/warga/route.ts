import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { warga, users } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select({
      id: warga.id,
      nik: warga.nik,
      nama: warga.nama,
      noRumah: warga.noRumah,
      telepon: warga.telepon,
      pekerjaan: warga.pekerjaan,
      status: warga.status,
      username: users.username,
    })
    .from(warga)
    .leftJoin(users, eq(users.wargaId, warga.id))
    .orderBy(asc(warga.noRumah));
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.nik || !body.nama || !body.noRumah) {
      return NextResponse.json(
        { error: "NIK, nama, dan nomor rumah wajib diisi" },
        { status: 400 }
      );
    }
    const dupe = await db
      .select({ id: warga.id })
      .from(warga)
      .where(eq(warga.nik, String(body.nik).trim()))
      .limit(1);
    if (dupe.length > 0) {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 409 });
    }
    const inserted = await db
      .insert(warga)
      .values({
        nik: String(body.nik).trim(),
        nama: String(body.nama).trim(),
        noRumah: String(body.noRumah).trim(),
        telepon: String(body.telepon || ""),
        pekerjaan: String(body.pekerjaan || ""),
        status: body.status === "nonaktif" ? "nonaktif" : "aktif",
      })
      .returning();
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
