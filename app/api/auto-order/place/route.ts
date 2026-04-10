import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserIntegrations } from "@/lib/integration";
import { PLATFORMS, Platform } from "@/lib/platforms";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mealRequirements } = await req.json();

    if (!mealRequirements) {
      return NextResponse.json(
        { error: "Meal requirements are required" },
        { status: 400 }
      );
    }

    console.log("=== AUTO ORDER: Fetching fresh menu data ===");

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user integrations and profile
    const integrations = await getUserIntegrations(user.id);

    const profile: any = await (prisma as any).userProfile.findUnique({
      where: { userId: user.id },
    });

    // Fetch fresh menu data from all connected platforms
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
                email: session.user.email,
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

            // Ensure platform is set
            items = items.map((item) => ({
              ...item,
              platform: item.platform || platform,
            }));

            allMenuItems.push(...items);
            console.log(`Fetched ${items.length} items from ${platform}`);
          }
        } catch (error) {
          console.error(`Error fetching menu from ${platform}:`, error);
        }
      }
    }

    if (allMenuItems.length === 0) {
      return NextResponse.json(
        { error: "No menu items available from connected platforms" },
        { status: 400 }
      );
    }

    console.log(`Total fresh menu items: ${allMenuItems.length}`);

    // Call match-meals API with fresh data
    const matchResponse = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/match-meals`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealRequirements,
          menuItems: allMenuItems,
          userProfile: profile,
        }),
      }
    );

    const matchResult = await matchResponse.json();

    if (!matchResponse.ok || !matchResult.success) {
      return NextResponse.json(
        { error: matchResult.error || "Failed to match meals" },
        { status: matchResponse.status }
      );
    }

    const matchedItems = matchResult.match;

    // Validate all items are from same platform and canteen
    if (!matchedItems.items || matchedItems.items.length === 0) {
      return NextResponse.json(
        { error: "No matching items found" },
        { status: 400 }
      );
    }

    const firstItem = matchedItems.items[0];
    const platform = firstItem.platform;
    const canteenId = firstItem.canteenId || firstItem.restaurantId;

    // Prepare order items
    const orderItems = matchedItems.items.map((item: any) => ({
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      quantity: item.quantity || 1,
    }));

    console.log("=== AUTO ORDER: Placing order ===");
    console.log("Platform:", platform);
    console.log("Canteen:", canteenId);
    console.log("Items:", orderItems.length);

    // Place the order
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

    if (!orderResponse.ok || !orderResult.success) {
      return NextResponse.json(
        {
          error: orderResult.error || "Failed to place order",
          details: orderResult.details,
        },
        { status: orderResponse.status }
      );
    }

    console.log("=== AUTO ORDER: Success ===");
    console.log("Order Number:", orderResult.order.orderNumber);

    return NextResponse.json({
      success: true,
      order: orderResult.order,
      matchedItems: matchedItems,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Auto order error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
