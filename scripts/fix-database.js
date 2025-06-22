const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

// Updated categories to match our June 2025 design
const CATEGORIES = [
  { name: 'Dining', description: 'Restaurants, bars, and food delivery' },
  { name: 'Travel', description: 'Airlines, hotels, and travel expenses' },
  { name: 'Gas', description: 'Gas stations and fuel' },
  { name: 'Groceries', description: 'Supermarkets and grocery stores' },
  { name: 'Online Shopping', description: 'E-commerce and online purchases' },
  { name: 'Entertainment', description: 'Movies, streaming, and entertainment' },
  { name: 'Utilities', description: 'Phone, internet, and utility bills' },
  { name: 'Other', description: 'All other purchases' },
]

// Enhanced subcategories with June 2025 data
const SUBCATEGORIES = [
  // Online Shopping
  { name: 'Amazon', description: 'Amazon.com purchases', parent: 'Online Shopping' },
  { name: 'Whole Foods', description: 'Whole Foods Market', parent: 'Groceries' },
  { name: 'Walmart.com', description: 'Walmart.com purchases', parent: 'Online Shopping' },
  
  // Travel - Enhanced with portal vs direct booking distinctions
  { name: 'Flights (Direct)', description: 'Flights booked directly with airlines', parent: 'Travel' },
  { name: 'Flights (Portal)', description: 'Flights booked through credit card travel portals', parent: 'Travel' },
  { name: 'Hotels (Direct)', description: 'Hotels booked directly with hotel chains', parent: 'Travel' },
  { name: 'Hotels (Portal)', description: 'Hotels booked through credit card travel portals', parent: 'Travel' },
  { name: 'Car Rental (Direct)', description: 'Car rentals booked directly with rental companies', parent: 'Travel' },
  { name: 'Car Rental (Portal)', description: 'Car rentals booked through credit card travel portals', parent: 'Travel' },
  { name: 'Cruises', description: 'Cruise bookings and cruise lines', parent: 'Travel' },
  { name: 'Transit', description: 'Public transportation, trains, buses', parent: 'Travel' },
  { name: 'Vacation Rentals', description: 'Airbnb, VRBO, and vacation rental platforms', parent: 'Travel' },
  { name: 'Rideshare', description: 'Uber, Lyft, and other rideshare services', parent: 'Travel' },
  
  // Entertainment - Expanded
  { name: 'Streaming', description: 'Video and music streaming services', parent: 'Entertainment' },
  { name: 'Prime Video', description: 'Amazon Prime Video rentals and purchases', parent: 'Entertainment' },
  { name: 'Concerts & Events', description: 'Concert tickets, sporting events, theater', parent: 'Entertainment' },
  
  // Dining - Enhanced categories
  { name: 'Fine Dining', description: 'Upscale restaurants and fine dining establishments', parent: 'Dining' },
  { name: 'Fast Food', description: 'Quick service and fast food restaurants', parent: 'Dining' },
  { name: 'Coffee Shops', description: 'Coffee shops, cafes, and specialty coffee', parent: 'Dining' },
  { name: 'Food Delivery', description: 'Food delivery services like DoorDash, Uber Eats', parent: 'Dining' },
  { name: 'Bars & Nightlife', description: 'Bars, pubs, and nightlife establishments', parent: 'Dining' },
  
  // Groceries - More specific
  { name: 'Supermarkets', description: 'Traditional grocery stores and supermarkets', parent: 'Groceries' },
  { name: 'Warehouse Clubs', description: 'Costco, Sam\'s Club, BJ\'s Wholesale', parent: 'Groceries' },
]

async function fixDatabase() {
  console.log('🔧 Starting database fix...')
  
  try {
    // First, ensure we have the correct categories
    console.log('📝 Ensuring categories exist...')
    const categoryMap = new Map()
    
    for (const category of CATEGORIES) {
      const existing = await prisma.spendingCategory.findFirst({
        where: { name: category.name }
      })
      
      if (existing) {
        categoryMap.set(category.name, existing.id)
        console.log(`✅ Category '${category.name}' already exists`)
      } else {
        const created = await prisma.spendingCategory.create({
          data: category
        })
        categoryMap.set(category.name, created.id)
        console.log(`➕ Created category '${category.name}'`)
      }
    }
    
    // Check if SubCategory table exists by trying to count
    console.log('🔍 Checking SubCategory table...')
    try {
      const count = await prisma.subCategory.count()
      console.log(`✅ SubCategory table exists with ${count} records`)
      
      // Add subcategories
      console.log('📝 Adding subcategories...')
      for (const sub of SUBCATEGORIES) {
        const parentCategoryId = categoryMap.get(sub.parent)
        if (!parentCategoryId) {
          console.warn(`⚠️ Parent category '${sub.parent}' not found for subcategory '${sub.name}'`)
          continue
        }
        
        try {
          const existing = await prisma.subCategory.findFirst({
            where: {
              name: sub.name,
              parentCategoryId: parentCategoryId
            }
          })
          
          if (existing) {
            console.log(`✅ Subcategory '${sub.name}' already exists`)
          } else {
            await prisma.subCategory.create({
              data: {
                name: sub.name,
                description: sub.description,
                parentCategoryId: parentCategoryId
              }
            })
            console.log(`➕ Created subcategory '${sub.name}' under '${sub.parent}'`)
          }
        } catch (subError) {
          console.warn(`⚠️ Could not create subcategory '${sub.name}':`, subError.message)
        }
      }
      
    } catch (tableError) {
      console.warn('⚠️ SubCategory table may not exist or is not accessible:', tableError.message)
      console.log('📋 This is expected if the database schema hasn\'t been fully migrated yet')
    }
    
    // Test the API endpoints
    console.log('🧪 Testing API endpoints...')
    
    // Test categories
    const categories = await prisma.spendingCategory.findMany({
      orderBy: { name: 'asc' }
    })
    console.log(`✅ Categories API would return ${categories.length} categories`)
    
    // Test subcategories
    try {
      const categoriesWithSubs = await prisma.spendingCategory.findMany({
        include: {
          subCategories: {
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      })
      
      const totalSubs = categoriesWithSubs.reduce((sum, cat) => sum + (cat.subCategories?.length || 0), 0)
      console.log(`✅ Subcategories API would return ${categoriesWithSubs.length} categories with ${totalSubs} total subcategories`)
      
    } catch (subError) {
      console.warn('⚠️ Subcategories API test failed:', subError.message)
    }
    
    console.log('🎉 Database fix completed successfully!')
    
  } catch (error) {
    console.error('❌ Database fix failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixDatabase()
    .then(() => {
      console.log('✅ Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

module.exports = { fixDatabase } 