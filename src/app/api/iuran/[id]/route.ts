import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jenisIuran } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await db
      .update(jenisIuran)
      .set({
        nama: String(body.nama).trim(),
        nominal: Number(body.nominal),
        periode: body.periode === "insidental" ? "insidental" : "bulanan",
        keterangan: String(body.keterangan || ""),
        aktif: body.aktif !== false,
      })
      .where(eq(jenisIuran.id, Number(id)))
      .returning();
    if (updated.length === 0)
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: updated[0] });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const { id } = await params;
  await db.delete(jenisIuran).where(eq(jenisIuran.id, Number(id)));
  return NextResponse.json({ ok: true });
}
