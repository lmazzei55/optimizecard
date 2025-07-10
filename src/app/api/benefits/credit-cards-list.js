const creditCards = [
  { //Chase Sapphire Reserve
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
  { //American Express Platinum
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
  { //Chase Sapphire Preferred
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
  { //American Express Gold
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
  { //Capital One Venture X
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
  { //Capital One Venture
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
  { //Chase Freedom Unlimited
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
  { //Chase Freedom Flex
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
  { //Citi Double Cash
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
  { //Wells Fargo Active Cash
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
  { //Discover it Cash Back
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
  { //American Express Blue Cash Preferred
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
  { //American Express Blue Cash Everyday
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
  },
  { //Citi Premier
    id: 'citi-premier',
    name: 'Citi Premier Card',
    issuer: 'Citi',
    annualFee: 95,
    tier: 'mid-tier',
    baseReward: 0.01,
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.citi.com/credit-cards/citi-premier-credit-card',
    signupBonus: 60000,
    signupSpend: 4000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Air Travel', rewardRate: 0.03 },
      { categoryName: 'Hotels', rewardRate: 0.03 },
      { categoryName: 'Restaurants', rewardRate: 0.03 },
      { categoryName: 'Supermarkets', rewardRate: 0.03 },
      { categoryName: 'Gas Stations', rewardRate: 0.03 }
    ],
    benefits: [
      {
        name: 'Annual Hotel Benefit',
        description: '$100 off a hotel stay of $500+ once per year through ThankYou Rewards',
        annualValue: 100,
        category: 'travel',
        isRecurring: true
      }
    ]
  },
  { //Bank of America Customized Cash Rewards
    id: 'bofa-customized-cash',
    name: 'Bank of America Customized Cash Rewards',
    issuer: 'Bank of America',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/',
    signupBonus: 200,
    signupSpend: 1000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Choice Category (e.g. Online Shopping, Dining, Travel)', rewardRate: 0.03, maxReward: 75, period: 'monthly' },
      { categoryName: 'Grocery Stores & Wholesale Clubs', rewardRate: 0.02, maxReward: 75, period: 'monthly' }
    ],
    benefits: [
      {
        name: 'Preferred Rewards Bonus',
        description: 'Up to 75% more cashback if you’re a Bank of America Preferred Rewards member',
        annualValue: 300,
        category: 'rewards',
        isRecurring: true
      }
    ]
  },
  { //U.S. Bank Cash+
    id: 'usbank-cash-plus',
    name: 'U.S. Bank Cash+ Visa Signature Card',
    issuer: 'U.S. Bank',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.usbank.com/credit-cards/cash-plus-visa-signature-credit-card.html',
    signupBonus: 200,
    signupSpend: 1000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: '2 chosen categories (quarterly)', rewardRate: 0.05, maxReward: 100, period: 'quarterly' },
      { categoryName: '1 everyday category (year-round)', rewardRate: 0.02 }
    ],
    benefits: [
      {
        name: 'Custom Rewards',
        description: 'Choose your 5% and 2% categories quarterly',
        annualValue: 300,
        category: 'rewards',
        isRecurring: true
      }
    ]
  },
  { //PenFed Power Cash
    id: 'penfed-power-cash',
    name: 'PenFed Power Cash Rewards Visa Signature Card',
    issuer: 'PenFed Credit Union',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.015,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.penfed.org/credit-cards/power-cash-rewards',
    signupBonus: 100,
    signupSpend: 1500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [],
    benefits: [
      {
        name: 'PenFed Honors Advantage Boost',
        description: 'Earn 2% cashback if you are a PenFed Honors Advantage member',
        annualValue: 100,
        category: 'rewards',
        isRecurring: true
      }
    ]
  },
  { //Apple Card
    id: 'apple-card',
    name: 'Apple Card',
    issuer: 'Goldman Sachs',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.apple.com/apple-card/',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Apple Purchases', rewardRate: 0.03 },
      { categoryName: 'Apple Pay Purchases', rewardRate: 0.02 },
      { categoryName: 'Other Purchases', rewardRate: 0.01 }
    ],
    benefits: [
      {
        name: 'Daily Cash',
        description: 'Cashback is delivered daily, not monthly',
        annualValue: 150,
        category: 'rewards',
        isRecurring: true
      },
      {
        name: 'No Fees',
        description: 'No annual, foreign transaction, or late fees',
        annualValue: 0,
        category: 'finance',
        isRecurring: true
      }
    ]
  },
  { //Amazon Prime Rewards
    id: 'amazon-prime-rewards',
    name: 'Amazon Prime Rewards Visa Signature Card',
    issuer: 'Chase',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.amazon.com/creditcard',
    signupBonus: 100,
    signupSpend: 0,
    signupTimeframe: 0,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Amazon & Whole Foods', rewardRate: 0.05 },
      { categoryName: 'Restaurants', rewardRate: 0.02 },
      { categoryName: 'Gas Stations', rewardRate: 0.02 },
      { categoryName: 'Drugstores', rewardRate: 0.02 }
    ],
    benefits: [
      {
        name: 'Visa Signature Benefits',
        description: 'Includes travel, shopping, and purchase protection perks',
        annualValue: 50,
        category: 'protection',
        isRecurring: true
      }
    ]
  },
  { //Capital One Quicksilver
    id: 'capital-one-quicksilver',
    name: 'Capital One Quicksilver Cash Rewards Credit Card',
    issuer: 'Capital One',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.015,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.capitalone.com/credit-cards/quicksilver/',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [],
    benefits: [
      {
        name: 'No Foreign Transaction Fees',
        description: 'Ideal for international use without extra charges',
        annualValue: 50,
        category: 'travel',
        isRecurring: true
      }
    ]
  },
  { //Citi Custom Cash
    id: 'citi-custom-cash',
    name: 'Citi Custom Cash Card',
    issuer: 'Citi',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.citi.com/credit-cards/custom-cash-credit-card/',
    signupBonus: 200,
    signupSpend: 1500,
    signupTimeframe: 6,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Top Eligible Spending Category (up to $500/mo)', rewardRate: 0.05, maxReward: 25, period: 'monthly' }
    ],
    benefits: [
      {
        name: 'Automatic 5% Bonus',
        description: 'Automatically earns 5% on your top eligible spend category each billing cycle',
        annualValue: 300,
        category: 'rewards',
        isRecurring: true
      }
    ]
  },
  { //Capital One SavorOne
    id: 'capital-one-savorone',
    name: 'Capital One SavorOne Cash Rewards Credit Card',
    issuer: 'Capital One',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.capitalone.com/credit-cards/savorone/',
    signupBonus: 200,
    signupSpend: 500,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Entertainment', rewardRate: 0.03 },
      { categoryName: 'Streaming Services', rewardRate: 0.03 },
      { categoryName: 'Grocery Stores', rewardRate: 0.03 },
      { categoryName: 'Travel', rewardRate: 0.05 }
    ],
    benefits: [
      {
        name: 'No Foreign Transaction Fees',
        description: 'Great for international travelers with no extra fees',
        annualValue: 50,
        category: 'travel',
        isRecurring: true
      }
    ]
  },
  { //Petal 2
    id: 'petal-2',
    name: 'Petal 2 Cash Back, No Fees Visa Credit Card',
    issuer: 'WebBank',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.petalcard.com/card/petal-2/',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [
      { categoryName: 'All Purchases (after 12 months)', rewardRate: 0.015 }
    ],
    benefits: [
      {
        name: 'No Fees',
        description: 'No annual, late, foreign transaction, or other fees',
        annualValue: 0,
        category: 'finance',
        isRecurring: true
      }
    ]
  },
  { //Upgrade Cash Rewards
    id: 'upgrade-cash-rewards',
    name: 'Upgrade Cash Rewards Visa',
    issuer: 'Sutton Bank',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.015,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.upgrade.com/credit-cards/cash-rewards/',
    signupBonus: 200,
    signupSpend: 1000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [],
    benefits: [
      {
        name: 'Installment Flexibility',
        description: 'Pay off balances in fixed monthly installments',
        annualValue: 0,
        category: 'finance',
        isRecurring: true
      }
    ]
  },
  { //SoFi Credit Card
    id: 'sofi-credit-card',
    name: 'SoFi Credit Card',
    issuer: 'SoFi Bank',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.02,
    rewardType: 'points',
    pointValue: 0.01,
    applicationUrl: 'https://www.sofi.com/credit-card/',
    signupBonus: 100,
    signupSpend: 1000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [],
    benefits: [
      {
        name: 'Enhanced Redemption',
        description: 'Redeem 2% value when applying rewards to SoFi products (loans, investing)',
        annualValue: 50,
        category: 'rewards',
        isRecurring: true
      },
      {
        name: 'No Foreign Transaction Fees',
        description: 'Travel globally without paying extra',
        annualValue: 50,
        category: 'travel',
        isRecurring: true
      }
    ]
  },
  { //Bilt World Elite Mastercard
    id: 'bilt-world-elite-mastercard',
    name: 'Bilt World Elite Mastercard',
    issuer: 'Bilt (Wells Fargo)',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01, // 1x on non‑bonus purchases
    rewardType: 'points',
    pointValue: 0.0125, // ~1.25¢ when redeemed via Bilt portal
    applicationUrl: 'https://www.biltrewards.com/card',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Rent Payments', rewardRate: 0.01, maxReward: 100000, period: 'yearly' },
      { categoryName: 'Dining', rewardRate: 0.03 },
      { categoryName: 'Travel (air/hotel/car)', rewardRate: 0.02 },
      { categoryName: 'Other Purchases', rewardRate: 0.01 }
    ],
    benefits: [
      {
        name: 'Rent with No Fees',
        description: 'Pay rent with no processing fee and earn points',
        annualValue: 500, // approximate value
        category: 'rewards',
        isRecurring: true
      },
      {
        name: 'Rent Day Double Points',
        description: '2× on non‑rent spending on the first of each month (up to 1,000 bonus points)',
        annualValue: 120, // 12×1000 points ×0.0125
        category: 'rewards',
        isRecurring: true
      },
      {
        name: 'Lyft Credit',
        description: '$5 monthly Lyft credit after 3 rides',
        annualValue: 60,
        category: 'travel',
        isRecurring: true
      },
      {
        name: 'Travel & Purchase Protections',
        description: 'Trip delay, cancellation, auto rental, cell phone, purchase security',
        annualValue: 200,
        category: 'protection',
        isRecurring: true
      },
      {
        name: 'Transferable Points',
        description: 'Transfer Bilt points 1:1 to 16+ airline & hotel partners',
        annualValue: 150,
        category: 'rewards',
        isRecurring: true
      }
    ]
  },
  { //U.S. Bank Altitude Reserve
    id: 'usbank-altitude-reserve',
    name: 'U.S. Bank Altitude Reserve Visa Infinite',
    issuer: 'U.S. Bank',
    annualFee: 400,
    tier: 'premium',
    baseReward: 0.03, // 3x points on mobile wallet transactions and travel
    rewardType: 'points',
    pointValue: 0.01, // redemption value varies
    applicationUrl: 'https://www.usbank.com/credit-cards/altitude-reserve',
    signupBonus: 20000,
    signupSpend: 3000,
    signupTimeframe: 3,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Mobile Wallet Purchases', rewardRate: 0.03 },
      { categoryName: 'Airlines & Hotels', rewardRate: 0.03 }
    ],
    benefits: [
      { name: 'Annual Travel Credit', description: '$325 travel/dining credit', annualValue: 325, category: 'travel', isRecurring: true },
      { name: 'Priority Pass Select', description: 'Unlimited lounge access', annualValue: 400, category: 'travel', isRecurring: true },
      { name: 'Global Entry/TSA PreCheck Credit', description: '$100 credit every 4 years', annualValue: 25, category: 'travel', isRecurring: true },
      { name: 'No Foreign Transaction Fees', description: 'Use abroad without extra charges', annualValue: 50, category: 'travel', isRecurring: true }
    ]
  },
  { //Target RedCard (Circle Credit Card)
    id: 'target-redcard-credit',
    name: 'Target RedCard (Circle Credit Card)',
    issuer: 'Target (Citi)',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.05, // instant 5% discount at Target
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.target.com/circlecard',
    signupBonus: 50,
    signupSpend: 50,
    signupTimeframe: 2, // within 60 days
    isActive: true,
    categoryRewards: [
      { categoryName: 'Target Purchases', rewardRate: 0.05 }
    ],
    benefits: [
      { name: 'Extended Return Period', description: 'Extra 30 days for returns', annualValue: 50, category: 'shopping', isRecurring: true },
      { name: 'Free 2-Day Shipping', description: 'Most items from Target.com', annualValue: 100, category: 'shopping', isRecurring: true }
    ]
  },
  { //Costco Anywhere Visa Card by Citi
    id: 'costco-anywhere-visa',
    name: 'Costco Anywhere Visa Card by Citi',
    issuer: 'Citi (Costco)',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://www.costco.com/credit-card.html',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Gas at Costco', rewardRate: 0.05, maxReward: 7000, period: 'yearly' },
      { categoryName: 'Other Gas & EV Charging', rewardRate: 0.04, maxReward: 7000, period: 'yearly' },
      { categoryName: 'Restaurants & Eligible Travel', rewardRate: 0.03 },
      { categoryName: 'Costco Purchases', rewardRate: 0.02 },
      { categoryName: 'All Other Purchases', rewardRate: 0.01 }
    ],
    benefits: [
      { name: 'No Annual Fee', description: 'No fee with Costco membership', annualValue: 100, category: 'general', isRecurring: true },
      { name: 'No Foreign Transaction Fees', description: 'Use internationally without FTF', annualValue: 50, category: 'travel', isRecurring: true },
      { name: 'Purchase Protection', description: 'Damage/theft protection on purchases', annualValue: 200, category: 'protection', isRecurring: true }
    ]
  },
  { //Venmo Credit Card
    id: 'venmo-credit-card',
    name: 'Venmo Credit Card',
    issuer: 'Venmo (Synchrony)',
    annualFee: 0,
    tier: 'free',
    baseReward: 0.01,
    rewardType: 'cashback',
    pointValue: 0.01,
    applicationUrl: 'https://venmo.com/about/creditcard/rewards/',
    signupBonus: 0,
    isActive: true,
    categoryRewards: [
      { categoryName: 'Top Spending Category', rewardRate: 0.03 },
      { categoryName: 'Second Highest Category', rewardRate: 0.02 },
      { categoryName: 'All Other Purchases', rewardRate: 0.01 }
    ],
    benefits: [
      { name: 'No Fees', description: 'No annual or foreign transaction fees', annualValue: 0, category: 'finance', isRecurring: true },
      { name: 'App Integration & Virtual Card', description: 'In-app controls & QR code payments', annualValue: 50, category: 'technology', isRecurring: true },
      { name: 'Visa Benefits', description: 'Auto rental, fraud protection, roadside assist', annualValue: 100, category: 'protection', isRecurring: true }
    ]
  }
  
];

module.exports = creditCards;
  