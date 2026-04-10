"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface UserProfile {
  age: number;
  height: number;
  weight: number;
  fitnessGoal: string;
  activityType: string;
  goalDescription?: string;
  medicalCondition?: string;
}

interface Integration {
  platform: string;
  connectedAt: string;
  platformUserId: string;
}

const PLATFORMS = [
  { id: 'sillobite', name: 'SilloBite', icon: '🍽️' },
  { id: 'figgy', name: 'Figgy', icon: '🥗' },
  { id: 'komato', name: 'Komato', icon: '🍅' },
];

const fitnessGoals = [
  { id: "weight_loss", title: "Weight Loss" },
  { id: "muscle_gain", title: "Muscle Gain" },
  { id: "endurance", title: "Endurance Training" },
  { id: "general_fitness", title: "General Fitness" }
];

const activityTypes = [
  { id: "gym", title: "Gym Training" },
  { id: "cycling", title: "Cycling" },
  { id: "running", title: "Running" },
  { id: "marathon", title: "Marathon Training" },
  { id: "general", title: "General Activity" }
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [fetchingMenu, setFetchingMenu] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    age: "",
    height: "",
    weight: "",
    fitnessGoal: "",
    activityType: "",
    goalDescription: "",
    medicalCondition: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfile();
      fetchIntegrationStatus();
      loadMenusFromCache();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
        setFormData({
          age: data.profile.age?.toString() || "",
          height: data.profile.height?.toString() || "",
          weight: data.profile.weight?.toString() || "",
          fitnessGoal: data.profile.fitnessGoal || "",
          activityType: data.profile.activityType || "",
          goalDescription: data.profile.goalDescription || "",
          medicalCondition: data.profile.medicalCondition || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch("/api/integration/status");
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error("Error fetching integration status:", error);
    }
  };

  const loadMenusFromCache = () => {
    try {
      const menus: Record<string, any> = {};
      PLATFORMS.forEach(platform => {
        const cached = localStorage.getItem(`${platform.id}_menu`);
        if (cached) {
          menus[platform.id] = JSON.parse(cached);
        }
      });
      setMenuData(menus);
    } catch (error) {
      console.error("Error loading menus from cache:", error);
    }
  };

  const handleFetchMenu = async (platform: string) => {
    setFetchingMenu(platform);
    try {
      const response = await fetch(`/api/menu?platform=${platform}`);
      const result = await response.json();

      if (result.success && result.data) {
        setMenuData(prev => ({ ...prev, [platform]: result.data }));
        localStorage.setItem(`${platform}_menu`, JSON.stringify(result.data));
        alert("Menu fetched successfully!");
      } else {
        alert(result.message || "Failed to fetch menu");
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
      alert("Error fetching menu. Please try again.");
    } finally {
      setFetchingMenu(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: parseInt(formData.age),
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          fitnessGoal: formData.fitnessGoal,
          activityType: formData.activityType,
          goalDescription: formData.goalDescription,
          medicalCondition: formData.medicalCondition
        })
      });

      if (response.ok) {
        await fetchProfile();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const getGoalTitle = (goal: string) => {
    return fitnessGoals.find(g => g.id === goal)?.title || goal;
  };

  const getActivityTitle = (activity: string) => {
    return activityTypes.find(a => a.id === activity)?.title || activity;
  };

  const isPlatformConnected = (platformId: string) => {
    return integrations.some(i => i.platform === platformId);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const bmi = profile ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="CareBite" width={28} height={28} className="w-7 h-7" />
              <h1 className="text-xl font-bold text-white tracking-tight">CareBite</h1>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-9 h-9 rounded-full border-2 border-zinc-700 group-hover:border-white transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black font-bold text-base">
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 py-1 z-20">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-red-950 hover:text-red-400 transition-colors flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* Profile Header */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-12 h-12 rounded-full border-2 border-zinc-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black font-bold text-base">
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">{session?.user?.name}</h2>
                <p className="text-zinc-400 text-xs">{session?.user?.email}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1 bg-white text-black rounded-md hover:bg-zinc-200 transition-all font-semibold flex items-center gap-1 group text-[11px]"
              >
                <svg className="w-3 h-3 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          <>
            {/* View Mode - Stats in Single Row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 hover:border-zinc-700 transition-all">
                <div className="text-zinc-500 text-[10px] font-medium mb-0.5 uppercase tracking-wider">Age</div>
                <div className="text-2xl font-bold text-white mb-0.5">{profile?.age}</div>
                <div className="text-zinc-600 text-[10px] font-medium">years</div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 hover:border-zinc-700 transition-all">
                <div className="text-zinc-500 text-[10px] font-medium mb-0.5 uppercase tracking-wider">Weight</div>
                <div className="text-2xl font-bold text-white mb-0.5">{profile?.weight}</div>
                <div className="text-zinc-600 text-[10px] font-medium">kg</div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 hover:border-zinc-700 transition-all">
                <div className="text-zinc-500 text-[10px] font-medium mb-0.5 uppercase tracking-wider">BMI</div>
                <div className="text-2xl font-bold text-white mb-0.5">{bmi}</div>
                <div className="text-zinc-600 text-[10px] font-medium">index</div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 hover:border-zinc-700 transition-all">
                <div className="text-zinc-500 text-[10px] font-medium mb-0.5 uppercase tracking-wider">Height</div>
                <div className="text-2xl font-bold text-white mb-0.5">{profile?.height}</div>
                <div className="text-zinc-600 text-[10px] font-medium">cm</div>
              </div>
            </div>

            {/* Fitness Journey */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-5">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Fitness Journey
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                      🎯
                    </div>
                    <h4 className="font-bold text-white text-base">Fitness Goal</h4>
                  </div>
                  <p className="text-zinc-300 text-sm ml-12">{profile && getGoalTitle(profile.fitnessGoal)}</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                      🏃
                    </div>
                    <h4 className="font-bold text-white text-base">Activity Type</h4>
                  </div>
                  <p className="text-zinc-300 text-sm ml-12">{profile && getActivityTitle(profile.activityType)}</p>
                </div>
              </div>

              {profile?.goalDescription && (
                <div className="mt-5 pt-5 border-t border-zinc-800">
                  <h4 className="font-bold text-white mb-2 text-sm">Your Goals</h4>
                  <p className="text-zinc-300 leading-relaxed text-sm">{profile.goalDescription}</p>
                </div>
              )}

              {profile?.medicalCondition && (
                <div className="mt-5 pt-5 border-t border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-red-950 rounded-lg flex items-center justify-center text-lg">
                      🏥
                    </div>
                    <h4 className="font-bold text-white text-sm">Medical Conditions</h4>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-sm ml-10">{profile.medicalCondition}</p>
                </div>
              )}
            </div>

            {/* Platform Connections */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                  🔗
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Platform Connections</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Connect to platforms to enable smart food recommendations
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {PLATFORMS.map(platform => {
                  const isConnected = isPlatformConnected(platform.id);
                  const integration = integrations.find(i => i.platform === platform.id);
                  const hasMenu = !!menuData[platform.id];

                  return (
                    <div key={platform.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-2xl">
                            {platform.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base">{platform.name}</h4>
                            {isConnected && integration && (
                              <p className="text-xs text-zinc-500 mt-0.5">
                                Connected on {new Date(integration.connectedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isConnected
                          ? "bg-green-950 text-green-400 border border-green-900"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}>
                          {isConnected ? "● Connected" : "○ Not Connected"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/connect?platform=${platform.id}`)}
                          className="flex-1 bg-white text-black py-2 px-3 rounded-lg font-bold hover:bg-zinc-200 transition-all text-xs"
                        >
                          {isConnected ? "Reconnect" : "Connect"}
                        </button>
                        {isConnected && (
                          <button
                            onClick={() => handleFetchMenu(platform.id)}
                            disabled={fetchingMenu === platform.id}
                            className="flex-1 bg-zinc-800 text-white py-2 px-3 rounded-lg font-bold hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all text-xs border border-zinc-700"
                          >
                            {fetchingMenu === platform.id ? "Fetching..." : "Fetch Menu"}
                          </button>
                        )}
                        {hasMenu && (
                          <button
                            onClick={() => {
                              localStorage.removeItem(`${platform.id}_menu`);
                              setMenuData(prev => {
                                const newData = { ...prev };
                                delete newData[platform.id];
                                return newData;
                              });
                            }}
                            className="px-3 py-2 bg-red-950 text-red-400 rounded-lg font-bold hover:bg-red-900 transition-all text-xs border border-red-900"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {hasMenu && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <p className="text-xs text-zinc-400">
                            Menu cached: <span className="text-white font-semibold">{menuData[platform.id].menuItems?.length || 0}</span> items available
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Edit Mode */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-5">
              <h3 className="text-xl font-bold text-white mb-5">Basic Information</h3>

              <div className="grid grid-cols-4 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all text-base font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all text-base font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">BMI</label>
                  <input
                    type="text"
                    value={bmi}
                    disabled
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 text-base font-semibold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all text-base font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Fitness Goal</label>
                  <select
                    value={formData.fitnessGoal}
                    onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all text-sm font-medium"
                  >
                    <option value="" className="bg-zinc-900">Select a goal</option>
                    {fitnessGoals.map((goal) => (
                      <option key={goal.id} value={goal.id} className="bg-zinc-900">{goal.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Activity Type</label>
                  <select
                    value={formData.activityType}
                    onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all text-sm font-medium"
                  >
                    <option value="" className="bg-zinc-900">Select an activity</option>
                    {activityTypes.map((activity) => (
                      <option key={activity.id} value={activity.id} className="bg-zinc-900">{activity.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-5">
              <h3 className="text-xl font-bold text-white mb-5">Additional Information</h3>

              <div className="mb-5">
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                  Goal Description (optional)
                </label>
                <textarea
                  value={formData.goalDescription}
                  onChange={(e) => setFormData({ ...formData, goalDescription: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all text-sm leading-relaxed"
                  rows={3}
                  placeholder="Tell us more about your fitness goals..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                  Medical Conditions (optional)
                </label>
                <textarea
                  value={formData.medicalCondition}
                  onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all text-sm leading-relaxed"
                  rows={3}
                  placeholder="Any medical conditions, allergies, or dietary restrictions..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                className="flex-1 bg-zinc-900 border border-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-800 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-white text-black py-3 rounded-lg font-bold hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all text-sm"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
