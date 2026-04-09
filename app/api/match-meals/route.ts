import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mealRequirements, menuItems, userProfile } = await req.json();

    if (!mealRequirements) {
      return NextResponse.json(
        { error: "Meal requirements are required" },
        { status: 400 }
      );
    }

    // Ensure menuItems is an array
    let itemNames: string[] = [];
    
    if (Array.isArray(menuItems)) {
      itemNames = menuItems.map((item: any) => {
        if (typeof item === 'string') return item;
        return item.name || item.dishName || item.title || item.dish_name || String(item);
      }).filter(Boolean);
    } else if (menuItems && typeof menuItems === 'object') {
      // If it's an object, try to extract array from common properties
      const possibleArrays = ['dishes', 'items', 'menu', 'data', 'menuItems'];
      for (const key of possibleArrays) {
        if (Array.isArray(menuItems[key])) {
          itemNames = menuItems[key].map((item: any) => {
            if (typeof item === 'string') return item;
            return item.name || item.dishName || item.title || item.dish_name || String(item);
          }).filter(Boolean);
          break;
        }
      }
    }

    if (itemNames.length === 0) {
      return NextResponse.json(
        { error: "No valid menu items found" },
        { status: 400 }
      );
    }

    console.log("Item names to match:", itemNames.length, "items"); // Debug log

    // Create prompt for AI to match meals
    const prompt = `You are a nutrition expert. Match meal requirements with available menu items.

MEAL REQUIREMENTS:
- Calories: ${mealRequirements.cal}
- Protein: ${mealRequirements.p}g
- Carbs: ${mealRequirements.c}g
- Fats: ${mealRequirements.f}g
- Meal: ${mealRequirements.mealType}
- Time: ${mealRequirements.time}

USER INFO:
${userProfile ? `
- Medical: ${userProfile.medicalCondition || "None"}
- Goal: ${userProfile.fitnessGoal}
- Activity: ${userProfile.activityType}
` : "Not provided"}

AVAILABLE ITEMS:
${itemNames.join(', ')}

Select items that match nutritional needs. Consider medical conditions. Return ONLY JSON:
{
  "items": [
    {
      "platform": "sillobite",
      "itemName": "Item Name",
      "quantity": 1,
      "estimatedNutrition": {
        "cal": 300,
        "p": 20,
        "c": 40,
        "f": 10
      }
    }
  ],
  "totalNutrition": {"cal": 500, "p": 35, "c": 60, "f": 15},
  "matchScore": 95,
  "notes": "Brief explanation"
}`;

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
            content: "You are a nutrition expert. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: "Failed to match meals" },
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
    let matchResult;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      matchResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Failed to parse meal matching response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      match: matchResult
    });

  } catch (error) {
    console.error("Error matching meals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
