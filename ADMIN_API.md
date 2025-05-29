# 🔧 Admin API Documentation

This document provides comprehensive documentation for the admin API endpoints that allow you to manage credit cards, benefits, and categories programmatically.

## 🔗 Base URL
All admin endpoints are prefixed with `/api/admin/`

## 🃏 Credit Cards Management

### List All Cards
```http
GET /api/admin/cards
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chase-sapphire-preferred",
      "name": "Chase Sapphire Preferred",
      "issuer": "Chase",
      "annualFee": 95,
      "baseReward": 1,
      "rewardType": "points",
      "pointValue": 0.0125,
      "signupBonus": 60000,
      "signupSpend": 4000,
      "signupTimeframe": 3,
      "isActive": true,
      "categoryRewards": [
        {
          "id": "reward-id",
          "rewardRate": 3.0,
          "maxReward": null,
          "period": null,
          "category": {
            "id": "category-id",
            "name": "Dining",
            "description": "Restaurants, bars, and food delivery"
          }
        }
      ],
      "benefits": [
        {
          "id": "benefit-id",
          "name": "Primary Rental Car Insurance",
          "description": "Primary auto rental collision damage waiver",
          "annualValue": 150,
          "category": "insurance",
          "isRecurring": true
        }
      ]
    }
  ]
}
```

### Get Specific Card
```http
GET /api/admin/cards/{cardId}
```

### Create New Card
```http
POST /api/admin/cards
Content-Type: application/json

{
  "id": "amex-platinum",
  "name": "American Express Platinum",
  "issuer": "American Express",
  "annualFee": 695,
  "baseReward": 1,
  "rewardType": "points",
  "pointValue": 0.01,
  "signupBonus": 80000,
  "signupSpend": 6000,
  "signupTimeframe": 6,
  "categoryRewards": [
    {
      "categoryName": "Travel",
      "rewardRate": 5.0,
      "maxReward": null,
      "period": null
    }
  ]
}
```

**Required Fields:**
- `id` (string): Unique identifier
- `name` (string): Card display name
- `issuer` (string): Bank/issuer name  
- `baseReward` (number): For points cards: multiplier (e.g., 2 for 2x), for cashback: percentage (e.g., 0.02 for 2%)
- `rewardType` (string): "points" or "cashback"

**Optional Fields:**
- `annualFee` (number): Default 0
- `pointValue` (number): Point value in dollars (e.g., 0.01 for 1¢)
- `signupBonus` (number): Signup bonus amount
- `signupSpend` (number): Required spend for signup bonus
- `signupTimeframe` (number): Months to complete signup spend
- `categoryRewards` (array): Enhanced category rates

### Update Card
```http
PUT /api/admin/cards/{cardId}
Content-Type: application/json

{
  "annualFee": 550,
  "categoryRewards": [
    {
      "categoryName": "Dining", 
      "rewardRate": 4.0
    }
  ]
}
```

### Delete Card
```http
DELETE /api/admin/cards/{cardId}
```

## 🎁 Benefits Management

### List All Benefits
```http
GET /api/admin/benefits
```

### Get Specific Benefit  
```http
GET /api/admin/benefits/{benefitId}
```

### Create New Benefit
```http
POST /api/admin/benefits
Content-Type: application/json

{
  "cardId": "amex-platinum",
  "name": "Airline Credit",
  "description": "$200 annual airline fee credit",
  "annualValue": 200,
  "category": "travel",
  "isRecurring": true
}
```

**Required Fields:**
- `cardId` (string): ID of associated card
- `name` (string): Benefit name
- `description` (string): Detailed description
- `annualValue` (number): Dollar value per year
- `category` (string): Benefit category (travel, dining, insurance, etc.)

**Optional Fields:**
- `isRecurring` (boolean): Default true

### Update Benefit
```http
PUT /api/admin/benefits/{benefitId}
Content-Type: application/json

{
  "annualValue": 300,
  "description": "Updated description"
}
```

### Delete Benefit
```http
DELETE /api/admin/benefits/{benefitId}
```

## 📝 Categories Management

### List All Categories
```http
GET /api/admin/categories
```

### Create New Category
```http
POST /api/admin/categories
Content-Type: application/json

{
  "name": "Streaming",
  "description": "Video and music streaming services"
}
```

## 🚀 Usage Examples

### Example 1: Add Chase Ink Business Preferred
```bash
curl -X POST http://localhost:3001/api/admin/cards \
  -H "Content-Type: application/json" \
  -d '{
    "id": "chase-ink-business-preferred",
    "name": "Chase Ink Business Preferred",
    "issuer": "Chase",
    "annualFee": 95,
    "baseReward": 1,
    "rewardType": "points",
    "pointValue": 0.0125,
    "signupBonus": 100000,
    "signupSpend": 15000,
    "signupTimeframe": 3,
    "categoryRewards": [
      {
        "categoryName": "Travel",
        "rewardRate": 3.0
      },
      {
        "categoryName": "Gas",
        "rewardRate": 3.0,
        "maxReward": 25000,
        "period": "yearly"
      }
    ]
  }'
```

### Example 2: Add Travel Credit to Venture X
```bash
curl -X POST http://localhost:3001/api/admin/benefits \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "capital-one-venture-x",
    "name": "Travel Credit",
    "description": "$300 annual travel credit for any travel purchases",
    "annualValue": 300,
    "category": "travel",
    "isRecurring": true
  }'
```

### Example 3: Update Card Annual Fee
```bash
curl -X PUT http://localhost:3001/api/admin/cards/chase-sapphire-preferred \
  -H "Content-Type: application/json" \
  -d '{
    "annualFee": 95
  }'
```

### Example 4: Add New Spending Category
```bash
curl -X POST http://localhost:3001/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pharmacy",
    "description": "Pharmacies and drug stores"
  }'
```

## ⚠️ Important Notes

### Points vs Cashback Cards
- **Points Cards**: `baseReward` should be the points multiplier (1 for 1x, 2 for 2x, etc.)
- **Cashback Cards**: `baseReward` should be the percentage as decimal (0.015 for 1.5%, 0.02 for 2%)

### Category Rewards
- `rewardRate` is the **multiplier** for both points and cashback cards
- For points cards: 3.0 means 3x points  
- For cashback cards: 3.0 means 3% cash back
- `maxReward` is the annual/quarterly/monthly limit in points or dollars
- `period` can be: "monthly", "quarterly", "yearly"

### Benefit Categories
Common categories: `travel`, `dining`, `entertainment`, `insurance`, `shopping`, `other`

### Error Handling
All endpoints return standardized error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing/invalid fields)
- `404`: Not Found
- `409`: Conflict (duplicate name/ID)
- `500`: Internal Server Error

## 🔒 Security Considerations

**⚠️ IMPORTANT**: These admin endpoints have no authentication/authorization. In production:

1. Add authentication middleware
2. Implement role-based access control  
3. Add request rate limiting
4. Log all admin actions
5. Add input sanitization
6. Consider moving to separate admin service

### Example Security Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    // Check for admin auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !isValidAdminToken(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
}
```

## 🛠️ Development Workflow

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test endpoints with curl or Postman**

3. **Use Prisma Studio for visual database management:**
   ```bash
   npx prisma studio
   ```

4. **Reset database if needed:**
   ```bash
   npx prisma db push --force-reset
   npm run db:seed
   ```

---

**📝 Need help?** Check the server logs for detailed error messages, or use Prisma Studio for visual database inspection at `http://localhost:5555`. 