"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";

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
  const [orderLoading, setOrderLoading] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadDietPlan();
      loadConnectedPlatforms();
      loadUserProfile();
    }
  }, [status, router]);

  // Reload menu when connected platforms change
  useEffect(() => {
    if (connectedPlatforms.length > 0) {
      loadMenu();
    }
  }, [connectedPlatforms]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.day-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const loadConnectedPlatforms = async () => {
    try {
      const response = await fetch("/api/integration/status");
      if (response.ok) {
        const data = await response.json();
        if (data.integrations && data.integrations.length > 0) {
          const platforms = data.integrations.map((i: any) => i.platform);
          setConnectedPlatforms(platforms);
          console.log("Connected platforms:", platforms);
        } else {
          setConnectedPlatforms([]);
          console.log("No platforms connected");
        }
      }
    } catch (error) {
      console.error("Error loading connected platforms:", error);
      setConnectedPlatforms([]);
    }
  };

  const loadDietPlan = async () => {
    try {
      // First try to fetch from API
      const response = await fetch("/api/generate-diet");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.dietPlan) {
          setDietPlan(data);
          // Also save to localStorage as backup
          localStorage.setItem("current_diet_plan", JSON.stringify(data));
          return;
        }
      }

      // Fallback to localStorage if API fails
      const savedPlan = localStorage.getItem("current_diet_plan");
      if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        setDietPlan(plan);
      }
    } catch (error) {
      console.error("Error loading diet plan:", error);
      // Try localStorage as fallback
      try {
        const savedPlan = localStorage.getItem("current_diet_plan");
        if (savedPlan) {
          const plan = JSON.parse(savedPlan);
          setDietPlan(plan);
        }
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }
    }
  };

  const loadMenu = () => {
    try {
      let allItems: any[] = [];

      // Only load from connected platforms
      const platformsToLoad = connectedPlatforms.length > 0
        ? connectedPlatforms
        : ['sillobite', 'figgy', 'komato']; // Fallback to all if not loaded yet

      platformsToLoad.forEach(platform => {
        const cachedMenu = localStorage.getItem(`${platform}_menu`);
        if (cachedMenu) {
          try {
            const menuData = JSON.parse(cachedMenu);
            let items: any[] = [];

            if (Array.isArray(menuData)) {
              items = menuData;
            } else if (typeof menuData === 'object' && menuData !== null) {
              const possibleArrays = ['dishes', 'items', 'menu', 'data', 'menuItems'];
              for (const key of possibleArrays) {
                if (Array.isArray(menuData[key])) {
                  items = menuData[key];
                  break;
                }
              }
            }

            // Ensure each item has platform info
            items = items.map(item => ({
              ...item,
              platform: item.platform || platform
            }));

            allItems = [...allItems, ...items];
            console.log(`Loaded ${items.length} items from ${platform}`);
          } catch (err) {
            console.error(`Error parsing ${platform} menu:`, err);
          }
        }
      });

      console.log(`Total menu items loaded: ${allItems.length}`);
      if (allItems.length > 0) {
        console.log("Sample items:", allItems.slice(0, 3).map(item => ({
          id: item.id || item._id || item.menuItemId,
          name: item.name || item.dishName || item.title,
          canteenId: item.canteenId || item.canteen_id || item.restaurantId || item.restaurant_id,
          platform: item.platform
        })));
      }

      setMenuItems(allItems);
    } catch (error) {
      console.error("Error loading menu:", error);
    }
  };

  const fetchAllMenus = async () => {
    setLoading(true);
    try {
      // First, get connected platforms
      const statusResponse = await fetch("/api/integration/status");
      if (!statusResponse.ok) {
        alert("Failed to check connected platforms");
        return;
      }

      const statusData = await statusResponse.json();
      if (!statusData.integrations || statusData.integrations.length === 0) {
        alert("No platforms connected. Please connect a platform first from the Connect page.");
        return;
      }

      const connectedPlatformsList = statusData.integrations.map((i: any) => i.platform);
      console.log("Fetching menus from connected platforms:", connectedPlatformsList);

      let fetchedCount = 0;
      let failedPlatforms: string[] = [];
      let needsReconnect: string[] = [];

      for (const platform of connectedPlatformsList) {
        try {
          console.log(`Fetching menu from ${platform}...`);
          const response = await fetch(`/api/menu?platform=${platform}`);
          const result = await response.json();

          if (result.success && result.data) {
            localStorage.setItem(`${platform}_menu`, JSON.stringify(result.data));
            console.log(`✓ Successfully fetched and cached menu from ${platform}`);
            fetchedCount++;
          } else if (result.needsReconnect) {
            console.log(`✗ ${platform}: Needs reconnection`);
            needsReconnect.push(platform);
          } else {
            console.log(`✗ ${platform}: ${result.message || 'Failed to fetch menu'}`);
            failedPlatforms.push(platform);
          }
        } catch (error) {
          console.error(`✗ Error fetching ${platform} menu:`, error);
          failedPlatforms.push(platform);
        }
      }

      // Reload menu from cache
      loadMenu();

      // Show result message
      if (fetchedCount > 0) {
        let message = `Successfully fetched menus from ${fetchedCount} platform(s)`;
        if (needsReconnect.length > 0) {
          message += `\n\n⚠️ Please reconnect: ${needsReconnect.join(", ")}\nAccess tokens expired or invalid.`;
        }
        if (failedPlatforms.length > 0) {
          message += `\n\nFailed to fetch from: ${failedPlatforms.join(", ")}`;
        }
        alert(message);
      } else if (needsReconnect.length > 0) {
        alert(`⚠️ Access tokens expired!\n\nPlease reconnect these platforms:\n${needsReconnect.join(", ")}\n\nGo to Connect page to reconnect.`);
      } else {
        alert(`Failed to fetch menus from all platforms.\n\nPlease check:\n1. Platforms are properly connected\n2. Platform APIs are running\n3. Network connection is stable`);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      alert("An error occurred while fetching menus. Please try again.");
    } finally {
      setLoading(false);
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

  const handlePlaceOrder = async () => {
    if (!matchedItems || !matchedItems.items || matchedItems.items.length === 0) {
      alert("No items to order");
      return;
    }

    // Validate all items are from same platform and canteen
    const firstItem = matchedItems.items[0];
    const platform = firstItem.platform;
    const canteenId = firstItem.canteenId || firstItem.restaurantId;

    const allSamePlatform = matchedItems.items.every(
      (item: any) => item.platform === platform
    );
    const allSameCanteen = matchedItems.items.every(
      (item: any) => (item.canteenId || item.restaurantId) === canteenId
    );

    if (!allSamePlatform || !allSameCanteen) {
      alert(
        "Error: All items must be from the same platform and canteen. Please try matching again."
      );
      return;
    }

    if (!canteenId) {
      alert("Error: Canteen ID is missing. Cannot place order.");
      return;
    }

    setOrderLoading(true);

    try {
      // Map matched items to the format needed for order creation
      const orderItems = matchedItems.items.map((item: any) => {
        // First try to use the menuItemId directly from the matched item
        let menuItemId = item.menuItemId;

        // If not found, try to find the original menu item with fuzzy matching
        if (!menuItemId) {
          const menuItem = menuItems.find(
            (m: any) => {
              const mName = (m.name || m.dishName || m.title || m.dish_name || '').toLowerCase().trim();
              const itemName = (item.itemName || '').toLowerCase().trim();
              const mPlatform = m.platform || 'sillobite';
              const mCanteenId = m.canteenId || m.canteen_id || m.restaurantId || m.restaurant_id;

              // Exact match
              if (mName === itemName && mPlatform === item.platform && mCanteenId === canteenId) {
                return true;
              }

              // Fuzzy match - check if names are similar (contains or very close)
              if (mPlatform === item.platform && mCanteenId === canteenId) {
                return mName.includes(itemName) || itemName.includes(mName);
              }

              return false;
            }
          );

          menuItemId = menuItem?.id || menuItem?._id || menuItem?.menuItemId || menuItem?.menu_item_id;
        }

        return {
          menuItemId: menuItemId,
          itemName: item.itemName,
          quantity: item.quantity || 1,
        };
      });

      // Check if we have valid menu item IDs
      const missingIds = orderItems.filter((item: any) => !item.menuItemId);
      if (missingIds.length > 0) {
        console.error("Missing menu item IDs:", missingIds);
        console.error("Available menu items:", menuItems.map((m: any) => ({
          id: m.id || m._id || m.menuItemId,
          name: m.name || m.dishName || m.title || m.dish_name,
          platform: m.platform,
          canteenId: m.canteenId || m.canteen_id || m.restaurantId || m.restaurant_id
        })));
        alert(
          `Error: Could not find menu item IDs for: ${missingIds.map((i: any) => i.itemName).join(", ")}\n\nPlease try matching again or contact support.`
        );
        return;
      }

      console.log("Placing order with canteenId:", canteenId);
      console.log("Order items:", orderItems);

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          platform: platform,
          canteenId: canteenId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          `Order placed successfully!\n\nOrder Number: ${result.order.orderNumber}\nAmount: ₹${result.order.amount}\nWallet Balance: ₹${result.order.walletBalance}`
        );
        // Clear matched items after successful order
        setMatchedItems(null);
      } else {
        const errorMsg = result.details?.message || result.error || "Failed to place order";
        const suggestion = result.details?.suggestion || "";
        alert(`Order Failed\n\n${errorMsg}${suggestion ? "\n\n" + suggestion : ""}`);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("An error occurred while placing the order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rich-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!dietPlan) {
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
              <h1 className="text-xl font-bold text-white">Orders</h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-rich-black-50 border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Diet Plan Found</h3>
            <p className="text-gray-400 mb-6">
              Please generate a diet plan first before managing orders.
            </p>
            <button
              onClick={() => router.push("/diet-plan")}
              className="px-6 py-3 bg-white text-rich-black rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              Generate Diet Plan
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const days = dietPlan.dietPlan.plan || [];

  return (
    <div className="min-h-screen bg-rich-black pb-24 md:pb-8">
      <header className="bg-rich-black-50 shadow-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-white">Orders</h1>
            </div>
            <button
              onClick={fetchAllMenus}
              disabled={loading}
              className="px-4 py-2 bg-white text-rich-black rounded-xl hover:bg-gray-200 disabled:bg-gray-600 disabled:text-white transition-all font-medium text-sm"
            >
              {loading ? "Fetching..." : "Refresh Menus"}
            </button>
          </div>

          {/* Connected Platforms Indicator */}
          {connectedPlatforms.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Connected:</span>
              <div className="flex gap-2">
                {connectedPlatforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium border border-emerald-500/30"
                  >
                    {platform === 'sillobite' ? '🍽️ SilloBite' :
                      platform === 'figgy' ? '🥗 Figgy' :
                        platform === 'komato' ? '🍅 Komato' : platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {connectedPlatforms.length === 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs border border-yellow-500/30">
                ⚠️ No platforms connected. Visit Connect page to link your accounts.
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Days Dropdown */}
          <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-4">Select Day</h3>

            {/* Premium Dropdown */}
            <div className="relative day-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-left hover:bg-white/10 transition-all flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white font-bold">
                      {days[selectedDay]?.d || selectedDay + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        Day {days[selectedDay]?.d || selectedDay + 1}
                      </div>
                      <div className="text-sm text-gray-400">
                        {(() => {
                          const dayNum = days[selectedDay]?.d || selectedDay + 1;
                          const dayDate = dietPlan?.startDate
                            ? new Date(new Date(dietPlan.startDate).getTime() + ((dayNum - 1) * 24 * 60 * 60 * 1000))
                            : null;

                          if (dayDate) {
                            return dayDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            });
                          }
                          return days[selectedDay]?.day || 'Select a day';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-sm font-semibold text-white">{days[selectedDay]?.total} cal</div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
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

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-rich-black-50 border border-white/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                  {days.map((day: any, index: number) => {
                    const dayNum = day.d || index + 1;
                    const dayDate = dietPlan?.startDate
                      ? new Date(new Date(dietPlan.startDate).getTime() + ((dayNum - 1) * 24 * 60 * 60 * 1000))
                      : null;

                    const actualDayName = dayDate
                      ? dayDate.toLocaleDateString('en-US', { weekday: 'long' })
                      : day.day;

                    const formattedDate = dayDate
                      ? dayDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                      : '';

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDay(index);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-all border-b border-white/5 last:border-b-0 ${selectedDay === index ? 'bg-white/10' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${selectedDay === index
                            ? 'bg-white text-rich-black'
                            : 'bg-white/10 text-white'
                            }`}>
                            {dayNum}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-white">Day {dayNum}</div>
                                <div className="text-sm text-gray-400">{actualDayName}</div>
                                {formattedDate && (
                                  <div className="text-xs text-gray-500 mt-0.5">{formattedDate}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Total</div>
                                <div className="text-sm font-semibold text-white">{day.total} cal</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Meals for Selected Day */}
          <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-4">
              {(() => {
                const dayNum = days[selectedDay]?.d || selectedDay + 1;
                const dayDate = dietPlan?.startDate
                  ? new Date(new Date(dietPlan.startDate).getTime() + ((dayNum - 1) * 24 * 60 * 60 * 1000))
                  : null;

                const actualDayName = dayDate
                  ? dayDate.toLocaleDateString('en-US', { weekday: 'long' })
                  : days[selectedDay]?.day;

                return `${actualDayName} - Select Meal`;
              })()}
            </h3>
            <div className="space-y-4">
              {/* Breakfast */}
              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">🌅 Breakfast</h4>
                    <p className="text-xs text-gray-500">{days[selectedDay]?.b?.t}</p>
                  </div>
                  <button
                    onClick={() => handleMatchMeal(selectedDay, "breakfast")}
                    disabled={loading || menuItems.length === 0}
                    className="px-3 py-1.5 bg-white text-rich-black text-sm rounded-lg hover:bg-gray-200 disabled:bg-gray-600 disabled:text-white transition-all font-medium"
                  >
                    {loading && selectedMeal === "breakfast" ? "Matching..." : "Match"}
                  </button>
                </div>
                <div className="text-sm text-gray-400">
                  <div>Cal: {days[selectedDay]?.b?.cal}</div>
                  <div>P: {days[selectedDay]?.b?.p}g | C: {days[selectedDay]?.b?.c}g | F: {days[selectedDay]?.b?.f}g</div>
                </div>
              </div>

              {/* Lunch */}
              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">☀️ Lunch</h4>
                    <p className="text-xs text-gray-500">{days[selectedDay]?.l?.t}</p>
                  </div>
                  <button
                    onClick={() => handleMatchMeal(selectedDay, "lunch")}
                    disabled={loading || menuItems.length === 0}
                    className="px-3 py-1.5 bg-white text-rich-black text-sm rounded-lg hover:bg-gray-200 disabled:bg-gray-600 disabled:text-white transition-all font-medium"
                  >
                    {loading && selectedMeal === "lunch" ? "Matching..." : "Match"}
                  </button>
                </div>
                <div className="text-sm text-gray-400">
                  <div>Cal: {days[selectedDay]?.l?.cal}</div>
                  <div>P: {days[selectedDay]?.l?.p}g | C: {days[selectedDay]?.l?.c}g | F: {days[selectedDay]?.l?.f}g</div>
                </div>
              </div>

              {/* Dinner */}
              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">🌙 Dinner</h4>
                    <p className="text-xs text-gray-500">{days[selectedDay]?.dn?.t}</p>
                  </div>
                  <button
                    onClick={() => handleMatchMeal(selectedDay, "dinner")}
                    disabled={loading || menuItems.length === 0}
                    className="px-3 py-1.5 bg-white text-rich-black text-sm rounded-lg hover:bg-gray-200 disabled:bg-gray-600 disabled:text-white transition-all font-medium"
                  >
                    {loading && selectedMeal === "dinner" ? "Matching..." : "Match"}
                  </button>
                </div>
                <div className="text-sm text-gray-400">
                  <div>Cal: {days[selectedDay]?.dn?.cal}</div>
                  <div>P: {days[selectedDay]?.dn?.p}g | C: {days[selectedDay]?.dn?.c}g | F: {days[selectedDay]?.dn?.f}g</div>
                </div>
              </div>
            </div>

            {menuItems.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-400">
                No menu items found. Please refresh menus first.
              </div>
            )}
          </div>

          {/* Matched Items */}
          <div className="bg-rich-black-50 rounded-2xl shadow border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-4">Matched Items</h3>
            {matchedItems ? (
              <div className="space-y-4">
                <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white">Match Score</span>
                    <span className="text-2xl font-bold text-white">{matchedItems.matchScore}%</span>
                  </div>
                  {matchedItems.notes && (
                    <p className="text-sm text-gray-400">{matchedItems.notes}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Selected Items:</h4>
                  {matchedItems.items?.map((item: any, idx: number) => (
                    <div key={idx} className="border border-white/10 rounded-xl p-3 mb-2 bg-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-white">{item.itemName}</div>
                          {item.canteenName || item.restaurantName && (
                            <div className="text-xs text-gray-500">{item.canteenName || item.restaurantName}</div>
                          )}
                          <div className="text-xs text-gray-500">Platform: {item.platform}</div>
                        </div>
                        <div className="text-sm font-semibold text-white">
                          Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        <div>Cal: {item.estimatedNutrition.cal} | P: {item.estimatedNutrition.p}g</div>
                        <div>C: {item.estimatedNutrition.c}g | F: {item.estimatedNutrition.f}g</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2">Total Nutrition:</h4>
                  <div className="text-sm text-gray-400">
                    <div>Calories: {matchedItems.totalNutrition.cal}</div>
                    <div>Protein: {matchedItems.totalNutrition.p}g</div>
                    <div>Carbs: {matchedItems.totalNutrition.c}g</div>
                    <div>Fats: {matchedItems.totalNutrition.f}g</div>
                  </div>
                </div>

                <button
                  className="w-full bg-white text-rich-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:bg-gray-600 disabled:text-white disabled:cursor-not-allowed"
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                >
                  {orderLoading ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Select a meal and click "Match" to see recommendations</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
