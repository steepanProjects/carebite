"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

const fitnessGoals = [
  {
    id: "weight_loss",
    title: "Weight Loss",
    icon: "⚖️",
    description: "Reduce body weight through calorie deficit and balanced nutrition"
  },
  {
    id: "muscle_gain",
    title: "Muscle Gain",
    icon: "💪",
    description: "Build muscle mass with protein-rich diet and strength training support"
  },
  {
    id: "endurance",
    title: "Endurance Training",
    icon: "🏃",
    description: "Boost stamina for long-distance activities with optimal carb intake"
  },
  {
    id: "general_fitness",
    title: "General Fitness",
    icon: "🌟",
    description: "Maintain overall health with balanced nutrition and wellness"
  }
];

const activityTypes = [
  { id: "gym", title: "Gym Training", icon: "🏋️" },
  { id: "cycling", title: "Cycling", icon: "🚴" },
  { id: "running", title: "Running", icon: "🏃" },
  { id: "marathon", title: "Marathon Training", icon: "🎽" },
  { id: "general", title: "General Activity", icon: "🚶" }
];

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center justify-center gap-2 mb-12">
    {Array.from({ length: totalSteps }).map((_, index) => (
      <div key={index} className="flex items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${index + 1 === currentStep
            ? "bg-white text-black ring-2 ring-white shadow-lg scale-110"
            : index + 1 < currentStep
              ? "bg-white/20 text-white"
              : "bg-white/5 text-white/40"
            }`}
        >
          {index + 1 < currentStep ? "✓" : index + 1}
        </div>
        {index < totalSteps - 1 && (
          <div
            className={`w-12 h-0.5 mx-1 transition-all duration-300 ${index + 1 < currentStep ? "bg-white/40" : "bg-white/10"
              }`}
          />
        )}
      </div>
    ))}
  </div>
);

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    age: "",
    height: "",
    weight: "",
    fitnessGoal: "",
    activityType: "",
    goalDescription: "",
    medicalCondition: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: parseInt(formData.age),
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          fitnessGoal: formData.fitnessGoal,
          activityType: formData.activityType,
          goalDescription: formData.goalDescription,
          medicalCondition: formData.medicalCondition
        })
      });

      if (response.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/logo.svg" alt="CareBite" width={48} height={48} className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Welcome to CareBite
          </h1>
          <p className="text-white/60 text-lg">
            Let's personalize your nutrition journey
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={4} />

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Tell us about yourself
              </h2>
              <p className="text-white/60">Your physical metrics help us create the perfect plan</p>
            </div>

            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                  placeholder="Enter your age"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                  placeholder="Enter your height in cm"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                  placeholder="Enter your weight in kg"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.age || !formData.height || !formData.weight}
              className="mt-8 w-full bg-white text-black py-4 rounded-xl font-semibold hover:bg-white/90 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Fitness Goal */}
        {step === 2 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                What's your fitness goal?
              </h2>
              <p className="text-white/60">
                Choose the goal that best describes what you want to achieve
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {fitnessGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setFormData({ ...formData, fitnessGoal: goal.id })}
                  className={`p-6 border-2 rounded-xl text-left transition-all transform hover:scale-[1.02] ${formData.fitnessGoal === goal.id
                    ? "border-white bg-white/10 shadow-lg"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                    }`}
                >
                  <div className="text-4xl mb-3">{goal.icon}</div>
                  <h3 className="font-semibold text-lg text-white mb-2">{goal.title}</h3>
                  <p className="text-sm text-white/60">{goal.description}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.fitnessGoal}
                className="flex-1 bg-white text-black py-4 rounded-xl font-semibold hover:bg-white/90 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Activity Type */}
        {step === 3 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                What's your main activity?
              </h2>
              <p className="text-white/60">
                This helps us tailor your nutrition plan to your training needs
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {activityTypes.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => setFormData({ ...formData, activityType: activity.id })}
                  className={`p-6 border-2 rounded-xl text-center transition-all transform hover:scale-[1.02] ${formData.activityType === activity.id
                    ? "border-white bg-white/10 shadow-lg"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                    }`}
                >
                  <div className="text-4xl mb-2">{activity.icon}</div>
                  <h3 className="font-medium text-sm text-white">{activity.title}</h3>
                </button>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Tell us more about your goals (optional)
              </label>
              <textarea
                value={formData.goalDescription}
                onChange={(e) => setFormData({ ...formData, goalDescription: e.target.value })}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all resize-none"
                rows={4}
                placeholder="E.g., I'm training for a marathon in 6 months and want to optimize my nutrition..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.activityType}
                className="flex-1 bg-white text-black py-4 rounded-xl font-semibold hover:bg-white/90 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Medical Condition */}
        {step === 4 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Any medical conditions we should know about?
              </h2>
              <p className="text-white/60">
                This helps us provide safer and more personalized nutrition recommendations. Your information is kept private and secure.
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Medical Conditions (optional)
              </label>
              <textarea
                value={formData.medicalCondition}
                onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all resize-none"
                rows={6}
                placeholder="E.g., Diabetes, high blood pressure, food allergies (nuts, gluten), lactose intolerance, heart condition, etc."
              />
              <p className="text-xs text-white/50 mt-3 flex items-start gap-2">
                <span>💡</span>
                <span>Include any allergies, chronic conditions, or dietary restrictions</span>
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-white text-black py-4 rounded-xl font-semibold hover:bg-white/90 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    Saving...
                  </span>
                ) : (
                  "Complete Setup"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
