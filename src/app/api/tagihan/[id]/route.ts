import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tagihan, transaksi, warga, jenisIuran } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { NAMA_BULAN, todayISO } from "@/lib/format";

// PATCH -> tandai lunas / batal lunas
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const aksi = body.aksi === "batal" ? "batal" : "bayar";

    const rows = await db
      .select({
        t: tagihan,
        namaWarga: warga.nama,
        namaIuran: jenisIuran.nama,
      })
      .from(tagihan)
      .innerJoin(warga, eq(tagihan.wargaId, warga.id))
      .innerJoin(jenisIuran, eq(tagihan.jenisIuranId, jenisIuran.id))
      .where(eq(tagihan.id, Number(id)))
      .limit(1);
    if (rows.length === 0)
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    const { t, namaWarga, namaIuran } = rows[0];

    if (aksi === "bayar") {
      if (t.status === "lunas")
        return NextResponse.json({ error: "Tagihan sudah lunas" }, { status: 400 });
      const tgl = body.tanggal || todayISO();
      await db
        .update(tagihan)
        .set({
          status: "lunas",
          tanggalBayar: tgl,
          metode: String(body.metode || "Tunai"),
        })
        .where(eq(tagihan.id, t.id));
      await db.insert(transaksi).values({
        jenis: "masuk",
        kategori: namaIuran,
        keterangan: `${namaIuran} ${NAMA_BULAN[t.bulan - 1]} ${t.tahun} - ${namaWarga}`,
        nominal: t.nominal,
        tanggal: tgl,
        tagihanId: t.id,
      });
    } else {
      await db
        .update(tagihan)
        .set({ status: "belum", tanggalBayar: null, metode: "" })
        .where(eq(tagihan.id, t.id));
      await db.delete(transaksi).where(eq(transaksi.tagihanId, t.id));
    }
    return NextResponse.json({ ok: true });
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
  await db.delete(transaksi).where(eq(transaksi.tagihanId, Number(id)));
  await db.delete(tagihan).where(eq(tagihan.id, Number(id)));
  return NextResponse.json({ ok: true });
}
