import { NextResponse } from "next/server";
import { db } from "@/db";
import { whatsappLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db.select().from(whatsappLogs).orderBy(desc(whatsappLogs.createdAt));
    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Get whatsapp logs error:", err);
    return NextResponse.json({ error: "Gagal mengambil riwayat pesan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tujuanNama, tujuanNomor, pesan, tipe = "Broadcast" } = body;

    if (!tujuanNama || !pesan) {
      return NextResponse.json({ error: "Nama tujuan dan pesan wajib diisi" }, { status: 400 });
    }

    const [created] = await db
      .insert(whatsappLogs)
      .values({
        tujuanNama,
        tujuanNomor: tujuanNomor || "Semua Warga",
        pesan,
        tipe,
        status: "terkirim",
      })
      .returning();

    // Prepare direct WhatsApp Web / API click-to-chat link
    const cleanPhone = (tujuanNomor || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;
    const waLink = waPhone ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(pesan)}` : "";

    return NextResponse.json({
      success: true,
      log: created,
      waLink,
      message: "Pesan WhatsApp berhasil dicatat dan disiapkan!",
    });
  } catch (err: any) {
    console.error("Send whatsapp error:", err);
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}
