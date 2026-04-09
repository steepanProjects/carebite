"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ScheduledMeal {
  day: number;
  dayName: string;
  mealType: "breakfast" | "lunch" | "dinner";
  scheduledTime: string;
  requirements: any;
  status: "pending" | "scheduled" | "ordered" | "failed";
  orderId?: string;
  orderNumber?: string;
  matchedItems?: any;
  error?: string;
}

export default function AutoOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [scheduledMeals, setScheduledMeals] = useState<ScheduledMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadDietPlan();
      loadScheduledOrders();
    }
  }, [status, router]);

  const loadDietPlan = () => {
    try {
      const savedPlan = localStorage.getItem("current_diet_plan");
      if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        console.log("Loaded diet plan:", plan);
        console.log("Diet plan structure:", {
          hasDietPlan: !!plan.dietPlan,
          hasPlan: !!plan.plan,
          keys: Object.keys(plan)
        });
        setDietPlan(plan);
        generateMealSchedule(plan);
      } else {
        console.log("No diet plan found in localStorage");
      }
    } catch (error) {
      console.error("Error loading diet plan:", error);
    }
  };

  const loadScheduledOrders = async () => {
    try {
      const response = await fetch("/api/auto-order/schedule");
      const data = await response.json();
      
      if (data.success && data.orders) {
        setScheduledMeals(data.orders);
      }
    } catch (error) {
      console.error("Error loading scheduled orders:", error);
    }
  };

  const saveScheduledOrders = (meals: ScheduledMeal[]) => {
    setScheduledMeals(meals);
    // Reload from database to get latest status
    loadScheduledOrders();
  };

  const generateMealSchedule = (plan: any) => {
    const meals: ScheduledMeal[] = [];
    const days = plan.dietPlan.plan || [];

    // Only generate schedule for display purposes
    // Actual ordering will be done day-by-day by the cron job
    days.forEach((day: any) => {
      // Breakfast at 7:30 AM
      meals.push({
        day: day.d,
        dayName: day.day,
        mealType: "breakfast",
        scheduledTime: "07:30",
        requirements: { ...day.b, mealType: "Breakfast" },
        status: "pending",
      });

      // Lunch at 12:30 PM
      meals.push({
        day: day.d,
        dayName: day.day,
        mealType: "lunch",
        scheduledTime: "12:30",
        requirements: { ...day.l, mealType: "Lunch" },
        status: "pending",
      });

      // Dinner at 7:30 PM
      meals.push({
        day: day.d,
        dayName: day.day,
        mealType: "dinner",
        scheduledTime: "19:30",
        requirements: { ...day.dn, mealType: "Dinner" },
        status: "pending",
      });
    });

    setScheduledMeals(meals);
  };

  const scheduleAllMeals = async () => {
    setLoading(true);
    try {
      console.log("Diet plan object:", dietPlan);
      console.log("Sending to API:", { 
        dietPlan: dietPlan.dietPlan,
        startDate: new Date().toISOString() 
      });

      // Save the diet plan to database for the cron job to use
      const response = await fetch("/api/auto-order/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          dietPlan: dietPlan?.dietPlan || dietPlan,
          startDate: new Date().toISOString() 
        }),
      });

      const result = await response.json();
      console.log("API response:", result);

      if (response.ok && result.success) {
        alert(`Automated ordering enabled! Orders will be placed automatically at meal times.`);
        setAutoOrderEnabled(true);
        await loadScheduledOrders();
      } else {
        alert(result.error || "Failed to enable automated ordering");
      }
    } catch (error) {
      console.error("Error enabling automated ordering:", error);
      alert("An error occurred while enabling automated ordering");
    } finally {
      setLoading(false);
    }
  };

  const testOrderNow = async (mealIndex: number) => {
    setLoading(true);
    const meal = scheduledMeals[mealIndex];

    try {
      const response = await fetch("/api/auto-order/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealRequirements: meal.requirements,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedMeals = [...scheduledMeals];
        updatedMeals[mealIndex] = {
          ...meal,
          status: "ordered",
          orderId: result.order?.id,
          orderNumber: result.order?.orderNumber,
          matchedItems: result.matchedItems,
        };
        saveScheduledOrders(updatedMeals);
        alert(`Order placed successfully!\nOrder Number: ${result.order?.orderNumber}`);
      } else {
        const updatedMeals = [...scheduledMeals];
        updatedMeals[mealIndex] = {
          ...meal,
          status: "failed",
          error: result.error,
        };
        saveScheduledOrders(updatedMeals);
        alert(`Order failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("An error occurred while placing the order");
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
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-800">Automated Ordering</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Diet Plan Found</h3>
            <p className="text-yellow-800 mb-4">
              Please generate a diet plan first before setting up automated ordering.
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

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "☀️";
      case "dinner":
        return "🌙";
      default:
        return "🍽️";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-green-100 text-green-800 border-green-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "failed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

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
            <h1 className="text-xl font-bold text-gray-800">🤖 Automated Ordering</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Automated Meal Ordering
              </h2>
              <p className="text-gray-600">
                Orders are automatically placed at scheduled times based on your diet plan
              </p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <div>🌅 Breakfast: 7:30 AM</div>
                <div>☀️ Lunch: 12:30 PM</div>
                <div>🌙 Dinner: 7:30 PM</div>
              </div>
            </div>
            <button
              onClick={scheduleAllMeals}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Enable Auto-Ordering"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {scheduledMeals.map((meal, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getMealIcon(meal.mealType)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Day {meal.day} - {meal.dayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)} at{" "}
                        {meal.scheduledTime}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <span>Cal: {meal.requirements.cal}</span>
                    <span className="mx-2">|</span>
                    <span>P: {meal.requirements.p}g</span>
                    <span className="mx-2">|</span>
                    <span>C: {meal.requirements.c}g</span>
                    <span className="mx-2">|</span>
                    <span>F: {meal.requirements.f}g</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        meal.status
                      )}`}
                    >
                      {meal.status.toUpperCase()}
                    </span>
                    {meal.orderNumber && (
                      <span className="text-xs text-gray-600">
                        Order #{meal.orderNumber}
                      </span>
                    )}
                  </div>

                  {meal.error && (
                    <div className="mt-2 text-xs text-red-600">Error: {meal.error}</div>
                  )}
                </div>

                <button
                  onClick={() => testOrderNow(index)}
                  disabled={loading || meal.status === "ordered"}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {loading ? "..." : meal.status === "ordered" ? "Ordered" : "Order Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
