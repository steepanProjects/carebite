"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";

interface Integration {
  platform: string;
  connectedAt: string;
  platformUserId: string;
}

const PLATFORMS = [
  { id: 'sillobite', name: 'SilloBite', icon: '🍽️', color: 'emerald' },
  { id: 'figgy', name: 'Figgy', icon: '🥗', color: 'blue' },
  { id: 'komato', name: 'Komato', icon: '🍅', color: 'red' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchIntegrationStatus();
    }
  }, [status, router]);

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch("/api/integration/status");
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error("Error fetching integration status:", error);
    }
  };

  const isPlatformConnected = (platformId: string) => {
    return integrations.some(i => i.platform === platformId);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rich-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rich-black pb-24 md:pb-8">
      <header className="bg-rich-black-50 shadow-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="CareBite" width={32} height={32} className="w-8 h-8 rounded-full" />
            <h1 className="text-xl font-bold text-white">CareBite</h1>
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
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-rich-black font-semibold">
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
                <div className="absolute right-0 mt-2 w-48 bg-rich-black-50 rounded-lg shadow-lg border border-white/10 py-2 z-20">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
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
                    className="w-full px-4 py-2 text-left text-white hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
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
        <div className="bg-rich-black-50 rounded-lg shadow border border-white/10 p-8 text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome back, {session?.user?.name}! 👋
          </h2>
          <p className="text-gray-400 text-lg">
            Your personalized health dashboard
          </p>
        </div>

        {/* Platform Connections Status */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                🔗
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Platform Connections</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {integrations.length} of {PLATFORMS.length} platforms connected
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="px-3 py-1.5 bg-white text-black rounded-lg hover:bg-zinc-200 transition-all font-semibold text-xs"
            >
              Manage
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLATFORMS.map(platform => {
              const isConnected = isPlatformConnected(platform.id);
              const integration = integrations.find(i => i.platform === platform.id);

              return (
                <div
                  key={platform.id}
                  className={`bg-zinc-900 border rounded-lg p-4 transition-all ${isConnected
                    ? 'border-green-900 hover:border-green-800'
                    : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-2xl">
                        {platform.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{platform.name}</h4>
                        {isConnected && integration && (
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {new Date(integration.connectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${isConnected
                      ? 'bg-green-950 text-green-400 border border-green-900'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                      {isConnected ? '● Connected' : '○ Not Connected'}
                    </span>

                    {!isConnected && (
                      <button
                        onClick={() => router.push(`/connect?platform=${platform.id}`)}
                        className="text-[10px] text-white hover:text-zinc-300 font-semibold underline"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Navigation Cards - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push("/diet-plan")}
            className="bg-rich-black-50 rounded-lg shadow border border-white/10 p-8 hover:shadow-lg hover:border-white/20 transition-all text-left"
          >
            <div className="text-5xl mb-4">🥗</div>
            <h3 className="text-2xl font-bold text-white mb-2">Generate Diet Plan</h3>
            <p className="text-gray-400">
              AI-powered personalized meal planning based on your profile
            </p>
          </button>

          <button
            onClick={() => router.push("/orders")}
            className="bg-rich-black-50 rounded-lg shadow border border-white/10 p-8 hover:shadow-lg hover:border-white/20 transition-all text-left"
          >
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-2xl font-bold text-white mb-2">Order Management</h3>
            <p className="text-gray-400">
              Manually match and order meals from your diet plan
            </p>
          </button>

          <button
            onClick={() => router.push("/auto-orders")}
            className="bg-rich-black-50 rounded-lg shadow border-2 border-white p-8 hover:shadow-lg hover:border-white/80 transition-all text-left"
          >
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-white mb-2">Automated Ordering</h3>
            <p className="text-gray-400">
              AI automatically orders meals at scheduled times based on your diet plan
            </p>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="bg-rich-black-50 rounded-lg shadow border border-white/10 p-8 hover:shadow-lg hover:border-white/20 transition-all text-left"
          >
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-2xl font-bold text-white mb-2">Your Profile</h3>
            <p className="text-gray-400">
              View and edit your personal information, goals, and fetch menu items
            </p>
          </button>
        </div>


      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
