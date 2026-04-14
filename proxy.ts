import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>(["/login"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/.well-known")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/robots")) return true;
  if (pathname.startsWith("/sitemap")) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  // Only guard actual page navigations (avoid blocking asset/metadata fetches).
  const accept = req.headers.get("accept") || "";
  if (!accept.includes("text/html")) return NextResponse.next();

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://43.135.134.131";

  // Session Cookie auth: forward incoming cookies to backend.
  const cookie = req.headers.get("cookie") || "";
  let meRes: Response | null = null;
  try {
    meRes = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/b/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        cookie,
      },
    });
  } catch {
    meRes = null;
  }

  if (meRes?.ok) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api).*)"],
};

