import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/login";
  /*
    Publicas, sin datos de nadie:
    - /demo, la pagina de ejemplo, que no toca la base;
    - /sw.js y /sin-conexion, que la app instalada necesita poder bajar
      aunque la sesion haya vencido (si redirigieran al login, el service
      worker guardaria el login como pagina de "sin conexion").
  */
  const isPublic =
    isLogin ||
    pathname === "/demo" ||
    pathname === "/sw.js" ||
    pathname === "/sin-conexion";

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  if (session && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
