import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

const DEFAULTS: Record<string, string> = {
  namaAplikasi: "KAS RT — Blok Mawar RT 002 RW 014",
  keteranganAplikasi: "Sistem Kas Digital Blok Mawar RT 002 RW 014 Perumahan Ciptaland",
  logoAplikasi: "",
  qrisPembayaran: "",
  namaRt: "Blok Mawar RT 002 RW 014",
  namaPerumahan: "Perumahan Ciptaland",
  namaKetua: "Ketua RT 002",
  namaBendahara: "Bendahara RT 002",
  teleponBendahara: "",
  rekening: "",
  pesanWa: "Assalamu'alaikum Bapak/Ibu {nama}, kami informasikan tagihan {iuran} periode {periode} sebesar {nominal} belum dibayarkan. Mohon segera melakukan pembayaran ke Bendahara RT. Terima kasih. - Pengurus RT 002 Blok Mawar",
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(settings);
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json({ data: map });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  try {
    const body = (await req.json()) as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(settings)
        .values({ key, value: String(value ?? "") })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: String(value ?? "") },
        });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
