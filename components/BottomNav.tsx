"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const getActiveTab = () => {
        if (pathname === "/dashboard") return "home";
        if (pathname === "/diet-plan") return "diet";
        if (pathname === "/orders") return "orders";
        if (pathname === "/auto-orders") return "auto";
        return "home";
    };

    const activeTab = getActiveTab();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    return (
        <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50">
            <div className="bg-gradient-to-b from-rich-black-50/95 to-rich-black/95 backdrop-blur-2xl border border-white/15 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] px-1 py-2">
                <div className="flex items-center justify-around">
                    {/* Home */}
                    <button
                        onClick={() => handleNavigation("/dashboard")}
                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-[20px] transition-all relative group min-w-[60px]"
                    >
                        {activeTab === "home" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <div className="relative z-10">
                            <svg
                                className={`w-5 h-5 transition-all duration-200 ${activeTab === "home" ? "text-white scale-110" : "text-gray-500"
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={activeTab === "home" ? 2.5 : 2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                            </svg>
                        </div>
                        <span
                            className={`text-[9px] font-semibold transition-all duration-200 relative z-10 ${activeTab === "home" ? "text-white" : "text-gray-600"
                                }`}
                        >
                            Home
                        </span>
                    </button>

                    {/* Diet Plan */}
                    <button
                        onClick={() => handleNavigation("/diet-plan")}
                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-[20px] transition-all relative group min-w-[60px]"
                    >
                        {activeTab === "diet" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <div className="relative z-10">
                            <svg
                                className={`w-5 h-5 transition-all duration-200 ${activeTab === "diet" ? "text-white scale-110" : "text-gray-500"
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={activeTab === "diet" ? 2.5 : 2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <span
                            className={`text-[9px] font-semibold transition-all duration-200 relative z-10 ${activeTab === "diet" ? "text-white" : "text-gray-600"
                                }`}
                        >
                            Diet
                        </span>
                    </button>

                    {/* Orders */}
                    <button
                        onClick={() => handleNavigation("/orders")}
                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-[20px] transition-all relative group min-w-[60px]"
                    >
                        {activeTab === "orders" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <div className="relative z-10">
                            <svg
                                className={`w-5 h-5 transition-all duration-200 ${activeTab === "orders" ? "text-white scale-110" : "text-gray-500"
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={activeTab === "orders" ? 2.5 : 2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                />
                            </svg>
                        </div>
                        <span
                            className={`text-[9px] font-semibold transition-all duration-200 relative z-10 ${activeTab === "orders" ? "text-white" : "text-gray-600"
                                }`}
                        >
                            Orders
                        </span>
                    </button>

                    {/* Auto Orders */}
                    <button
                        onClick={() => handleNavigation("/auto-orders")}
                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-[20px] transition-all relative group min-w-[60px]"
                    >
                        {activeTab === "auto" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <div className="relative z-10">
                            <svg
                                className={`w-5 h-5 transition-all duration-200 ${activeTab === "auto" ? "text-white scale-110" : "text-gray-500"
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={activeTab === "auto" ? 2.5 : 2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <span
                            className={`text-[9px] font-semibold transition-all duration-200 relative z-10 ${activeTab === "auto" ? "text-white" : "text-gray-600"
                                }`}
                        >
                            Auto
                        </span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
