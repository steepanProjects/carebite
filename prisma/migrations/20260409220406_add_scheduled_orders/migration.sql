-- CreateTable
CREATE TABLE "ScheduledOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "dayName" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderId" TEXT,
    "orderNumber" TEXT,
    "matchedItems" JSONB,
    "error" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledOrder_userId_status_idx" ON "ScheduledOrder"("userId", "status");

-- CreateIndex
CREATE INDEX "ScheduledOrder_scheduledTime_status_idx" ON "ScheduledOrder"("scheduledTime", "status");

-- AddForeignKey
ALTER TABLE "ScheduledOrder" ADD CONSTRAINT "ScheduledOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
