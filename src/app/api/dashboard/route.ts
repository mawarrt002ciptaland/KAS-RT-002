import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transaksi, warga, tagihan, jenisIuran } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = Number(req.nextUrl.searchParams.get("tahun")) || new Date().getFullYear();
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const [sums] = await db
    .select({
      masuk: sql<number>`coalesce(sum(case when ${transaksi.jenis} = 'masuk' then ${transaksi.nominal} else 0 end), 0)`,
      keluar: sql<number>`coalesce(sum(case when ${transaksi.jenis} = 'keluar' then ${transaksi.nominal} else 0 end), 0)`,
      masukBulanIni: sql<number>`coalesce(sum(case when ${transaksi.jenis} = 'masuk' and extract(month from ${transaksi.tanggal}) = ${curMonth} and extract(year from ${transaksi.tanggal}) = ${curYear} then ${transaksi.nominal} else 0 end), 0)`,
    })
    .from(transaksi);

  const [wargaCount] = await db
    .select({ n: sql<number>`count(*)` })
    .from(warga)
    .where(eq(warga.status, "aktif"));

  const [pendingCount] = await db
    .select({ n: sql<number>`count(*)` })
    .from(tagihan)
    .where(eq(tagihan.status, "belum"));

  const monthly = await db
    .select({
      bulan: sql<number>`extract(month from ${transaksi.tanggal})::int`,
      masuk: sql<number>`coalesce(sum(case when ${transaksi.jenis} = 'masuk' then ${transaksi.nominal} else 0 end), 0)`,
      keluar: sql<number>`coalesce(sum(case when ${transaksi.jenis} = 'keluar' then ${transaksi.nominal} else 0 end), 0)`,
    })
    .from(transaksi)
    .where(sql`extract(year from ${transaksi.tanggal}) = ${year}`)
    .groupBy(sql`extract(month from ${transaksi.tanggal})`);

  const chart = Array.from({ length: 12 }, (_, i) => {
    const m = monthly.find((r) => Number(r.bulan) === i + 1);
    return {
      bulan: i + 1,
      masuk: Number(m?.masuk || 0),
      keluar: Number(m?.keluar || 0),
    };
  });

  const recent = await db
    .select({
      id: tagihan.id,
      nama: warga.nama,
      noRumah: warga.noRumah,
      iuran: jenisIuran.nama,
      bulan: tagihan.bulan,
      tahun: tagihan.tahun,
      nominal: tagihan.nominal,
      status: tagihan.status,
    })
    .from(tagihan)
    .innerJoin(warga, eq(tagihan.wargaId, warga.id))
    .innerJoin(jenisIuran, eq(tagihan.jenisIuranId, jenisIuran.id))
    .orderBy(desc(tagihan.id))
    .limit(6);

  const pengeluaranKategori = await db
    .select({
      kategori: transaksi.kategori,
      total: sql<number>`sum(${transaksi.nominal})`,
    })
    .from(transaksi)
    .where(eq(transaksi.jenis, "keluar"))
    .groupBy(transaksi.kategori);

  return NextResponse.json({
    saldo: Number(sums.masuk) - Number(sums.keluar),
    totalMasuk: Number(sums.masuk),
    totalKeluar: Number(sums.keluar),
    masukBulanIni: Number(sums.masukBulanIni),
    jumlahWarga: Number(wargaCount.n),
    tagihanPending: Number(pendingCount.n),
    chart,
    recent,
    pengeluaranKategori: pengeluaranKategori.map((p) => ({
      kategori: p.kategori,
      total: Number(p.total),
    })),
  });
}
