const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
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
    
    // First, try to check if table exists
    console.log('Checking database connection...');
    
    // Try a simple query first
    const result = await prisma.$queryRaw`SELECT current_database()`;
    console.log('Connected to database:', result[0].current_database);
    
    // Check if categories already exist
    const existingCount = await prisma.spendingCategory.count();
    console.log(`Found ${existingCount} existing categories`);
    
    if (existingCount === 0) {
      console.log('Creating categories...');
      
      for (const category of categories) {
        const created = await prisma.spendingCategory.create({
          data: category
        });
        console.log(`✅ Created category: ${created.name}`);
      }
      
      console.log('🎉 All categories created successfully!');
    } else {
      console.log('Categories already exist, listing them:');
      const existing = await prisma.spendingCategory.findMany();
      existing.forEach(cat => console.log(`- ${cat.name}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P2002') {
      console.log('Categories already exist (unique constraint)');
    } else if (error.code === 'P2021') {
      console.log('Table does not exist - need to run migrations');
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories(); 