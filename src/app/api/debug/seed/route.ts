import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Import the updated credit cards list
const creditCards = require('../../benefits/credit-cards-list.js');

// Helper function to generate a simple ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    // Clear existing data in correct order (respecting foreign keys)
    await client.query('DELETE FROM "CardBenefit"');
    await client.query('DELETE FROM "CategoryReward"');
    await client.query('DELETE FROM "CreditCard"');
    await client.query('DELETE FROM "SubCategory"');
    await client.query('DELETE FROM "SpendingCategory"');
    
    console.log('✅ Cleared existing data');

    // Create spending categories with generated IDs
    const categories = [
      { name: 'Travel', description: 'Airlines, hotels, car rentals, and other travel expenses' },
      { name: 'Dining', description: 'Restaurants, bars, and food delivery' },
      { name: 'Groceries', description: 'Supermarkets and grocery stores' },
      { name: 'Gas', description: 'Gas stations and fuel purchases' },
      { name: 'Entertainment', description: 'Movies, concerts, streaming services' },
      { name: 'Shopping', description: 'General retail and online shopping' },
      { name: 'Transportation', description: 'Public transit, rideshare, parking' },
      { name: 'Health & Medical', description: 'Doctor visits, pharmacy, medical expenses' },
      { name: 'Utilities', description: 'Electricity, water, internet, phone bills' }
    ];

    for (const category of categories) {
      const categoryId = generateId();
      await client.query(
        'INSERT INTO "SpendingCategory" (id, name, description, "createdAt") VALUES ($1, $2, $3, NOW())',
        [categoryId, category.name, category.description]
      );
    }
    
    console.log('✅ Created spending categories');

    // Insert credit cards with all benefits
    for (const card of creditCards) {
      // Insert credit card
      await client.query(`
        INSERT INTO "CreditCard" (
          id, name, issuer, "annualFee", tier, "baseReward", "rewardType", 
          "pointValue", "applicationUrl", "signupBonus", "signupSpend", 
          "signupTimeframe", "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      `, [
        card.id, card.name, card.issuer, card.annualFee, card.tier,
        card.baseReward, card.rewardType, card.pointValue || null,
        card.applicationUrl, card.signupBonus || null, card.signupSpend || null,
        card.signupTimeframe || null, card.isActive
      ]);

      // Insert category rewards
      if (card.categoryRewards && card.categoryRewards.length > 0) {
        for (const reward of card.categoryRewards) {
          // Get the category ID by name
          const categoryResult = await client.query(
            'SELECT id FROM "SpendingCategory" WHERE name = $1',
            [reward.categoryName]
          );
          
          if (categoryResult.rows.length > 0) {
            const categoryId = categoryResult.rows[0].id;
            const rewardId = generateId();
            
            await client.query(`
              INSERT INTO "CategoryReward" (
                id, "cardId", "categoryId", "rewardRate", "maxReward", period
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              rewardId, card.id, categoryId, reward.rewardRate,
              reward.maxReward || null, reward.period || null
            ]);
          }
        }
      }

      // Insert benefits
      if (card.benefits && card.benefits.length > 0) {
        for (const benefit of card.benefits) {
          const benefitId = generateId();
          await client.query(`
            INSERT INTO "CardBenefit" (
              id, "cardId", name, description, "annualValue", category, "isRecurring", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `, [
            benefitId, card.id, benefit.name, benefit.description,
            benefit.annualValue, benefit.category, benefit.isRecurring
          ]);
        }
      }
    }

    console.log('✅ Inserted all credit cards with comprehensive benefits');

    // Get final counts
    const cardCount = await client.query('SELECT COUNT(*) FROM "CreditCard"');
    const rewardCount = await client.query('SELECT COUNT(*) FROM "CategoryReward"');
    const benefitCount = await client.query('SELECT COUNT(*) FROM "CardBenefit"');
    const categoryCount = await client.query('SELECT COUNT(*) FROM "SpendingCategory"');

    const result = {
      success: true,
      message: 'Database seeded successfully with comprehensive benefits!',
      counts: {
        creditCards: parseInt(cardCount.rows[0].count),
        categoryRewards: parseInt(rewardCount.rows[0].count),
        benefits: parseInt(benefitCount.rows[0].count),
        categories: parseInt(categoryCount.rows[0].count)
      }
    };

    console.log('🎉 Seeding completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  } finally {
    client.release();
  }
} 