import { NextResponse } from "next/server";
import { db } from "@/db";
import { tagihan, warga, transaksi } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get("bulan") || "April 2026";
    const status = searchParams.get("status");

    // Fetch tagihan joined with warga
    const rows = await db
      .select({
        id: tagihan.id,
        wargaId: tagihan.wargaId,
        bulan: tagihan.bulan,
        periode: tagihan.periode,
        nominalKas: tagihan.nominalKas,
        nominalSampah: tagihan.nominalSampah,
        totalTagihan: tagihan.totalTagihan,
        status: tagihan.status,
        tanggalBayar: tagihan.tanggalBayar,
        metode: tagihan.metode,
        buktiTransfer: tagihan.buktiTransfer,
        catatan: tagihan.catatan,
        createdAt: tagihan.createdAt,
        wargaNama: warga.nama,
        wargaNoRumah: warga.noRumah,
        wargaNoHp: warga.noHp,
        wargaNik: warga.nik,
      })
      .from(tagihan)
      .leftJoin(warga, eq(tagihan.wargaId, warga.id))
      .where(bulan !== "Semua" ? eq(tagihan.bulan, bulan) : undefined)
      .orderBy(warga.noRumah);

    // Calculate statistics for the selected month/period
    let totalTarget = 0;
    let totalTerkumpul = 0;
    let totalTertunda = 0;
    let countLunas = 0;
    let countBelumLunas = 0;

    for (const r of rows) {
      totalTarget += r.totalTagihan;
      if (r.status === "lunas") {
        totalTerkumpul += r.totalTagihan;
        countLunas++;
      } else {
        totalTertunda += r.totalTagihan;
        countBelumLunas++;
      }
    }

    const persentase = totalTarget > 0 ? Math.round((totalTerkumpul / totalTarget) * 100) : 0;

    return NextResponse.json({
      tagihan: status ? rows.filter((r) => r.status === status) : rows,
      stats: {
        totalTarget,
        totalTerkumpul,
        totalTertunda,
        countLunas,
        countBelumLunas,
        totalWarga: rows.length,
        persentase,
      },
    });
  } catch (err: any) {
    console.error("Get tagihan error:", err);
    return NextResponse.json({ error: "Gagal mengambil data tagihan" }, { status: 500 });
  }
}

// Mark bill as paid or update payment
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, metode = "Transfer BCA", buktiTransfer = "", catatan = "" } = body;

    if (!id) {
      return NextResponse.json({ error: "ID tagihan diperlukan" }, { status: 400 });
    }

    const billRes = await db.select().from(tagihan).where(eq(tagihan.id, id)).limit(1);
    if (billRes.length === 0) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    const bill = billRes[0];
    const isPaying = status === "lunas";
    const nowStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // If changing to lunas, optionally record in transaksi
    let transaksiId = bill.transaksiId;
    if (isPaying && !transaksiId) {
      const wRes = await db.select().from(warga).where(eq(warga.id, bill.wargaId)).limit(1);
      const wName = wRes[0]?.nama || "Warga RT 002";
      const wHouse = wRes[0]?.noRumah || "";

      const countT = await db.select().from(transaksi);
      const kode = `TRX-${(countT.length + 1).toString().padStart(5, "0")}`;

      const [newTrx] = await db
        .insert(transaksi)
        .values({
          kodeTransaksi: kode,
          jenis: "pemasukan",
          kategori: "Iuran Bulanan",
          tanggal: new Date().toISOString().split("T")[0],
          nominal: bill.totalTagihan,
          keterangan: `Pembayaran Iuran Kas & Sampah ${bill.bulan} - ${wName} (${wHouse})`,
          metodePembayaran: metode,
          wargaId: bill.wargaId,
          namaPihak: wName,
          buktiUrl: buktiTransfer,
          status: "berhasil",
          createdBy: "Sistem / Verifikasi",
        })
        .returning();

      transaksiId = newTrx.id;
    }

    const [updated] = await db
      .update(tagihan)
      .set({
        status: status || (isPaying ? "lunas" : "belum_lunas"),
        tanggalBayar: isPaying ? nowStr : null,
        metode: isPaying ? metode : null,
        buktiTransfer: isPaying ? buktiTransfer : null,
        transaksiId: isPaying ? transaksiId : null,
        catatan: catatan || (isPaying ? "Lunas terverifikasi" : "Belum lunas"),
      })
      .where(eq(tagihan.id, id))
      .returning();

    return NextResponse.json({ success: true, tagihan: updated });
  } catch (err: any) {
    console.error("Update tagihan error:", err);
    return NextResponse.json({ error: "Gagal memperbarui status tagihan" }, { status: 500 });
  }
}

// Generate new month dues for all warga
export async function POST(req: Request) {
  try {
    const { bulan, nominalKas = 30000, nominalSampah = 20000 } = await req.json();

    if (!bulan) {
      return NextResponse.json({ error: "Nama bulan wajib diisi (contoh: Mei 2026)" }, { status: 400 });
    }

    const allWarga = await db.select().from(warga);
    let createdCount = 0;

    for (const w of allWarga) {
      // Check if bill already generated for this resident and month
      const existing = await db
        .select()
        .from(tagihan)
        .where(and(eq(tagihan.wargaId, w.id), eq(tagihan.bulan, bulan)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(tagihan).values({
          wargaId: w.id,
          bulan,
          periode: bulan,
          nominalKas: Number(nominalKas),
          nominalSampah: Number(nominalSampah),
          totalTagihan: Number(nominalKas) + Number(nominalSampah),
          status: "belum_lunas",
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tagihan bulan ${bulan} berhasil dibuat untuk ${createdCount} warga`,
    });
  } catch (err: any) {
    console.error("Generate tagihan error:", err);
    return NextResponse.json({ error: "Gagal membuat tagihan" }, { status: 500 });
  }
}
