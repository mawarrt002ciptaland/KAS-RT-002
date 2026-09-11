import { NextResponse } from "next/server";
import { db } from "@/db";
import { warga } from "@/db/schema";
import { desc, eq, or, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let query = db.select().from(warga).$dynamic();

    if (search) {
      query = query.where(
        or(
          ilike(warga.nama, `%${search}%`),
          ilike(warga.nik, `%${search}%`),
          ilike(warga.noRumah, `%${search}%`)
        )
      );
    }

    const list = await query.orderBy(warga.id);
    return NextResponse.json({ warga: list });
  } catch (err: any) {
    console.error("Get warga error:", err);
    return NextResponse.json({ error: "Gagal mengambil data warga" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nik, nama, noRumah, noHp, statusTinggal = "Tetap", jumlahKeluarga = 1, pekerjaan = "" } = body;

    if (!nik || !nama || !noRumah || !noHp) {
      return NextResponse.json({ error: "NIK, Nama, No Rumah, dan No HP wajib diisi" }, { status: 400 });
    }

    // Check duplicate NIK
    const existing = await db.select().from(warga).where(eq(warga.nik, nik.trim())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "NIK sudah terdaftar sebelumnya" }, { status: 409 });
    }

    const [newWarga] = await db
      .insert(warga)
      .values({
        nik: nik.trim(),
        nama: nama.trim(),
        noRumah: noRumah.trim(),
        noHp: noHp.trim(),
        statusTinggal,
        jumlahKeluarga: Number(jumlahKeluarga) || 1,
        pekerjaan: pekerjaan.trim(),
      })
      .returning();

    return NextResponse.json({ success: true, warga: newWarga });
  } catch (err: any) {
    console.error("Add warga error:", err);
    return NextResponse.json(
      {
        error: "Gagal menambahkan warga ke database. Periksa koneksi Neon dan tabel warga.",
        detail: err?.message || "Unknown warga write error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nama, noRumah, noHp, statusTinggal, jumlahKeluarga, pekerjaan, statusIuran } = body;

    if (!id) {
      return NextResponse.json({ error: "ID warga diperlukan" }, { status: 400 });
    }

    const [updated] = await db
      .update(warga)
      .set({
        nama,
        noRumah,
        noHp,
        statusTinggal,
        jumlahKeluarga: Number(jumlahKeluarga) || 1,
        pekerjaan,
        statusIuran,
      })
      .where(eq(warga.id, id))
      .returning();

    return NextResponse.json({ success: true, warga: updated });
  } catch (err: any) {
    console.error("Update warga error:", err);
    return NextResponse.json({ error: "Gagal memperbarui warga" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID warga diperlukan" }, { status: 400 });
    }

    await db.delete(warga).where(eq(warga.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete warga error:", err);
    return NextResponse.json({ error: "Gagal menghapus warga" }, { status: 500 });
  }
}
