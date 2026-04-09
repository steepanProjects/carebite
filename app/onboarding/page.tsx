"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome to CareBite! 🍽️
          </h1>
          <p className="text-gray-600">
            Let's personalize your nutrition journey
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of 4</span>
            <span className="text-sm font-medium text-gray-700">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Tell us about yourself
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your height in cm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your weight in kg"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.age || !formData.height || !formData.weight}
              className="mt-8 w-full bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Fitness Goal */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              What's your fitness goal?
            </h2>
            <p className="text-gray-600 mb-6">
              Choose the goal that best describes what you want to achieve
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {fitnessGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setFormData({ ...formData, fitnessGoal: goal.id })}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    formData.fitnessGoal === goal.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="text-4xl mb-3">{goal.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{goal.title}</h3>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.fitnessGoal}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Activity Type */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              What's your main activity?
            </h2>
            <p className="text-gray-600 mb-6">
              This helps us tailor your nutrition plan to your training needs
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {activityTypes.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => setFormData({ ...formData, activityType: activity.id })}
                  className={`p-6 border-2 rounded-lg text-center transition-all ${
                    formData.activityType === activity.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="text-4xl mb-2">{activity.icon}</div>
                  <h3 className="font-medium text-sm">{activity.title}</h3>
                </button>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us more about your goals (optional)
              </label>
              <textarea
                value={formData.goalDescription}
                onChange={(e) => setFormData({ ...formData, goalDescription: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={4}
                placeholder="E.g., I'm training for a marathon in 6 months and want to optimize my nutrition..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.activityType}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Medical Condition */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Any medical conditions we should know about?
            </h2>
            <p className="text-gray-600 mb-6">
              This helps us provide safer and more personalized nutrition recommendations. Your information is kept private and secure.
            </p>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions (optional)
              </label>
              <textarea
                value={formData.medicalCondition}
                onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={6}
                placeholder="E.g., Diabetes, high blood pressure, food allergies (nuts, gluten), lactose intolerance, heart condition, etc."
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Include any allergies, chronic conditions, or dietary restrictions
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
