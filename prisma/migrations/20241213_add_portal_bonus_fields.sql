-- Add portal bonus fields to CategoryReward table
ALTER TABLE "public"."CategoryReward" 
ADD COLUMN "hasPortalBonus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "portalRewardRate" DOUBLE PRECISION,
ADD COLUMN "portalDescription" TEXT;

-- Update existing records to set hasPortalBonus to false by default
UPDATE "public"."CategoryReward" SET "hasPortalBonus" = false WHERE "hasPortalBonus" IS NULL; 