import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Test endpoint to manually trigger order for current user
// This bypasses time window checks for testing purposes

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mealType } = await req.json(); // breakfast, lunch, or dinner

    if (!mealType || !["breakfast", "lunch", "dinner"].includes(mealType)) {
      return NextResponse.json(
        { error: "Invalid meal type. Use: breakfast, lunch, or dinner" },
        { status: 400 }
      );
    }

    console.log(`=== TEST ORDER: ${mealType} for ${session.user.email} ===`);

    // Call the cron endpoint with a test flag
    const cronUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auto-order/cron?test=true&mealType=${mealType}&email=${session.user.email}`;

    const response = await fetch(cronUrl, {
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Test order triggered for ${mealType}`,
      result,
    });
  } catch (error) {
    console.error("Test order error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
