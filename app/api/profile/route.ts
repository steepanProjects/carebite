import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  console.log("POST /api/profile called");
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", JSON.stringify(session, null, 2));

    if (!session?.user?.email) {
      console.log("No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    console.log("Request data:", data);
    const { age, height, weight, fitnessGoal, activityType, goalDescription, medicalCondition } = data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    console.log("User found:", JSON.stringify(user, null, 2));

    if (!user) {
      console.log("User not found in database for email:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Upserting profile for user:", user.id);
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        age,
        height,
        weight,
        fitnessGoal,
        activityType,
        goalDescription,
        medicalCondition
      },
      create: {
        userId: user.id,
        age,
        height,
        weight,
        fitnessGoal,
        activityType,
        goalDescription,
        medicalCondition
      }
    });
    console.log("Profile saved:", profile);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: user.profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
