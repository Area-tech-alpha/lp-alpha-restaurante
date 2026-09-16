-- CreateTable
CREATE TABLE "ad_clicks" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "platform" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "campaignName" TEXT,
    "clicks" INTEGER NOT NULL,

    CONSTRAINT "ad_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_clicks_campaign_idx" ON "ad_clicks"("campaign");

-- CreateIndex
CREATE UNIQUE INDEX "ad_clicks_date_platform_campaign_key" ON "ad_clicks"("date", "platform", "campaign");
