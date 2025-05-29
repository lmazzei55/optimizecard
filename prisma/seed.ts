import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create spending categories
  const categories = [
    { name: 'Dining', description: 'Restaurants, bars, and food delivery' },
    { name: 'Travel', description: 'Airlines, hotels, and travel expenses' },
    { name: 'Gas', description: 'Gas stations and fuel' },
    { name: 'Groceries', description: 'Supermarkets and grocery stores' },
    { name: 'Online Shopping', description: 'E-commerce and online purchases' },
    { name: 'Entertainment', description: 'Movies, streaming, and entertainment' },
    { name: 'Utilities', description: 'Phone, internet, and utility bills' },
    { name: 'Other', description: 'All other purchases' },
  ]

  console.log('Creating spending categories...')
  for (const category of categories) {
    await prisma.spendingCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Get category IDs for creating card rewards
  const diningCategory = await prisma.spendingCategory.findUnique({ where: { name: 'Dining' } })
  const travelCategory = await prisma.spendingCategory.findUnique({ where: { name: 'Travel' } })
  const gasCategory = await prisma.spendingCategory.findUnique({ where: { name: 'Gas' } })
  const groceriesCategory = await prisma.spendingCategory.findUnique({ where: { name: 'Groceries' } })
  const onlineCategory = await prisma.spendingCategory.findUnique({ where: { name: 'Online Shopping' } })
  const entertainmentCategory = await prisma.spendingCategory.findUnique({ where: { name: 'Entertainment' } })

  // Create popular credit cards
  console.log('Creating credit cards...')

  // Chase Sapphire Preferred
  const sapphirePreferred = await prisma.creditCard.upsert({
    where: { id: 'chase-sapphire-preferred' },
    update: {},
    create: {
      id: 'chase-sapphire-preferred',
      name: 'Chase Sapphire Preferred',
      issuer: 'Chase',
      annualFee: 95,
      baseReward: 0.01,
      rewardType: 'points',
      pointValue: 0.0125, // 1.25 cents per point
      signupBonus: 60000,
      signupSpend: 4000,
      signupTimeframe: 3,
    },
  })

  // Chase Sapphire Reserve
  const sapphireReserve = await prisma.creditCard.upsert({
    where: { id: 'chase-sapphire-reserve' },
    update: {},
    create: {
      id: 'chase-sapphire-reserve',
      name: 'Chase Sapphire Reserve',
      issuer: 'Chase',
      annualFee: 550,
      baseReward: 0.01,
      rewardType: 'points',
      pointValue: 0.015, // 1.5 cents per point
      signupBonus: 60000,
      signupSpend: 4000,
      signupTimeframe: 3,
    },
  })

  // Chase Freedom Unlimited
  const freedomUnlimited = await prisma.creditCard.upsert({
    where: { id: 'chase-freedom-unlimited' },
    update: {},
    create: {
      id: 'chase-freedom-unlimited',
      name: 'Chase Freedom Unlimited',
      issuer: 'Chase',
      annualFee: 0,
      baseReward: 0.015,
      rewardType: 'cashback',
      signupBonus: 200,
      signupSpend: 500,
      signupTimeframe: 3,
    },
  })

  // Capital One Venture X
  const ventureX = await prisma.creditCard.upsert({
    where: { id: 'capital-one-venture-x' },
    update: {},
    create: {
      id: 'capital-one-venture-x',
      name: 'Capital One Venture X',
      issuer: 'Capital One',
      annualFee: 395,
      baseReward: 0.02,
      rewardType: 'points',
      pointValue: 0.01,
      signupBonus: 75000,
      signupSpend: 4000,
      signupTimeframe: 3,
    },
  })

  // American Express Gold
  const amexGold = await prisma.creditCard.upsert({
    where: { id: 'amex-gold' },
    update: {},
    create: {
      id: 'amex-gold',
      name: 'American Express Gold',
      issuer: 'American Express',
      annualFee: 250,
      baseReward: 0.01,
      rewardType: 'points',
      pointValue: 0.01,
      signupBonus: 60000,
      signupSpend: 4000,
      signupTimeframe: 6,
    },
  })

  // Citi Double Cash
  const citiDoubleCash = await prisma.creditCard.upsert({
    where: { id: 'citi-double-cash' },
    update: {},
    create: {
      id: 'citi-double-cash',
      name: 'Citi Double Cash',
      issuer: 'Citi',
      annualFee: 0,
      baseReward: 0.02,
      rewardType: 'cashback',
    },
  })

  // Discover it Cash Back
  const discoverIt = await prisma.creditCard.upsert({
    where: { id: 'discover-it-cash-back' },
    update: {},
    create: {
      id: 'discover-it-cash-back',
      name: 'Discover it Cash Back',
      issuer: 'Discover',
      annualFee: 0,
      baseReward: 0.01,
      rewardType: 'cashback',
      signupBonus: 0, // First year cashback match
    },
  })

  // Wells Fargo Active Cash
  const wellsActiveCash = await prisma.creditCard.upsert({
    where: { id: 'wells-fargo-active-cash' },
    update: {},
    create: {
      id: 'wells-fargo-active-cash',
      name: 'Wells Fargo Active Cash',
      issuer: 'Wells Fargo',
      annualFee: 0,
      baseReward: 0.02,
      rewardType: 'cashback',
      signupBonus: 200,
      signupSpend: 1000,
      signupTimeframe: 3,
    },
  })

  // Create category rewards
  console.log('Creating category rewards...')

  // Chase Sapphire Preferred rewards
  if (diningCategory && travelCategory) {
    await prisma.categoryReward.upsert({
      where: { cardId_categoryId: { cardId: sapphirePreferred.id, categoryId: diningCategory.id } },
      update: {},
      create: { cardId: sapphirePreferred.id, categoryId: diningCategory.id, rewardRate: 3.0 },
    })
    await prisma.categoryReward.upsert({
      where: { cardId_categoryId: { cardId: sapphirePreferred.id, categoryId: travelCategory.id } },
      update: {},
      create: { cardId: sapphirePreferred.id, categoryId: travelCategory.id, rewardRate: 2.0 },
    })
  }

  // Chase Sapphire Reserve rewards
  if (diningCategory && travelCategory) {
    await prisma.categoryReward.upsert({
      where: { cardId_categoryId: { cardId: sapphireReserve.id, categoryId: diningCategory.id } },
      update: {},
      create: { cardId: sapphireReserve.id, categoryId: diningCategory.id, rewardRate: 3.0 },
    })
    await prisma.categoryReward.upsert({
      where: { cardId_categoryId: { cardId: sapphireReserve.id, categoryId: travelCategory.id } },
      update: {},
      create: { cardId: sapphireReserve.id, categoryId: travelCategory.id, rewardRate: 3.0 },
    })
  }

  // American Express Gold rewards
  if (diningCategory && groceriesCategory) {
    await prisma.categoryReward.upsert({
      where: { cardId_categoryId: { cardId: amexGold.id, categoryId: diningCategory.id } },
      update: {},
      create: { cardId: amexGold.id, categoryId: diningCategory.id, rewardRate: 4.0 },
    })
    await prisma.categoryReward.upsert({
      where: { cardId_categoryId: { cardId: amexGold.id, categoryId: groceriesCategory.id } },
      update: {},
      create: { cardId: amexGold.id, categoryId: groceriesCategory.id, rewardRate: 4.0, maxReward: 25000, period: 'yearly' },
    })
  }

  // Discover it rotating categories (example: Q1 Gas)
  if (gasCategory) {
    await prisma.categoryReward.upsert({
      where: { cardId_categoryId: { cardId: discoverIt.id, categoryId: gasCategory.id } },
      update: {},
      create: { cardId: discoverIt.id, categoryId: gasCategory.id, rewardRate: 5.0, maxReward: 75, period: 'quarterly' },
    })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 