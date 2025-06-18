import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default async function middleware(req: NextRequest) {
  // Skip auth check for routes that don't need it
  const path = req.nextUrl.pathname
  
  // Only check auth for routes that actually need protection
  if (path.startsWith("/admin") || path.startsWith("/profile")) {
    try {
      // Get the session only for protected routes
      const session = await auth()

      // Protect admin routes
      if (path.startsWith("/admin")) {
        if (!session?.user || (session.user as any)?.role !== "admin") {
          return NextResponse.redirect(new URL("/auth/signin", req.url))
        }
      }

      // Protect user-specific routes
      if (path.startsWith("/profile")) {
        if (!session?.user) {
          return NextResponse.redirect(new URL("/auth/signin", req.url))
        }
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      // Don't block the request if auth fails - let NextAuth handle it
      // Only redirect for admin routes which definitely need protection
      if (path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }
  }

  // Allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match only protected routes to avoid unnecessary auth calls
     * - admin routes
     * - profile routes
     */
    "/admin/:path*",
    "/profile/:path*"
  ]
} 