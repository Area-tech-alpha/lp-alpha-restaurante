-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "fbclid" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN "fbclid" TEXT,
ADD COLUMN "fbc" TEXT,
ADD COLUMN "fbp" TEXT;
