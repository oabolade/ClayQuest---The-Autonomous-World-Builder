"use client";

import { useState, useCallback } from "react";
import { AppScreen, Story, LoadingStep } from "@/types";
import { WelcomeScreen } from "./WelcomeScreen";
import { CaptureScreen } from "./CaptureScreen";
import { LoadingScreen } from "./LoadingScreen";
import { PictureBookViewer } from "./PictureBookViewer";

const LOADING_STEPS: LoadingStep[] = [
  "analyzing",
  "creating-story",
  "generating-images",
  "adding-voice",
  "finalizing",
];

export function ClayQuestApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("welcome");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("analyzing");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(() => {
    setCurrentScreen("capture");
  }, []);

  const handleBack = useCallback(() => {
    setCurrentScreen("welcome");
    setCapturedImage(null);
  }, []);

  const generateStory = useCallback(async (imageData: string) => {
    setCapturedImage(imageData);
    setCurrentScreen("loading");
    setError(null);
    setLoadingStep("analyzing");
    setLoadingProgress(0);

    // Simulate progress through steps
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 800);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        const currentIndex = LOADING_STEPS.indexOf(prev);
        if (currentIndex < LOADING_STEPS.length - 1) {
          return LOADING_STEPS[currentIndex + 1];
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 3000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      clearInterval(progressInterval);
      clearInterval(stepInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate story");
      }

      const data = await response.json();

      setLoadingProgress(100);
      setLoadingStep("finalizing");

      // Brief delay before showing the book
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStory(data.story);
      setCurrentScreen("book");
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, []);

  const handleCapture = useCallback(
    (imageData: string) => {
      generateStory(imageData);
    },
    [generateStory]
  );

  const handleRetry = useCallback(() => {
    if (capturedImage) {
      generateStory(capturedImage);
    }
  }, [capturedImage, generateStory]);

  const handleCancel = useCallback(() => {
    setCurrentScreen("welcome");
    setCapturedImage(null);
    setError(null);
  }, []);

  const handleNewStory = useCallback(() => {
    setCurrentScreen("welcome");
    setCapturedImage(null);
    setStory(null);
    setError(null);
  }, []);

  return (
    <main className="h-screen h-[100dvh] overflow-hidden">
      {currentScreen === "welcome" && <WelcomeScreen onStart={handleStart} />}

      {currentScreen === "capture" && (
        <CaptureScreen onCapture={handleCapture} onBack={handleBack} />
      )}

      {currentScreen === "loading" && (
        <LoadingScreen
          currentStep={loadingStep}
          progress={loadingProgress}
          error={error}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      )}

      {currentScreen === "book" && story && (
        <PictureBookViewer story={story} onNewStory={handleNewStory} />
      )}
    </main>
  );
}
