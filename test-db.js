const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check if SpendingCategory table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SpendingCategory'
      );
    `;
    console.log('SpendingCategory table exists:', tableExists[0].exists);
    
    // Try to count categories
    const count = await prisma.spendingCategory.count();
    console.log('Categories count:', count);
    
    // Try to fetch categories
    const categories = await prisma.spendingCategory.findMany({
      take: 3
    });
    console.log('Sample categories:', categories.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 