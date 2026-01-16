"use client";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#FFF8E1] to-[#FFE0B2]">
      {/* Mascot */}
      <div className="animate-bounce-slow mb-8">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-[#FF9800] flex items-center justify-center shadow-lg">
          <span className="text-6xl md:text-8xl">🎨</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-[#4E342E] mb-4 text-center animate-fade-in">
        ClayQuest
      </h1>

      {/* Subtitle */}
      <p className="text-xl md:text-2xl text-[#6D4C41] mb-12 text-center max-w-md animate-fade-in">
        Turn your clay creations into magical stories!
      </p>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="
          px-12 py-6
          text-2xl md:text-3xl font-bold text-white
          bg-[#FF9800] hover:bg-[#F57C00]
          rounded-full
          shadow-lg hover:shadow-xl
          transform hover:scale-105
          transition-all duration-200
          animate-pulse-glow
          min-w-[280px]
        "
      >
        Start Adventure!
      </button>

      {/* Instructions hint */}
      <p className="mt-8 text-[#8D6E63] text-center">
        Get your clay creation ready!
      </p>
    </div>
  );
}
