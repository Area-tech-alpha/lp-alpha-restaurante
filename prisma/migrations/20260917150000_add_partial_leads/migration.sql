-- CreateTable
CREATE TABLE "partial_leads" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "ipAddress" TEXT,
    "webhookSentAt" TIMESTAMP(3),
    "webhookStatus" INTEGER,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partial_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partial_leads_sessionId_key" ON "partial_leads"("sessionId");

-- AddForeignKey
ALTER TABLE "partial_leads" ADD CONSTRAINT "partial_leads_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
