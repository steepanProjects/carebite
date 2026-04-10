"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PLATFORMS = [
  { id: 'sillobite', name: 'SilloBite', icon: '🍽️' },
  { id: 'figgy', name: 'Figgy', icon: '🥗' },
  { id: 'komato', name: 'Komato', icon: '🍅' },
];

export default function ConnectCard() {
  const searchParams = useSearchParams();
  const platformParam = searchParams.get('platform') || 'sillobite';
  const [platform] = useState(platformParam);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  const selectedPlatform = PLATFORMS.find(p => p.id === platform) || PLATFORMS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email.trim() || !code.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, platform }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Connected successfully" });
        setEmail("");
        setCode("");

        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center text-3xl border border-zinc-800">
            {selectedPlatform.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Connect to {selectedPlatform.name}
            </h1>
            <p className="text-zinc-400 text-sm">
              Link your account to enable smart food recommendations
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all"
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="code"
            className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider"
          >
            Connection Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all"
            placeholder="Enter your code"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>Connect to {selectedPlatform?.name}</>
          )}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm border ${message.type === "success"
            ? "bg-green-950 text-green-400 border-green-900"
            : "bg-red-950 text-red-400 border-red-900"
            }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
