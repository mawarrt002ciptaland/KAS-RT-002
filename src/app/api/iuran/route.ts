import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jenisIuran } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(jenisIuran).orderBy(asc(jenisIuran.id));
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.nama || !body.nominal) {
      return NextResponse.json(
        { error: "Nama dan nominal wajib diisi" },
        { status: 400 }
      );
    }
    const inserted = await db
      .insert(jenisIuran)
      .values({
        nama: String(body.nama).trim(),
        nominal: Number(body.nominal),
        periode: body.periode === "insidental" ? "insidental" : "bulanan",
        keterangan: String(body.keterangan || ""),
        aktif: body.aktif !== false,
      })
      .returning();
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
