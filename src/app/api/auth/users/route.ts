import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select({
        id: users.id,
        nik: users.nik,
        username: users.username,
        name: users.name,
        role: users.role,
        phone: users.phone,
        houseNumber: users.houseNumber,
        avatar: users.avatar,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: list });
  } catch (err: any) {
    console.error("Fetch users error:", err);
    return NextResponse.json({ error: "Gagal memuat daftar akun" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, name, role, phone, houseNumber, nik } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: "Data user tidak lengkap" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }

    const initials = name
      .split(" ")
      .map((s: string) => s[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const [created] = await db
      .insert(users)
      .values({
        nik: nik || null,
        username: cleanUsername,
        password: password,
        name: name,
        role: role || "warga",
        phone: phone || "",
        houseNumber: houseNumber || "",
        avatar: initials,
        status: "active",
      })
      .returning();

    return NextResponse.json({ success: true, user: created });
  } catch (err: any) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Gagal menambahkan user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, role, phone, houseNumber, password } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID wajib disertakan" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (houseNumber !== undefined) updateData.houseNumber = houseNumber;
    if (password) updateData.password = password;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Gagal memperbarui user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID user wajib disertakan" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
