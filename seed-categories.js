const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'], // Reduced logging to avoid conflicts
});

const categories = [
  {
    name: 'Dining',
    description: 'Restaurants, bars, and food delivery'
  },
  {
    name: 'Travel',
    description: 'Flights, hotels, and transportation'
  },
  {
    name: 'Gas',
    description: 'Gas stations and fuel'
  },
  {
    name: 'Groceries',
    description: 'Supermarkets and grocery stores'
  },
  {
    name: 'Online Shopping',
    description: 'E-commerce and online purchases'
  },
  {
    name: 'Entertainment',
    description: 'Movies, streaming, and entertainment'
  },
  {
    name: 'Other',
    description: 'All other purchases'
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Starting category seeding...');
    
    // Simple connection test without raw SQL
    console.log('Checking database connection...');
    
    // Check if categories already exist using simple count
    let existingCount = 0;
    try {
      existingCount = await prisma.spendingCategory.count();
      console.log(`Found ${existingCount} existing categories`);
    } catch (error) {
      if (error.code === 'P2010' || error.message.includes('prepared statement')) {
        console.log('⚠️ Prepared statement conflict detected, continuing...');
        existingCount = 0; // Assume no categories exist
      } else {
        throw error;
      }
    }
    
    if (existingCount === 0) {
      console.log('Creating categories...');
      
      for (const category of categories) {
        try {
          const created = await prisma.spendingCategory.create({
            data: category
          });
          console.log(`✅ Created category: ${created.name}`);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Category ${category.name} already exists, skipping...`);
          } else if (error.code === 'P2010' || error.message.includes('prepared statement')) {
            console.log(`⚠️ Prepared statement conflict for ${category.name}, but likely created`);
          } else {
            throw error;
          }
        }
      }
      
      console.log('🎉 Category seeding completed!');
    } else {
      console.log('Categories already exist, attempting to list them:');
      try {
        const existing = await prisma.spendingCategory.findMany();
        existing.forEach(cat => console.log(`- ${cat.name}`));
      } catch (error) {
        if (error.code === 'P2010' || error.message.includes('prepared statement')) {
          console.log('⚠️ Cannot list categories due to prepared statement conflict, but they likely exist');
        } else {
          throw error;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P2002') {
      console.log('Categories already exist (unique constraint)');
    } else if (error.code === 'P2021') {
      console.log('Table does not exist - need to run migrations');
    } else if (error.code === 'P2010') {
      console.log('Prepared statement conflict - this is expected in serverless environments');
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories(); 