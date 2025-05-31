import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint to verify webhook delivery
export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK TEST ENDPOINT HIT ===')
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  const body = await request.text()
  console.log('Body length:', body.length)
  console.log('Body preview:', body.substring(0, 200))
  
  return NextResponse.json({ 
    received: true, 
    timestamp: new Date().toISOString(),
    bodyLength: body.length 
  })
}

// Also handle GET for easy testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is working',
    timestamp: new Date().toISOString()
  })
} 