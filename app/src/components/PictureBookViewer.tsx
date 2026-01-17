"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Story } from "@/types";

// Configurable delays (in milliseconds)
const CONFIG = {
  PANEL_TRANSITION_DELAY: 300, // Visual transition delay before playing audio
  PRELOAD_TIMEOUT: 10000, // Max time to wait for preloading
};

interface PictureBookViewerProps {
  story: Story;
  onNewStory: () => void;
}

// Celebration Overlay Component
function CelebrationOverlay({
  title,
  onRestart,
  onNewStory,
}: {
  title: string;
  onRestart: () => void;
  onNewStory: () => void;
}) {
  const confettiEmojis = ["🎉", "⭐", "✨", "🌟", "💫", "🎊", "🌈", "🎈"];

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#FFE0B2] to-[#FFCC80] flex flex-col items-center justify-center z-50">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              animationDelay: `${(i * 0.15) % 2}s`,
              animationDuration: `${2 + (i % 3)}s`,
              fontSize: "2rem",
            }}
          >
            {confettiEmojis[i % confettiEmojis.length]}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="text-6xl mb-4 animate-sparkle">🎊</div>
      <h2 className="font-playful text-5xl md:text-6xl font-bold text-[#4E342E] animate-celebration-bounce mb-4">
        The End!
      </h2>
      <p className="font-playful text-2xl text-[#6D4C41] mb-8 text-center px-4">
        {title}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onRestart}
          className="px-8 py-4 text-xl font-bold text-[#4E342E] bg-white border-4 border-[#4E342E] rounded-full hover:bg-gray-100 transition-all hover:scale-105"
        >
          📖 Read Again
        </button>
        <button
          onClick={onNewStory}
          className="px-8 py-4 text-xl font-bold text-white bg-[#FF9800] rounded-full hover:bg-[#F57C00] transition-all hover:scale-105"
        >
          ✨ New Story
        </button>
      </div>
    </div>
  );
}

export function PictureBookViewer({ story, onNewStory }: PictureBookViewerProps) {
  // -1 = not started, 0-3 = active panel index
  const [activePanel, setActivePanel] = useState(-1);
  const [playbackState, setPlaybackState] = useState<"idle" | "playing" | "paused" | "complete">("idle");
  const [showCelebration, setShowCelebration] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [preloadStatus, setPreloadStatus] = useState<"pending" | "loading" | "ready">("pending");

  // Use ref for audio cache to avoid re-renders and ensure persistence
  const audioCacheRef = useRef<Map<number, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackStateRef = useRef(playbackState);
  const currentPanelRef = useRef(-1); // Track which panel audio is playing for

  // Keep ref in sync with state
  useEffect(() => {
    playbackStateRef.current = playbackState;
  }, [playbackState]);

  const totalPanels = Math.min(story.pages.length, 4); // Max 4 panels

  // Fetch audio URL for a page (uses cache ref)
  const fetchAudioUrl = useCallback(
    async (text: string, pageIndex: number): Promise<string | null> => {
      // Check cache first
      if (audioCacheRef.current.has(pageIndex)) {
        return audioCacheRef.current.get(pageIndex)!;
      }

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, pageIndex }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.useWebSpeech) return null;

        if (data.audioUrl) {
          audioCacheRef.current.set(pageIndex, data.audioUrl);
          return data.audioUrl;
        }

        return null;
      } catch {
        return null;
      }
    },
    []
  );

  // Preload all audio files on mount (2+2 batching to avoid ElevenLabs 429)
  useEffect(() => {
    const preloadAllAudio = async () => {
      setPreloadStatus("loading");
      console.log("[Audio] Starting preload for", totalPanels, "panels (2+2 batch mode)");

      const pages = story.pages.slice(0, totalPanels);

      const preloadBatch = async (startIndex: number, endIndex: number) => {
        const batchPromises = pages.slice(startIndex, endIndex).map(async (page, i) => {
          const index = startIndex + i;
          try {
            const url = await fetchAudioUrl(page.text, index);
            if (url) {
              const audio = new Audio();
              audio.preload = "auto";
              audio.src = url;
              console.log("[Audio] Preloaded panel", index, ":", url);
            }
            return { index, success: !!url };
          } catch (err) {
            console.error("[Audio] Failed to preload panel", index, err);
            return { index, success: false };
          }
        });
        return Promise.all(batchPromises);
      };

      // Batch 1: panels 0-1
      await Promise.race([
        preloadBatch(0, 2),
        new Promise((resolve) => setTimeout(resolve, CONFIG.PRELOAD_TIMEOUT / 2)),
      ]);

      // Batch 2: panels 2-3
      if (totalPanels > 2) {
        await Promise.race([
          preloadBatch(2, totalPanels),
          new Promise((resolve) => setTimeout(resolve, CONFIG.PRELOAD_TIMEOUT / 2)),
        ]);
      }

      setPreloadStatus("ready");
      console.log("[Audio] Preload complete");
    };

    preloadAllAudio();
  }, [story.pages, totalPanels, fetchAudioUrl]);

  // Play using Web Speech API
  const playWebSpeech = useCallback(
    (text: string, onEnd: () => void) => {
      if (!("speechSynthesis" in window) || audioMuted) {
        // If muted or no speech support, simulate with timeout
        const wordCount = text.split(" ").length;
        const duration = Math.max(2000, wordCount * 300);
        setTimeout(onEnd, duration);
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.volume = audioMuted ? 0 : 1;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female")) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = onEnd;
      utterance.onerror = onEnd;

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [audioMuted]
  );

  // Handle audio end - advance to next panel
  const handleAudioEnd = useCallback(() => {
    if (playbackStateRef.current !== "playing") return;

    if (activePanel < totalPanels - 1) {
      setActivePanel((prev) => prev + 1);
    } else {
      setPlaybackState("complete");
      setShowCelebration(true);
    }
  }, [activePanel, totalPanels]);

  // Play audio for a specific panel (uses preloaded cache)
  const playPanelAudio = useCallback(
    async (panelIndex: number) => {
      // Skip if already playing this panel or invalid index
      if (panelIndex < 0 || panelIndex >= totalPanels) {
        return;
      }

      // Prevent duplicate plays for same panel
      if (currentPanelRef.current === panelIndex) {
        return;
      }

      // Stop any existing audio first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      currentPanelRef.current = panelIndex;

      // If muted, still advance after delay
      if (audioMuted) {
        if (playbackStateRef.current === "playing") {
          const text = story.pages[panelIndex]?.text || "";
          const wordCount = text.split(" ").length;
          const duration = Math.max(2000, wordCount * 300);
          setTimeout(handleAudioEnd, duration);
        }
        return;
      }

      const page = story.pages[panelIndex];

      // Get audio URL from cache (should be preloaded)
      const audioUrl = audioCacheRef.current.get(panelIndex);

      if (audioUrl && audioRef.current) {
        try {
          audioRef.current.src = audioUrl;
          audioRef.current.volume = 1;
          await audioRef.current.play();
        } catch {
          // Fallback to Web Speech if audio play fails
          playWebSpeech(page.text, handleAudioEnd);
        }
      } else {
        // No cached audio, use Web Speech
        playWebSpeech(page.text, handleAudioEnd);
      }
    },
    [totalPanels, audioMuted, story.pages, playWebSpeech, handleAudioEnd]
  );

  // Stop all audio
  const stopAudio = useCallback(() => {
    currentPanelRef.current = -1; // Reset to allow new playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Start playback from beginning or current panel
  const startPlayback = useCallback(() => {
    setShowCelebration(false);
    setPlaybackState("playing");
    if (activePanel < 0) {
      setActivePanel(0);
    }
  }, [activePanel]);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (playbackState === "playing") {
      setPlaybackState("paused");
      stopAudio();
    } else if (playbackState === "paused") {
      setPlaybackState("playing");
    } else if (playbackState === "complete") {
      // Restart from beginning
      setActivePanel(0);
      setShowCelebration(false);
      setPlaybackState("playing");
    } else {
      startPlayback();
    }
  }, [playbackState, stopAudio, startPlayback]);

  // Navigate to previous panel
  const handlePrev = useCallback(() => {
    if (activePanel > 0) {
      stopAudio();
      setActivePanel((prev) => prev - 1);
    }
  }, [activePanel, stopAudio]);

  // Navigate to next panel
  const handleNext = useCallback(() => {
    if (activePanel < totalPanels - 1) {
      stopAudio();
      setActivePanel((prev) => prev + 1);
    }
  }, [activePanel, totalPanels, stopAudio]);

  // Click on a specific panel
  const handlePanelClick = useCallback(
    (panelIndex: number) => {
      stopAudio();
      setActivePanel(panelIndex);
      if (playbackState === "idle") {
        setPlaybackState("playing");
      }
    },
    [stopAudio, playbackState]
  );

  // Restart story
  const handleRestart = useCallback(() => {
    stopAudio();
    setActivePanel(0);
    setPlaybackState("playing");
    setShowCelebration(false);
  }, [stopAudio]);

  // Toggle audio mute
  const toggleMute = useCallback(() => {
    setAudioMuted((prev) => !prev);
    if (audioRef.current) {
      audioRef.current.volume = audioMuted ? 1 : 0;
    }
  }, [audioMuted]);

  // Load voices for Web Speech API
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Play audio when panel changes and in playing state
  useEffect(() => {
    if (playbackState === "playing" && activePanel >= 0 && activePanel < totalPanels) {
      // Reset the ref to allow playing new panel
      currentPanelRef.current = -1;
      // Configurable delay for visual transition before audio starts
      const timer = setTimeout(() => {
        playPanelAudio(activePanel);
      }, CONFIG.PANEL_TRANSITION_DELAY);
      return () => clearTimeout(timer);
    }
  }, [activePanel, playbackState, totalPanels, playPanelAudio]);

  // Handle HTML audio element end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      handleAudioEnd();
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [handleAudioEnd]);

  // Get panel state for styling
  const getPanelState = useCallback(
    (index: number) => {
      if (index === activePanel) return "active";
      if (activePanel >= 0 && index < activePanel) return "completed";
      if (activePanel >= 0 && index > activePanel) return "pending";
      return "idle";
    },
    [activePanel]
  );

  // Memoize pages to display (max 4)
  const pagesToDisplay = useMemo(() => story.pages.slice(0, 4), [story.pages]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF8E1] to-[#FFE0B2] overflow-hidden relative">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm shadow-sm">
        <button
          onClick={onNewStory}
          className="flex items-center gap-2 px-4 py-2 text-[#4E342E] hover:bg-[#FFF8E1] rounded-full transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="font-playful text-xl md:text-2xl font-bold text-[#4E342E] truncate max-w-[50%]">
          {story.title}
        </h1>

        <button
          onClick={toggleMute}
          className={`p-2 rounded-full transition-colors ${
            audioMuted ? "bg-gray-300 text-gray-600" : "bg-[#FF9800] text-white hover:bg-[#F57C00]"
          }`}
          title={audioMuted ? "Unmute" : "Mute"}
        >
          {audioMuted ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 2x2 Grid of Story Panels */}
      <div className="flex-1 grid grid-cols-2 gap-3 p-3 min-h-0 overflow-hidden">
        {pagesToDisplay.map((page, index) => {
          const state = getPanelState(index);
          return (
            <div
              key={page.id}
              onClick={() => handlePanelClick(index)}
              className={`
                story-panel flex flex-col overflow-hidden cursor-pointer
                ${state === "active" ? "story-panel--active animate-panel-glow" : ""}
                ${state === "pending" ? "story-panel--dimmed" : ""}
                ${state === "completed" ? "story-panel--completed" : ""}
              `}
            >
              {/* Panel Number Badge */}
              <div
                className={`
                  absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center
                  font-bold text-lg z-10 transition-colors
                  ${state === "active" ? "bg-[#FF9800] text-white" : ""}
                  ${state === "completed" ? "bg-[#66BB6A] text-white" : ""}
                  ${state === "pending" || state === "idle" ? "bg-gray-300 text-gray-600" : ""}
                `}
              >
                {index + 1}
              </div>

              {/* Image */}
              <div className="flex-1 min-h-0 relative overflow-hidden">
                <img
                  src={page.imageUrl}
                  alt={`Story panel ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Playing indicator */}
                {state === "active" && playbackState === "playing" && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-white rounded-full animate-bounce"
                        style={{
                          height: `${12 + i * 4}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-shrink-0 p-2 md:p-3 bg-white">
                <p className="font-playful text-sm md:text-base lg:text-lg text-[#4E342E] text-center leading-snug line-clamp-3">
                  {page.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Playback Controls */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 md:gap-6 px-4 py-3 bg-white/90 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={activePanel <= 0}
          className="story-control-btn"
          title="Previous"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayback}
          disabled={preloadStatus === "loading"}
          className={`story-play-btn ${preloadStatus === "loading" ? "opacity-70" : ""}`}
          title={preloadStatus === "loading" ? "Loading audio..." : playbackState === "playing" ? "Pause" : "Play"}
        >
          {preloadStatus === "loading" ? (
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : playbackState === "playing" ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={activePanel >= totalPanels - 1}
          className="story-control-btn"
          title="Next"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-300 mx-2" />

        {/* Progress Dots */}
        <div className="flex gap-2">
          {pagesToDisplay.map((_, i) => {
            const state = getPanelState(i);
            return (
              <button
                key={i}
                onClick={() => handlePanelClick(i)}
                className={`
                  progress-dot
                  ${state === "active" ? "progress-dot--active" : ""}
                  ${state === "completed" ? "progress-dot--completed" : ""}
                  ${state === "pending" || state === "idle" ? "progress-dot--pending" : ""}
                `}
                title={`Go to panel ${i + 1}`}
              />
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-300 mx-2" />

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          className="story-control-btn"
          title="Restart"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <CelebrationOverlay
          title={story.title}
          onRestart={handleRestart}
          onNewStory={onNewStory}
        />
      )}
    </div>
  );
}
