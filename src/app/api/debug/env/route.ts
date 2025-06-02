import { NextResponse } from 'next/server'

export async function GET() {
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

  // Only show this in development or for testing purposes
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Environment check disabled in production',
      hint: 'Check server logs for missing environment variables'
    })
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