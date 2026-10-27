-- AlterTable
ALTER TABLE "leads" ADD COLUMN "agendadoPara" TIMESTAMP(3),
ADD COLUMN "googleEventId" TEXT,
ADD COLUMN "closerEmail" TEXT,
ADD COLUMN "agendamentoCriadoEm" TIMESTAMP(3),
ADD COLUMN "growthHubSentAt" TIMESTAMP(3),
ADD COLUMN "growthHubStatus" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "leads_closerEmail_agendadoPara_key" ON "leads"("closerEmail", "agendadoPara");
