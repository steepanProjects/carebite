"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <h1 className="text-xl font-bold text-gray-800">CareBite</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
            >
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium">Profile</span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome back, {session?.user?.name}! 👋
          </h2>
          <p className="text-gray-600 text-lg">
            Your personalized health dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push("/diet-plan")}
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow text-left"
          >
            <div className="text-5xl mb-4">🥗</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Generate Diet Plan</h3>
            <p className="text-gray-600">
              AI-powered personalized meal planning based on your profile and available menu
            </p>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow text-left"
          >
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Profile</h3>
            <p className="text-gray-600">
              View and edit your personal information, goals, and fetch menu items
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
