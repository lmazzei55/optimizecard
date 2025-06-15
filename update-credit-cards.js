const { PrismaClient } = require('./src/generated/prisma');
const creditCards = require('./src/app/api/benefits/credit-cards-list.js');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function updateCreditCards() {
  try {
    console.log('🔄 Starting credit card update with portal bonus support...');
    
    // Clear existing data
    console.log('🗑️ Clearing existing category rewards...');
    await prisma.categoryReward.deleteMany({});
    
    console.log('🗑️ Clearing existing card benefits...');
    await prisma.cardBenefit.deleteMany({});
    
    console.log('🗑️ Clearing existing credit cards...');
    await prisma.creditCard.deleteMany({});
    
    // Get categories
    const categories = await prisma.spendingCategory.findMany();
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));
    
    console.log(`📋 Found ${categories.length} spending categories`);
    
    // Create credit cards with new structure
    for (const cardData of creditCards) {
      const { categoryRewards, benefits, ...cardInfo } = cardData;
      
      console.log(`\n💳 Creating card: ${cardData.name}`);
      
      // Create the credit card
      const card = await prisma.creditCard.create({
        data: cardInfo
      });
      
      // Create category rewards with portal bonus support
      for (const reward of categoryRewards) {
        const categoryId = categoryMap.get(reward.categoryName);
        if (categoryId) {
          await prisma.categoryReward.create({
            data: {
              cardId: card.id,
              categoryId: categoryId,
              rewardRate: reward.rewardRate,
              maxReward: reward.maxReward,
              period: reward.period,
              hasPortalBonus: reward.hasPortalBonus || false,
              portalRewardRate: reward.portalRewardRate,
              portalDescription: reward.portalDescription
            }
          });
          
          const portalInfo = reward.hasPortalBonus 
            ? ` (Portal: ${(reward.portalRewardRate * 100).toFixed(1)}% - ${reward.portalDescription})`
            : '';
          console.log(`  ✅ ${reward.categoryName}: ${(reward.rewardRate * 100).toFixed(1)}%${portalInfo}`);
        } else {
          console.log(`  ⚠️ Category not found: ${reward.categoryName}`);
        }
      }
      
      // Create benefits
      for (const benefit of benefits) {
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
        console.log(`  🎁 ${benefit.name}: $${benefit.annualValue}`);
      }
    }
    
    console.log('\n🎉 Credit card update completed successfully!');
    console.log(`📊 Updated ${creditCards.length} credit cards with portal bonus support`);
    
    // Summary of portal bonuses
    const portalBonusCount = creditCards.reduce((count, card) => {
      return count + card.categoryRewards.filter(r => r.hasPortalBonus).length;
    }, 0);
    
    console.log(`🚀 Added ${portalBonusCount} portal bonus configurations`);
    
  } catch (error) {
    console.error('❌ Error updating credit cards:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateCreditCards(); 