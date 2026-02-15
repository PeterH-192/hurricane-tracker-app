import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes - no auth needed
  const publicPaths = ["/login", "/register", "/book", "/waitlist"];
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Public API routes
  const publicApiPaths = [
    "/api/auth",
    "/api/reservations", // POST for public booking
    "/api/waitlist/join",
  ];
  const isPublicApi = publicApiPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Allow public routes
  if (isPublicPath || isPublicApi || pathname === "/") {
    return NextResponse.next();
  }

  // Require auth for dashboard and API routes
  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
