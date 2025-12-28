"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const buildMessages = [
  "AEON cores initializing...",
  "Analyzing your requirements...",
  "Designing component architecture...",
  "Generating React components...",
  "Styling with precision...",
  "Optimizing for performance...",
  "Adding responsive layouts...",
  "Polishing the UI...",
  "Running final checks...",
  "Almost there...",
];

// Three epic Aeon characters that pop up
const AEON_CHARACTERS = [
  "/tmpppouz1gf.png",
  "/replicate-prediction-fqr656zbedrmc0crw11t1aeyxr.png",
  "/replicate-prediction-4szx28y00nrga0ctazcvwkcv5r.png",
];

// Shuffle array for random order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface BuildLoaderProps {
  className?: string;
}

export function BuildLoader({ className }: BuildLoaderProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [visibleChars, setVisibleChars] = React.useState<number[]>([]);

  // Randomize character order on mount
  const randomizedChars = React.useMemo(() => shuffleArray(AEON_CHARACTERS), []);

  // Random positions for each character
  const charPositions = React.useMemo(() =>
    randomizedChars.map(() => ({
      x: Math.floor(Math.random() * 100) - 50,
      y: Math.floor(Math.random() * 40) - 20,
      rotation: Math.floor(Math.random() * 30) - 15,
      scale: 0.8 + Math.random() * 0.4,
    })), [randomizedChars]);

  // Cycle through messages
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % buildMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Pop in characters one by one
  React.useEffect(() => {
    randomizedChars.forEach((_, index) => {
      setTimeout(() => {
        setVisibleChars((prev) => [...prev, index]);
      }, 800 + index * 600);
    });
  }, [randomizedChars]);

  // Animate progress (fake but feels good)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full bg-gradient-to-br from-background via-background to-primary/5 p-8",
        className
      )}
    >
      {/* Three Aeon characters popping up in random positions */}
      <div className="relative flex items-center justify-center gap-2 mb-4 h-48 w-full max-w-xl">
        {randomizedChars.map((src, index) => (
          <div
            key={src}
            className={`relative transition-all duration-700 ease-out ${visibleChars.includes(index)
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50 translate-y-12"
              }`}
            style={{
              transform: visibleChars.includes(index)
                ? `translateX(${charPositions[index].x}px) translateY(${charPositions[index].y}px) rotate(${charPositions[index].rotation}deg) scale(${charPositions[index].scale})`
                : undefined,
              transitionDelay: `${index * 100}ms`,
            }}
          >
            {/* Glow behind character */}
            <div className={`absolute inset-0 blur-2xl bg-amber-500/30 rounded-full transition-opacity duration-500 ${visibleChars.includes(index) ? "opacity-100" : "opacity-0"
              }`} style={{ width: "120%", height: "120%", left: "-10%", top: "-10%" }} />

            <Image
              src={src}
              alt="AEON Character"
              width={140}
              height={180}
              className="relative z-10 w-24 md:w-32 lg:w-36 h-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
              priority
              unoptimized
            />
          </div>
        ))}
      </div>

      {/* Animated rings */}
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
        <div className="absolute inset-4 border-2 border-primary/30 rounded-full animate-spin-slow" />
        <div className="absolute inset-8 border-2 border-primary/40 rounded-full animate-reverse-spin" />
        <div className="absolute inset-12 border-2 border-primary/50 rounded-full animate-spin-slow" />

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary animate-pulse">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </div>

      {/* Status message */}
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-gradient">
          Building Your App
        </h2>
        <p className="text-muted-foreground text-lg transition-all duration-500">
          {buildMessages[messageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-muted rounded-full mt-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full transition-all duration-500 ease-out animate-gradient-x"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Bottom text */}
      <p className="absolute bottom-8 text-xs text-muted-foreground/50">
        This usually takes 20-40 seconds
      </p>
    </div>
  );
}
