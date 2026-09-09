import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { warga } from "@/db/schema";
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
      .update(warga)
      .set({
        nik: String(body.nik).trim(),
        nama: String(body.nama).trim(),
        noRumah: String(body.noRumah).trim(),
        telepon: String(body.telepon || ""),
        pekerjaan: String(body.pekerjaan || ""),
        status: body.status === "nonaktif" ? "nonaktif" : "aktif",
      })
      .where(eq(warga.id, Number(id)))
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
  await db.delete(warga).where(eq(warga.id, Number(id)));
  return NextResponse.json({ ok: true });
}
