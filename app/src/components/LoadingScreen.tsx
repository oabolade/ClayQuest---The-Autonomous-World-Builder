"use client";

import { useEffect, useState } from "react";
import { LoadingStep, LOADING_MESSAGES } from "@/types";

interface LoadingScreenProps {
  currentStep: LoadingStep;
  progress: number;
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

const STEP_EMOJIS: Record<LoadingStep, string> = {
  "analyzing": "🔍",
  "creating-story": "📖",
  "generating-images": "🎨",
  "adding-voice": "🎤",
  "finalizing": "✨",
};

export function LoadingScreen({
  currentStep,
  progress,
  error,
  onRetry,
  onCancel,
}: LoadingScreenProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#FFF8E1] to-[#FFE0B2]">
        <div className="text-8xl mb-8">😅</div>
        <h2 className="text-3xl font-bold text-[#4E342E] mb-4 text-center">
          Oops! The magic got stuck.
        </h2>
        <p className="text-lg text-[#6D4C41] mb-8 text-center max-w-md">
          {error}
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="px-8 py-4 text-lg font-bold text-[#4E342E] bg-white border-2 border-[#4E342E] rounded-full hover:bg-gray-100 transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={onRetry}
            className="px-8 py-4 text-lg font-bold text-white bg-[#FF9800] rounded-full hover:bg-[#F57C00] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#FFF8E1] to-[#FFE0B2]">
      {/* Animated mascot */}
      <div className="relative mb-8">
        <div className="animate-bounce-slow">
          <div className="w-40 h-40 rounded-full bg-[#FF9800] flex items-center justify-center shadow-lg">
            <span className="text-7xl">{STEP_EMOJIS[currentStep]}</span>
          </div>
        </div>

        {/* Magic sparkles */}
        <div className="absolute -top-2 -right-2 text-3xl animate-pulse">✨</div>
        <div className="absolute -bottom-2 -left-2 text-3xl animate-pulse delay-300">✨</div>
        <div className="absolute top-1/2 -right-6 text-2xl animate-pulse delay-150">⭐</div>
      </div>

      {/* Loading message */}
      <h2 className="text-2xl md:text-3xl font-bold text-[#4E342E] mb-4 text-center">
        {LOADING_MESSAGES[currentStep]}{dots}
      </h2>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="h-4 bg-white rounded-full shadow-inner overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF9800] to-[#FFB74D] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-3 mb-8">
        {Object.keys(STEP_EMOJIS).map((step, index) => {
          const steps = Object.keys(STEP_EMOJIS);
          const currentIndex = steps.indexOf(currentStep);
          const isComplete = index < currentIndex;
          const isCurrent = step === currentStep;

          return (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isComplete
                  ? "bg-[#4CAF50]"
                  : isCurrent
                    ? "bg-[#FF9800] scale-125"
                    : "bg-gray-300"
              }`}
            />
          );
        })}
      </div>

      {/* Fun fact while waiting */}
      <p className="text-[#8D6E63] text-center max-w-sm">
        Did you know? The first clay sculptures were made over 25,000 years ago!
      </p>
    </div>
  );
}
