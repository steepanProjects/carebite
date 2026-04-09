import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIntegrations } from "@/lib/integration";
import { PLATFORMS, Platform } from "@/lib/platforms";

// This endpoint is called by Vercel Cron every 10 minutes
// Vercel Cron automatically authenticates requests, no manual auth needed

export async function GET(req: Request) {
  try {
    // For Vercel Cron: Check if request is from Vercel
    // Vercel adds special headers to cron requests
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow requests from Vercel Cron (no auth header) or with valid secret
    const isVercelCron = req.headers.get("user-agent")?.includes("vercel");
    const isValidSecret = authHeader === `Bearer ${cronSecret}`;
    
    if (!isVercelCron && !isValidSecret) {
      console.log("Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== CRON JOB: Checking scheduled orders ===");

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    
    // Get current day of the diet plan (you might want to track this differently)
    // For now, we'll check all pending orders that match the current time window (±15 minutes)
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Define time windows (±15 minutes)
    const timeWindows = [
      { name: "breakfast", hour: 7, minute: 30 },
      { name: "lunch", hour: 12, minute: 30 },
      { name: "dinner", hour: 19, minute: 30 },
    ];
    
    let activeWindow = null;
    for (const window of timeWindows) {
      const timeDiff = Math.abs(
        (currentHour * 60 + currentMinute) - (window.hour * 60 + window.minute)
      );
      if (timeDiff <= 15) {
        activeWindow = window.name;
        break;
      }
    }
    
    if (!activeWindow) {
      console.log("No active time window");
      return NextResponse.json({
        success: true,
        message: "No active time window",
        currentTime,
      });
    }

    console.log(`Active window: ${activeWindow} at ${currentTime}`);

    // Get all users with automated ordering enabled
    const configs = await (prisma as any).scheduledOrder.findMany({
      where: {
        mealType: "config",
        status: "scheduled",
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${configs.length} users with auto-ordering enabled`);

    const results = [];

    for (const config of configs) {
      try {
        const dietPlan = config.requirements.dietPlan;
        const startDate = new Date(config.requirements.startDate);
        const today = new Date();
        
        // Calculate which day of the diet plan we're on
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentDayIndex = daysDiff % dietPlan.plan.length; // Loop through the plan
        const currentDay = dietPlan.plan[currentDayIndex];
        
        console.log(`User: ${config.user.email}, Diet Day: ${currentDay.d} (${currentDay.day}), Meal: ${activeWindow}`);

        // Check if this meal has already been ordered today
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const existingOrder = await (prisma as any).scheduledOrder.findFirst({
          where: {
            userId: config.userId,
            day: currentDay.d,
            mealType: activeWindow,
            executedAt: {
              gte: todayStart,
            },
          },
        });

        if (existingOrder) {
          console.log(`Meal already ordered today: ${existingOrder.orderNumber || existingOrder.status}`);
          continue;
        }

        // Get meal requirements for this meal type
        let mealRequirements;
        if (activeWindow === "breakfast") {
          mealRequirements = { ...currentDay.b, mealType: "Breakfast" };
        } else if (activeWindow === "lunch") {
          mealRequirements = { ...currentDay.l, mealType: "Lunch" };
        } else if (activeWindow === "dinner") {
          mealRequirements = { ...currentDay.dn, mealType: "Dinner" };
        }

        console.log(`Processing order for ${activeWindow}: Cal ${mealRequirements.cal}`);

        // Get user integrations
        const integrations = await getUserIntegrations(config.userId);
        const profile: any = await (prisma as any).userProfile.findUnique({
          where: { userId: config.userId },
        });

        // Fetch fresh menu data
        const allMenuItems: any[] = [];
        const platforms: Platform[] = ["sillobite", "figgy", "komato"];

        for (const platform of platforms) {
          const integration = integrations.find((i: any) => i.platform === platform);

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
              }
            } catch (error) {
              console.error(`Error fetching menu from ${platform}:`, error);
            }
          }
        }

        if (allMenuItems.length === 0) {
          const failedOrder = await (prisma as any).scheduledOrder.create({
            data: {
              userId: config.userId,
              day: currentDay.d,
              dayName: currentDay.day,
              mealType: activeWindow,
              scheduledTime: activeWindow === "breakfast" ? "07:30" : activeWindow === "lunch" ? "12:30" : "19:30",
              requirements: mealRequirements,
              status: "failed",
              error: "No menu items available",
              executedAt: new Date(),
            },
          });
          results.push({ orderId: failedOrder.id, status: "failed", error: "No menu items" });
          continue;
        }

        // Match meals
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
              day: currentDay.d,
              dayName: currentDay.day,
              mealType: activeWindow,
              scheduledTime: activeWindow === "breakfast" ? "07:30" : activeWindow === "lunch" ? "12:30" : "19:30",
              requirements: mealRequirements,
              status: "failed",
              error: matchResult.error || "Failed to match meals",
              executedAt: new Date(),
            },
          });
          results.push({ orderId: failedOrder.id, status: "failed", error: matchResult.error });
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
              day: currentDay.d,
              dayName: currentDay.day,
              mealType: activeWindow,
              scheduledTime: activeWindow === "breakfast" ? "07:30" : activeWindow === "lunch" ? "12:30" : "19:30",
              requirements: mealRequirements,
              status: "ordered",
              orderId: orderResult.order.id,
              orderNumber: orderResult.order.orderNumber,
              matchedItems: matchedItems,
              executedAt: new Date(),
            },
          });
          results.push({
            orderId: successOrder.id,
            status: "ordered",
            orderNumber: orderResult.order.orderNumber,
          });
          console.log(`✓ Order placed: ${orderResult.order.orderNumber}`);
        } else {
          const failedOrder = await (prisma as any).scheduledOrder.create({
            data: {
              userId: config.userId,
              day: currentDay.d,
              dayName: currentDay.day,
              mealType: activeWindow,
              scheduledTime: activeWindow === "breakfast" ? "07:30" : activeWindow === "lunch" ? "12:30" : "19:30",
              requirements: mealRequirements,
              status: "failed",
              error: orderResult.error || "Failed to place order",
              executedAt: new Date(),
            },
          });
          results.push({ orderId: failedOrder.id, status: "failed", error: orderResult.error });
        }
      } catch (error) {
        console.error(`Error processing order for user ${config.user.email}:`, error);
        const failedOrder = await (prisma as any).scheduledOrder.create({
          data: {
            userId: config.userId,
            day: 0,
            dayName: "Error",
            mealType: activeWindow,
            scheduledTime: activeWindow === "breakfast" ? "07:30" : activeWindow === "lunch" ? "12:30" : "19:30",
            requirements: {},
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            executedAt: new Date(),
          },
        });
        results.push({
          orderId: failedOrder.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log("=== CRON JOB: Complete ===");

    return NextResponse.json({
      success: true,
      currentTime,
      activeWindow,
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
