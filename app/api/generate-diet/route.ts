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

    const { days, menuItems } = await req.json();

    if (!days || !menuItems || menuItems.length === 0) {
      return NextResponse.json(
        { error: "Days and menu items are required" },
        { status: 400 }
      );
    }

    // Extract only dish names from menu items
    const dishNames = menuItems.map((item: any) => {
      if (typeof item === 'string') return item;
      return item.name || item.dishName || item.title || String(item);
    }).filter(Boolean);

    if (dishNames.length === 0) {
      return NextResponse.json(
        { error: "No valid dish names found in menu" },
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

    // Create simplified prompt for LLM
    const prompt = `You are a professional nutritionist. Create a ${days}-day personalized diet plan.

USER PROFILE:
- Age: ${profile.age} years
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- BMI: ${bmi}
- Fitness Goal: ${profile.fitnessGoal}
- Activity Type: ${profile.activityType}
- Goals: ${profile.goalDescription || "Not specified"}
- Medical Conditions: ${profile.medicalCondition || "None"}

AVAILABLE DISHES (use ONLY these):
${dishNames.join(', ')}

IMPORTANT INSTRUCTIONS:
1. Consider the user's fitness goal:
   - weight_loss: Lower calories, high protein, moderate carbs
   - muscle_gain: High protein, high calories, good carbs
   - endurance: High carbs, moderate protein, sustained energy
   - general_fitness: Balanced nutrition

2. Consider activity type:
   - gym: High protein for muscle recovery
   - cycling/running/marathon: High carbs for energy
   - general: Balanced meals

3. Respect medical conditions - avoid foods that may conflict

4. Use ONLY dishes from the available list above

5. Create variety across days

Return ONLY valid JSON (no markdown, no code blocks):
{
  "dietPlan": [
    {
      "day": "Monday",
      "dayNumber": 1,
      "breakfast": {
        "time": "8:00 AM",
        "dishes": ["dish1", "dish2"]
      },
      "lunch": {
        "time": "1:00 PM",
        "dishes": ["dish1", "dish2"]
      },
      "snacks": {
        "time": "4:00 PM",
        "dishes": ["dish1"]
      },
      "dinner": {
        "time": "8:00 PM",
        "dishes": ["dish1", "dish2"]
      }
    }
  ],
  "nutritionalNotes": "Brief explanation of the diet strategy based on user's goals and conditions"
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
    const content = data.choices[0]?.message?.content;

    if (!content) {
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
      dietPlan = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Failed to parse diet plan response" },
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
