import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { days } = await req.json();

    if (!days) {
      return NextResponse.json(
        { error: "Number of days is required" },
        { status: 400 }
      );
    }

    // Fetch user with profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        profile: true 
      }
    });

    if (!user?.profile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    const profile = user.profile;
    const bmi = (profile.weight! / Math.pow(profile.height! / 100, 2)).toFixed(1);

    // Get day names based on number of days
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const planDays = Array.from({ length: days }, (_, i) => dayNames[i % 7]);

    // Create prompt for LLM focusing on nutritional requirements
    const prompt = `You are a professional nutritionist. Create a ${days}-day personalized diet plan based on nutritional requirements.

USER PROFILE:
- Age: ${profile.age} years
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- BMI: ${bmi}
- Fitness Goal: ${profile.fitnessGoal}
- Activity Type: ${profile.activityType}
- Goals: ${profile.goalDescription || "Not specified"}
- Medical Conditions: ${profile.medicalCondition || "None"}

INSTRUCTIONS:
1. Based on the user's fitness goal, provide nutritional requirements:
   - weight_loss: Lower calories (1500-1800 cal/day), high protein (100-120g), moderate carbs (150-180g), healthy fats
   - muscle_gain: Higher calories (2500-3000 cal/day), very high protein (150-180g), high carbs (300-350g), moderate fats
   - endurance: High calories (2200-2800 cal/day), moderate protein (100-130g), very high carbs (350-400g), moderate fats
   - general_fitness: Balanced (2000-2200 cal/day), moderate protein (80-100g), balanced carbs (200-250g), healthy fats

2. Consider activity type:
   - gym: Emphasize protein for muscle recovery, post-workout carbs
   - cycling/running/marathon: Emphasize carbs for sustained energy, adequate protein
   - general: Balanced macronutrients

3. Respect medical conditions - adjust macros accordingly

4. For each meal, provide ONLY the target macronutrients (no food names)

5. No snacks - only breakfast, lunch, dinner

Return ONLY valid JSON (no markdown, no code blocks):
{
  "plan": [
    {
      "d": 1,
      "day": "Monday",
      "b": {"t": "8:00 AM", "cal": 500, "p": 30, "c": 60, "f": 15},
      "l": {"t": "1:00 PM", "cal": 600, "p": 40, "c": 70, "f": 20},
      "dn": {"t": "8:00 PM", "cal": 700, "p": 45, "c": 80, "f": 25},
      "total": 1800
    }
  ],
  "notes": "Brief strategy",
  "target": {"cal": 1800, "p": 115, "c": 210, "f": 60}
}

Days to plan: ${planDays.join(', ')}`;

    // Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a professional nutritionist. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate diet plan" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Groq API response:", data); // Debug log
    const content = data.choices[0]?.message?.content;
    console.log("AI content:", content); // Debug log

    if (!content) {
      console.error("No content in response");
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let dietPlan;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log("Cleaned content:", cleanContent); // Debug log
      dietPlan = JSON.parse(cleanContent);
      console.log("Parsed diet plan:", dietPlan); // Debug log
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Failed to parse diet plan response", details: content },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dietPlan: dietPlan,
      userProfile: {
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        bmi: parseFloat(bmi),
        fitnessGoal: profile.fitnessGoal,
        activityType: profile.activityType
      }
    });

  } catch (error) {
    console.error("Error generating diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
