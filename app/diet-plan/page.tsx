"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DietPlanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadMenuFromCache();
      loadSavedDietPlan(); // Load previously saved diet plan if exists
    }
  }, [status, router]);

  const loadMenuFromCache = () => {
    try {
      const cachedMenu = localStorage.getItem("sillobite_menu");
      if (cachedMenu) {
        const menuData = JSON.parse(cachedMenu);
        console.log("Menu data structure:", menuData); // Debug log
        
        // Handle different menu data structures
        let dishes: string[] = [];
        
        if (Array.isArray(menuData)) {
          // If it's already an array
          dishes = menuData.map((item: any) => {
            if (typeof item === 'string') return item;
            return item.name || item.dishName || item.title || item.dish_name || String(item);
          }).filter(Boolean);
        } else if (typeof menuData === 'object' && menuData !== null) {
          // If it's an object, try to extract dishes from common properties
          const possibleArrays = ['dishes', 'items', 'menu', 'data', 'menuItems'];
          for (const key of possibleArrays) {
            if (Array.isArray(menuData[key])) {
              dishes = menuData[key].map((item: any) => {
                if (typeof item === 'string') return item;
                return item.name || item.dishName || item.title || item.dish_name || String(item);
              }).filter(Boolean);
              break;
            }
          }
          
          // If still no dishes found, try to get all values that might be dish names
          if (dishes.length === 0) {
            dishes = Object.values(menuData)
              .filter((val: any) => typeof val === 'string' || (val && typeof val.name === 'string'))
              .map((val: any) => typeof val === 'string' ? val : val.name)
              .filter(Boolean);
          }
        }
        
        if (dishes.length > 0) {
          setMenuItems(dishes);
          console.log("Loaded dishes:", dishes); // Debug log
        } else {
          console.error("No dishes extracted from:", menuData);
          setError("No valid menu items found. Please fetch menu from your profile first.");
        }
      } else {
        setError("No menu items found. Please fetch menu from your profile first.");
      }
    } catch (error) {
      console.error("Error loading menu:", error);
      setError("Failed to load menu items");
    }
  };

  const handleGenerate = async () => {
    if (menuItems.length === 0) {
      setError("No menu items available. Please fetch menu from your profile first.");
      return;
    }

    setLoading(true);
    setError("");
    setDietPlan(null);

    try {
      const response = await fetch("/api/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          menuItems
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDietPlan(result);
        // Save to localStorage - will persist until next plan is generated
        localStorage.setItem("current_diet_plan", JSON.stringify(result));
      } else {
        setError(result.error || "Failed to generate diet plan");
      }
    } catch (error) {
      console.error("Error generating diet plan:", error);
      setError("An error occurred while generating the diet plan");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedDietPlan = () => {
    try {
      const savedPlan = localStorage.getItem("current_diet_plan");
      if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        setDietPlan(plan);
        setDays(plan.dietPlan?.dietPlan?.length || 7);
      }
    } catch (error) {
      console.error("Error loading saved diet plan:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <h1 className="text-xl font-bold text-gray-800">CareBite</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Generate Your Personalized Diet Plan 🥗
          </h2>
          <p className="text-gray-600">
            AI-powered meal planning based on your profile and available menu items
          </p>
        </div>

        {!dietPlan ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Days
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter number of days (1-30)"
              />
              <p className="text-sm text-gray-500 mt-2">
                📊 Available menu items: {menuItems.length}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
                {error.includes("fetch menu") && (
                  <button
                    onClick={() => router.push("/profile")}
                    className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                  >
                    Go to Profile to fetch menu
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || menuItems.length === 0}
              className="w-full bg-emerald-500 text-white py-4 rounded-lg font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating your personalized diet plan...
                </span>
              ) : (
                "Generate Diet Plan"
              )}
            </button>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How it works:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• AI analyzes your profile (age, weight, height, BMI, goals, medical conditions)</li>
                <li>• Considers fitness goals (weight loss = low cal, muscle gain = high protein, endurance = high carbs)</li>
                <li>• Respects activity type (gym = protein focus, running/cycling = carb focus)</li>
                <li>• Takes medical conditions into account for safe recommendations</li>
                <li>• Creates balanced meals using only your available menu items</li>
                <li>• Organizes by day names (Monday, Tuesday, etc.)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Your {days}-Day Diet Plan
                  </h3>
                  {dietPlan.dietPlan.nutritionalNotes && (
                    <p className="text-gray-600 mt-2">
                      <span className="font-semibold">Strategy:</span> {dietPlan.dietPlan.nutritionalNotes}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    💾 This plan is saved and will be available until you generate a new one
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDietPlan(null);
                    localStorage.removeItem("current_diet_plan");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Generate New Plan
                </button>
              </div>
            </div>

            {/* Compact Table View */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-emerald-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Day</th>
                      <th className="px-4 py-3 text-left font-semibold">Breakfast (8:00 AM)</th>
                      <th className="px-4 py-3 text-left font-semibold">Lunch (1:00 PM)</th>
                      <th className="px-4 py-3 text-left font-semibold">Snacks (4:00 PM)</th>
                      <th className="px-4 py-3 text-left font-semibold">Dinner (8:00 PM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dietPlan.dietPlan.dietPlan?.map((dayPlan: any, index: number) => {
                      // Handle both old and new format
                      const breakfast = dayPlan.breakfast?.dishes || dayPlan.breakfast || [];
                      const lunch = dayPlan.lunch?.dishes || dayPlan.lunch || [];
                      const snacks = dayPlan.snacks?.dishes || dayPlan.snacks || [];
                      const dinner = dayPlan.dinner?.dishes || dayPlan.dinner || [];
                      const breakfastTime = dayPlan.breakfast?.time || "8:00 AM";
                      const lunchTime = dayPlan.lunch?.time || "1:00 PM";
                      const snacksTime = dayPlan.snacks?.time || "4:00 PM";
                      const dinnerTime = dayPlan.dinner?.time || "8:00 PM";
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                            Day {dayPlan.dayNumber || index + 1}
                            <div className="text-xs text-gray-500 font-normal">{dayPlan.day}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-500 mb-1">{breakfastTime}</div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {breakfast.map((dish: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span>{dish}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-500 mb-1">{lunchTime}</div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {lunch.map((dish: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span>{dish}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-500 mb-1">{snacksTime}</div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {snacks.map((dish: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span>{dish}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-500 mb-1">{dinnerTime}</div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {dinner.map((dish: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span>{dish}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Placement Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Diet Plan Saved</h4>
              <p className="text-sm text-blue-800 mb-2">
                Your personalized diet plan is saved in cache memory with meal timings:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• Breakfast: 8:00 AM</li>
                <li>• Lunch: 1:00 PM</li>
                <li>• Snacks: 4:00 PM</li>
                <li>• Dinner: 8:00 PM</li>
              </ul>
              <p className="text-sm text-blue-800 mt-2">
                This plan will remain available until you generate a new one.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
