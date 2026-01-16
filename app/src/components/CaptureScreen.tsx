"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface CaptureScreenProps {
  onCapture: (imageData: string) => void;
  onBack: () => void;
}

type CaptureState = "init" | "ready" | "preview" | "error";

export function CaptureScreen({ onCapture, onBack }: CaptureScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captureState, setCaptureState] = useState<CaptureState>("init");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const startCamera = useCallback(async () => {
    try {
      setCaptureState("init");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      // Wait for video element to be available
      const checkVideo = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
              .then(() => setCaptureState("ready"))
              .catch((err) => {
                console.error("Play error:", err);
                setCaptureState("ready"); // Still show video even if autoplay fails
              });
          };
        } else {
          // Retry after a short delay if video element not ready
          setTimeout(checkVideo, 100);
        }
      };
      checkVideo();
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMessage("Could not access camera. Please allow camera access and try again.");
      setCaptureState("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    setCaptureState("preview");
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setCaptureState("ready");
  }, []);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      stopCamera();
      onCapture(capturedImage);
    }
  }, [capturedImage, stopCamera, onCapture]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleBack = () => {
    stopCamera();
    onBack();
  };

  return (
    <div className="min-h-screen flex flex-col bg-black relative">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Error State */}
      {captureState === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FFF8E1]">
          <div className="text-6xl mb-6">📷</div>
          <p className="text-xl text-[#4E342E] text-center mb-6">{errorMessage}</p>
          <button
            onClick={startCamera}
            className="px-8 py-4 text-xl font-bold text-white bg-[#FF9800] rounded-full hover:bg-[#F57C00] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Camera View - always rendered but visibility controlled */}
      {(captureState === "init" || captureState === "ready") && (
        <>
          {/* Video feed - always present for ref to work */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${captureState === "init" ? "opacity-0" : "opacity-100"}`}
            />

            {/* Loading overlay */}
            {captureState === "init" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFF8E1]">
                <div className="animate-spin-slow text-6xl mb-4">📷</div>
                <p className="text-xl text-[#4E342E]">Starting camera...</p>
              </div>
            )}

            {/* Frame guide overlay - only show when ready */}
            {captureState === "ready" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 md:w-80 md:h-80 border-4 border-dashed border-white/60 rounded-3xl" />
              </div>
            )}

            {/* Instructions */}
            {captureState === "ready" && (
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-black/50 px-6 py-3 rounded-full">
                  <p className="text-white text-lg font-semibold">Show me your clay!</p>
                </div>
              </div>
            )}
          </div>

          {/* Capture button - only show when ready */}
          {captureState === "ready" && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button
                onClick={takePhoto}
                className="w-20 h-20 rounded-full bg-white border-4 border-[#FF9800] hover:border-[#F57C00] shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-[#FF9800]" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview State */}
      {captureState === "preview" && capturedImage && (
        <div className="flex-1 flex flex-col">
          {/* Captured image */}
          <div className="flex-1 relative">
            <img
              src={capturedImage}
              alt="Captured clay creation"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex gap-4 justify-center">
              <button
                onClick={retake}
                className="px-8 py-4 text-lg font-bold text-white bg-gray-600 rounded-full hover:bg-gray-700 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={confirmPhoto}
                className="px-8 py-4 text-lg font-bold text-white bg-[#FF9800] rounded-full hover:bg-[#F57C00] transition-colors animate-pulse-glow"
              >
                Create My Story!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
