"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// ─── animation variants ───────────────────────────────────────────────────────

const containerV = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};

const logoV = {
  initial: { scale: 0.85, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const textV = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.2, duration: 0.5 },
};

const taglineV = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { delay: 0.4, duration: 0.5 },
};

const loaderV = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { delay: 0.6, duration: 0.4 },
};

// ─── animated loading bar ─────────────────────────────────────────────────────

function LoadingBar() {
  return (
    <div className="w-32 h-0.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-white rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SplashScreen() {
  // ── all existing logic preserved exactly ──
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    const checkProfile = async () => {
      // Always show splash screen first
      setShowSplash(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (session) {
        // User is logged in - check profile and redirect
        try {
          const response = await fetch("/api/profile");
          const data = await response.json();

          setIsExiting(true);
          await new Promise((resolve) => setTimeout(resolve, 400));

          if (data.profile) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } catch (error) {
          console.error("Error checking profile:", error);
          setIsExiting(true);
          await new Promise((resolve) => setTimeout(resolve, 400));
          router.push("/onboarding");
        }
      } else {
        // User not logged in - redirect to login
        setIsExiting(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        router.push("/login");
      }
      setIsChecking(false);
    };

    checkProfile();
  }, [session, status, router]);

  // If not showing splash yet, show nothing
  if (!showSplash) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black"
          initial={containerV.initial}
          animate={containerV.animate}
          exit={containerV.exit}
          transition={containerV.transition}
        >
          {/* content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* logo with subtle container */}
            <motion.div
              className="relative mb-8"
              variants={logoV}
              initial="initial"
              animate="animate"
              transition={logoV.transition}
            >
              <div className="relative w-28 h-28 rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5">
                <Image
                  src="/image.png"
                  alt="CareBite"
                  width={112}
                  height={112}
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* brand name */}
            <motion.div
              className="text-center mb-3"
              variants={textV}
              initial="initial"
              animate="animate"
              transition={textV.transition}
            >
              <h1 className="text-4xl md:text-5xl font-black tracking-wider leading-none mb-1 text-white">
                CAREBITE
              </h1>
            </motion.div>

            {/* tagline */}
            <motion.p
              className="text-gray-500 text-xs md:text-sm font-medium tracking-[0.3em] uppercase mb-12"
              variants={taglineV}
              initial="initial"
              animate="animate"
              transition={taglineV.transition}
            >
              Agentic Nutrition Engine
            </motion.p>

            {/* loading indicator */}
            <motion.div
              variants={loaderV}
              initial="initial"
              animate="animate"
              transition={loaderV.transition}
            >
              <LoadingBar />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
