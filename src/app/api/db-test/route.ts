import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL || "";
    const maskedUrl = databaseUrl
      ? databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
      : null;

    const ping = await db.execute(sql`select now() as now, current_database() as db_name, current_user as db_user`);

    return NextResponse.json({
      ok: true,
      message: "Koneksi database berhasil",
      env: {
        hasDatabaseUrl: Boolean(databaseUrl),
        databaseUrlMasked: maskedUrl,
        isNeon: databaseUrl.includes("neon.tech"),
      },
      ping,
    });
  } catch (error: any) {
    console.error("DB GET test error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Koneksi database gagal",
        error: error?.message || "Unknown database error",
        detail: error?.cause?.message || null,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const username = `neon_test_${Date.now()}`;

    const [created] = await db
      .insert(users)
      .values({
        nik: null,
        username,
        password: "test1234",
        name: "Neon Write Test",
        role: "admin",
        phone: "081100000000",
        houseNumber: "TEST",
        avatar: "NT",
        status: "active",
      })
      .returning();

    await db.delete(users).where(sql`${users.id} = ${created.id}`);

    return NextResponse.json({
      ok: true,
      message: "Tes tulis database berhasil",
      insertedId: created.id,
      username,
    });
  } catch (error: any) {
    console.error("DB POST test error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Tes tulis database gagal",
        error: error?.message || "Unknown write error",
        detail: error?.cause?.message || null,
      },
      { status: 500 }
    );
  }
}
