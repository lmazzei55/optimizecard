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
      { categoryName: 'Travel', rewardRate: 0.03 },
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
      },
      {
        name: 'Global Entry Credit',
        description: '$100 Global Entry/TSA PreCheck credit every 4 years',
        annualValue: 25,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'DashPass Credit',
        description: 'Complimentary DashPass membership',
        annualValue: 96,
        category: 'dining',
        isRecurring: true
      },
      {
        name: 'Lyft Credit',
        description: '$60 annual Lyft credit',
        annualValue: 60,
        category: 'transportation',
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
      { categoryName: 'Travel', rewardRate: 0.05 }
    ],
    benefits: [
      {
        name: 'Uber Cash',
        description: '$200 annual Uber Cash ($15/month + $20 in December)',
        annualValue: 200,
        category: 'transportation',
        isRecurring: true
      },
      {
        name: 'Hotel Credit',
        description: '$200 annual hotel credit',
        annualValue: 200,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Centurion Lounge Access',
        description: 'Access to Centurion Lounges and Priority Pass',
        annualValue: 550,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Clear Credit',
        description: '$189 annual Clear membership credit',
        annualValue: 189,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Digital Entertainment Credit',
        description: '$240 annual digital entertainment credit ($20/month)',
        annualValue: 240,
        category: 'entertainment',
        isRecurring: true
      },
      {
        name: 'Airline Fee Credit',
        description: '$200 annual airline incidental fee credit',
        annualValue: 200,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Global Entry Credit',
        description: '$100 Global Entry/TSA PreCheck credit every 4 years',
        annualValue: 25,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Saks Credit',
        description: '$100 annual Saks Fifth Avenue credit',
        annualValue: 100,
        category: 'shopping',
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
      { categoryName: 'Travel', rewardRate: 0.02 },
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
      },
      {
        name: 'DashPass Credit',
        description: 'Complimentary DashPass membership',
        annualValue: 96,
        category: 'dining',
        isRecurring: true
      },
      {
        name: 'Travel Protection',
        description: 'Trip cancellation/interruption insurance',
        annualValue: 50,
        category: 'insurance',
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
      { categoryName: 'Travel', rewardRate: 0.03 }
    ],
    benefits: [
      {
        name: 'Uber Cash',
        description: '$120 annual Uber Cash ($10/month)',
        annualValue: 120,
        category: 'transportation',
        isRecurring: true
      },
      {
        name: 'Dining Credit',
        description: '$120 annual dining credit',
        annualValue: 120,
        category: 'dining',
        isRecurring: true
      },
      {
        name: 'Resy Credit',
        description: '$100 annual Resy credit',
        annualValue: 100,
        category: 'dining',
        isRecurring: true
      }
    ]
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One',
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
      { categoryName: 'Travel', rewardRate: 0.05 }
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
      },
      {
        name: 'Global Entry Credit',
        description: '$100 Global Entry/TSA PreCheck credit every 4 years',
        annualValue: 25,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Anniversary Bonus',
        description: '10,000 bonus miles on account anniversary',
        annualValue: 100,
        category: 'bonus',
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
      { categoryName: 'Travel', rewardRate: 0.02 }
    ],
    benefits: [
      {
        name: 'Global Entry Credit',
        description: '$100 Global Entry/TSA PreCheck credit every 4 years',
        annualValue: 25,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Travel Protection',
        description: 'Trip cancellation/interruption insurance',
        annualValue: 50,
        category: 'insurance',
        isRecurring: true
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
    benefits: [
      {
        name: 'Purchase Protection',
        description: 'Purchase protection and extended warranty',
        annualValue: 25,
        category: 'insurance',
        isRecurring: true
      }
    ]
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
    benefits: [
      {
        name: 'Purchase Protection',
        description: 'Purchase protection and extended warranty',
        annualValue: 25,
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
    baseReward: 0.02,
    rewardType: 'cashback',
    applicationUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [],
    benefits: [
      {
        name: 'Citi Price Rewind',
        description: 'Price protection for purchases',
        annualValue: 50,
        category: 'shopping',
        isRecurring: true
      }
    ]
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
      },
      {
        name: 'Zero Liability Protection',
        description: 'Fraud protection for unauthorized transactions',
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
      },
      {
        name: 'FICO Credit Score',
        description: 'Free FICO credit score monitoring',
        annualValue: 60,
        category: 'financial',
        isRecurring: true
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
    benefits: [
      {
        name: 'Purchase Protection',
        description: 'Purchase protection and extended warranty',
        annualValue: 50,
        category: 'insurance',
        isRecurring: true
      },
      {
        name: 'Return Protection',
        description: 'Return protection for eligible purchases',
        annualValue: 25,
        category: 'shopping',
        isRecurring: true
      }
    ]
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
    benefits: [
      {
        name: 'Purchase Protection',
        description: 'Purchase protection and extended warranty',
        annualValue: 25,
        category: 'insurance',
        isRecurring: true
      }
    ]
  }
];

module.exports = creditCards;
  