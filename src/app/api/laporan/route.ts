import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transaksi } from "@/db/schema";
import { asc, sql, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const tahun = Number(sp.get("tahun")) || new Date().getFullYear();
  const bulan = Number(sp.get("bulan")) || 0; // 0 = semua bulan

  const conds = [sql`extract(year from ${transaksi.tanggal}) = ${tahun}`];
  if (bulan >= 1 && bulan <= 12) {
    conds.push(sql`extract(month from ${transaksi.tanggal}) = ${bulan}`);
  }

  const rows = await db
    .select()
    .from(transaksi)
    .where(and(...conds))
    .orderBy(asc(transaksi.tanggal), asc(transaksi.id));

  // saldo awal = semua transaksi sebelum periode
  const startDate =
    bulan >= 1
      ? `${tahun}-${String(bulan).padStart(2, "0")}-01`
      : `${tahun}-01-01`;
  const [prev] = await db
    .select({
      masuk: sql<number>`coalesce(sum(case when ${transaksi.jenis} = 'masuk' then ${transaksi.nominal} else 0 end), 0)`,
      keluar: sql<number>`coalesce(sum(case when ${transaksi.jenis} = 'keluar' then ${transaksi.nominal} else 0 end), 0)`,
    })
    .from(transaksi)
    .where(sql`${transaksi.tanggal} < ${startDate}`);

  const totalMasuk = rows
    .filter((r) => r.jenis === "masuk")
    .reduce((a, b) => a + Number(b.nominal), 0);
  const totalKeluar = rows
    .filter((r) => r.jenis === "keluar")
    .reduce((a, b) => a + Number(b.nominal), 0);
  const saldoAwal = Number(prev.masuk) - Number(prev.keluar);

  return NextResponse.json({
    data: rows,
    saldoAwal,
    totalMasuk,
    totalKeluar,
    saldoAkhir: saldoAwal + totalMasuk - totalKeluar,
  });
}
