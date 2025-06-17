const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'leoermeyor@gmail.com' },
      select: {
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        rewardPreference: true,
        pointValue: true,
        enableSubCategories: true
      }
    })
    
    console.log('User data:', user)
    
    if (user) {
      // Update to premium if needed
      const updated = await prisma.user.update({
        where: { email: 'leoermeyor@gmail.com' },
        data: { subscriptionTier: 'premium' },
        select: {
          email: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          rewardPreference: true
        }
      })
      console.log('Updated user:', updated)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser() 