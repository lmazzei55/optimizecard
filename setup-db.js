const { PrismaClient } = require('./src/generated/prisma')

async function setupDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Setting up database schema...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check if User table exists
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ User table exists with ${userCount} records`)
    } catch (error) {
      console.log('❌ User table does not exist, creating schema...')
      
      // Create tables using raw SQL
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "name" TEXT,
          "image" TEXT,
          "emailVerified" TIMESTAMP(3),
          "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
          "subscriptionStatus" TEXT,
          "customerId" TEXT,
          "subscriptionId" TEXT,
          "currentPeriodEnd" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
      `
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Account" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "provider" TEXT NOT NULL,
          "providerAccountId" TEXT NOT NULL,
          "refresh_token" TEXT,
          "access_token" TEXT,
          "expires_at" INTEGER,
          "token_type" TEXT,
          "scope" TEXT,
          "id_token" TEXT,
          "session_state" TEXT,
          CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Session" (
          "id" TEXT NOT NULL,
          "sessionToken" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "VerificationToken" (
          "identifier" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL
        );
      `
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "CreditCard" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "issuer" TEXT NOT NULL,
          "network" TEXT NOT NULL,
          "annualFee" INTEGER NOT NULL DEFAULT 0,
          "signupBonus" INTEGER,
          "signupSpend" INTEGER,
          "signupTimeframe" INTEGER,
          "applicationUrl" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "RewardCategory" (
          "id" TEXT NOT NULL,
          "cardId" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "subcategory" TEXT,
          "rate" DOUBLE PRECISION NOT NULL,
          "cap" INTEGER,
          "timeframe" TEXT,
          CONSTRAINT "RewardCategory_pkey" PRIMARY KEY ("id")
        );
      `
      
      console.log('✅ Database schema created successfully')
    }
    
    console.log('🎉 Database setup complete!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase() 