import { NextResponse } from "next/server";
import { db } from "@/db";
import { transaksi, tagihan, warga, pengaturan } from "@/db/schema";
import { eq } from "drizzle-orm";

function angkaKeTerbilang(nilai: number): string {
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  const angka = Math.floor(nilai);

  if (angka < 12) return satuan[angka];
  if (angka < 20) return angkaKeTerbilang(angka - 10) + " Belas";
  if (angka < 100) return angkaKeTerbilang(Math.floor(angka / 10)) + " Puluh" + (angka % 10 !== 0 ? " " + angkaKeTerbilang(angka % 10) : "");
  if (angka < 200) return "Seratus" + (angka - 100 !== 0 ? " " + angkaKeTerbilang(angka - 100) : "");
  if (angka < 1000) return angkaKeTerbilang(Math.floor(angka / 100)) + " Ratus" + (angka % 100 !== 0 ? " " + angkaKeTerbilang(angka % 100) : "");
  if (angka < 2000) return "Seribu" + (angka - 1000 !== 0 ? " " + angkaKeTerbilang(angka - 1000) : "");
  if (angka < 1000000) return angkaKeTerbilang(Math.floor(angka / 1000)) + " Ribu" + (angka % 1000 !== 0 ? " " + angkaKeTerbilang(angka % 100) : "");
  if (angka < 1000000000) return angkaKeTerbilang(Math.floor(angka / 1000000)) + " Juta" + (angka % 1000000 !== 0 ? " " + angkaKeTerbilang(angka % 1000000) : "");
  return String(nilai);
}

function settingsPayload(config: any) {
  return {
    bendahara: config.bendahara,
    ketuaRt: config.ketuaRt,
    rt: config.namaRt,
    perumahan: config.perumahan,
    blok: config.blok,
    namaBank: config.namaBank,
    noRekening: config.noRekening,
    atasNama: config.atasNama,
    logoImage: config.logoImage,
    qrisImage: config.qrisImage,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kode = searchParams.get("kode");
    const tagihanId = searchParams.get("tagihanId");

    const settingsList = await db.select().from(pengaturan).limit(1);
    const config = settingsList[0] || {
      namaRt: "RT 002 RW 014",
      perumahan: "Perumahan Ciptaland",
      blok: "Blok Mawar",
      bendahara: "Ahmad Suryana",
      ketuaRt: "Bambang Sudik Pamarto",
      namaBank: "Bank Central Asia (BCA)",
      noRekening: "8720192831",
      atasNama: "KAS RT 002 BLOK MAWAR",
      logoImage: "",
      qrisImage: "",
    };

    if (tagihanId) {
      const rows = await db
        .select({
          id: tagihan.id,
          bulan: tagihan.bulan,
          nominalKas: tagihan.nominalKas,
          nominalSampah: tagihan.nominalSampah,
          totalTagihan: tagihan.totalTagihan,
          status: tagihan.status,
          tanggalBayar: tagihan.tanggalBayar,
          metode: tagihan.metode,
          wargaNama: warga.nama,
          wargaNoRumah: warga.noRumah,
          wargaNoHp: warga.noHp,
        })
        .from(tagihan)
        .leftJoin(warga, eq(tagihan.wargaId, warga.id))
        .where(eq(tagihan.id, Number(tagihanId)))
        .limit(1);

      if (rows.length === 0) {
        return NextResponse.json({ error: "Data tagihan tidak ditemukan" }, { status: 404 });
      }

      const item = rows[0];
      return NextResponse.json({
        kwitansi: {
          noKwitansi: `KW-${item.bulan.replace(" ", "")}-${String(item.id).padStart(4, "0")}`,
          tanggal: item.tanggalBayar || new Date().toLocaleDateString("id-ID"),
          sudahTerimaDari: item.wargaNama || "Warga",
          noRumah: item.wargaNoRumah || "",
          nominal: item.totalTagihan,
          terbilang: `${angkaKeTerbilang(item.totalTagihan)} Rupiah`,
          untukPembayaran: `Iuran Bulanan Kas & Sampah ${item.bulan} ${config.blok}`,
          metodePembayaran: item.metode || "Transfer BCA",
          status: item.status === "lunas" ? "LUNAS" : "BELUM LUNAS",
          ...settingsPayload(config),
        },
      });
    }

    if (kode) {
      const trxList = await db.select().from(transaksi).where(eq(transaksi.kodeTransaksi, kode)).limit(1);
      if (trxList.length === 0) {
        return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
      }

      const t = trxList[0];
      return NextResponse.json({
        kwitansi: {
          noKwitansi: `KW-${t.kodeTransaksi}`,
          tanggal: t.tanggal,
          sudahTerimaDari: t.namaPihak || "Warga RT 002",
          noRumah: config.blok,
          nominal: t.nominal,
          terbilang: `${angkaKeTerbilang(t.nominal)} Rupiah`,
          untukPembayaran: t.keterangan,
          metodePembayaran: t.metodePembayaran || "Transfer / QRIS",
          status: "LUNAS",
          ...settingsPayload(config),
        },
      });
    }

    return NextResponse.json({
      kwitansi: {
        noKwitansi: "KW-202604-0012",
        tanggal: "06 April 2026",
        sudahTerimaDari: "Bayu Sudik Pamarto",
        noRumah: "M-02",
        nominal: 50000,
        terbilang: "Lima Puluh Ribu Rupiah",
        untukPembayaran: `Iuran Kas RT & Retribusi Sampah Periode April 2026 ${config.blok}`,
        metodePembayaran: "Transfer BCA / QRIS",
        status: "LUNAS",
        ...settingsPayload(config),
      },
    });
  } catch (err: any) {
    console.error("Get kwitansi error:", err);
    return NextResponse.json({ error: "Gagal memproses kwitansi" }, { status: 500 });
  }
}
