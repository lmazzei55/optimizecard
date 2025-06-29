import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only allow admin users
    const adminEmails = ['lmazzei.work@gmail.com', 'lmazzeiucd@gmail.com', 'optimizecard@gmail.com']
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Check database configuration (without exposing credentials)
    const databaseUrl = process.env.DATABASE_URL
    const directDatabaseUrl = process.env.DIRECT_DATABASE_URL
    
    const maskUrl = (url: string | undefined) => {
      if (!url) return 'Not set'
      // Mask password and show only host/port info
      return url.replace(/:([^:@]+)@/, ':***@')
    }
    
    return NextResponse.json({
      success: true,
      config: {
        DATABASE_URL: maskUrl(databaseUrl),
        DIRECT_DATABASE_URL: maskUrl(directDatabaseUrl),
        prioritizedUrl: maskUrl(directDatabaseUrl || databaseUrl),
        nodeEnv: process.env.NODE_ENV,
        hasDirectUrl: !!directDatabaseUrl,
        hasRegularUrl: !!databaseUrl,
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to check database config',
      details: error.message
    }, { status: 500 })
  }
} 