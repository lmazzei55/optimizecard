const creditCards = [
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 550,
    tier: 'premium',
    baseReward: 0.01, // 1x on general purchases
    rewardType: 'points',
    pointValue: 0.015, // 1.5¢ when redeemed via Chase Travel
    applicationUrl: 'https://creditcards.chase.com/travel-credit-cards/sapphire-reserve',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { 
        categoryName: 'Travel', 
        rewardRate: 0.03,
        hasPortalBonus: true,
        portalRewardRate: 0.10,
        portalDescription: 'Higher rate when booked through Chase Travel'
      },
      { categoryName: 'Dining', rewardRate: 0.03 }
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
  },
  {
    id: 'amex-platinum',
    name: 'American Express Platinum Card',
    issuer: 'American Express',
    annualFee: 695,
    tier: 'premium',
    baseReward: 0.01,
    rewardType: 'points',
    pointValue: 0.02, // 2¢ when transferred to partners
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
    signupBonus: 80000,
    signupSpend: 6000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { 
        categoryName: 'Travel', 
        rewardRate: 0.05,
        hasPortalBonus: true,
        portalRewardRate: 0.05,
        portalDescription: 'Same rate for direct bookings and AmEx Travel'
      }
    ],
    benefits: [
      {
        name: 'Annual Travel Credits',
        description: '$200 airline fee credit + $200 hotel credit',
        annualValue: 400,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Centurion Lounge Access',
        description: 'Access to Centurion Lounges and Priority Pass',
        annualValue: 550,
        category: 'travel',
        isRecurring: true
      }
    ]
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.01,
    rewardType: 'points',
    pointValue: 0.0125, // 1.25¢ when redeemed via Chase Travel
    applicationUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { 
        categoryName: 'Travel', 
        rewardRate: 0.02,
        hasPortalBonus: true,
        portalRewardRate: 0.05,
        portalDescription: 'Higher rate when booked through Chase Travel'
      },
      { categoryName: 'Dining', rewardRate: 0.02 },
      { categoryName: 'Groceries', rewardRate: 0.02 },
      { categoryName: 'Entertainment', rewardRate: 0.02 }
    ],
    benefits: [
      {
        name: 'Travel Credit',
        description: '$50 annual Ultimate Rewards hotel credit',
        annualValue: 50,
        category: 'travel',
        isRecurring: true
      }
    ]
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    annualFee: 250,
    tier: 'premium',
    baseReward: 0.01,
    rewardType: 'points',
    pointValue: 0.02,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Dining', rewardRate: 0.04 },
      { categoryName: 'Groceries', rewardRate: 0.04, maxReward: 1000, period: 'yearly' },
      { 
        categoryName: 'Travel', 
        rewardRate: 0.03,
        hasPortalBonus: false // Same rate for all travel bookings
      }
    ],
    benefits: [
      {
        name: 'Dining Credits',
        description: '$120 Uber Cash + $120 dining credit',
        annualValue: 240,
        category: 'dining',
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
    baseReward: 0.02,
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { 
        categoryName: 'Travel', 
        rewardRate: 0.05,
        hasPortalBonus: true,
        portalRewardRate: 0.10,
        portalDescription: 'Higher rate when booked through Capital One Travel'
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
  },
  {
    id: 'capital-one-venture',
    name: 'Capital One Venture',
    issuer: 'Capital One',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.02,
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture/',
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { 
        categoryName: 'Travel', 
        rewardRate: 0.02,
        hasPortalBonus: true,
        portalRewardRate: 0.05,
        portalDescription: 'Higher rate when booked through Capital One Travel'
      }
    ],
    benefits: [
      {
        name: 'Global Entry Credit',
        description: '$100 Global Entry/TSA PreCheck credit',
        annualValue: 20, // Amortized over 5 years
        category: 'travel',
        isRecurring: false
      }
    ]
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.015,
    rewardType: 'cashback',
    applicationUrl: 'https://creditcards.chase.com/cash-back-credit-cards/freedom-unlimited',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Groceries', rewardRate: 0.03 },
      { categoryName: 'Gas', rewardRate: 0.03 }
    ],
    benefits: []
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    applicationUrl: 'https://creditcards.chase.com/cash-back-credit-cards/freedom-flex',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Groceries', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Gas', rewardRate: 0.05, maxReward: 75, period: 'quarterly' }
    ],
    benefits: []
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash Card',
    issuer: 'Citi',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.02,
    rewardType: 'cashback',
    applicationUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [],
    benefits: []
  },
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash Card',
    issuer: 'Wells Fargo',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.02,
    rewardType: 'cashback',
    applicationUrl: 'https://www.wellsfargo.com/credit-cards/active-cash/',
    signupBonus: 200,
    signupSpend: 1000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [],
    benefits: [
      {
        name: 'Cell Phone Protection',
        description: 'Up to $600 protection for cell phone damage/theft',
        annualValue: 25,
        category: 'insurance',
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
    baseReward: 0.01,
    rewardType: 'cashback',
    applicationUrl: 'https://www.discover.com/credit-cards/cash-back/it-card.html',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Gas', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Groceries', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Entertainment', rewardRate: 0.05, maxReward: 75, period: 'quarterly' }
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
    id: 'amex-blue-cash-preferred',
    name: 'American Express Blue Cash Preferred',
    issuer: 'American Express',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.01,
    rewardType: 'cashback',
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/',
    signupBonus: 350,
    signupSpend: 3000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Groceries', rewardRate: 0.06, maxReward: 360, period: 'yearly' },
      { categoryName: 'Entertainment', rewardRate: 0.06, maxReward: 360, period: 'yearly' },
      { categoryName: 'Gas', rewardRate: 0.03 }
    ],
    benefits: []
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'American Express Blue Cash Everyday',
    issuer: 'American Express',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/',
    signupBonus: 200,
    signupSpend: 2000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Groceries', rewardRate: 0.03, maxReward: 180, period: 'yearly' },
      { categoryName: 'Gas', rewardRate: 0.02 }
    ],
    benefits: []
  }
];

module.exports = creditCards;
  