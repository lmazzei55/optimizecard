import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default async function middleware(req: NextRequest) {
  // Get the session
  const session = await auth()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!session?.user || (session.user as any)?.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }

  // Protect user-specific routes
  if (req.nextUrl.pathname.startsWith("/profile")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }

  // Allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - api/public (public API endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|api/public|_next/static|_next/image|favicon.ico).*)"
  ]
} 