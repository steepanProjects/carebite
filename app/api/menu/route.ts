import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const SILLOBITE_API_URL = process.env.SILLOBITE_API_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { integration: true },
    });

    if (!user || !user.integration?.accessToken) {
      return NextResponse.json(
        { success: false, message: "SilloBite not connected. Please connect first." },
        { status: 400 }
      );
    }

    const response = await fetch(`${SILLOBITE_API_URL}/api/carebite/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        accessToken: user.integration.accessToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || "Failed to fetch menu from SilloBite" 
        },
        { status: response.status }
      );
    }

    const menuData = await response.json();

    return NextResponse.json({
      success: true,
      data: menuData,
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
