import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, Platform } from "@/lib/platforms";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("Menu API - Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      email: session?.user?.email
    });

    if (!session?.user?.email) {
      console.log("Menu API - Unauthorized: No session or email");
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get platform from query params
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform || 'sillobite';

    console.log("Menu API - Platform:", platform);

    if (!PLATFORMS[platform]) {
      console.log("Menu API - Invalid platform:", platform);
      return NextResponse.json(
        { success: false, message: "Invalid platform" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { integrations: true },
    });

    console.log("Menu API - User found:", {
      hasUser: !!user,
      userId: user?.id,
      integrationsCount: user?.integrations?.length || 0
    });

    if (!user) {
      console.log("Menu API - User not found in database");
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const integration = user.integrations.find(i => i.platform === platform);

    console.log("Menu API - Integration check:", {
      platform,
      hasIntegration: !!integration,
      hasAccessToken: !!integration?.accessToken,
      integrationPlatform: integration?.platform
    });

    if (!integration?.accessToken) {
      const platformConfig = PLATFORMS[platform];
      console.log("Menu API - No integration or access token for platform:", platform);
      return NextResponse.json(
        { success: false, message: `${platformConfig.displayName} not connected. Please connect first.` },
        { status: 400 }
      );
    }

    const platformConfig = PLATFORMS[platform];
    console.log("Menu API - Fetching menu from:", `${platformConfig.apiUrl}/api/carebite/menu`);

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

    console.log("Menu API - External API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("Menu API - External API error:", errorData);

      // If it's a 401, the access token is likely expired or invalid
      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            message: `${platformConfig.displayName} access token is invalid or expired. Please reconnect your account.`,
            needsReconnect: true,
            platform
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || errorData.error || `Failed to fetch menu from ${platformConfig.displayName}`
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
