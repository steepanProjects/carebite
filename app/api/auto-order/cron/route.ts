import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIntegrations } from "@/lib/integration";
import { PLATFORMS, Platform } from "@/lib/platforms";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory cache for menu data (expires after 10 minutes)
const menuCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// This endpoint is called by Vercel Cron every 10 minutes
export async function GET(req: Request) {
  try {
    // Verify cron authentication
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = req.headers.get("user-agent")?.includes("vercel");
    const isValidSecret = authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isValidSecret) {
      console.log("Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== CRON JOB: Starting auto-order check ===");

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDayName = dayNames[dayOfWeek];

    console.log(`Current time: ${currentTime}, Day: ${currentDayName}`);

    // Get all users with auto-ordering enabled
    const configs = await (prisma as any).autoOrderConfig.findMany({
      where: {
        enabled: true,
      },
      include: {
        user: {
          include: {
            integrations: true,
          },
        },
      },
    });

    console.log(`Found ${configs.length} users with auto-ordering enabled`);

    const results = [];

    for (const config of configs) {
      try {
        // Check if today is enabled for this user
        const dayEnabledKey = `${currentDayName}Enabled`;
        if (!config[dayEnabledKey]) {
          console.log(`${config.user.email}: ${currentDayName} is disabled, skipping`);
          continue;
        }

        // Determine which meal to order based on current time (±15 minute window)
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        let mealType: string | null = null;
        let mealTime: string | null = null;

        // Check breakfast
        if (config.breakfastEnabled) {
          const [bHour, bMin] = config.breakfastTime.split(":").map(Number);
          const bTotalMinutes = bHour * 60 + bMin;
          if (Math.abs(currentTotalMinutes - bTotalMinutes) <= 15) {
            mealType = "breakfast";
            mealTime = config.breakfastTime;
          }
        }

        // Check lunch
        if (!mealType && config.lunchEnabled) {
          const [lHour, lMin] = config.lunchTime.split(":").map(Number);
          const lTotalMinutes = lHour * 60 + lMin;
          if (Math.abs(currentTotalMinutes - lTotalMinutes) <= 15) {
            mealType = "lunch";
            mealTime = config.lunchTime;
          }
        }

        // Check dinner
        if (!mealType && config.dinnerEnabled) {
          const [dHour, dMin] = config.dinnerTime.split(":").map(Number);
          const dTotalMinutes = dHour * 60 + dMin;
          if (Math.abs(currentTotalMinutes - dTotalMinutes) <= 15) {
            mealType = "dinner";
            mealTime = config.dinnerTime;
          }
        }

        if (!mealType) {
          console.log(`${config.user.email}: No active meal window`);
          continue;
        }

        console.log(`${config.user.email}: Processing ${mealType} order`);

        // Get active diet plan
        const dietPlan = await (prisma as any).dietPlan.findFirst({
          where: {
            userId: config.userId,
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (!dietPlan) {
          console.log(`${config.user.email}: No active diet plan`);
          continue;
        }

        // Calculate current diet day
        const daysDiff = Math.floor(
          (now.getTime() - new Date(dietPlan.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        const dietDayIndex = daysDiff % dietPlan.days;

        // Handle different diet plan structures
        const planArray = dietPlan.plan?.plan || dietPlan.plan;
        if (!planArray || !Array.isArray(planArray) || planArray.length === 0) {
          console.log(`${config.user.email}: Invalid diet plan structure`);
          continue;
        }

        const currentDay = planArray[dietDayIndex];
        if (!currentDay) {
          console.log(`${config.user.email}: Diet day not found for index ${dietDayIndex}`);
          continue;
        }

        // Check if already ordered today
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const existingOrder = await (prisma as any).scheduledOrder.findFirst({
          where: {
            userId: config.userId,
            day: currentDay.d || dietDayIndex + 1,
            mealType: mealType,
            executedAt: {
              gte: todayStart,
            },
          },
        });

        if (existingOrder) {
          console.log(
            `${config.user.email}: ${mealType} already ordered today (${existingOrder.orderNumber || existingOrder.status})`
          );
          continue;
        }

        // Check for schedule override
        const [mealHour, mealMinute] = (mealType === "breakfast" ? config.breakfastTime :
          mealType === "lunch" ? config.lunchTime :
            config.dinnerTime).split(":").map(Number);
        const scheduledDateTime = new Date(now);
        scheduledDateTime.setHours(mealHour, mealMinute, 0, 0);

        const override = await (prisma as any).scheduleOverride.findUnique({
          where: {
            userId_scheduledDate_mealType: {
              userId: config.userId,
              scheduledDate: scheduledDateTime,
              mealType: mealType,
            },
          },
        });

        if (override && !override.enabled) {
          console.log(`${config.user.email}: ${mealType} is disabled by user override`);
          continue;
        }

        // Get meal requirements
        let mealRequirements;
        if (mealType === "breakfast") {
          mealRequirements = { ...(currentDay.b || currentDay.breakfast), mealType: "Breakfast" };
        } else if (mealType === "lunch") {
          mealRequirements = { ...(currentDay.l || currentDay.lunch), mealType: "Lunch" };
        } else if (mealType === "dinner") {
          mealRequirements = { ...(currentDay.dn || currentDay.dinner), mealType: "Dinner" };
        }

        console.log(`${config.user.email}: Meal requirements - Cal: ${mealRequirements.cal}`);

        // Fetch menu data (with caching)
        const cacheKey = `menu_${config.userId}`;
        let allMenuItems: any[] = [];

        const cached = menuCache.get(cacheKey);
        if (cached && now.getTime() - cached.timestamp < CACHE_DURATION) {
          console.log(`${config.user.email}: Using cached menu data`);
          allMenuItems = cached.data;
        } else {
          console.log(`${config.user.email}: Fetching fresh menu data`);
          const platforms: Platform[] = ["sillobite", "figgy", "komato"];

          for (const platform of platforms) {
            const integration = config.user.integrations.find(
              (i: any) => i.platform === platform
            );

            if (integration?.accessToken) {
              try {
                const platformConfig = PLATFORMS[platform];
                const response = await fetch(
                  `${platformConfig.apiUrl}/api/carebite/menu`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: config.user.email,
                      accessToken: integration.accessToken,
                    }),
                  }
                );

                if (response.ok) {
                  const menuData = await response.json();
                  let items: any[] = [];

                  if (Array.isArray(menuData)) {
                    items = menuData;
                  } else if (menuData.data && Array.isArray(menuData.data)) {
                    items = menuData.data;
                  } else if (typeof menuData === "object") {
                    const possibleArrays = ["dishes", "items", "menu", "menuItems"];
                    for (const key of possibleArrays) {
                      if (Array.isArray(menuData[key])) {
                        items = menuData[key];
                        break;
                      }
                    }
                  }

                  items = items.map((item) => ({
                    ...item,
                    platform: item.platform || platform,
                  }));

                  allMenuItems.push(...items);
                  console.log(`${config.user.email}: Fetched ${items.length} items from ${platform}`);
                }
              } catch (error) {
                console.error(`${config.user.email}: Error fetching menu from ${platform}:`, error);
              }
            }
          }

          // Cache the menu data
          if (allMenuItems.length > 0) {
            menuCache.set(cacheKey, {
              data: allMenuItems,
              timestamp: now.getTime(),
            });
          }
        }

        if (allMenuItems.length === 0) {
          const failedOrder = await (prisma as any).scheduledOrder.create({
            data: {
              userId: config.userId,
              day: currentDay.d || dietDayIndex + 1,
              dayName: currentDay.day || dayNames[dayOfWeek],
              mealType: mealType,
              scheduledTime: mealTime,
              requirements: mealRequirements,
              status: "failed",
              error: "No menu items available",
              executedAt: new Date(),
            },
          });
          results.push({
            user: config.user.email,
            orderId: failedOrder.id,
            status: "failed",
            error: "No menu items",
          });
          continue;
        }

        console.log(`${config.user.email}: Total menu items: ${allMenuItems.length}`);

        // Get user profile
        const profile = await (prisma as any).userProfile.findUnique({
          where: { userId: config.userId },
        });

        // Match meals using AI
        const matchResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/match-meals`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mealRequirements: mealRequirements,
              menuItems: allMenuItems,
              userProfile: profile,
            }),
          }
        );

        const matchResult = await matchResponse.json();

        if (!matchResponse.ok || !matchResult.success) {
          const failedOrder = await (prisma as any).scheduledOrder.create({
            data: {
              userId: config.userId,
              day: currentDay.d || dietDayIndex + 1,
              dayName: currentDay.day || dayNames[dayOfWeek],
              mealType: mealType,
              scheduledTime: mealTime,
              requirements: mealRequirements,
              status: "failed",
              error: matchResult.error || "Failed to match meals",
              executedAt: new Date(),
            },
          });
          results.push({
            user: config.user.email,
            orderId: failedOrder.id,
            status: "failed",
            error: matchResult.error,
          });
          continue;
        }

        const matchedItems = matchResult.match;
        const firstItem = matchedItems.items[0];
        const platform = firstItem.platform;
        const canteenId = firstItem.canteenId || firstItem.restaurantId;

        const orderItems = matchedItems.items.map((item: any) => ({
          menuItemId: item.menuItemId,
          itemName: item.itemName,
          quantity: item.quantity || 1,
        }));

        console.log(`${config.user.email}: Placing order on ${platform}`);

        // Place order
        const orderResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/create-order`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: orderItems,
              platform,
              canteenId,
            }),
          }
        );

        const orderResult = await orderResponse.json();

        if (orderResponse.ok && orderResult.success) {
          const successOrder = await (prisma as any).scheduledOrder.create({
            data: {
              userId: config.userId,
              day: currentDay.d || dietDayIndex + 1,
              dayName: currentDay.day || dayNames[dayOfWeek],
              mealType: mealType,
              scheduledTime: mealTime,
              requirements: mealRequirements,
              status: "ordered",
              orderId: orderResult.order.id,
              orderNumber: orderResult.order.orderNumber,
              matchedItems: matchedItems,
              executedAt: new Date(),
            },
          });
          results.push({
            user: config.user.email,
            orderId: successOrder.id,
            status: "ordered",
            orderNumber: orderResult.order.orderNumber,
          });
          console.log(`✓ ${config.user.email}: Order placed - ${orderResult.order.orderNumber}`);
        } else {
          const failedOrder = await (prisma as any).scheduledOrder.create({
            data: {
              userId: config.userId,
              day: currentDay.d || dietDayIndex + 1,
              dayName: currentDay.day || dayNames[dayOfWeek],
              mealType: mealType,
              scheduledTime: mealTime,
              requirements: mealRequirements,
              status: "failed",
              error: orderResult.error || "Failed to place order",
              executedAt: new Date(),
            },
          });
          results.push({
            user: config.user.email,
            orderId: failedOrder.id,
            status: "failed",
            error: orderResult.error,
          });
        }
      } catch (error) {
        console.error(`Error processing order for user ${config.user.email}:`, error);
        results.push({
          user: config.user.email,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log("=== CRON JOB: Complete ===");

    return NextResponse.json({
      success: true,
      currentTime,
      currentDay: currentDayName,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
