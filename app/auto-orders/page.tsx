"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";

interface AutoOrderConfig {
  enabled: boolean;
  breakfastEnabled: boolean;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  mondayEnabled: boolean;
  tuesdayEnabled: boolean;
  wednesdayEnabled: boolean;
  thursdayEnabled: boolean;
  fridayEnabled: boolean;
  saturdayEnabled: boolean;
  sundayEnabled: boolean;
}

interface UpcomingOrder {
  date: string;
  dayName: string;
  mealType: string;
  scheduledTime: string;
  requirements: any;
  dietDay: number;
  enabled: boolean;
}

export default function AutoOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState<AutoOrderConfig | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadConfig();
      loadUpcoming();
    }
  }, [status, router]);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/auto-order/config");
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const loadUpcoming = async () => {
    try {
      const response = await fetch("/api/auto-order/upcoming");
      const data = await response.json();
      if (data.success) {
        setUpcoming(data.upcoming || []);
      }
    } catch (error) {
      console.error("Error loading upcoming orders:", error);
    }
  };

  const updateConfig = async (updates: Partial<AutoOrderConfig>) => {
    if (!config) return;

    setSaving(true);
    try {
      const newConfig = { ...config, ...updates };
      const response = await fetch("/api/auto-order/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });

      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        await loadUpcoming(); // Reload upcoming orders
      } else {
        alert("Failed to update configuration");
      }
    } catch (error) {
      console.error("Error updating config:", error);
      alert("An error occurred while updating configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoOrder = async () => {
    if (!config) return;
    await updateConfig({ enabled: !config.enabled });
  };

  const toggleUpcomingOrder = async (order: UpcomingOrder) => {
    setSaving(true);
    try {
      const response = await fetch("/api/auto-order/upcoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: order.date,
          mealType: order.mealType,
          enabled: !order.enabled,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload upcoming orders
        await loadUpcoming();
      } else {
        alert("Failed to toggle schedule");
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
      alert("An error occurred while toggling schedule");
    } finally {
      setSaving(false);
    }
  };

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

  if (status === "loading" || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rich-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rich-black pb-24 md:pb-8">
      <header className="bg-rich-black-50 shadow-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-white">🤖 Automated Ordering</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Master Toggle Card */}
        <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Auto-Ordering</h2>
              <p className="text-gray-400 text-sm">
                {config.enabled
                  ? "Orders are automatically placed based on your schedule"
                  : "Enable to start automatic meal ordering"}
              </p>
            </div>
            <button
              onClick={toggleAutoOrder}
              disabled={saving}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-rich-black ${config.enabled ? "bg-emerald-500" : "bg-white/20"
                } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${config.enabled ? "translate-x-12" : "translate-x-1"
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Upcoming Orders Card */}
        {config.enabled && (
          <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">📅 Next 3 Scheduled Orders</h3>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((order, index) => {
                  const orderDate = new Date(order.date);
                  const isToday =
                    orderDate.toDateString() === new Date().toDateString();
                  const isTomorrow =
                    orderDate.toDateString() ===
                    new Date(Date.now() + 86400000).toDateString();

                  let dateLabel = orderDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  });
                  if (isToday) dateLabel = "Today";
                  else if (isTomorrow) dateLabel = "Tomorrow";

                  return (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-3xl">{getMealIcon(order.mealType)}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-white capitalize">
                              {order.mealType}
                            </div>
                            <div className="text-sm text-gray-400">
                              {dateLabel} at {order.scheduledTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Diet Day {order.dietDay}</div>
                            <div className="text-sm font-semibold text-white">
                              {order.requirements?.cal || 0} cal
                            </div>
                          </div>
                          <button
                            onClick={() => toggleUpcomingOrder(order)}
                            disabled={saving}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${order.enabled ? "bg-emerald-500" : "bg-white/20"
                              } ${saving ? "opacity-50" : ""}`}
                            title={order.enabled ? "Click to disable" : "Click to enable"}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${order.enabled ? "translate-x-9" : "translate-x-1"
                                }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No upcoming orders scheduled</p>
                <p className="text-sm mt-2">Check your meal and day settings below</p>
              </div>
            )}
          </div>
        )}

        {/* Meal Toggles Card */}
        {config.enabled && (
          <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">🍽️ Meal Settings</h3>
            <div className="space-y-4">
              {/* Breakfast */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌅</span>
                  <div>
                    <div className="font-semibold text-white">Breakfast</div>
                    <div className="text-sm text-gray-400">{config.breakfastTime}</div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateConfig({ breakfastEnabled: !config.breakfastEnabled })
                  }
                  disabled={saving}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${config.breakfastEnabled ? "bg-emerald-500" : "bg-white/20"
                    } ${saving ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${config.breakfastEnabled ? "translate-x-9" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {/* Lunch */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">☀️</span>
                  <div>
                    <div className="font-semibold text-white">Lunch</div>
                    <div className="text-sm text-gray-400">{config.lunchTime}</div>
                  </div>
                </div>
                <button
                  onClick={() => updateConfig({ lunchEnabled: !config.lunchEnabled })}
                  disabled={saving}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${config.lunchEnabled ? "bg-emerald-500" : "bg-white/20"
                    } ${saving ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${config.lunchEnabled ? "translate-x-9" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {/* Dinner */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <div className="font-semibold text-white">Dinner</div>
                    <div className="text-sm text-gray-400">{config.dinnerTime}</div>
                  </div>
                </div>
                <button
                  onClick={() => updateConfig({ dinnerEnabled: !config.dinnerEnabled })}
                  disabled={saving}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${config.dinnerEnabled ? "bg-emerald-500" : "bg-white/20"
                    } ${saving ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${config.dinnerEnabled ? "translate-x-9" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Schedule Card */}
        {config.enabled && (
          <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">📆 Weekly Schedule</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { key: "mondayEnabled", label: "Mon", full: "Monday" },
                { key: "tuesdayEnabled", label: "Tue", full: "Tuesday" },
                { key: "wednesdayEnabled", label: "Wed", full: "Wednesday" },
                { key: "thursdayEnabled", label: "Thu", full: "Thursday" },
                { key: "fridayEnabled", label: "Fri", full: "Friday" },
                { key: "saturdayEnabled", label: "Sat", full: "Saturday" },
                { key: "sundayEnabled", label: "Sun", full: "Sunday" },
              ].map((day) => {
                const isEnabled = config[day.key as keyof AutoOrderConfig] as boolean;
                return (
                  <button
                    key={day.key}
                    onClick={() => updateConfig({ [day.key]: !isEnabled })}
                    disabled={saving}
                    className={`p-4 rounded-xl border-2 transition-all ${isEnabled
                      ? "bg-emerald-500/20 border-emerald-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-500"
                      } ${saving ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                  >
                    <div className="font-bold text-lg">{day.label}</div>
                    <div className="text-xs mt-1 hidden md:block">{day.full}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h4 className="font-semibold text-white mb-2">How It Works</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Orders are placed automatically at scheduled times</li>
                <li>• Fresh menu data is fetched in real-time</li>
                <li>• AI matches meals to your diet plan requirements</li>
                <li>• You can customize which meals and days to order</li>
                <li>• Orders are only placed on enabled days</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
