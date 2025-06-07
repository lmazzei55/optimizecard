import { NextResponse } from 'next/server'

export async function GET() {
  // Check which OAuth providers have valid credentials
  const availableProviders = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
               process.env.GOOGLE_CLIENT_ID !== "not-configured" && 
               process.env.GOOGLE_CLIENT_SECRET !== "not-configured"),
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET &&
               process.env.GITHUB_CLIENT_ID !== "not-configured" && 
               process.env.GITHUB_CLIENT_SECRET !== "not-configured"), 
    facebook: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET &&
                 process.env.FACEBOOK_CLIENT_ID !== "not-configured" && 
                 process.env.FACEBOOK_CLIENT_SECRET !== "not-configured"),
    twitter: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET &&
                process.env.TWITTER_CLIENT_ID !== "not-configured" && 
                process.env.TWITTER_CLIENT_SECRET !== "not-configured"),
    resend: !!(process.env.AUTH_RESEND_KEY && 
               process.env.AUTH_RESEND_KEY !== "not-configured"),
    demo: process.env.NODE_ENV === "development"
  }

  return NextResponse.json(availableProviders)
} 