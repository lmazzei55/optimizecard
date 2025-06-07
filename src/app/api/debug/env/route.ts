import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  // Only allow in development OR for admin users in production
  if (process.env.NODE_ENV === 'production') {
    const session = await auth()
    if (!session?.user || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const envCheck = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'missing',
    DATABASE_URL: !!process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: !!process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID: !!process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: !!process.env.FACEBOOK_CLIENT_SECRET,
    TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET,
    AUTH_RESEND_KEY: !!process.env.AUTH_RESEND_KEY,
    EMAIL_FROM: !!process.env.EMAIL_FROM,
    NODE_ENV: process.env.NODE_ENV,
  }

  const missingVars = Object.entries(envCheck)
    .filter(([key, value]) => !value || value === 'missing')
    .map(([key]) => key)

  return NextResponse.json({
    environment: envCheck,
    missing: missingVars,
    status: missingVars.length === 0 ? 'OK' : 'MISSING_VARIABLES'
  })
} 