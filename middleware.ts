import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const protectedPath = request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/users");
  const hasSession = request.cookies.has("routewatch_session");

  if (protectedPath && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/users/:path*", "/login"]
};
