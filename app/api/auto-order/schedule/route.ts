import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received body:", JSON.stringify(body, null, 2));
    
    const { dietPlan, startDate } = body;

    if (!dietPlan) {
      console.error("Diet plan is missing from request");
      return NextResponse.json(
        { 
          error: "Diet plan is required",
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }

    if (!dietPlan.plan || !Array.isArray(dietPlan.plan)) {
      console.error("Diet plan structure is invalid:", dietPlan);
      return NextResponse.json(
        { 
          error: "Invalid diet plan structure. Expected { plan: [...] }",
          received: dietPlan
        },
        { status: 400 }
      );
    }

    console.log("=== ENABLING AUTO ORDERING ===");
    console.log("User:", session.user.email);
    console.log("Diet plan days:", dietPlan.plan?.length);
    console.log("Start date:", startDate);

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete existing scheduled orders for this user
    await (prisma as any).scheduledOrder.deleteMany({
      where: { userId: user.id },
    });

    // Store the diet plan as JSON in the first scheduled order record
    // This will be used by the cron job to determine what to order each day
    await (prisma as any).scheduledOrder.create({
      data: {
        userId: user.id,
        day: 0, // Special record to store diet plan
        dayName: "AUTO_ORDER_CONFIG",
        mealType: "config",
        scheduledTime: "00:00",
        requirements: {
          dietPlan: dietPlan,
          startDate: startDate || new Date().toISOString(),
          enabled: true,
        },
        status: "scheduled",
      },
    });

    console.log("Automated ordering enabled");

    return NextResponse.json({
      success: true,
      message: "Automated ordering enabled successfully",
    });
  } catch (error) {
    console.error("Schedule error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve scheduled orders and their status
export async function GET(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const scheduledOrders = await (prisma as any).scheduledOrder.findMany({
      where: { 
        userId: user.id,
        mealType: { not: "config" } // Exclude config record
      },
      orderBy: [{ executedAt: "desc" }, { day: "asc" }],
    });

    return NextResponse.json({
      success: true,
      orders: scheduledOrders,
    });
  } catch (error) {
    console.error("Get scheduled orders error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
