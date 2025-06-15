import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

const creditCards = [
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.015, // 1.5%
    rewardType: 'cashback',
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/freedom/unlimited',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.01, // 1%
    rewardType: 'points',
    pointValue: 0.0125, // 1.25¢ per point
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    issuer: 'Citi',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.02, // 2%
    rewardType: 'cashback',
    applicationUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
    isActive: true,
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    annualFee: 250,
    tier: 'premium',
    baseReward: 0.01, // 1%
    rewardType: 'points',
    pointValue: 0.01, // 1¢ per point
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 6,
    isActive: true,
  },
  {
    id: 'discover-it-cash-back',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01, // 1%
    rewardType: 'cashback',
    applicationUrl: 'https://www.discover.com/credit-cards/cash-back/it-card.html',
    signupBonus: 0, // Cashback match for first year
    isActive: true,
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    tier: 'premium',
    baseReward: 0.02, // 2%
    rewardType: 'points',
    pointValue: 0.01, // 1¢ per point
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
  }
]

const categoryRewards = [
  // Chase Freedom Unlimited
  { cardId: 'chase-freedom-unlimited', categoryName: 'Dining', rewardRate: 0.03 },
  { cardId: 'chase-freedom-unlimited', categoryName: 'Groceries', rewardRate: 0.03 },
  
  // Chase Sapphire Preferred
  { cardId: 'chase-sapphire-preferred', categoryName: 'Dining', rewardRate: 0.03 },
  { cardId: 'chase-sapphire-preferred', categoryName: 'Travel', rewardRate: 0.02 },
  
  // Amex Gold
  { cardId: 'amex-gold', categoryName: 'Dining', rewardRate: 0.04 },
  { cardId: 'amex-gold', categoryName: 'Groceries', rewardRate: 0.04 },
  
  // Discover it Cash Back (rotating categories)
  { cardId: 'discover-it-cash-back', categoryName: 'Gas', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
]

export async function POST() {
  try {
    // Check if cards already exist with prepared statement conflict handling
    let existingCount = 0
    try {
      existingCount = await withRetry(async () => {
        return await prisma.creditCard.count()
      })
    } catch (error: any) {
      // If it's a prepared statement conflict, we can't get count but database is working
      if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
        console.log('⚠️ Prepared statement conflict in count check, assuming database needs seeding')
        existingCount = 0 // Assume we need to seed
      } else {
        throw error // Re-throw other errors
      }
    }
    
    if (existingCount > 0) {
      return NextResponse.json({
        message: `Database already has ${existingCount} credit cards`,
        skipped: true,
        timestamp: new Date().toISOString()
      })
    }
    
    // Seed credit cards with prepared statement conflict handling
    const createdCards = []
    const failedCards = []
    
    for (const cardData of creditCards) {
      try {
        const card = await withRetry(async () => {
          return await prisma.creditCard.create({
            data: cardData
          })
        })
        createdCards.push(card.id)
      } catch (error: any) {
        // If it's a prepared statement conflict, the card might already exist
        if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
          console.log(`⚠️ Prepared statement conflict creating card ${cardData.id}, might already exist`)
          failedCards.push(`${cardData.id}: prepared statement conflict`)
        } else {
          console.error(`Error creating card ${cardData.id}:`, error)
          failedCards.push(`${cardData.id}: ${error.message}`)
        }
      }
    }
    
    // Seed category rewards with prepared statement conflict handling
    const createdRewards = []
    const failedRewards = []
    
    for (const rewardData of categoryRewards) {
      try {
        // Find the category by name
        let category = null
        try {
          category = await withRetry(async () => {
            return await prisma.spendingCategory.findFirst({
              where: { name: rewardData.categoryName }
            })
          })
        } catch (error: any) {
          if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
            console.log(`⚠️ Prepared statement conflict finding category ${rewardData.categoryName}`)
            continue // Skip this reward
          } else {
            throw error
          }
        }
        
        if (category) {
          try {
            const reward = await withRetry(async () => {
              return await prisma.categoryReward.create({
                data: {
                  cardId: rewardData.cardId,
                  categoryId: category.id,
                  rewardRate: rewardData.rewardRate,
                  maxReward: rewardData.maxReward,
                  period: rewardData.period as any
                }
              })
            })
            createdRewards.push(reward.id)
          } catch (error: any) {
            if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
              console.log(`⚠️ Prepared statement conflict creating reward for ${rewardData.cardId}`)
              failedRewards.push(`${rewardData.cardId}: prepared statement conflict`)
            } else {
              console.error(`Error creating reward for ${rewardData.cardId}:`, error)
              failedRewards.push(`${rewardData.cardId}: ${error.message}`)
            }
          }
        }
      } catch (error: any) {
        console.error(`Error processing reward for ${rewardData.cardId}:`, error)
        failedRewards.push(`${rewardData.cardId}: ${error.message}`)
      }
    }
    
    const totalAttempted = creditCards.length + categoryRewards.length
    const totalSuccessful = createdCards.length + createdRewards.length
    const totalFailed = failedCards.length + failedRewards.length
    
    return NextResponse.json({
      message: 'Seeding completed',
      cardsCreated: createdCards.length,
      rewardsCreated: createdRewards.length,
      totalAttempted,
      totalSuccessful,
      totalFailed,
      cards: createdCards,
      failedCards: failedCards.length > 0 ? failedCards : undefined,
      failedRewards: failedRewards.length > 0 ? failedRewards : undefined,
      note: totalFailed > 0 ? 'Some operations failed due to prepared statement conflicts in serverless environment' : undefined,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Seeding error:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 