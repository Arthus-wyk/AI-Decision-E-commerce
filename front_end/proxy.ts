import { NextRequest, NextResponse } from "next/server";

const privateRoutes = ["/account", "/checkout"];
const authRoutes = ["/signin", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("session_token")?.value);
  const isPrivate = privateRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isAuth = authRoutes.includes(pathname);

  if (isPrivate && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuth && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/signin", "/signup"],
};
