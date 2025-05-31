import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const benefits = await prisma.cardBenefit.findMany({
      include: {
        card: {
          select: {
            id: true,
            name: true,
            issuer: true,
          },
        },
      },
      orderBy: [
        { card: { name: 'asc' } },
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Group benefits by card for easier frontend consumption
    type BenefitsByCard = Record<string, {
      card: { id: string; name: string; issuer: string };
      benefits: Array<{
        id: string;
        name: string;
        description: string | null;
        annualValue: number | null;
        category: string;
        isRecurring: boolean;
      }>;
    }>;

    const benefitsByCard = benefits.reduce((acc: BenefitsByCard, benefit: (typeof benefits)[0]) => {
      const cardId = benefit.cardId
      if (!acc[cardId]) {
        acc[cardId] = {
          card: benefit.card,
          benefits: [],
        }
      }
      acc[cardId].benefits.push({
        id: benefit.id,
        name: benefit.name,
        description: benefit.description,
        annualValue: benefit.annualValue,
        category: benefit.category,
        isRecurring: benefit.isRecurring,
      })
      return acc
    }, {} as BenefitsByCard)

    return NextResponse.json({
      success: true,
      data: {
        benefits,
        benefitsByCard,
      },
    })
  } catch (error) {
    console.error('Error fetching benefits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch benefits' },
      { status: 500 }
    )
  }
} 