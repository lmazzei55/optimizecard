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

    const categoryMap = new Map();
    
    for (const category of categories) {
      const categoryId = generateId();
      categoryMap.set(category.name, categoryId);
      await client.query(
        'INSERT INTO "SpendingCategory" (id, name, description, "createdAt") VALUES ($1, $2, $3, NOW())',
        [categoryId, category.name, category.description]
      );
    }
    
    console.log('✅ Created spending categories');

    // Create subcategories
    const subcategories = [
      // Travel subcategories
      { parentCategory: 'Travel', name: 'Airlines', description: 'Commercial airline tickets and fees' },
      { parentCategory: 'Travel', name: 'Hotels', description: 'Hotel stays and accommodations' },
      { parentCategory: 'Travel', name: 'Car Rentals', description: 'Rental cars and vehicle services' },
      { parentCategory: 'Travel', name: 'Booking Sites', description: 'Expedia, Priceline, Booking.com' },
      
      // Dining subcategories
      { parentCategory: 'Dining', name: 'Restaurants', description: 'Sit-down restaurants and fine dining' },
      { parentCategory: 'Dining', name: 'Fast Food', description: 'Quick service restaurants' },
      { parentCategory: 'Dining', name: 'Food Delivery', description: 'DoorDash, Uber Eats, Grubhub' },
      { parentCategory: 'Dining', name: 'Coffee Shops', description: 'Starbucks, local coffee shops' },
      { parentCategory: 'Dining', name: 'Bars & Nightlife', description: 'Bars, clubs, and nightlife venues' },
      
      // Groceries subcategories
      { parentCategory: 'Groceries', name: 'Whole Foods', description: 'Whole Foods Market stores' },
      { parentCategory: 'Groceries', name: 'Supermarkets', description: 'Traditional grocery stores' },
      { parentCategory: 'Groceries', name: 'Warehouse Clubs', description: 'Costco, Sam\'s Club, BJ\'s' },
      { parentCategory: 'Groceries', name: 'Specialty Stores', description: 'Butcher shops, bakeries, organic stores' },
      
      // Shopping subcategories
      { parentCategory: 'Shopping', name: 'Amazon', description: 'Amazon.com purchases' },
      { parentCategory: 'Shopping', name: 'Department Stores', description: 'Target, Walmart, Macy\'s' },
      { parentCategory: 'Shopping', name: 'Online Shopping', description: 'Other online retailers' },
      { parentCategory: 'Shopping', name: 'Electronics', description: 'Best Buy, Apple Store, electronics retailers' },
      { parentCategory: 'Shopping', name: 'Clothing', description: 'Clothing and apparel stores' },
      
      // Entertainment subcategories
      { parentCategory: 'Entertainment', name: 'Streaming Services', description: 'Netflix, Spotify, Disney+' },
      { parentCategory: 'Entertainment', name: 'Movies & Theater', description: 'Movie theaters, live shows' },
      { parentCategory: 'Entertainment', name: 'Gaming', description: 'Video games, gaming platforms' },
      { parentCategory: 'Entertainment', name: 'Sports & Recreation', description: 'Gyms, sports events, recreation' },
      
      // Gas subcategories
      { parentCategory: 'Gas', name: 'Shell', description: 'Shell gas stations' },
      { parentCategory: 'Gas', name: 'Exxon', description: 'Exxon gas stations' },
      { parentCategory: 'Gas', name: 'BP', description: 'BP gas stations' },
      { parentCategory: 'Gas', name: 'Other Gas Stations', description: 'Independent and other brand stations' },
      
      // Transportation subcategories
      { parentCategory: 'Transportation', name: 'Uber/Lyft', description: 'Rideshare services' },
      { parentCategory: 'Transportation', name: 'Public Transit', description: 'Buses, trains, subway' },
      { parentCategory: 'Transportation', name: 'Parking', description: 'Parking fees and meters' },
      { parentCategory: 'Transportation', name: 'Tolls', description: 'Highway and bridge tolls' },
      
      // Health & Medical subcategories
      { parentCategory: 'Health & Medical', name: 'Pharmacy', description: 'CVS, Walgreens, prescriptions' },
      { parentCategory: 'Health & Medical', name: 'Doctor Visits', description: 'Medical appointments and consultations' },
      { parentCategory: 'Health & Medical', name: 'Dental', description: 'Dental care and orthodontics' },
      { parentCategory: 'Health & Medical', name: 'Vision', description: 'Eye care and optical services' },
      
      // Utilities subcategories
      { parentCategory: 'Utilities', name: 'Electric', description: 'Electricity bills' },
      { parentCategory: 'Utilities', name: 'Internet & Phone', description: 'Internet, cable, mobile phone bills' },
      { parentCategory: 'Utilities', name: 'Water & Sewer', description: 'Water and waste management' },
      { parentCategory: 'Utilities', name: 'Insurance', description: 'Home, auto, life insurance' }
    ];

    for (const subcategory of subcategories) {
      const parentCategoryId = categoryMap.get(subcategory.parentCategory);
      if (parentCategoryId) {
        const subcategoryId = generateId();
        await client.query(
          'INSERT INTO "SubCategory" (id, name, description, "parentCategoryId", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
          [subcategoryId, subcategory.name, subcategory.description, parentCategoryId]
        );
      }
    }
    
    console.log('✅ Created subcategories');

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
    const subcategoryCount = await client.query('SELECT COUNT(*) FROM "SubCategory"');

    const result = {
      success: true,
      message: 'Database seeded successfully with comprehensive benefits!',
      counts: {
        creditCards: parseInt(cardCount.rows[0].count),
        categoryRewards: parseInt(rewardCount.rows[0].count),
        benefits: parseInt(benefitCount.rows[0].count),
        categories: parseInt(categoryCount.rows[0].count),
        subcategories: parseInt(subcategoryCount.rows[0].count)
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