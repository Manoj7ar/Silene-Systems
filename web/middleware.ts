import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user, configured } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (configured && path.startsWith("/app") && !user) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set(
      "next",
      `${path}${request.nextUrl.search || ""}`
    );
    return NextResponse.redirect(login);
  }

  if (configured && user && path === "/get-started") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (
    configured &&
    user &&
    (path === "/auth/login" ||
      path === "/auth/signup" ||
      path === "/auth/forgot-password")
  ) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/get-started", "/app/:path*", "/auth/:path*"],
};
