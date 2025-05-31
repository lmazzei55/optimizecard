import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { spendingData: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse spending data if it exists
    let spending = []
    if (user.spendingData) {
      try {
        spending = JSON.parse(user.spendingData)
      } catch (error) {
        console.error('Error parsing user spending data:', error)
      }
    }

    return NextResponse.json({ spending })
  } catch (error) {
    console.error('Error fetching user spending:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { spending } = body

    if (!Array.isArray(spending)) {
      return NextResponse.json({ error: 'Invalid spending data' }, { status: 400 })
    }

    // Update user's spending data
    await prisma.user.update({
      where: { email: session.user.email },
      data: { spendingData: JSON.stringify(spending) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving user spending:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 