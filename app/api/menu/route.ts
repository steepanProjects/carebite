import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, Platform } from "@/lib/platforms";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get platform from query params
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform || 'sillobite';

    if (!PLATFORMS[platform]) {
      return NextResponse.json(
        { success: false, message: "Invalid platform" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { integrations: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const integration = user.integrations.find(i => i.platform === platform);

    if (!integration?.accessToken) {
      const platformConfig = PLATFORMS[platform];
      return NextResponse.json(
        { success: false, message: `${platformConfig.displayName} not connected. Please connect first.` },
        { status: 400 }
      );
    }

    const platformConfig = PLATFORMS[platform];
    const response = await fetch(`${platformConfig.apiUrl}/api/carebite/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        accessToken: integration.accessToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || `Failed to fetch menu from ${platformConfig.displayName}` 
        },
        { status: response.status }
      );
    }

    const menuData = await response.json();

    return NextResponse.json({
      success: true,
      data: menuData,
      platform,
    });
  } catch (error) {
    console.error("Fetch menu error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
