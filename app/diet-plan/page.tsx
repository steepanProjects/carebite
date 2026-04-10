"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";

export default function DietPlanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [error, setError] = useState("");
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number>(1); // Initially expand day 1

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
    setShowNewPlanModal(false);

    try {
      const response = await fetch("/api/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDietPlan(result);
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

  const handleDeleteAndNew = () => {
    setDietPlan(null);
    setShowNewPlanModal(true);
    setDays(7); // Reset to default
    setError("");
  };

  const loadSavedDietPlan = async () => {
    try {
      const response = await fetch("/api/generate-diet");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.dietPlan) {
          setDietPlan(data);
          setDays(data.days || 7);
        }
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
    <div className="min-h-screen bg-rich-black pb-24 md:pb-8">
      <header className="bg-rich-black-50 shadow-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Diet Plan</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!dietPlan ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-12 text-center max-w-md">
              <div className="text-6xl mb-6">🥗</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                No Diet Plan Yet
              </h2>
              <p className="text-gray-400 mb-8">
                Generate your personalized diet plan to get started
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Number of Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-rich-black border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="Enter days (1-30)"
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-white text-rich-black py-4 rounded-xl font-semibold hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rich-black"></div>
                    Generating...
                  </span>
                ) : (
                  "Generate Diet Plan"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Your {days}-Day Diet Plan
                  </h3>
                  {dietPlan.startDate && dietPlan.endDate && (
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(dietPlan.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} - {new Date(dietPlan.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {dietPlan.dietPlan.notes && (
                <p className="text-gray-400 text-sm mb-6">
                  <span className="font-semibold text-white">Strategy:</span> {dietPlan.dietPlan.notes}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleDeleteAndNew}
                  className="px-6 py-2.5 bg-white text-rich-black rounded-xl hover:bg-gray-200 transition-all font-semibold text-sm"
                >
                  New Plan
                </button>
              </div>
            </div>

            {/* New Plan Modal */}
            {showNewPlanModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-rich-black-50 rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md w-full">
                  <h3 className="text-2xl font-bold text-white mb-2">Generate New Plan</h3>
                  <p className="text-gray-400 mb-6 text-sm">
                    This will delete your current plan and create a new one
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Number of Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-rich-black border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                      placeholder="Enter days (1-30)"
                    />
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowNewPlanModal(false);
                        setError("");
                        // Restore the plan
                        loadSavedDietPlan();
                      }}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-white text-rich-black rounded-xl font-semibold hover:bg-gray-200 disabled:bg-gray-600 disabled:text-white disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rich-black"></div>
                          Generating...
                        </span>
                      ) : (
                        "Generate"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Day Cards */}
            <div className="grid grid-cols-1 gap-4">
              {(dietPlan.dietPlan?.plan || dietPlan.dietPlan?.dietPlan)?.map((dayPlan: any, index: number) => {
                const breakfast = dayPlan.b || dayPlan.breakfast;
                const lunch = dayPlan.l || dayPlan.lunch;
                const dinner = dayPlan.dn || dayPlan.dinner;
                const dayNum = dayPlan.d || dayPlan.dayNumber || index + 1;
                const dayTotal = dayPlan.total || dayPlan.dayTotal;

                // Calculate the actual date for this day
                const dayDate = dietPlan.startDate
                  ? new Date(new Date(dietPlan.startDate).getTime() + (index * 24 * 60 * 60 * 1000))
                  : null;

                // Get the actual day name from the date
                const actualDayName = dayDate
                  ? dayDate.toLocaleDateString('en-US', { weekday: 'long' })
                  : dayPlan.day;

                const renderMeal = (meal: any, mealName: string, icon: string) => {
                  if (!meal) return null;
                  const cal = meal.cal || meal.total;
                  const protein = meal.p;
                  const carbs = meal.c;
                  const fats = meal.f;
                  const time = meal.t || meal.time;

                  return (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <h4 className="text-white font-semibold">{mealName}</h4>
                            {time && <p className="text-xs text-gray-500">{time}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{cal}</div>
                          <div className="text-xs text-gray-400">calories</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-400">Protein</div>
                          <div className="text-sm font-semibold text-white">{protein}g</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-400">Carbs</div>
                          <div className="text-sm font-semibold text-white">{carbs}g</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-400">Fats</div>
                          <div className="text-sm font-semibold text-white">{fats}g</div>
                        </div>
                      </div>
                    </div>
                  );
                };

                const isExpanded = expandedDay === dayNum;

                return (
                  <div
                    key={index}
                    className="bg-rich-black-50 rounded-2xl shadow border border-white/10 hover:border-white/20 transition-all overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedDay(isExpanded ? 0 : dayNum)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">Day {dayNum}</h3>
                          <p className="text-sm text-gray-400">{actualDayName}</p>
                          {dayDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              {dayDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2">
                          <div className="text-xs text-gray-400">Total</div>
                          <div className="text-lg font-bold text-white">{dayTotal} cal</div>
                        </div>
                        <svg
                          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {renderMeal(breakfast, "Breakfast", "🌅")}
                        {renderMeal(lunch, "Lunch", "☀️")}
                        {renderMeal(dinner, "Dinner", "🌙")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
