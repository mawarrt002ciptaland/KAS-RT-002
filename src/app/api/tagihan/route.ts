import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tagihan, warga, jenisIuran } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const conds = [];
  if (sp.get("bulan")) conds.push(eq(tagihan.bulan, Number(sp.get("bulan"))));
  if (sp.get("tahun")) conds.push(eq(tagihan.tahun, Number(sp.get("tahun"))));
  if (sp.get("status")) conds.push(eq(tagihan.status, String(sp.get("status"))));
  if (user.role !== "admin" && user.wargaId) {
    conds.push(eq(tagihan.wargaId, user.wargaId));
  }

  const query = db
    .select({
      id: tagihan.id,
      wargaId: tagihan.wargaId,
      namaWarga: warga.nama,
      noRumah: warga.noRumah,
      telepon: warga.telepon,
      jenisIuranId: tagihan.jenisIuranId,
      namaIuran: jenisIuran.nama,
      bulan: tagihan.bulan,
      tahun: tagihan.tahun,
      nominal: tagihan.nominal,
      status: tagihan.status,
      tanggalBayar: tagihan.tanggalBayar,
      metode: tagihan.metode,
    })
    .from(tagihan)
    .innerJoin(warga, eq(tagihan.wargaId, warga.id))
    .innerJoin(jenisIuran, eq(tagihan.jenisIuranId, jenisIuran.id));

  const rows =
    conds.length > 0
      ? await query.where(and(...conds)).orderBy(desc(tagihan.tahun), desc(tagihan.bulan), desc(tagihan.id))
      : await query.orderBy(desc(tagihan.tahun), desc(tagihan.bulan), desc(tagihan.id));

  return NextResponse.json({ data: rows });
}

// POST -> generate tagihan massal untuk semua warga aktif
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  try {
    const { jenisIuranId, bulan, tahun } = await req.json();
    if (!jenisIuranId || !bulan || !tahun) {
      return NextResponse.json(
        { error: "Jenis iuran, bulan, dan tahun wajib diisi" },
        { status: 400 }
      );
    }
    const iuranRows = await db
      .select()
      .from(jenisIuran)
      .where(eq(jenisIuran.id, Number(jenisIuranId)))
      .limit(1);
    if (iuranRows.length === 0)
      return NextResponse.json({ error: "Jenis iuran tidak ditemukan" }, { status: 404 });
    const iuran = iuranRows[0];

    const wargaAktif = await db
      .select()
      .from(warga)
      .where(eq(warga.status, "aktif"));

    const existing = await db
      .select({ wargaId: tagihan.wargaId })
      .from(tagihan)
      .where(
        and(
          eq(tagihan.jenisIuranId, iuran.id),
          eq(tagihan.bulan, Number(bulan)),
          eq(tagihan.tahun, Number(tahun))
        )
      );
    const existingSet = new Set(existing.map((e) => e.wargaId));

    const toInsert = wargaAktif
      .filter((w) => !existingSet.has(w.id))
      .map((w) => ({
        wargaId: w.id,
        jenisIuranId: iuran.id,
        bulan: Number(bulan),
        tahun: Number(tahun),
        nominal: iuran.nominal,
        status: "belum",
      }));

    if (toInsert.length > 0) {
      await db.insert(tagihan).values(toInsert);
    }
    return NextResponse.json({
      ok: true,
      created: toInsert.length,
      skipped: existingSet.size,
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
