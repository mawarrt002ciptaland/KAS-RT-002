import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("kas_rt_user");

  if (!session?.value) {
    // Default fallback to demo bendahara if no session exists yet
    return NextResponse.json({
      user: {
        id: 3,
        nik: "3201140504900002",
        username: "bendahara",
        name: "Ahmad Suryana",
        role: "bendahara",
        phone: "081398765432",
        houseNumber: "M-03",
        avatar: "AS",
      },
    });
  }

  try {
    const user = JSON.parse(session.value);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
