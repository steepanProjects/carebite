import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, Platform } from "@/lib/platforms";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, platform, canteenId } = await req.json();

    console.log("=== CREATE ORDER REQUEST ===");
    console.log("User:", session.user.email);
    console.log("Platform:", platform);
    console.log("Canteen ID:", canteenId);
    console.log("Items:", JSON.stringify(items, null, 2));

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    if (!platform || !canteenId) {
      return NextResponse.json(
        { error: "Platform and canteen ID are required" },
        { status: 400 }
      );
    }

    // Get user integration for the platform
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { integrations: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const integration = user.integrations.find((i) => i.platform === platform);

    if (!integration?.accessToken) {
      return NextResponse.json(
        { error: `${platform} not connected` },
        { status: 400 }
      );
    }

    // Build menus array in the format [[itemId, quantity], ...]
    const menus = items.map((item: any) => [
      item.menuItemId || item.itemId,
      item.quantity || 1,
    ]);

    console.log("Menus array:", JSON.stringify(menus, null, 2));

    const platformConfig = PLATFORMS[platform as Platform];
    const apiUrl = `${platformConfig.apiUrl}/api/carebite/create-order`;

    console.log("Calling platform API:", apiUrl);

    const requestBody = {
      email: session.user.email,
      accessToken: integration.accessToken,
      menus,
      canteenId,
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Call the platform's create-order API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log("=== PLATFORM API RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("Order creation failed:", result);
      return NextResponse.json(
        {
          error: result.error || "Failed to create order",
          details: result,
        },
        { status: response.status }
      );
    }

    console.log("=== ORDER CREATED SUCCESSFULLY ===");
    console.log("Order:", JSON.stringify(result.order, null, 2));

    return NextResponse.json({
      success: true,
      order: result.order,
      message: result.message || "Order placed successfully",
    });
  } catch (error) {
    console.error("=== CREATE ORDER ERROR ===");
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
