import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "pmc_admin";

async function valid(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.SESSION_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await valid(req.cookies.get(COOKIE_NAME)?.value);

  if (pathname === "/login") {
    if (authed) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // protege tout sauf assets statiques et favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
