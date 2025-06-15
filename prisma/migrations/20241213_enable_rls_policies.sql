-- Enable RLS for all tables that need it
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CreditCard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SpendingCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SubCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CategoryReward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CardBenefit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."UserSpendingCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."UserSpendingSubCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."UserBenefitValuation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."UserCard" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON "public"."User";
DROP POLICY IF EXISTS "Users can manage their own sessions" ON "public"."Session";
DROP POLICY IF EXISTS "Users can manage their own accounts" ON "public"."Account";
DROP POLICY IF EXISTS "Public credit cards are viewable" ON "public"."CreditCard";
DROP POLICY IF EXISTS "Users can manage their own card associations" ON "public"."UserCard";
DROP POLICY IF EXISTS "Users can manage their own spending categories" ON "public"."UserSpendingCategory";
DROP POLICY IF EXISTS "Users can manage their own spending subcategories" ON "public"."UserSpendingSubCategory";
DROP POLICY IF EXISTS "Users can manage their own benefit valuations" ON "public"."UserBenefitValuation";
DROP POLICY IF EXISTS "Public spending categories are viewable" ON "public"."SpendingCategory";
DROP POLICY IF EXISTS "Public subcategories are viewable" ON "public"."SubCategory";
DROP POLICY IF EXISTS "Public category rewards are viewable" ON "public"."CategoryReward";
DROP POLICY IF EXISTS "Public card benefits are viewable" ON "public"."CardBenefit";
DROP POLICY IF EXISTS "Verification tokens are accessible" ON "public"."VerificationToken";

-- User table policies - users can only access their own data
CREATE POLICY "Users can view and edit their own profile" ON "public"."User"
FOR ALL USING (auth.uid()::text = id);

-- Session table policies - users can only access their own sessions
CREATE POLICY "Users can manage their own sessions" ON "public"."Session"
FOR ALL USING (auth.uid()::text = "userId");

-- Account table policies - users can only access their own accounts
CREATE POLICY "Users can manage their own accounts" ON "public"."Account"
FOR ALL USING (auth.uid()::text = "userId");

-- VerificationToken policies - allow access for authentication flow
CREATE POLICY "Verification tokens are accessible" ON "public"."VerificationToken"
FOR ALL USING (true);

-- CreditCard table policies - public read access for all cards
CREATE POLICY "Public credit cards are viewable" ON "public"."CreditCard"
FOR SELECT USING (true);

-- SpendingCategory policies - public read access
CREATE POLICY "Public spending categories are viewable" ON "public"."SpendingCategory"
FOR SELECT USING (true);

-- SubCategory policies - public read access
CREATE POLICY "Public subcategories are viewable" ON "public"."SubCategory"
FOR SELECT USING (true);

-- CategoryReward policies - public read access
CREATE POLICY "Public category rewards are viewable" ON "public"."CategoryReward"
FOR SELECT USING (true);

-- CardBenefit policies - public read access
CREATE POLICY "Public card benefits are viewable" ON "public"."CardBenefit"
FOR SELECT USING (true);

-- UserCard table policies - users can only manage their own card associations
CREATE POLICY "Users can manage their own card associations" ON "public"."UserCard"
FOR ALL USING (auth.uid()::text = "userId");

-- UserSpendingCategory policies - users can only manage their own spending data
CREATE POLICY "Users can manage their own spending categories" ON "public"."UserSpendingCategory"
FOR ALL USING (auth.uid()::text = "userId");

-- UserSpendingSubCategory policies - users can only manage their own spending data
CREATE POLICY "Users can manage their own spending subcategories" ON "public"."UserSpendingSubCategory"
FOR ALL USING (auth.uid()::text = "userId");

-- UserBenefitValuation policies - users can only manage their own benefit valuations
CREATE POLICY "Users can manage their own benefit valuations" ON "public"."UserBenefitValuation"
FOR ALL USING (auth.uid()::text = "userId"); 