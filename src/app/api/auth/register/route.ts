import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, warga } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { nik, username, password, name, role = "warga", phone, houseNumber } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password minimal 4 karakter" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    // Check username uniqueness
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Username @${cleanUsername} sudah digunakan. Pilih username lain.` },
        { status: 409 }
      );
    }

    let finalName = name || cleanUsername;
    let finalPhone = phone || "";
    let finalHouse = houseNumber || "";
    let cleanNik = nik ? nik.trim() : null;

    // If NIK provided, fetch resident info
    if (cleanNik) {
      const wFound = await db
        .select()
        .from(warga)
        .where(eq(warga.nik, cleanNik))
        .limit(1);

      if (wFound.length > 0) {
        finalName = wFound[0].nama;
        finalPhone = wFound[0].noHp;
        finalHouse = wFound[0].noRumah;
      }
    }

    // Generate avatar initials
    const initials = finalName
      .split(" ")
      .map((s: string) => s[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "US";

    const [newUser] = await db
      .insert(users)
      .values({
        nik: cleanNik,
        username: cleanUsername,
        password: password,
        name: finalName,
        role: role,
        phone: finalPhone,
        houseNumber: finalHouse,
        avatar: initials,
        status: "active",
      })
      .returning();

    const safeUser = {
      id: newUser.id,
      nik: newUser.nik,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      houseNumber: newUser.houseNumber,
      avatar: newUser.avatar,
    };

    const res = NextResponse.json({
      success: true,
      message: "Pendaftaran akun berhasil!",
      user: safeUser,
    });

    res.cookies.set("kas_rt_user", JSON.stringify(safeUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      {
        error: "Gagal mendaftarkan akun ke database. Periksa koneksi Neon / DATABASE_URL / schema tabel users & warga.",
        detail: err?.message || "Unknown register error",
      },
      { status: 500 }
    );
  }
}
