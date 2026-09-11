import { NextResponse } from "next/server";
import { db } from "@/db";
import { warga, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { nik } = await req.json();

    if (!nik || typeof nik !== "string") {
      return NextResponse.json(
        { error: "Nomor Induk Kependudukan (NIK) wajib diisi" },
        { status: 400 }
      );
    }

    const cleanNik = nik.trim();

    // 1. Check if NIK exists in RT 002 RW 014 resident database
    const wargaFound = await db
      .select()
      .from(warga)
      .where(eq(warga.nik, cleanNik))
      .limit(1);

    if (wargaFound.length === 0) {
      return NextResponse.json(
        {
          registered: false,
          foundInRT: false,
          error: "NIK tidak terdaftar dalam basis data Warga RT 002 RW 014 Blok Mawar. Hubungi pengurus RT untuk pendaftaran data warga.",
        },
        { status: 404 }
      );
    }

    const resident = wargaFound[0];

    // 2. Check if user account already created
    const userFound = await db
      .select()
      .from(users)
      .where(eq(users.nik, cleanNik))
      .limit(1);

    if (userFound.length > 0) {
      return NextResponse.json({
        foundInRT: true,
        alreadyHasAccount: true,
        resident: {
          nik: resident.nik,
          nama: resident.nama,
          noRumah: resident.noRumah,
          noHp: resident.noHp,
        },
        existingUsername: userFound[0].username,
        message: `NIK ${cleanNik} sudah terdaftar dengan username @${userFound[0].username}. Silakan login langsung.`,
      });
    }

    // NIK is valid and ready to create username and password!
    return NextResponse.json({
      foundInRT: true,
      alreadyHasAccount: false,
      resident: {
        nik: resident.nik,
        nama: resident.nama,
        noRumah: resident.noRumah,
        noHp: resident.noHp,
      },
      message: `NIK terverifikasi atas nama ${resident.nama} (${resident.noRumah}). Lanjutkan membuat username dan password.`,
    });
  } catch (err: any) {
    console.error("Check NIK error:", err);
    return NextResponse.json(
      { error: "Gagal memverifikasi NIK" },
      { status: 500 }
    );
  }
}
