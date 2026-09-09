export const dynamic = "force-static";

export function GET() {
  return Response.json({ ok: true, app: "KAS RT Blok Mawar", version: "2026.09-static-dist-v5", mode: "static-export", databaseRequired: false });
}
