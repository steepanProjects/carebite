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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalTitle = (goal: string) => {
    const goals: Record<string, string> = {
      weight_loss: "Weight Loss",
      muscle_gain: "Muscle Gain",
      endurance: "Endurance Training",
      general_fitness: "General Fitness"
    };
    return goals[goal] || goal;
  };

  const getActivityTitle = (activity: string) => {
    const activities: Record<string, string> = {
      gym: "Gym Training",
      cycling: "Cycling",
      running: "Running",
      marathon: "Marathon Training",
      general: "General Activity"
    };
    return activities[activity] || activity;
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
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <h1 className="text-xl font-bold text-gray-800">CareBite</h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back, {session?.user?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Here's your personalized health dashboard
          </p>
        </div>

        {profile && (
          <>
            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">Age</div>
                <div className="text-3xl font-bold text-gray-800">{profile.age}</div>
                <div className="text-gray-400 text-xs mt-1">years</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">Height</div>
                <div className="text-3xl font-bold text-gray-800">{profile.height}</div>
                <div className="text-gray-400 text-xs mt-1">cm</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">Weight</div>
                <div className="text-3xl font-bold text-gray-800">{profile.weight}</div>
                <div className="text-gray-400 text-xs mt-1">kg</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm mb-1">BMI</div>
                <div className="text-3xl font-bold text-gray-800">{bmi}</div>
                <div className="text-gray-400 text-xs mt-1">index</div>
              </div>
            </div>

            {/* Goals Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Fitness Journey</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <h4 className="font-semibold text-gray-700">Fitness Goal</h4>
                  </div>
                  <p className="text-gray-600 ml-9">{getGoalTitle(profile.fitnessGoal)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏃</span>
                    <h4 className="font-semibold text-gray-700">Activity Type</h4>
                  </div>
                  <p className="text-gray-600 ml-9">{getActivityTitle(profile.activityType)}</p>
                </div>
              </div>

              {profile.goalDescription && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Your Goals</h4>
                  <p className="text-gray-600">{profile.goalDescription}</p>
                </div>
              )}

              {profile.medicalCondition && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏥</span>
                    <h4 className="font-semibold text-gray-700">Medical Conditions</h4>
                  </div>
                  <p className="text-gray-600 ml-7">{profile.medicalCondition}</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
