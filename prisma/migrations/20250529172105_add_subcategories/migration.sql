-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "rewardPreference" TEXT NOT NULL DEFAULT 'cashback',
    "pointValue" REAL NOT NULL DEFAULT 0.01,
    "enableSubCategories" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "annualFee" REAL NOT NULL,
    "baseReward" REAL NOT NULL,
    "rewardType" TEXT NOT NULL,
    "pointValue" REAL,
    "signupBonus" REAL,
    "signupSpend" REAL,
    "signupTimeframe" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SpendingCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentCategoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "SpendingCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "categoryId" TEXT,
    "subCategoryId" TEXT,
    "rewardRate" REAL NOT NULL,
    "maxReward" REAL,
    "period" TEXT,
    CONSTRAINT "CategoryReward_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategoryReward_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpendingCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategoryReward_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardBenefit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "annualValue" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardBenefit_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSpendingCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "monthlySpend" REAL NOT NULL,
    CONSTRAINT "UserSpendingCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSpendingCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpendingCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSpendingSubCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "monthlySpend" REAL NOT NULL,
    CONSTRAINT "UserSpendingSubCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSpendingSubCategory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBenefitValuation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "personalValue" REAL NOT NULL,
    CONSTRAINT "UserBenefitValuation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBenefitValuation_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "CardBenefit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "SpendingCategory_name_key" ON "SpendingCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_parentCategoryId_name_key" ON "SubCategory"("parentCategoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryReward_cardId_categoryId_subCategoryId_key" ON "CategoryReward"("cardId", "categoryId", "subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CardBenefit_cardId_name_key" ON "CardBenefit"("cardId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSpendingCategory_userId_categoryId_key" ON "UserSpendingCategory"("userId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSpendingSubCategory_userId_subCategoryId_key" ON "UserSpendingSubCategory"("userId", "subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBenefitValuation_userId_benefitId_key" ON "UserBenefitValuation"("userId", "benefitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCard_userId_cardId_key" ON "UserCard"("userId", "cardId");
