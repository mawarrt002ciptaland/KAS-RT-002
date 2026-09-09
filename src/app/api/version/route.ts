export const dynamic = "force-static";

export function GET() {
  return Response.json({ app: "KAS RT Blok Mawar", version: "2026.09-static-dist-v5", outputDirectory: "dist", databaseRequiredAtBuild: false, databaseRequiredAtRuntime: false });
}
