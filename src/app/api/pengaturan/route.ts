import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturan } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(pengaturan).limit(1);
    if (list.length === 0) {
      // Create default if none exists
      const [created] = await db
        .insert(pengaturan)
        .values({
          namaRt: "RT 002 RW 014",
          perumahan: "Perumahan Ciptaland",
          blok: "Blok Mawar",
          ketuaRt: "Bambang Sudik Pamarto",
          noHpKetua: "081234567890",
          bendahara: "Ahmad Suryana",
          noHpBendahara: "081398765432",
          namaBank: "Bank Central Asia (BCA)",
          noRekening: "8720192831",
          atasNama: "KAS RT 002 BLOK MAWAR",
          qrisImage:
            "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226590014ID.LINKAJA.WWW01189360091100214002021587201928315204581253033605802ID5919KAS%20RT%20002%20BLOK%20MAWAR6009TANGERANG61051515462070703A0163048B5A",
          logoImage: "/logo-ciptaland.png",
          iuranWajib: 50000,
        })
        .returning();
      return NextResponse.json({ pengaturan: created });
    }
    return NextResponse.json({ pengaturan: list[0] });
  } catch (err: any) {
    console.error("Get pengaturan error:", err);
    return NextResponse.json({ error: "Gagal mengambil data pengaturan" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const list = await db.select().from(pengaturan).limit(1);

    if (list.length === 0) {
      const [created] = await db.insert(pengaturan).values(body).returning();
      return NextResponse.json({ success: true, pengaturan: created });
    }

    const [updated] = await db
      .update(pengaturan)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(pengaturan.id, list[0].id))
      .returning();

    return NextResponse.json({ success: true, pengaturan: updated });
  } catch (err: any) {
    console.error("Update pengaturan error:", err);
    return NextResponse.json(
      {
        error: "Gagal menyimpan pengaturan ke database. Periksa koneksi Neon dan tabel pengaturan.",
        detail: err?.message || "Unknown pengaturan write error",
      },
      { status: 500 }
    );
  }
}
