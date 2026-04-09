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
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.5 },
};

const logoV = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as const },
};

const glowV = {
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.3, 0.5, 0.3],
  },
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

const textV = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.3, duration: 0.5 },
};

const taglineV = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.5, duration: 0.5 },
};

const loaderV = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { delay: 0.7, duration: 0.4 },
};

// ─── floating blob ───────────────────────────────────────────────────────────

function Blob({
  className,
  style,
  delay = 0,
}: {
  className: string;
  style: React.CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ─── animated dots loader ─────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-emerald-400"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
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
      if (session) {
        // User is logged in - skip splash and go directly to appropriate page
        try {
          const response = await fetch("/api/profile");
          const data = await response.json();

          if (data.profile) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } catch (error) {
          console.error("Error checking profile:", error);
          router.push("/onboarding");
        }
      } else {
        // User not logged in - show splash briefly then redirect to login
        setShowSplash(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsExiting(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/login");
      }
      setIsChecking(false);
    };

    checkProfile();
  }, [session, status, router]);

  // If user is logged in, show nothing (direct redirect)
  if (session) {
    return null;
  }

  // If not showing splash yet, show nothing
  if (!showSplash) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black"
          initial={containerV.initial}
          animate={containerV.animate}
          exit={containerV.exit}
          transition={containerV.transition}
        >
          {/* noise texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat",
              backgroundSize: "128px",
            }}
          />

          {/* ambient blobs */}
          <Blob
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #059669 0%, #064e3b 70%)" }}
            delay={0}
          />
          <Blob
            className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #0d9488 0%, #115e59 70%)" }}
            delay={3}
          />
          <Blob
            className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-2xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #10b981 0%, #047857 70%)" }}
            delay={5.5}
          />

          {/* content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* logo with glow */}
            <div className="relative mb-8">
              {/* pulsing glow behind logo */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)",
                  filter: "blur(32px)",
                }}
                variants={glowV}
                animate="animate"
                transition={glowV.transition}
              />

              {/* logo */}
              <motion.div
                className="relative w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-sm"
                style={{
                  boxShadow:
                    "0 0 48px rgba(16,185,129,0.3), 0 12px 32px rgba(0,0,0,0.5)",
                }}
                variants={logoV}
                initial="initial"
                animate="animate"
                transition={logoV.transition}
              >
                <Image
                  src="/image.png"
                  alt="CareBite"
                  width={96}
                  height={96}
                  className="object-contain"
                  priority
                />
              </motion.div>
            </div>

            {/* brand name */}
            <motion.div
              className="text-center mb-3"
              variants={textV}
              initial="initial"
              animate="animate"
              transition={textV.transition}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none mb-1">
                <span className="text-white">Care</span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
                  }}
                >
                  Bite
                </span>
              </h1>
            </motion.div>

            {/* tagline */}
            <motion.p
              className="text-gray-400 text-sm md:text-base font-medium tracking-wide mb-10"
              variants={taglineV}
              initial="initial"
              animate="animate"
              transition={taglineV.transition}
            >
              Smart nutrition for better care
            </motion.p>

            {/* loading indicator */}
            <motion.div
              variants={loaderV}
              initial="initial"
              animate="animate"
              transition={loaderV.transition}
            >
              <LoadingDots />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
