import { NextRequest, NextResponse } from "next/server";

// Menyalin token dari query param ?_auth= ke header internal.
// Query string tidak dapat disaring oleh proxy preview, sehingga ini
// menjadi jalur autentikasi yang selalu berhasil.
export function middleware(req: NextRequest) {
  const authParam = req.nextUrl.searchParams.get("_auth");
  if (!authParam) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-middleware-auth", authParam);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: "/api/:path*",
};
