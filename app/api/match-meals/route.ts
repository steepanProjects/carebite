import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

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

    // Build structured item list with platform and canteen info
    let structuredItems: Array<{
      id: string;
      name: string;
      platform: string;
      canteenId?: string;
      canteenName?: string;
    }> = [];

    if (Array.isArray(menuItems)) {
      structuredItems = menuItems.map((item: any) => {
        const name = item.name || item.dishName || item.title || item.dish_name || String(item);
        const platform = item.platform || 'sillobite';
        const canteenId = item.canteenId || item.canteen_id || item.restaurantId || item.restaurant_id;
        const canteenName = item.canteenName || item.canteen_name || item.restaurantName || item.restaurant_name;
        const id = item.id || item._id || item.menuItemId || item.menu_item_id;

        return { id, name, platform, canteenId, canteenName };
      }).filter((item) => item.name && item.id);
    }

    if (structuredItems.length === 0) {
      return NextResponse.json(
        { error: "No valid menu items found" },
        { status: 400 }
      );
    }

    console.log("Items to match:", structuredItems.length, "items from all platforms");
    console.log("Sample structured items:", structuredItems.slice(0, 3).map(item => ({
      id: item.id,
      name: item.name,
      platform: item.platform,
      canteenId: item.canteenId
    })));

    // Group items by platform and canteen to reduce token usage
    const itemsByCanteen = structuredItems.reduce((acc: any, item) => {
      const key = `${item.platform}:${item.canteenId}`;
      if (!acc[key]) {
        acc[key] = {
          platform: item.platform,
          canteenId: item.canteenId,
          canteenName: item.canteenName,
          items: []
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {});

    // Create a more compact format: group by canteen, limit items to reduce tokens
    const MAX_ITEMS_PER_CANTEEN = 50; // Limit items per canteen to stay within token limits
    const compactList = Object.values(itemsByCanteen).map((canteen: any) => {
      const itemsToShow = canteen.items.slice(0, MAX_ITEMS_PER_CANTEEN);
      const itemNames = itemsToShow.map((item: any) => `${item.id}:${item.name}`).join(', ');
      const moreText = canteen.items.length > MAX_ITEMS_PER_CANTEEN ? ` (+${canteen.items.length - MAX_ITEMS_PER_CANTEEN} more)` : '';
      return `[${canteen.platform}] Canteen:${canteen.canteenId} (${canteen.canteenName || 'Unknown'})${moreText}\nItems: ${itemNames}`;
    }).join('\n\n');

    console.log("Canteens available:", Object.keys(itemsByCanteen).length);
    console.log("Total items across all canteens:", structuredItems.length);

    // Create prompt for AI to match meals
    const prompt = `You are a nutrition expert. Match meal requirements with available menu items from multiple platforms.

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

AVAILABLE CANTEENS AND ITEMS (grouped by canteen for efficiency):
${compactList}

CRITICAL INSTRUCTIONS:
1. ALL selected items MUST be from the SAME platform AND SAME canteen
2. Choose the canteen that has the best combination of dishes to meet nutritional requirements
3. Consider medical conditions and dietary restrictions
4. Return items with their EXACT menu item ID (the ID before the colon in "ID:Name" format)
5. IMPORTANT: Extract the canteenId value from "Canteen:VALUE" - return only VALUE
6. If no single canteen can fulfill the requirements well, choose the best available option

Return ONLY JSON:
{
  "items": [
    {
      "menuItemId": "exact_id_from_list",
      "itemName": "Exact Item Name",
      "platform": "platform_name",
      "canteenId": "only_the_canteen_id_value",
      "canteenName": "Canteen Name",
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
  "notes": "Brief explanation of why these items were chosen"
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

      // Check if it's a rate limit error
      if (errorData.error?.code === 'rate_limit_exceeded') {
        const errorMsg = errorData.error.message;
        // Extract wait time if available
        const waitTimeMatch = errorMsg.match(/try again in ([\d.]+[smh]+)/);
        const waitTime = waitTimeMatch ? waitTimeMatch[1] : 'some time';

        return NextResponse.json(
          {
            error: `Rate limit reached. Please try again in ${waitTime}.`,
            details: errorMsg
          },
          { status: 429 }
        );
      }

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

      // Post-process: Clean up canteenId if it has prefixes
      if (matchResult.items && Array.isArray(matchResult.items)) {
        matchResult.items = matchResult.items.map((item: any) => {
          if (item.canteenId) {
            // Remove any prefix like "R:", "Canteen:", etc.
            item.canteenId = item.canteenId.replace(/^(R:|Canteen:|Restaurant:)/i, '');
          }
          if (item.restaurantId) {
            // Also clean restaurantId for backward compatibility
            item.restaurantId = item.restaurantId.replace(/^(R:|Canteen:|Restaurant:)/i, '');
          }
          return item;
        });
      }

      console.log("Matched items with cleaned IDs:", matchResult.items?.map((item: any) => ({
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        canteenId: item.canteenId,
        platform: item.platform
      })));
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
