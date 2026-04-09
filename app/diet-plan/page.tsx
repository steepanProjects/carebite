"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DietPlanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadSavedDietPlan(); // Load previously saved diet plan if exists
    }
  }, [status, router]);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setDietPlan(null);

    try {
      const response = await fetch("/api/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days })
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
            AI-powered meal planning based on your profile
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
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
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
                <li>• Creates nutritional requirements based on your fitness goals</li>
                <li>• Provides food types, calories, and macronutrients (protein, carbs, fats)</li>
                <li>• Considers activity type for optimal nutrition timing</li>
                <li>• Respects medical conditions for safe recommendations</li>
                <li>• Organizes by day with meal timings for easy planning</li>
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
                  {dietPlan.dietPlan.notes && (
                    <p className="text-gray-600 mt-2">
                      <span className="font-semibold">Strategy:</span> {dietPlan.dietPlan.notes}
                    </p>
                  )}
                  {dietPlan.dietPlan.target && (
                    <div className="mt-3 flex gap-4 text-sm">
                      <span className="text-gray-700">
                        <span className="font-semibold">Daily Target:</span> {dietPlan.dietPlan.target.cal} cal
                      </span>
                      <span className="text-gray-700">
                        P: {dietPlan.dietPlan.target.p}g
                      </span>
                      <span className="text-gray-700">
                        C: {dietPlan.dietPlan.target.c}g
                      </span>
                      <span className="text-gray-700">
                        F: {dietPlan.dietPlan.target.f}g
                      </span>
                    </div>
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
                      <th className="px-4 py-3 text-left font-semibold">Breakfast</th>
                      <th className="px-4 py-3 text-left font-semibold">Lunch</th>
                      <th className="px-4 py-3 text-left font-semibold">Dinner</th>
                      <th className="px-4 py-3 text-left font-semibold">Daily Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(dietPlan.dietPlan?.plan || dietPlan.dietPlan?.dietPlan)?.map((dayPlan: any, index: number) => {
                      // Handle new ultra-compact format
                      const breakfast = dayPlan.b || dayPlan.breakfast;
                      const lunch = dayPlan.l || dayPlan.lunch;
                      const dinner = dayPlan.dn || dayPlan.dinner;
                      const dayNum = dayPlan.d || dayPlan.dayNumber || index + 1;
                      const dayName = dayPlan.day;
                      const dayTotal = dayPlan.total || dayPlan.dayTotal;
                      
                      const renderMacros = (meal: any) => {
                        if (!meal) return null;
                        const cal = meal.cal || meal.total;
                        const protein = meal.p;
                        const carbs = meal.c;
                        const fats = meal.f;
                        const time = meal.t || meal.time;
                        
                        return (
                          <div>
                            {time && <div className="text-xs text-gray-500 mb-2 font-semibold">{time}</div>}
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-gray-800">{cal} calories</div>
                              <div className="text-xs text-gray-600">Protein: {protein}g</div>
                              <div className="text-xs text-gray-600">Carbs: {carbs}g</div>
                              <div className="text-xs text-gray-600">Fats: {fats}g</div>
                            </div>
                          </div>
                        );
                      };
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap align-top">
                            Day {dayNum}
                            <div className="text-xs text-gray-500 font-normal">{dayName}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {renderMacros(breakfast)}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {renderMacros(lunch)}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {renderMacros(dinner)}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="text-lg font-bold text-emerald-600">
                              {dayTotal} cal
                            </div>
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
              <h4 className="font-semibold text-blue-900 mb-2">📋 Nutritional Targets Saved</h4>
              <p className="text-sm text-blue-800 mb-2">
                Your personalized macronutrient targets are saved in cache memory for each meal.
              </p>
              <p className="text-sm text-blue-800">
                This plan will remain available until you generate a new one.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
