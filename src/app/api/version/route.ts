export function GET() {
  return Response.json({ app: "KAS RT Blok Mawar", version: "6.0-nik-auth", login: true, registration: "verified-nik", deployment: "Cloudflare Workers / Next.js server", databaseRequiredAtRuntime: true }, { headers: { "Cache-Control": "no-store" } });
}
