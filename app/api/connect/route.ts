import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCode, Platform, PLATFORMS } from "@/lib/platforms";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, platform } = body;

    if (!email || !code || !platform) {
      return NextResponse.json(
        { success: false, message: "Email, code, and platform are required" },
        { status: 400 }
      );
    }

    if (!PLATFORMS[platform as Platform]) {
      return NextResponse.json(
        { success: false, message: "Invalid platform" },
        { status: 400 }
      );
    }

    const result = await verifyCode(platform as Platform, email, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Verification failed" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        await prisma.userIntegration.upsert({
          where: {
            userId_platform: {
              userId: user.id,
              platform: platform as Platform
            }
          },
          update: {
            platformUserId: String(result.user_id!),
            accessToken: result.access_token!,
            connectedAt: new Date(),
          },
          create: {
            userId: user.id,
            platform: platform as Platform,
            platformUserId: String(result.user_id!),
            accessToken: result.access_token!,
          },
        });
      }
    }

    const platformConfig = PLATFORMS[platform as Platform];
    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${platformConfig.displayName}`,
      data: {
        access_token: result.access_token,
        user_id: result.user_id,
        platform,
      },
    });
  } catch (error) {
    console.error("Connect platform error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
