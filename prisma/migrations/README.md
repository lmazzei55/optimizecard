# Database Migrations

## RLS (Row Level Security) Migration

### File: `20241213_enable_rls_policies.sql`

This migration enables Row Level Security (RLS) on all tables to fix security vulnerabilities detected by Supabase's database linter.

### What it does:
1. Enables RLS on all tables in the public schema
2. Creates appropriate policies for user data isolation
3. Allows public read access for reference data (credit cards, categories, benefits)
4. Restricts user-specific data to authenticated users only

### How to apply:

#### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `20241213_enable_rls_policies.sql`
4. Run the migration

#### Option 2: Supabase CLI
```bash
supabase db push
```

#### Option 3: Direct PostgreSQL
If you have direct database access:
```bash
psql -h your-db-host -U your-username -d your-database -f prisma/migrations/20241213_enable_rls_policies.sql
```

### Security Benefits:
- Users can only access their own data
- Public reference data remains accessible
- Prevents unauthorized data access
- Complies with Supabase security best practices

### Tables affected:
- User (user-specific access)
- Session (user-specific access)
- Account (user-specific access)
- VerificationToken (public access for auth flow)
- CreditCard (public read access)
- SpendingCategory (public read access)
- SubCategory (public read access)
- CategoryReward (public read access)
- CardBenefit (public read access)
- UserCard (user-specific access)
- UserSpendingCategory (user-specific access)
- UserSpendingSubCategory (user-specific access)
- UserBenefitValuation (user-specific access) 