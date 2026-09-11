import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { desc, eq, and, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'Tersedia' | 'Habis' | 'Semua'
    const search = searchParams.get("search");
    const kategori = searchParams.get("kategori");

    let query = db.select().from(products).$dynamic();
    const conditions = [];

    if (status && status !== "Semua") {
      conditions.push(eq(products.status, status));
    }
    if (kategori && kategori !== "Semua") {
      conditions.push(eq(products.kategori, kategori));
    }
    if (search) {
      conditions.push(ilike(products.namaProduk, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const list = await query.orderBy(desc(products.id));
    return NextResponse.json({ products: list });
  } catch (err: any) {
    console.error("Get products error:", err);
    return NextResponse.json({ error: "Gagal mengambil data produk" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      namaProduk,
      kategori,
      harga,
      status = "Tersedia", // 'Tersedia' or 'Habis'
      penjualNama,
      noRumah,
      noWhatsapp,
      deskripsi = "",
      gambarUrl = "",
    } = body;

    if (!namaProduk || !kategori || !harga || !penjualNama || !noWhatsapp) {
      return NextResponse.json({ error: "Data produk belum lengkap" }, { status: 400 });
    }

    // Default image if not provided
    const fallbackImage =
      gambarUrl ||
      (kategori === "Makanan & Minuman"
        ? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80"
        : kategori === "Jasa"
        ? "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80");

    const [created] = await db
      .insert(products)
      .values({
        namaProduk: namaProduk.trim(),
        kategori: kategori.trim(),
        harga: Number(harga),
        status: status === "Habis" ? "Habis" : "Tersedia",
        penjualNama: penjualNama.trim(),
        noRumah: noRumah.trim(),
        noWhatsapp: noWhatsapp.trim(),
        deskripsi: deskripsi.trim(),
        gambarUrl: fallbackImage,
      })
      .returning();

    return NextResponse.json({ success: true, product: created });
  } catch (err: any) {
    console.error("Create product error:", err);
    return NextResponse.json(
      {
        error: "Gagal mempublikasikan produk ke database. Periksa koneksi Neon dan tabel products.",
        detail: err?.message || "Unknown product write error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, namaProduk, kategori, harga, status, penjualNama, noRumah, noWhatsapp, deskripsi, gambarUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "ID produk diperlukan" }, { status: 400 });
    }

    const updateData: any = {};
    if (namaProduk) updateData.namaProduk = namaProduk;
    if (kategori) updateData.kategori = kategori;
    if (harga !== undefined) updateData.harga = Number(harga);
    if (status) updateData.status = status; // Can toggle Tersedia / Habis
    if (penjualNama) updateData.penjualNama = penjualNama;
    if (noRumah) updateData.noRumah = noRumah;
    if (noWhatsapp) updateData.noWhatsapp = noWhatsapp;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (gambarUrl !== undefined) updateData.gambarUrl = gambarUrl;

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID produk diperlukan" }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
