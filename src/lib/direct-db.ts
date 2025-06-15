import { Pool, PoolClient } from 'pg'

// Create a connection pool for direct PostgreSQL access
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }
  return pool
}

// Execute a query with automatic connection management
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  const pool = getPool()
  let client: PoolClient | null = null
  
  try {
    client = await pool.connect()
    const result = await client.query(query, params)
    return result.rows as T[]
  } catch (error: any) {
    console.error('❌ Direct DB query failed:', error.message)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Get credit cards with category rewards and benefits
export async function getCreditCardsWithRewards(options: {
  rewardType?: string
  tier?: string
  isActive?: boolean
}) {
  const { rewardType, tier, isActive = true } = options
  
  let whereConditions = ['c."isActive" = $1']
  let params: any[] = [isActive]
  let paramIndex = 2

  if (rewardType) {
    whereConditions.push(`c."rewardType" = $${paramIndex}`)
    params.push(rewardType)
    paramIndex++
  }

  if (tier) {
    whereConditions.push(`c."tier" = $${paramIndex}`)
    params.push(tier)
    paramIndex++
  }

  const whereClause = whereConditions.join(' AND ')

  const query = `
    SELECT 
      c.id,
      c.name,
      c.issuer,
      c."annualFee",
      c."rewardType",
      c."baseReward",
      c."applicationUrl",
      c."signupBonus",
      c."signupSpend",
      c."signupTimeframe"
    FROM "CreditCard" c
    WHERE ${whereClause}
    ORDER BY c.name
  `

  return executeQuery(query, params)
}

// Get category rewards for a specific card
export async function getCategoryRewards(cardId: string) {
  const query = `
    SELECT 
      cr.id,
      cr."rewardRate",
      cr."maxReward",
      cr.period,
      sc.name as "categoryName",
      sub.name as "subCategoryName"
    FROM "CategoryReward" cr
    LEFT JOIN "SpendingCategory" sc ON cr."categoryId" = sc.id
    LEFT JOIN "SubCategory" sub ON cr."subCategoryId" = sub.id
    WHERE cr."cardId" = $1
  `

  return executeQuery(query, [cardId])
}

// Get benefits for a specific card
export async function getCardBenefits(cardId: string) {
  const query = `
    SELECT 
      cb.name,
      cb.description,
      cb."annualValue",
      cb.category,
      cb."isRecurring"
    FROM "CardBenefit" cb
    WHERE cb."cardId" = $1
  `

  return executeQuery(query, [cardId])
}

// Get all spending categories
export async function getSpendingCategories() {
  const query = `
    SELECT 
      sc.id,
      sc.name,
      sc.description
    FROM "SpendingCategory" sc
    ORDER BY sc.name
  `

  return executeQuery(query)
}

// Health check for direct database connection
export async function checkDatabaseHealth() {
  try {
    const result = await executeQuery('SELECT NOW() as current_time')
    return {
      status: 'healthy',
      timestamp: result[0]?.current_time,
      connection: 'direct'
    }
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
      connection: 'direct'
    }
  }
}

// Graceful shutdown
export async function closeDatabasePool() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('✅ Database pool closed')
  }
} 