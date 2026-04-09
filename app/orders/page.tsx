"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<string>("");
  const [matchedItems, setMatchedItems] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadDietPlan();
      loadMenu();
      loadUserProfile();
    }
  }, [status, router]);

  const loadDietPlan = () => {
    try {
      const savedPlan = localStorage.getItem("current_diet_plan");
      if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        setDietPlan(plan);
      }
    } catch (error) {
      console.error("Error loading diet plan:", error);
    }
  };

  const loadMenu = () => {
    try {
      const cachedMenu = localStorage.getItem("sillobite_menu");
      if (cachedMenu) {
        const menuData = JSON.parse(cachedMenu);
        // Extract just item names
        let items: string[] = [];
        
        if (Array.isArray(menuData)) {
          items = menuData.map((item: any) => {
            if (typeof item === 'string') return item;
            return item.name || item.dishName || item.title || item.dish_name || String(item);
          }).filter(Boolean);
        } else if (typeof menuData === 'object' && menuData !== null) {
          const possibleArrays = ['dishes', 'items', 'menu', 'data', 'menuItems'];
          for (const key of possibleArrays) {
            if (Array.isArray(menuData[key])) {
              items = menuData[key].map((item: any) => {
                if (typeof item === 'string') return item;
                return item.name || item.dishName || item.title || item.dish_name || String(item);
              }).filter(Boolean);
              break;
            }
          }
        }
        
        setMenuItems(items);
      }
    } catch (error) {
      console.error("Error loading menu:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.profile) {
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleMatchMeal = async (dayIndex: number, mealType: string) => {
    setLoading(true);
    setSelectedDay(dayIndex);
    setSelectedMeal(mealType);
    setMatchedItems(null);

    try {
      const day = dietPlan.dietPlan.plan[dayIndex];
      let mealReq;
      
      if (mealType === "breakfast") {
        mealReq = { ...day.b, mealType: "Breakfast" };
      } else if (mealType === "lunch") {
        mealReq = { ...day.l, mealType: "Lunch" };
      } else if (mealType === "dinner") {
        mealReq = { ...day.dn, mealType: "Dinner" };
      }

      console.log("Menu items type:", typeof menuItems, "Is array:", Array.isArray(menuItems));
      console.log("Menu items:", menuItems);

      const response = await fetch("/api/match-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealRequirements: mealReq,
          menuItems: menuItems,
          userProfile: userProfile
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMatchedItems(result.match);
      } else {
        alert(result.error || "Failed to match meals");
      }
    } catch (error) {
      console.error("Error matching meals:", error);
      alert("An error occurred while matching meals");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!dietPlan) {
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Diet Plan Found</h3>
            <p className="text-yellow-800 mb-4">
              Please generate a diet plan first before managing orders.
            </p>
            <button
              onClick={() => router.push("/diet-plan")}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Generate Diet Plan
            </button>
          </div>
        </main>
      </div>
    );
  }

  const days = dietPlan.dietPlan.plan || [];

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
              <h1 className="text-xl font-bold text-gray-800">CareBite - Order Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Order Management 🛒
          </h2>
          <p className="text-gray-600">
            AI-powered meal matching based on your diet plan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Days List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Select Day</h3>
            <div className="space-y-2">
              {days.map((day: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedDay === index
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  }`}
                >
                  <div className="font-semibold">Day {day.d}</div>
                  <div className="text-sm opacity-90">{day.day}</div>
                  <div className="text-xs opacity-75 mt-1">{day.total} cal</div>
                </button>
              ))}
            </div>
          </div>

          {/* Meals for Selected Day */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              {days[selectedDay]?.day} - Select Meal
            </h3>
            <div className="space-y-4">
              {/* Breakfast */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">🌅 Breakfast</h4>
                    <p className="text-xs text-gray-500">{days[selectedDay]?.b?.t}</p>
                  </div>
                  <button
                    onClick={() => handleMatchMeal(selectedDay, "breakfast")}
                    disabled={loading || menuItems.length === 0}
                    className="px-3 py-1 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600 disabled:bg-gray-300"
                  >
                    {loading && selectedMeal === "breakfast" ? "Matching..." : "Match Items"}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Cal: {days[selectedDay]?.b?.cal}</div>
                  <div>P: {days[selectedDay]?.b?.p}g | C: {days[selectedDay]?.b?.c}g | F: {days[selectedDay]?.b?.f}g</div>
                </div>
              </div>

              {/* Lunch */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">☀️ Lunch</h4>
                    <p className="text-xs text-gray-500">{days[selectedDay]?.l?.t}</p>
                  </div>
                  <button
                    onClick={() => handleMatchMeal(selectedDay, "lunch")}
                    disabled={loading || menuItems.length === 0}
                    className="px-3 py-1 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600 disabled:bg-gray-300"
                  >
                    {loading && selectedMeal === "lunch" ? "Matching..." : "Match Items"}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Cal: {days[selectedDay]?.l?.cal}</div>
                  <div>P: {days[selectedDay]?.l?.p}g | C: {days[selectedDay]?.l?.c}g | F: {days[selectedDay]?.l?.f}g</div>
                </div>
              </div>

              {/* Dinner */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">🌙 Dinner</h4>
                    <p className="text-xs text-gray-500">{days[selectedDay]?.dn?.t}</p>
                  </div>
                  <button
                    onClick={() => handleMatchMeal(selectedDay, "dinner")}
                    disabled={loading || menuItems.length === 0}
                    className="px-3 py-1 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600 disabled:bg-gray-300"
                  >
                    {loading && selectedMeal === "dinner" ? "Matching..." : "Match Items"}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Cal: {days[selectedDay]?.dn?.cal}</div>
                  <div>P: {days[selectedDay]?.dn?.p}g | C: {days[selectedDay]?.dn?.c}g | F: {days[selectedDay]?.dn?.f}g</div>
                </div>
              </div>
            </div>

            {menuItems.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                No menu items found. Please fetch menu from your profile first.
              </div>
            )}
          </div>

          {/* Matched Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Matched Items</h3>
            {matchedItems ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-emerald-900">Match Score</span>
                    <span className="text-2xl font-bold text-emerald-600">{matchedItems.matchScore}%</span>
                  </div>
                  {matchedItems.notes && (
                    <p className="text-sm text-emerald-800">{matchedItems.notes}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Selected Items:</h4>
                  {matchedItems.items?.map((item: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3 mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">{item.itemName}</div>
                          {item.restaurantName && (
                            <div className="text-xs text-gray-500">{item.restaurantName}</div>
                          )}
                          <div className="text-xs text-gray-500">Platform: {item.platform}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>Cal: {item.estimatedNutrition.cal} | P: {item.estimatedNutrition.p}g</div>
                        <div>C: {item.estimatedNutrition.c}g | F: {item.estimatedNutrition.f}g</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-700 mb-2">Total Nutrition:</h4>
                  <div className="text-sm text-gray-600">
                    <div>Calories: {matchedItems.totalNutrition.cal}</div>
                    <div>Protein: {matchedItems.totalNutrition.p}g</div>
                    <div>Carbs: {matchedItems.totalNutrition.c}g</div>
                    <div>Fats: {matchedItems.totalNutrition.f}g</div>
                  </div>
                </div>

                <button
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  onClick={() => alert("Order API integration coming soon!")}
                >
                  Place Order (Coming Soon)
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Select a meal and click "Match Items" to see recommendations</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
