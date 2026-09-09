import { Pool } from "pg";
import { ensureDb } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

function sanitizeDatabaseUrl(raw: string): string {
  let url = raw.trim();
  url = url.replace(/^psql\s+/i, "");
  url = url.replace(/^['"]|['"]$/g, "").trim();
  url = url.replace(/[?&]channel_binding=[^&]*/gi, (m) =>
    m.startsWith("?") ? "?" : ""
  );
  url = url.replace(/\?&/, "?").replace(/[?&]$/, "");
  return url;
}

export async function GET() {
  const raw = process.env.DATABASE_URL;
  const hasDatabaseUrl = Boolean(raw);

  if (!raw) {
    return Response.json(
      {
        ok: false,
        hasDatabaseUrl: false,
        dbConnected: false,
        dbError: "DATABASE_URL is not set",
      },
      { status: 500 }
    );
  }

  const cleaned = sanitizeDatabaseUrl(raw);

  // Info aman untuk diagnosa (tanpa password)
  let hostInfo = "unparseable";
  let userInfo = "unparseable";
  let dbName = "unparseable";
  try {
    const u = new URL(cleaned);
    hostInfo = u.hostname + (u.port ? `:${u.port}` : "");
    userInfo = u.username || "(kosong)";
    dbName = u.pathname.replace("/", "") || "(kosong)";
  } catch {
    // biarkan unparseable
  }

  const diagnostics = {
    host: hostInfo,
    user: userInfo,
    database: dbName,
    hadChannelBinding: /channel_binding/i.test(raw),
    hadQuotes: /^['"]|['"]$/.test(raw.trim()),
    length: raw.length,
  };

  // Uji koneksi langsung dengan pg (tanpa drizzle) agar error asli terlihat
  const needsSsl =
    /sslmode=require|neon\.tech|supabase\.co|render\.com|railway\.app|amazonaws\.com/i.test(
      cleaned
    );
  const pool = new Pool({
    connectionString: cleaned,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    connectionTimeoutMillis: 8000,
    max: 1,
  });

  try {
    const r = await pool.query("select 1 as ok");
    await pool.end().catch(() => {});
    if (r.rows[0]?.ok === 1) {
      ensureDb().catch(() => {});
      return Response.json({
        ok: true,
        hasDatabaseUrl,
        dbConnected: true,
        diagnostics,
      });
    }
    return Response.json(
      { ok: false, hasDatabaseUrl, dbConnected: false, dbError: "Unexpected result", diagnostics },
      { status: 500 }
    );
  } catch (e) {
    await pool.end().catch(() => {});
    let msg = e instanceof Error ? e.message : String(e);
    let cause: unknown = e instanceof Error ? e.cause : undefined;
    while (cause instanceof Error) {
      msg = `${msg} | cause: ${cause.message}`;
      cause = cause.cause;
    }
    return Response.json(
      { ok: false, hasDatabaseUrl, dbConnected: false, dbError: msg, diagnostics },
      { status: 500 }
    );
  }
}
