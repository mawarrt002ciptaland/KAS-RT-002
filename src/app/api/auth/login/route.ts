import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { findFallbackUser, toSafeSessionUser } from "@/lib/auth-fallback";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username/NIK dan password wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedUser = String(username).trim();
    const trimmedPassword = String(password);

    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.username, trimmedUser), eq(users.nik, trimmedUser)))
        .limit(1);

      if (foundUsers.length > 0) {
        const user = foundUsers[0];

        if (user.password !== trimmedPassword) {
          return NextResponse.json(
            { error: "Password salah. Silakan coba lagi." },
            { status: 401 }
          );
        }

        const safeUser = {
          id: user.id,
          nik: user.nik,
          username: user.username,
          name: user.name,
          role: user.role,
          phone: user.phone,
          houseNumber: user.houseNumber,
          avatar: user.avatar,
        };

        const res = NextResponse.json({
          success: true,
          message: "Login berhasil",
          user: safeUser,
          source: "database",
        });

        res.cookies.set("kas_rt_user", JSON.stringify(safeUser), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });

        return res;
      }
    } catch (dbError) {
      console.error("Database login unavailable, using fallback auth:", dbError);
    }

    const fallbackUser = findFallbackUser(trimmedUser, trimmedPassword);

    if (!fallbackUser) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau password salah." },
        { status: 401 }
      );
    }

    const safeUser = toSafeSessionUser(fallbackUser);

    const res = NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: safeUser,
      source: "fallback",
    });

    res.cookies.set("kas_rt_user", JSON.stringify(safeUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat login" },
      { status: 500 }
    );
  }
}
