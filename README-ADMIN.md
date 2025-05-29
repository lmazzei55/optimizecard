# 🔧 Admin Guide: Managing Credit Cards & Benefits

This guide explains how to manage the credit card database using the available admin tools. Whether you need to add new cards, update benefits, or manage spending categories, this document covers all the options.

## 🎯 Overview: What Can You Manage?

### 💳 **Credit Cards**
- Add new credit cards with reward structures
- Update annual fees, signup bonuses, and reward rates
- Manage category-specific rewards (e.g., 3x dining, 2x travel)
- Enable/disable cards in recommendations
- Delete cards (with all related data)

### 🎁 **Card Benefits**
- Add benefits to any card (travel credits, lounge access, insurance, etc.)
- Update benefit values and descriptions
- Categorize benefits (travel, dining, insurance, etc.)
- Remove outdated benefits

### 📝 **Spending Categories**
- Add new spending categories (e.g., "Pharmacy", "Streaming")
- View category usage across cards

## 🛠️ Available Admin Tools

### 1. **Admin API Endpoints** (Most Powerful)
Programmatic access via HTTP requests - perfect for bulk updates or automation.

### 2. **Prisma Studio** (Visual Interface)
Point-and-click database management with a web interface.

### 3. **Seed File Management** (Version Controlled)
Code-based approach for reproducible setups and backups.

---

## 🚀 Quick Start: Adding Your First Card

Let's walk through adding a new credit card using each method:

### Method 1: Using Admin API

**Step 1: Add the card**
```bash
curl -X POST http://localhost:3001/api/admin/cards \
  -H "Content-Type: application/json" \
  -d '{
    "id": "chase-ink-preferred",
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

**Step 2: Add benefits**
```bash
curl -X POST http://localhost:3001/api/admin/benefits \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "chase-ink-preferred",
    "name": "Cell Phone Protection",
    "description": "Up to $1,000 coverage for cell phone damage",
    "annualValue": 200,
    "category": "insurance",
    "isRecurring": true
  }'
```

### Method 2: Using Prisma Studio

```bash
# Start Prisma Studio
npx prisma studio
```

1. Open `http://localhost:5555`
2. Click on "CreditCard" table
3. Click "Add record"
4. Fill in the form fields
5. Save the record
6. Go to "CardBenefit" table to add benefits

### Method 3: Using Seed File

Edit `prisma/seed.ts` and add to the `CREDIT_CARDS` array:

```typescript
{
  id: 'chase-ink-preferred',
  name: 'Chase Ink Business Preferred',
  issuer: 'Chase',
  annualFee: 95,
  baseReward: 1,
  rewardType: 'points' as const,
  pointValue: 0.0125,
  // ... other fields
}
```

Then run:
```bash
npm run db:seed
```

---

## 📋 Common Admin Tasks

### Adding a New Spending Category

**API Method:**
```bash
curl -X POST http://localhost:3001/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Streaming",
    "description": "Video and music streaming services"
  }'
```

**Prisma Studio:** Categories → Add record

### Updating Annual Fees

**API Method:**
```bash
curl -X PUT http://localhost:3001/api/admin/cards/chase-sapphire-preferred \
  -H "Content-Type: application/json" \
  -d '{"annualFee": 95}'
```

**Prisma Studio:** CreditCard → Find card → Edit → Save

### Adding Travel Credits to Multiple Cards

**Bulk API approach:**
```bash
# Capital One Venture X
curl -X POST http://localhost:3001/api/admin/benefits \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "capital-one-venture-x",
    "name": "Travel Credit",
    "description": "$300 annual travel credit",
    "annualValue": 300,
    "category": "travel"
  }'

# Chase Sapphire Reserve
curl -X POST http://localhost:3001/api/admin/benefits \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "chase-sapphire-reserve", 
    "name": "Travel Credit",
    "description": "$300 annual travel credit",
    "annualValue": 300,
    "category": "travel"
  }'
```

### Viewing All Cards and Their Benefits

```bash
# List all cards with full details
curl -s http://localhost:3001/api/admin/cards | jq '.data[]'

# List just card names and annual fees
curl -s http://localhost:3001/api/admin/cards | jq '.data[] | {name, annualFee}'

# List all benefits
curl -s http://localhost:3001/api/admin/benefits | jq '.data[]'
```

---

## 💡 Best Practices

### Card Data Guidelines

**Points vs Cashback Cards:**
- **Points cards**: `baseReward` = points multiplier (1 for 1x, 2 for 2x)
- **Cashback cards**: `baseReward` = percentage as decimal (0.015 for 1.5%)

**Category Rewards:**
- `rewardRate` is always a multiplier (3.0 = 3x points or 3% cash)
- Use `maxReward` and `period` for spending caps
- Available periods: "monthly", "quarterly", "yearly"

**Card IDs:**
- Use kebab-case: `chase-sapphire-preferred`
- Include issuer for clarity: `amex-platinum`
- Keep consistent with existing patterns

### Benefit Categories
Standardized categories for better organization:
- `travel` - Travel credits, lounge access, TSA PreCheck
- `dining` - Restaurant credits, delivery benefits
- `entertainment` - Streaming credits, event access
- `insurance` - Rental car, travel, phone protection
- `shopping` - Store credits, purchase protection
- `other` - Miscellaneous benefits

### Data Validation
Always validate your data:
```bash
# Check if card was added successfully
curl -s http://localhost:3001/api/admin/cards/your-card-id | jq '.success'

# Verify benefits are attached
curl -s http://localhost:3001/api/admin/cards/your-card-id | jq '.data.benefits'
```

---

## 🔄 Workflows for Different Scenarios

### New Card Launch (e.g., Chase adds a new card)

1. **Research the card details**
   - Annual fee, reward structure, signup bonus
   - Category multipliers and caps
   - Benefits and their estimated values

2. **Add the card via API**
   ```bash
   curl -X POST http://localhost:3001/api/admin/cards \
     -H "Content-Type: application/json" \
     -d '{ /* card data */ }'
   ```

3. **Add all benefits**
   ```bash
   # Repeat for each benefit
   curl -X POST http://localhost:3001/api/admin/benefits \
     -H "Content-Type: application/json" \
     -d '{ /* benefit data */ }'
   ```

4. **Test in the app**
   - Go to `http://localhost:3001/dashboard`
   - Input some spending to see if the card appears in recommendations
   - Check benefit valuations are working

### Annual Updates (fees change, benefits modified)

1. **Update annual fees**
   ```bash
   curl -X PUT http://localhost:3001/api/admin/cards/card-id \
     -H "Content-Type: application/json" \
     -d '{"annualFee": 550}'
   ```

2. **Update benefit values**
   ```bash
   curl -X PUT http://localhost:3001/api/admin/benefits/benefit-id \
     -H "Content-Type: application/json" \
     -d '{"annualValue": 300}'
   ```

### Bulk Data Management

1. **Export current data**
   ```bash
   curl -s http://localhost:3001/api/admin/cards > cards-backup.json
   curl -s http://localhost:3001/api/admin/benefits > benefits-backup.json
   ```

2. **Use seed file for major changes**
   - Edit `prisma/seed.ts`
   - Run `npm run db:seed`
   - Ensures consistency and version control

### Database Reset (start fresh)

```bash
# Reset and reseed
npx prisma db push --force-reset
npm run db:seed

# Or just reseed
npm run db:seed
```

---

## 🔍 Monitoring and Maintenance

### Check Database Health

```bash
# View all tables in Prisma Studio
npx prisma studio

# Count records
curl -s http://localhost:3001/api/admin/cards | jq '.data | length'
curl -s http://localhost:3001/api/admin/benefits | jq '.data | length'
curl -s http://localhost:3001/api/admin/categories | jq '.data | length'
```

### Find Issues

```bash
# Cards with no benefits
curl -s http://localhost:3001/api/admin/cards | jq '.data[] | select(.benefits | length == 0) | .name'

# Benefits with unusual values
curl -s http://localhost:3001/api/admin/benefits | jq '.data[] | select(.annualValue > 1000) | {card: .card.name, name, value: .annualValue}'

# Category usage
curl -s http://localhost:3001/api/admin/categories | jq '.data[] | {name, rewardCards: ._count.categoryRewards}'
```

### Backup Strategies

**API Export:**
```bash
# Create timestamped backup
DATE=$(date +%Y%m%d_%H%M%S)
curl -s http://localhost:3001/api/admin/cards > "backup_cards_$DATE.json"
curl -s http://localhost:3001/api/admin/benefits > "backup_benefits_$DATE.json"
```

**Database File:**
```bash
# SQLite database file
cp prisma/dev.db "backup_database_$(date +%Y%m%d).db"
```

---

## 🚨 Troubleshooting

### Common Issues

**"Card not found" when adding benefits:**
- Check the `cardId` matches exactly
- List all cards: `curl -s http://localhost:3001/api/admin/cards | jq '.data[].id'`

**Category rewards not working:**
- Ensure category name matches exactly (case-sensitive)
- Check available categories: `curl -s http://localhost:3001/api/admin/categories | jq '.data[].name'`

**Points calculation seems wrong:**
- Verify `baseReward` for points cards is the multiplier (1, 2) not percentage (0.01, 0.02)
- Check `pointValue` is reasonable (0.01-0.02 typically)

**Benefits not showing in app:**
- Confirm benefit was created: `curl -s http://localhost:3001/api/admin/benefits | grep "benefit-name"`
- Check benefit is assigned to correct card

### Error Codes

- `400` - Missing required fields
- `404` - Card/benefit not found
- `409` - Duplicate ID/name
- `500` - Server error (check logs)

### Reset and Recovery

**If something breaks:**
```bash
# 1. Reset database
npx prisma db push --force-reset

# 2. Reseed with known good data
npm run db:seed

# 3. Restart dev server
npm run dev
```

---

## 🔒 Security Notes

⚠️ **Important**: Admin endpoints have no authentication in development.

**For production deployment:**
- Add authentication middleware
- Implement role-based access control
- Add request rate limiting
- Log all admin actions
- Validate all inputs
- Consider separate admin service

**Example security check:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    const authToken = request.headers.get('authorization')
    if (!isValidAdminToken(authToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}
```

---

## 📚 Additional Resources

- **Technical API Documentation**: See `ADMIN_API.md` for complete endpoint specs
- **Main App Documentation**: See `README.md` for user-facing features
- **Database Schema**: Check `prisma/schema.prisma` for data structure
- **Prisma Documentation**: https://www.prisma.io/docs

## 🤝 Getting Help

**Common Commands:**
```bash
# Start development
npm run dev

# Open database manager
npx prisma studio

# Reset everything
npx prisma db push --force-reset && npm run db:seed

# Check server logs
# Look at terminal where `npm run dev` is running
```

**Debug Steps:**
1. Check server logs for errors
2. Verify data with Prisma Studio
3. Test API endpoints with curl
4. Check browser network tab for frontend issues

---

**💡 Pro Tip**: Use Prisma Studio for quick edits and API endpoints for bulk operations. Keep the seed file updated as your "source of truth" for version control. 