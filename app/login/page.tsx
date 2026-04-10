"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// ─── variants ─────────────────────────────────────────────────────────────────

const pageV = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.45 },
};

const leftV = {
  initial: { scale: 1.1, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const cardV = {
  initial: { opacity: 0, scale: 0.95, y: 30 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const, delay: 0.2 },
};

const logoV = {
  initial: { opacity: 0, scale: 0.72, y: -14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { delay: 0.35, duration: 0.5, ease: "easeOut" as const },
};

const headV = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.45, duration: 0.4 },
};

const divV = {
  initial: { opacity: 0, scaleX: 0.3 },
  animate: { opacity: 1, scaleX: 1 },
  transition: { delay: 0.55, duration: 0.5, ease: "easeOut" as const },
};

const btnV = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.63, duration: 0.4 },
};

const chipWrap = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.75 } },
};

const chipV = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

const footV = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { delay: 0.95, duration: 0.4 },
};

const leftTextWrap = {
  initial: {},
  animate: { transition: { staggerChildren: 0.13, delayChildren: 0.65 } },
};

const leftLine = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

// ─── ambient blob ─────────────────────────────────────────────────────────────

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
      animate={{ scale: [1, 1.18, 1], opacity: [0.14, 0.24, 0.14] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ─── Google icon (SVG paths unchanged) ───────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  // ── all existing logic preserved exactly ──
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  const features = ["✦ AI Nutrition", "✦ Smart Meals", "✦ Health Insights"];

  return (
    // h-screen + overflow-hidden on root = zero gap, zero scroll
    <motion.div
      className="flex h-screen w-screen overflow-hidden"
      initial={pageV.initial}
      animate={pageV.animate}
      transition={pageV.transition}
    >

      {/* ══════════════════════════════════════════════════
          LEFT — hero image  (hidden below md)
          Uses flex so h-full resolves correctly
      ══════════════════════════════════════════════════ */}
      <div className="hidden md:flex relative w-1/2 h-full overflow-hidden flex-shrink-0">

        {/* animated image wrapper — scale zoom on load */}
        <motion.div
          className="absolute inset-0"
          initial={leftV.initial}
          animate={leftV.animate}
          transition={leftV.transition}
        >
          <Image
            src="/login-hero.png"
            alt="CareBite — smarter meals"
            fill
            className="object-cover object-center"
            priority
            quality={100}
            sizes="50vw"
          />
        </motion.div>

        {/* layer 1 — base dark tint (no blur to keep image sharp) */}
        <div className="absolute inset-0 bg-black/35" />

        {/* layer 2 — strong right-edge gradient to eliminate any gap perception */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/40 to-black/90" />

        {/* layer 3 — bottom vignette for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

        {/* top-left brand mark */}
        <motion.div
          className="absolute top-7 left-7 z-20 flex items-center gap-2.5"
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/25 bg-white/10 backdrop-blur-md flex items-center justify-center">
            <Image src="/image.png" alt="logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="text-white font-bold text-[17px] tracking-tight drop-shadow-sm">
            Care<span className="text-white">Bite</span>
          </span>
        </motion.div>

        {/* bottom-left copy block */}
        <motion.div
          className="absolute bottom-10 left-8 right-10 z-20"
          variants={leftTextWrap}
          initial="initial"
          animate="animate"
        >
          <motion.p
            className="text-[10px] font-bold uppercase tracking-[0.25em] text-white mb-2.5"
            variants={leftLine}
          >
            Nutrition Intelligence
          </motion.p>

          <motion.h2
            className="text-[2rem] font-extrabold text-white leading-tight mb-3 drop-shadow-md"
            variants={leftLine}
          >
            Smarter meals.<br />Better outcomes.
          </motion.h2>

          <motion.p
            className="text-sm text-white/55 leading-relaxed max-w-[280px]"
            variants={leftLine}
          >
            AI-powered nutrition tracking built for modern care teams and health-conscious individuals.
          </motion.p>

          {/* stat pills */}
          <motion.div className="flex gap-2.5 mt-6 flex-wrap" variants={leftLine}>
            {[
              { value: "10k+", label: "Users" },
              { value: "98%", label: "Accuracy" },
              { value: "24/7", label: "Support" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2 text-center"
              >
                <p className="text-white font-bold text-[15px] leading-none">{s.value}</p>
                <p className="text-white/45 text-[10px] mt-0.5 tracking-wide uppercase">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════
          RIGHT — login panel
          flex-1 on mobile fills full width; md:w-1/2 on desktop
      ══════════════════════════════════════════════════ */}
      <div className="relative flex flex-1 md:w-1/2 md:flex-none h-full items-center justify-center overflow-hidden bg-gradient-to-br from-rich-black-100 via-rich-black to-rich-black-100">

        {/* noise grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.032]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />

        {/* ambient blobs */}
        <Blob
          className="absolute -top-28 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #FFFFFF 0%, #A3A3A3 70%)" }}
          delay={0}
        />
        <Blob
          className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #1A1A1A 0%, #0A0A0A 70%)" }}
          delay={3.5}
        />
        <Blob
          className="absolute top-1/2 -right-10 w-52 h-52 rounded-full blur-2xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #E5E5E5 0%, #525252 70%)" }}
          delay={6.5}
        />

        {/* card emerald glow halo */}
        <div
          className="absolute z-0 pointer-events-none w-[400px] h-[500px]"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.18) 0%, transparent 68%)",
            filter: "blur(40px)",
          }}
        />

        {/* ── glass card ── */}
        <motion.div
          className="relative z-10 w-full max-w-[360px] mx-auto px-8 py-9 rounded-3xl border border-white/[0.13] bg-white/[0.07] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px -10px rgba(0,0,0,0.7), 0 0 60px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.09)",
          }}
          initial={cardV.initial}
          animate={cardV.animate}
          transition={cardV.transition}
        >

          {/* logo */}
          <motion.div
            className="flex flex-col items-center mb-7 gap-3.5"
            initial={logoV.initial}
            animate={logoV.animate}
            transition={logoV.transition}
          >
            <motion.div
              className="w-[70px] h-[70px] rounded-2xl overflow-hidden flex items-center justify-center border border-white/20 bg-white/5"
              style={{
                boxShadow: "0 0 40px rgba(255,255,255,0.3), 0 8px 28px rgba(0,0,0,0.5)",
              }}
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/image.png"
                alt="CareBite logo"
                width={70}
                height={70}
                className="object-contain"
                priority
              />
            </motion.div>

            {/* brand name */}
            <motion.div
              className="text-center"
              initial={headV.initial}
              animate={headV.animate}
              transition={headV.transition}
            >
              <h1 className="text-[27px] font-extrabold tracking-tight leading-none">
                <span className="text-white">Care</span>
                <span className="text-white">Bite</span>
              </h1>
              <p className="text-[13px] text-gray-400 mt-2 font-medium tracking-wide">
                Smart nutrition for better care
              </p>
            </motion.div>
          </motion.div>

          {/* divider */}
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={divV.initial}
            animate={divV.animate}
            transition={divV.transition}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <span className="text-[9.5px] text-gray-500 font-semibold uppercase tracking-[0.22em] whitespace-nowrap">
              Sign in to continue
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </motion.div>

          {/* Google button */}
          <motion.div
            initial={btnV.initial}
            animate={btnV.animate}
            transition={btnV.transition}
          >
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-3 bg-white/[0.08] border border-white/[0.18] text-white font-semibold py-3.5 px-5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              whileHover={{
                scale: 1.03,
                boxShadow: "0 0 36px rgba(255,255,255,0.35), 0 8px 28px rgba(0,0,0,0.4)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              {/* shimmer sweep on hover */}
              <motion.span
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                  background: "linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)",
                  backgroundSize: "220% 100%",
                  backgroundPosition: "220% center",
                }}
                whileHover={{ backgroundPosition: "-220% center" }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              />

              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    className="flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <svg
                      className="w-5 h-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-gray-300 text-sm">Signing you in…</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    className="flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GoogleIcon />
                    <span className="text-sm">Continue with Google</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

          {/* feature chips */}
          <motion.div
            className="flex items-center justify-center gap-2 mt-5 flex-wrap"
            variants={chipWrap}
            initial="initial"
            animate="animate"
          >
            {features.map((feat) => (
              <motion.span
                key={feat}
                className="text-[11px] text-white border border-white/25 bg-white/[0.08] rounded-full px-3 py-[5px] font-medium tracking-wide cursor-default select-none"
                variants={chipV}
                whileHover={{ scale: 1.08, y: -2, borderColor: "rgba(255,255,255,0.55)" }}
                transition={{ type: "spring", stiffness: 360, damping: 18 }}
              >
                {feat}
              </motion.span>
            ))}
          </motion.div>

          {/* footer */}
          <motion.p
            className="text-center text-[11px] text-gray-600 mt-5 leading-relaxed"
            initial={footV.initial}
            animate={footV.animate}
            transition={footV.transition}
          >
            By continuing, you agree to our{" "}
            <span className="text-white hover:text-gray-300 cursor-pointer transition-colors duration-200">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-white hover:text-gray-300 cursor-pointer transition-colors duration-200">
              Privacy Policy
            </span>
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
