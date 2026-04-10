-- CreateTable
CREATE TABLE "AutoOrderConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "breakfastEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lunchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dinnerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "breakfastTime" TEXT NOT NULL DEFAULT '07:30',
    "lunchTime" TEXT NOT NULL DEFAULT '12:30',
    "dinnerTime" TEXT NOT NULL DEFAULT '19:30',
    "mondayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tuesdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "wednesdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "thursdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fridayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "saturdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sundayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoOrderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "mealType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutoOrderConfig_userId_key" ON "AutoOrderConfig"("userId");

-- CreateIndex
CREATE INDEX "AutoOrderConfig_userId_enabled_idx" ON "AutoOrderConfig"("userId", "enabled");

-- CreateIndex
CREATE INDEX "ScheduleOverride_userId_scheduledDate_idx" ON "ScheduleOverride"("userId", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleOverride_userId_scheduledDate_mealType_key" ON "ScheduleOverride"("userId", "scheduledDate", "mealType");

-- AddForeignKey
ALTER TABLE "AutoOrderConfig" ADD CONSTRAINT "AutoOrderConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
