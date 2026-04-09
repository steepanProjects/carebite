"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
            <Image src="/logo.svg" alt="CareBite" width={32} height={32} className="w-8 h-8 rounded-full" />
            <h1 className="text-xl font-bold text-gray-800">CareBite</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-10 h-10 rounded-full border-2 border-emerald-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
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
              AI-powered personalized meal planning based on your profile
            </p>
          </button>

          <button
            onClick={() => router.push("/orders")}
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow text-left"
          >
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Order Management</h3>
            <p className="text-gray-600">
              AI matches your diet plan with available menu items for ordering
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
