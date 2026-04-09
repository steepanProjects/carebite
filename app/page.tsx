"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    const timer = setTimeout(() => {
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
      setIsChecking(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-2">🍽️</h1>
          <h2 className="text-4xl font-bold text-white">CareBite</h2>
          <p className="text-emerald-100 mt-2">Your health companion</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  );
}
