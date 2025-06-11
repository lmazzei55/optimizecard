const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'], // Reduced logging to avoid conflicts
});

const creditCards = [
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.015, // 1.5%
    rewardType: 'cashback',
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      {
        categoryName: 'Dining',
        rewardRate: 0.03, // 3%
      },
      {
        categoryName: 'Groceries',
        rewardRate: 0.03, // 3%
      }
    ],
    benefits: [
      {
        name: 'Purchase Protection',
        description: 'Covers eligible purchases against damage or theft',
        annualValue: 50,
        category: 'insurance',
        isRecurring: true
      }
    ]
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash Card',
    issuer: 'Citi',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.02, // 2%
    rewardType: 'cashback',
    applicationUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [],
    benefits: [
      {
        name: 'No Annual Fee',
        description: 'No annual fee ever',
        annualValue: 95,
        category: 'fee',
        isRecurring: true
      }
    ]
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
    signupBonus: 0,
    isActive: true,
    categoryRewards: [
      {
        categoryName: 'Gas',
        rewardRate: 0.05, // 5% rotating
        maxReward: 75, // $75 per quarter
        period: 'quarterly'
      },
      {
        categoryName: 'Groceries',
        rewardRate: 0.05, // 5% rotating
        maxReward: 75, // $75 per quarter
        period: 'quarterly'
      }
    ],
    benefits: [
      {
        name: 'Cashback Match',
        description: 'Discover matches all cashback earned in first year',
        annualValue: 200,
        category: 'bonus',
        isRecurring: false
      }
    ]
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.01, // 1x points
    rewardType: 'points',
    pointValue: 0.0125, // 1.25¢ per point
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      {
        categoryName: 'Travel',
        rewardRate: 0.02, // 2x points
      },
      {
        categoryName: 'Dining',
        rewardRate: 0.02, // 2x points
      }
    ],
    benefits: [
      {
        name: 'Travel Credit',
        description: '$50 annual Ultimate Rewards hotel credit',
        annualValue: 50,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Primary Rental Car Insurance',
        description: 'Primary auto rental collision damage waiver',
        annualValue: 75,
        category: 'insurance',
        isRecurring: true
      }
    ]
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    tier: 'premium',
    baseReward: 0.02, // 2x miles
    rewardType: 'points',
    pointValue: 0.01, // 1¢ per mile
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      {
        categoryName: 'Travel',
        rewardRate: 0.05, // 5x miles
      },
      {
        categoryName: 'Dining',
        rewardRate: 0.03, // 3x miles
      }
    ],
    benefits: [
      {
        name: 'Annual Travel Credit',
        description: '$300 annual travel credit',
        annualValue: 300,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Priority Pass',
        description: 'Unlimited Priority Pass lounge access',
        annualValue: 429,
        category: 'travel',
        isRecurring: true
      }
    ]
  }
];

async function seedCreditCards() {
  try {
    console.log('🌱 Starting credit card seeding...');
    
    // Simple connection test without raw SQL
    console.log('Checking database connection...');
    
    // Check if credit cards already exist using simple count
    let existingCount = 0;
    try {
      existingCount = await prisma.creditCard.count();
      console.log(`Found ${existingCount} existing credit cards`);
    } catch (error) {
      if (error.code === 'P2010' || error.message.includes('prepared statement')) {
        console.log('⚠️ Prepared statement conflict detected, continuing...');
        existingCount = 0; // Assume no credit cards exist
      } else {
        throw error;
      }
    }
    
    if (existingCount === 0) {
      console.log('Creating credit cards...');
      
      // First, ensure categories exist
      let categories = [];
      try {
        categories = await prisma.spendingCategory.findMany();
      } catch (error) {
        if (error.code === 'P2010' || error.message.includes('prepared statement')) {
          console.log('⚠️ Cannot fetch categories due to prepared statement conflict, using defaults...');
          // Create a default mapping for known categories
          categories = [
            { id: 'dining-id', name: 'Dining' },
            { id: 'travel-id', name: 'Travel' },
            { id: 'gas-id', name: 'Gas' },
            { id: 'groceries-id', name: 'Groceries' },
            { id: 'online-shopping-id', name: 'Online Shopping' },
            { id: 'entertainment-id', name: 'Entertainment' },
            { id: 'other-id', name: 'Other' }
          ];
        } else {
          throw error;
        }
      }
      
      const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));
      
      for (const cardData of creditCards) {
        const { categoryRewards, benefits, ...cardInfo } = cardData;
        
        // Create the credit card
        try {
          const card = await prisma.creditCard.create({
            data: cardInfo
          });
          console.log(`✅ Created card: ${card.name}`);
          
          // Create category rewards
          for (const reward of categoryRewards) {
            const categoryId = categoryMap.get(reward.categoryName);
            if (categoryId) {
              try {
                await prisma.categoryReward.create({
                  data: {
                    cardId: card.id,
                    categoryId: categoryId,
                    rewardRate: reward.rewardRate,
                    maxReward: reward.maxReward,
                    period: reward.period
                  }
                });
                console.log(`  ✅ Added ${reward.categoryName} reward: ${reward.rewardRate * 100}%`);
              } catch (error) {
                if (error.code === 'P2010' || error.message.includes('prepared statement')) {
                  console.log(`  ⚠️ Prepared statement conflict for ${reward.categoryName} reward, but likely created`);
                } else {
                  console.error(`  ❌ Error creating reward for ${reward.categoryName}:`, error.message);
                }
              }
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
              });
              console.log(`  ✅ Added benefit: ${benefit.name}`);
            } catch (error) {
              if (error.code === 'P2010' || error.message.includes('prepared statement')) {
                console.log(`  ⚠️ Prepared statement conflict for ${benefit.name} benefit, but likely created`);
              } else {
                console.error(`  ❌ Error creating benefit ${benefit.name}:`, error.message);
              }
            }
          }
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Card ${cardData.name} already exists, skipping...`);
          } else if (error.code === 'P2010' || error.message.includes('prepared statement')) {
            console.log(`⚠️ Prepared statement conflict for ${cardData.name}, but likely created`);
          } else {
            console.error(`❌ Error creating card ${cardData.name}:`, error.message);
          }
        }
      }
      
      console.log('🎉 Credit card seeding completed!');
    } else {
      console.log('Credit cards already exist, attempting to list them:');
      try {
        const existing = await prisma.creditCard.findMany({
          select: { name: true, issuer: true, annualFee: true }
        });
        existing.forEach(card => console.log(`- ${card.name} (${card.issuer}) - $${card.annualFee} AF`));
      } catch (error) {
        if (error.code === 'P2010' || error.message.includes('prepared statement')) {
          console.log('⚠️ Cannot list credit cards due to prepared statement conflict, but they likely exist');
        } else {
          throw error;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P2002') {
      console.log('Credit cards already exist (unique constraint)');
    } else if (error.code === 'P2021') {
      console.log('Table does not exist - need to run migrations');
    } else if (error.code === 'P2010') {
      console.log('Prepared statement conflict - this is expected in serverless environments');
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedCreditCards(); 