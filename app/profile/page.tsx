"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{session?.user?.name}</h2>
                <p className="text-gray-600">{session?.user?.email}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          <>
            {/* View Mode */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">Age</div>
                <div className="text-3xl font-bold text-gray-800">{profile?.age}</div>
                <div className="text-gray-400 text-xs mt-1">years</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">Height</div>
                <div className="text-3xl font-bold text-gray-800">{profile?.height}</div>
                <div className="text-gray-400 text-xs mt-1">cm</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">Weight</div>
                <div className="text-3xl font-bold text-gray-800">{profile?.weight}</div>
                <div className="text-gray-400 text-xs mt-1">kg</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">BMI</div>
                <div className="text-3xl font-bold text-gray-800">{bmi}</div>
                <div className="text-gray-400 text-xs mt-1">index</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Fitness Journey</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <h4 className="font-semibold text-gray-700">Fitness Goal</h4>
                  </div>
                  <p className="text-gray-600 ml-9">{profile && getGoalTitle(profile.fitnessGoal)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏃</span>
                    <h4 className="font-semibold text-gray-700">Activity Type</h4>
                  </div>
                  <p className="text-gray-600 ml-9">{profile && getActivityTitle(profile.activityType)}</p>
                </div>
              </div>

              {profile?.goalDescription && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Your Goals</h4>
                  <p className="text-gray-600">{profile.goalDescription}</p>
                </div>
              )}

              {profile?.medicalCondition && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏥</span>
                    <h4 className="font-semibold text-gray-700">Medical Conditions</h4>
                  </div>
                  <p className="text-gray-600 ml-7">{profile.medicalCondition}</p>
                </div>
              )}
            </div>

            {/* Platform Connections */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🔗</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Platform Connections</h3>
                  <p className="text-sm text-gray-500">
                    Connect to platforms to enable smart food recommendations
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {PLATFORMS.map(platform => {
                  const isConnected = isPlatformConnected(platform.id);
                  const integration = integrations.find(i => i.platform === platform.id);
                  const hasMenu = !!menuData[platform.id];

                  return (
                    <div key={platform.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{platform.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800">{platform.name}</h4>
                            {isConnected && integration && (
                              <p className="text-xs text-gray-500">
                                Connected on {new Date(integration.connectedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isConnected 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {isConnected ? "Connected" : "Not Connected"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push("/connect")}
                          className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-sm"
                        >
                          {isConnected ? "Reconnect" : "Connect"}
                        </button>
                        {isConnected && (
                          <button
                            onClick={() => handleFetchMenu(platform.id)}
                            disabled={fetchingMenu === platform.id}
                            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
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
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {hasMenu && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600">
                            Menu cached: {menuData[platform.id].menuItems?.length || 0} items available
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
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Goal</label>
                  <select
                    value={formData.fitnessGoal}
                    onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select a goal</option>
                    {fitnessGoals.map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                  <select
                    value={formData.activityType}
                    onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select an activity</option>
                    {activityTypes.map((activity) => (
                      <option key={activity.id} value={activity.id}>{activity.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Additional Information</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Description (optional)
                </label>
                <textarea
                  value={formData.goalDescription}
                  onChange={(e) => setFormData({ ...formData, goalDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={4}
                  placeholder="Tell us more about your fitness goals..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions (optional)
                </label>
                <textarea
                  value={formData.medicalCondition}
                  onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={4}
                  placeholder="Any medical conditions, allergies, or dietary restrictions..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
