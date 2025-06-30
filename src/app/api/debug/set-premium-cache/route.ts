import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, tier } = await request.json()
    
    if (!email || !tier) {
      return NextResponse.json({ error: "Email and tier required" }, { status: 400 })
    }
    
    if (!['free', 'premium'].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }
    
    // This endpoint is just for setting localStorage instructions
    // The actual caching happens in the browser
    
    return NextResponse.json({
      success: true,
      message: `Instructions to set ${email} to ${tier} tier`,
      instructions: {
        action: tier === 'premium' ? 'set' : 'remove',
        key: 'subscriptionTier',
        value: tier === 'premium' ? 'premium' : null,
        jsCode: tier === 'premium' 
          ? `localStorage.setItem('subscriptionTier', 'premium')` 
          : `localStorage.removeItem('subscriptionTier')`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
} 