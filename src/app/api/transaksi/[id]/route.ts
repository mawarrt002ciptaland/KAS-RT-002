import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transaksi } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const { id } = await params;
  await db.delete(transaksi).where(eq(transaksi.id, Number(id)));
  return NextResponse.json({ ok: true });
}
