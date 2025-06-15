import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Import the updated credit cards list
const creditCards = require('../../benefits/credit-cards-list.js')

export async function POST() {
  try {
    console.log('🔄 Starting basic credit card seeding (without portal bonus fields)...')
    
    // Clear existing data in correct order (due to foreign key constraints)
    console.log('🗑️ Clearing existing data...')
    
    try {
      await prisma.categoryReward.deleteMany({})
      await prisma.cardBenefit.deleteMany({})
      await prisma.creditCard.deleteMany({})
      console.log('✅ Cleared existing data')
    } catch (error: any) {
      console.log('⚠️ Error clearing data (might be empty):', error.message)
    }
    
    // Get categories
    const categories = await prisma.spendingCategory.findMany()
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]))
    
    console.log(`📋 Found ${categories.length} spending categories`)
    
    const results = {
      cardsCreated: 0,
      rewardsCreated: 0,
      benefitsCreated: 0,
      errors: [] as string[]
    }
    
    // Create credit cards with basic structure (no portal bonus fields)
    for (const cardData of creditCards) {
      try {
        const { categoryRewards, benefits, ...cardInfo } = cardData
        
        console.log(`💳 Creating card: ${cardData.name}`)
        
        // Create the credit card
        const card = await prisma.creditCard.create({
          data: cardInfo
        })
        results.cardsCreated++
        
        // Create category rewards WITHOUT portal bonus fields
        for (const reward of categoryRewards) {
          try {
            const categoryId = categoryMap.get(reward.categoryName)
            if (categoryId) {
              await prisma.categoryReward.create({
                data: {
                  cardId: card.id,
                  categoryId: categoryId,
                  rewardRate: reward.rewardRate,
                  maxReward: reward.maxReward,
                  period: reward.period
                  // Portal bonus fields omitted for now
                }
              })
              results.rewardsCreated++
              
              const portalNote = reward.hasPortalBonus 
                ? ` (Has portal bonus: ${(reward.portalRewardRate * 100).toFixed(1)}%)`
                : ''
              console.log(`  ✅ ${reward.categoryName}: ${(reward.rewardRate * 100).toFixed(1)}%${portalNote}`)
            } else {
              console.log(`  ⚠️ Category not found: ${reward.categoryName}`)
              results.errors.push(`Category not found: ${reward.categoryName} for card ${cardData.name}`)
            }
          } catch (error: any) {
            console.error(`  ❌ Error creating reward for ${reward.categoryName}:`, error.message)
            results.errors.push(`Reward error for ${cardData.name} - ${reward.categoryName}: ${error.message}`)
          }
        }
        
        // Create benefits
        for (const benefit of benefits) {
          try {
            await prisma.cardBenefit.create({
              data: {
                cardId: card.id,
                name: benefit.name,
                description: benefit.description,
                annualValue: benefit.annualValue,
                category: benefit.category,
                isRecurring: benefit.isRecurring
              }
            })
            results.benefitsCreated++
            console.log(`  🎁 ${benefit.name}: $${benefit.annualValue}`)
          } catch (error: any) {
            console.error(`  ❌ Error creating benefit ${benefit.name}:`, error.message)
            results.errors.push(`Benefit error for ${cardData.name} - ${benefit.name}: ${error.message}`)
          }
        }
      } catch (error: any) {
        console.error(`❌ Error creating card ${cardData.name}:`, error.message)
        results.errors.push(`Card error for ${cardData.name}: ${error.message}`)
      }
    }
    
    console.log('🎉 Basic credit card seeding completed!')
    
    // Summary of portal bonuses (for info only)
    const portalBonusCount = creditCards.reduce((count: number, card: any) => {
      return count + card.categoryRewards.filter((r: any) => r.hasPortalBonus).length
    }, 0)
    
    return NextResponse.json({
      success: true,
      message: 'Basic credit card seeding completed successfully',
      note: 'Portal bonus fields not included - apply migration first for full functionality',
      results: {
        ...results,
        totalCards: creditCards.length,
        portalBonusCount: `${portalBonusCount} portal bonuses detected (not saved)`
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Error seeding credit cards:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 