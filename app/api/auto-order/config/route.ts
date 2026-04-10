import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch auto-order configuration
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

        let config = await (prisma as any).autoOrderConfig.findUnique({
            where: { userId: user.id },
        });

        // Create default config if doesn't exist
        if (!config) {
            config = await (prisma as any).autoOrderConfig.create({
                data: {
                    userId: user.id,
                    enabled: false,
                    breakfastEnabled: true,
                    lunchEnabled: true,
                    dinnerEnabled: true,
                    breakfastTime: "07:30",
                    lunchTime: "12:30",
                    dinnerTime: "19:30",
                    mondayEnabled: true,
                    tuesdayEnabled: true,
                    wednesdayEnabled: true,
                    thursdayEnabled: true,
                    fridayEnabled: true,
                    saturdayEnabled: true,
                    sundayEnabled: true,
                },
            });
        }

        return NextResponse.json({
            success: true,
            config,
        });
    } catch (error) {
        console.error("Get auto-order config error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// POST - Update auto-order configuration
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

        const body = await req.json();

        const config = await (prisma as any).autoOrderConfig.upsert({
            where: { userId: user.id },
            update: {
                ...body,
                updatedAt: new Date(),
            },
            create: {
                userId: user.id,
                ...body,
            },
        });

        return NextResponse.json({
            success: true,
            config,
            message: "Auto-order configuration updated successfully",
        });
    } catch (error) {
        console.error("Update auto-order config error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
