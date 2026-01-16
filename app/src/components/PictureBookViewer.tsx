"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Story } from "@/types";

interface PictureBookViewerProps {
  story: Story;
  onNewStory: () => void;
}

export function PictureBookViewer({ story, onNewStory }: PictureBookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showText, setShowText] = useState(true);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioCache, setAudioCache] = useState<Map<number, string>>(new Map());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const totalPages = story.pages.length;
  const isLastPage = currentPage === totalPages - 1;
  const page = story.pages[currentPage];

  // Fetch audio from ElevenLabs or fallback to Web Speech
  const fetchAudio = useCallback(async (text: string, pageIndex: number): Promise<string | null> => {
    // Check cache first
    if (audioCache.has(pageIndex)) {
      console.log("[Client] Using cached audio for page", pageIndex);
      return audioCache.get(pageIndex)!;
    }

    try {
      console.log("[Client] Fetching audio for page", pageIndex);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, pageIndex }),
      });

      console.log("[Client] TTS response status:", response.status);

      if (!response.ok) {
        console.log("[Client] TTS response not ok, using Web Speech");
        return null;
      }

      const data = await response.json();

      // Check if server says to use Web Speech
      if (data.useWebSpeech) {
        console.log("[Client] Server says use Web Speech");
        return null;
      }

      // Got audio URL from server
      if (data.audioUrl) {
        console.log("[Client] Got audio URL:", data.audioUrl);
        // Cache the audio URL
        setAudioCache((prev) => new Map(prev).set(pageIndex, data.audioUrl));
        return data.audioUrl;
      }

      return null;
    } catch (error) {
      console.error("[Client] Audio fetch error:", error);
      return null;
    }
  }, [audioCache]);

  // Play using Web Speech API
  const playWebSpeech = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Web Speech API not supported");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for children
    utterance.pitch = 1.1; // Slightly higher pitch
    utterance.volume = 1;

    // Try to find a nice English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Female")
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Main play function
  const playAudio = useCallback(async () => {
    if (isLoadingAudio) return;

    setIsLoadingAudio(true);

    try {
      console.log("[Client] Playing audio for page", currentPage);
      const audioUrl = await fetchAudio(page.text, currentPage);

      if (audioUrl && audioRef.current) {
        console.log("[Client] Playing ElevenLabs audio");
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        // Fallback to Web Speech
        console.log("[Client] Falling back to Web Speech");
        playWebSpeech(page.text);
      }
    } catch (error) {
      console.error("[Client] Play error:", error);
      // Fallback to Web Speech
      playWebSpeech(page.text);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [currentPage, page.text, fetchAudio, playWebSpeech, isLoadingAudio]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const toggleAudio = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }, [isPlaying, playAudio, pauseAudio]);

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      pauseAudio();
      setCurrentPage(pageIndex);
    }
  }, [totalPages, pauseAudio]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const restartStory = useCallback(() => {
    goToPage(0);
  }, [goToPage]);

  // Load voices for Web Speech API
  useEffect(() => {
    if ("speechSynthesis" in window) {
      // Voices may load asynchronously
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Auto-play audio when page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      playAudio();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // No cleanup needed - audio URLs are now server paths, not blob URLs

  // Handle swipe gestures
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextPage();
      } else {
        prevPage();
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-[#FFF8E1] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-[#4E342E] truncate">{story.title}</h1>
        <button
          onClick={toggleAudio}
          disabled={isLoadingAudio}
          className={`p-2 rounded-full text-white transition-colors ${
            isLoadingAudio
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#FF9800] hover:bg-[#F57C00]"
          }`}
        >
          {isLoadingAudio ? (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        {/* Illustration */}
        <div className="flex-1 relative min-h-0">
          <img
            src={page.imageUrl}
            alt={`Story page ${currentPage + 1}`}
            className="w-full h-full object-contain bg-white animate-fade-in"
            key={currentPage}
          />

          {/* Navigation arrows */}
          {currentPage > 0 && (
            <button
              onClick={prevPage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {currentPage < totalPages - 1 && (
            <button
              onClick={nextPage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Text area */}
        {showText && (
          <div className="flex-shrink-0 bg-white p-3 shadow-lg animate-slide-up max-h-[20vh] overflow-y-auto">
            <p className="text-base md:text-lg text-[#4E342E] text-center leading-relaxed">
              {page.text}
            </p>
          </div>
        )}

        {/* Toggle text button */}
        <button
          onClick={() => setShowText(!showText)}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* Page indicators */}
      <div className="flex-shrink-0 flex justify-center gap-2 py-2 bg-white/80">
        {story.pages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToPage(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentPage
                ? "bg-[#FF9800] scale-125"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Last page actions */}
      {isLastPage && (
        <div className="flex-shrink-0 p-3 bg-gradient-to-t from-[#FFE0B2] to-transparent animate-fade-in">
          <div className="text-center mb-4">
            <span className="text-4xl">🎉</span>
            <h2 className="text-2xl font-bold text-[#4E342E]">The End!</h2>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={restartStory}
              className="px-6 py-3 text-lg font-bold text-[#4E342E] bg-white border-2 border-[#4E342E] rounded-full hover:bg-gray-100 transition-colors"
            >
              Read Again
            </button>
            <button
              onClick={onNewStory}
              className="px-6 py-3 text-lg font-bold text-white bg-[#FF9800] rounded-full hover:bg-[#F57C00] transition-colors"
            >
              New Story
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
