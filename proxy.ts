import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const COOKIE_NAME = "physiocare_session";

export default async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isLoginRoute = pathname === "/admin/login";

  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
