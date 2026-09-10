import { sql } from "drizzle-orm";
import { db, hasDatabase } from "@/db";
import { authUsers } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  try {
    if (!hasDatabase()) return Response.json({ ok: false, code: "DATABASE_NOT_CONFIGURED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    await db.execute(sql`select 1`);
    await db.select({ id: authUsers.id }).from(authUsers).limit(1);
    return Response.json({ ok: true, database: "connected", authentication: "database-sessions", version: "6.0-nik-auth" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, code: "DATABASE_UNAVAILABLE_OR_UNMIGRATED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
