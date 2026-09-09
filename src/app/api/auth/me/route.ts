import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (e) {
    // Database tidak terjangkau / DATABASE_URL belum diset
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      {
        error: "DATABASE_UNAVAILABLE",
        detail: msg,
      },
      { status: 503 }
    );
  }
}
