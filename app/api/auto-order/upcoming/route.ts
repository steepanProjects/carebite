import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get auto-order config
        const config = await (prisma as any).autoOrderConfig.findUnique({
            where: { userId: user.id },
        });

        if (!config || !config.enabled) {
            return NextResponse.json({
                success: true,
                upcoming: [],
                message: "Auto-ordering is not enabled",
            });
        }

        // Get active diet plan
        const dietPlan = await (prisma as any).dietPlan.findFirst({
            where: {
                userId: user.id,
                isActive: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!dietPlan) {
            return NextResponse.json({
                success: true,
                upcoming: [],
                message: "No active diet plan found",
            });
        }

        // Calculate upcoming orders
        const now = new Date();
        const upcoming = [];

        const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

        const mealTimes = [
            { type: "breakfast", time: config.breakfastTime, enabled: config.breakfastEnabled },
            { type: "lunch", time: config.lunchTime, enabled: config.lunchEnabled },
            { type: "dinner", time: config.dinnerTime, enabled: config.dinnerEnabled },
        ];

        // Handle different diet plan structures
        const planArray = dietPlan.plan?.plan || dietPlan.plan;
        if (!planArray || !Array.isArray(planArray) || planArray.length === 0) {
            return NextResponse.json({
                success: true,
                upcoming: [],
                message: "Invalid diet plan structure",
            });
        }

        // Check next 7 days
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(now);
            checkDate.setDate(checkDate.getDate() + i);
            const dayOfWeek = checkDate.getDay();
            const dayName = dayNames[dayOfWeek];

            // Check if this day is enabled
            const dayEnabledKey = `${dayName.toLowerCase()}Enabled` as keyof typeof config;
            if (!config[dayEnabledKey]) continue;

            // Calculate diet plan day
            const daysDiff = Math.floor(
                (checkDate.getTime() - new Date(dietPlan.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const dietDayIndex = daysDiff % dietPlan.days;
            const dietDay = planArray[dietDayIndex];

            if (!dietDay) {
                console.log("Diet day not found for index:", dietDayIndex);
                continue;
            }

            // Check each meal
            for (const meal of mealTimes) {
                if (!meal.enabled) continue;

                const [hours, minutes] = meal.time.split(":").map(Number);
                const scheduledTime = new Date(checkDate);
                scheduledTime.setHours(hours, minutes, 0, 0);

                // Only include future orders
                if (scheduledTime > now) {
                    let requirements;
                    if (meal.type === "breakfast") {
                        requirements = dietDay.b || dietDay.breakfast;
                    } else if (meal.type === "lunch") {
                        requirements = dietDay.l || dietDay.lunch;
                    } else if (meal.type === "dinner") {
                        requirements = dietDay.dn || dietDay.dinner;
                    }

                    // Skip if requirements not found
                    if (!requirements) {
                        console.log(`No requirements found for ${meal.type} on day ${dietDayIndex}`);
                        continue;
                    }

                    upcoming.push({
                        date: scheduledTime.toISOString(),
                        dayName,
                        mealType: meal.type,
                        scheduledTime: meal.time,
                        requirements,
                        dietDay: dietDay.d || dietDayIndex + 1,
                        enabled: true, // Default to enabled
                    });

                    // Stop after finding 3 upcoming orders
                    if (upcoming.length >= 3) break;
                }
            }

            if (upcoming.length >= 3) break;
        }

        // Check for schedule overrides
        for (const order of upcoming) {
            const override = await (prisma as any).scheduleOverride.findUnique({
                where: {
                    userId_scheduledDate_mealType: {
                        userId: user.id,
                        scheduledDate: new Date(order.date),
                        mealType: order.mealType,
                    },
                },
            });

            if (override) {
                order.enabled = override.enabled;
            }
        }

        return NextResponse.json({
            success: true,
            upcoming,
        });
    } catch (error) {
        console.error("Get upcoming orders error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// POST - Toggle specific upcoming order
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { date, mealType, enabled } = await req.json();

        if (!date || !mealType || enabled === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: date, mealType, enabled" },
                { status: 400 }
            );
        }

        const scheduledDate = new Date(date);

        // Upsert the override
        const override = await (prisma as any).scheduleOverride.upsert({
            where: {
                userId_scheduledDate_mealType: {
                    userId: user.id,
                    scheduledDate,
                    mealType,
                },
            },
            update: {
                enabled,
            },
            create: {
                userId: user.id,
                scheduledDate,
                mealType,
                enabled,
            },
        });

        return NextResponse.json({
            success: true,
            override,
            message: `Schedule ${enabled ? "enabled" : "disabled"} successfully`,
        });
    } catch (error) {
        console.error("Toggle schedule error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
