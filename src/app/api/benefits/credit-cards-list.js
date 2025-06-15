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
      { categoryName: 'Travel', subCategoryName: 'Hotels & Car Rentals (Chase Travel)', rewardRate: 0.10 },
      { categoryName: 'Travel', subCategoryName: 'Flights (Chase Travel)', rewardRate: 0.05 },
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Travel', rewardRate: 0.03 }
    ],
    benefits: [
      { name: 'Annual Travel Credit', description: '$300 statement credit for travel purchases', annualValue: 300, category: 'travel', isRecurring: true },
      { name: 'Priority Pass Select', description: 'Unlimited Priority Pass lounge access', annualValue: 429, category: 'travel', isRecurring: true },
      { name: 'Global Entry/TSA PreCheck Credit', description: '$100 credit every four years', annualValue: 25, category: 'travel', isRecurring: true },
      { name: 'Lyft & DoorDash Credits', description: 'Lyft Pink + dashPass offer', annualValue: 155, category: 'travel', isRecurring: true }
    ]
  },
  {
    id: 'amex-platinum',
    name: 'The Platinum Card from American Express',
    issuer: 'American Express',
    annualFee: 695,
    tier: 'premium',
    baseReward: 0.01, // 1x on non-travel purchases
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
    signupBonus: 80000,
    signupSpend: 8000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Travel', subCategoryName: 'Flights (Direct or AmEx Travel)', rewardRate: 0.05 },
      { categoryName: 'Travel', subCategoryName: 'Hotels (AmEx Travel)', rewardRate: 0.05 }
    ],
    benefits: [
      { name: 'Airline Fee Credit', description: '$200 airline incidental fee statement credit', annualValue: 200, category: 'travel', isRecurring: true },
      { name: 'Uber Cash', description: '$200 annual Uber credit ($15/mo, +$20 Dec)', annualValue: 200, category: 'travel', isRecurring: true },
      { name: 'Hotel Credit', description: '$200 on prepaid Fine Hotels + Resorts bookings', annualValue: 200, category: 'travel', isRecurring: true },
      { name: 'Lounge Access', description: 'Access to AMEX Centurion, Delta Sky Club, Priority Pass, etc.', annualValue: 600, category: 'travel', isRecurring: true },
      { name: 'CLEAR Credit', description: '$189 CLEAR® membership credit', annualValue: 189, category: 'travel', isRecurring: true },
      { name: 'Digital Entertainment Credit', description: '$240/year on eligible streaming', annualValue: 240, category: 'entertainment', isRecurring: true }
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
    pointValue: 0.0125, // 1.25¢ when redeemed via Chase Travel
    applicationUrl: 'https://creditcards.chase.com/travel-credit-cards/sapphire/preferred',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Travel', subCategoryName: 'Chase Travel Portal', rewardRate: 0.05 },
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Groceries', subCategoryName: 'Online Grocery', rewardRate: 0.03 },
      { categoryName: 'Entertainment', subCategoryName: 'Streaming Services', rewardRate: 0.03 },
      { categoryName: 'Travel', rewardRate: 0.02 }
    ],
    benefits: [
      { name: 'Annual Hotel Credit', description: '$50 credit on hotel stays booked through Chase Travel', annualValue: 50, category: 'travel', isRecurring: true },
      { name: 'Points Boost', description: '25% more value when points are redeemed for travel via Chase Travel', annualValue: 150, category: 'rewards', isRecurring: true }
    ]
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    annualFee: 250,
    tier: 'premium',
    baseReward: 0.01, // 1x points
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold/',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Dining', rewardRate: 0.04 },
      { categoryName: 'Groceries', subCategoryName: 'U.S. Supermarkets', rewardRate: 0.04, maxReward: 1000, period: 'yearly' },
      { categoryName: 'Travel', subCategoryName: 'Flights (Direct or AmEx)', rewardRate: 0.03 }
    ],
    benefits: [
      { name: 'Dining Credit', description: '$10/month credit at select restaurants (Grubhub, The Cheesecake Factory, etc.)', annualValue: 120, category: 'dining', isRecurring: true },
      { name: 'Uber Cash', description: '$10/month Uber Cash for rides or Eats in the U.S.', annualValue: 120, category: 'travel', isRecurring: true }
    ]
  },
  {
    id: 'capital-one-venture',
    name: 'Capital One Venture Rewards',
    issuer: 'Capital One',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.02, // 2x miles
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture/',
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Travel', subCategoryName: 'Hotels & Rental Cars (Capital One Travel)', rewardRate: 0.05 }
    ],
    benefits: [
      { name: 'Global Entry/TSA PreCheck Credit', description: 'Up to $100 statement credit for application fee every 4 years', annualValue: 25, category: 'travel', isRecurring: true },
      { name: 'Two Miles per Dollar', description: '2x miles on every purchase', annualValue: 200, category: 'rewards', isRecurring: true }
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
    pointValue: 0.01,
    applicationUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
    signupBonus: 75000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Travel', subCategoryName: 'Capital One Travel Portal', rewardRate: 0.10 },
      { categoryName: 'Travel', rewardRate: 0.05 },
      { categoryName: 'Dining', rewardRate: 0.03 }
    ],
    benefits: [
      { name: 'Annual Travel Credit', description: '$300 annual travel credit', annualValue: 300, category: 'travel', isRecurring: true },
      { name: 'Priority Pass', description: 'Unlimited Priority Pass lounge access', annualValue: 429, category: 'travel', isRecurring: true },
      { name: 'Global Entry/TSA PreCheck Credit', description: '$100 credit every 4 years', annualValue: 25, category: 'travel', isRecurring: true }
    ]
  },
  {
    id: 'citi-premier',
    name: 'Citi Premier Card',
    issuer: 'Citi',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.01, // 1x points
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.citi.com/credit-cards/citi-premier-credit-card',
    signupBonus: 80000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Travel', rewardRate: 0.03 },
      { categoryName: 'Gas', rewardRate: 0.03 },
      { categoryName: 'Groceries', rewardRate: 0.03 },
      { categoryName: 'Dining', rewardRate: 0.03 }
    ],
    benefits: [
      { name: 'Transfer Partners', description: 'Transfer points to airline and hotel partners', annualValue: 100, category: 'rewards', isRecurring: true }
    ]
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.015, // 1.5%
    rewardType: 'cashback',
    applicationUrl: 'https://creditcards.chase.com/cash-back-credit-cards/freedom-unlimited',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Pharmacies', rewardRate: 0.03 }
    ],
    benefits: [
      { name: 'Purchase Protection', description: 'Covers eligible purchases against damage or theft', annualValue: 50, category: 'insurance', isRecurring: true }
    ]
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01, // 1%
    rewardType: 'cashback',
    applicationUrl: 'https://creditcards.chase.com/cash-back-credit-cards/freedom-flex',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Pharmacies', rewardRate: 0.03 },
      { categoryName: 'Gas', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Groceries', rewardRate: 0.05, maxReward: 75, period: 'quarterly' }
    ],
    benefits: [
      { name: 'Rotating Categories', description: '5% cash back on rotating quarterly categories', annualValue: 300, category: 'rewards', isRecurring: true }
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
      { name: 'No Annual Fee', description: 'No annual fee ever', annualValue: 95, category: 'fee', isRecurring: true }
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
      { categoryName: 'Gas', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Groceries', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Restaurants', rewardRate: 0.05, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Amazon', rewardRate: 0.05, maxReward: 75, period: 'quarterly' }
    ],
    benefits: [
      { name: 'Cashback Match', description: 'Discover matches all cashback earned in first year', annualValue: 200, category: 'bonus', isRecurring: false }
    ]
  },
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash Card',
    issuer: 'Wells Fargo',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.02, // 2%
    rewardType: 'cashback',
    applicationUrl: 'https://www.wellsfargo.com/credit-cards/active-cash/',
    signupBonus: 200,
    signupSpend: 1000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [],
    benefits: [
      { name: 'No Annual Fee', description: 'No annual fee', annualValue: 95, category: 'fee', isRecurring: true },
      { name: 'Cell Phone Protection', description: 'Up to $600 protection for cell phone damage', annualValue: 100, category: 'insurance', isRecurring: true }
    ]
  },
  {
    id: 'bank-of-america-customized-cash',
    name: 'Bank of America Customized Cash Rewards',
    issuer: 'Bank of America',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01, // 1%
    rewardType: 'cashback',
    applicationUrl: 'https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/',
    signupBonus: 200,
    signupSpend: 1000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Gas', rewardRate: 0.03, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Groceries', rewardRate: 0.03, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Dining', rewardRate: 0.03, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Travel', rewardRate: 0.03, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Drug Stores', rewardRate: 0.03, maxReward: 75, period: 'quarterly' },
      { categoryName: 'Home Improvement', rewardRate: 0.03, maxReward: 75, period: 'quarterly' }
    ],
    benefits: [
      { name: 'Preferred Rewards Bonus', description: 'Up to 75% bonus with Bank of America Preferred Rewards', annualValue: 150, category: 'rewards', isRecurring: true }
    ]
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred Card from American Express',
    issuer: 'American Express',
    annualFee: 95,
    tier: 'premium',
    baseReward: 0.01, // 1%
    rewardType: 'cashback',
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/',
    signupBonus: 300,
    signupSpend: 3000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Groceries', subCategoryName: 'U.S. Supermarkets', rewardRate: 0.06, maxReward: 360, period: 'yearly' },
      { categoryName: 'Entertainment', subCategoryName: 'Streaming Services', rewardRate: 0.06, maxReward: 360, period: 'yearly' },
      { categoryName: 'Transit', rewardRate: 0.03 },
      { categoryName: 'Gas', rewardRate: 0.03 }
    ],
    benefits: [
      { name: 'High Grocery Rewards', description: '6% cash back at U.S. supermarkets up to $6,000 per year', annualValue: 360, category: 'rewards', isRecurring: true }
    ]
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday Card from American Express',
    issuer: 'American Express',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01, // 1%
    rewardType: 'cashback',
    applicationUrl: 'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/',
    signupBonus: 200,
    signupSpend: 2000,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Groceries', subCategoryName: 'U.S. Supermarkets', rewardRate: 0.03, maxReward: 180, period: 'yearly' },
      { categoryName: 'Gas', rewardRate: 0.02 },
      { categoryName: 'Department Stores', rewardRate: 0.02 }
    ],
    benefits: [
      { name: 'No Annual Fee', description: 'No annual fee', annualValue: 95, category: 'fee', isRecurring: true }
    ]
  }
];

module.exports = creditCards;
  