import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { verifyCode } from "@/lib/sillobite";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: "Email and code are required" },
        { status: 400 }
      );
    }

    const result = await verifyCode(email, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Verification failed" },
        { status: 400 }
      );
    }

    const session = await getServerSession();

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        await prisma.userIntegration.upsert({
          where: { userId: user.id },
          update: {
            sillobiteUserId: String(result.user_id!),
            accessToken: result.access_token!,
            connectedAt: new Date(),
          },
          create: {
            userId: user.id,
            sillobiteUserId: String(result.user_id!),
            accessToken: result.access_token!,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to SilloBite",
      data: {
        access_token: result.access_token,
        user_id: result.user_id,
      },
    });
  } catch (error) {
    console.error("Connect SilloBite error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
