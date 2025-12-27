"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const buildMessages = [
  "Initializing AI cores...",
  "Analyzing your requirements...",
  "Designing component architecture...",
  "Generating React components...",
  "Styling with Tailwind CSS...",
  "Optimizing for performance...",
  "Adding responsive layouts...",
  "Polishing the UI...",
  "Running final checks...",
  "Almost there...",
];

const logos = [
  "/aeon_fox.png",
  "/aeon-fox-robot-badgeark.png",
  "/aeon-badge-variant-11.jpg",
];

interface BuildLoaderProps {
  className?: string;
}

export function BuildLoader({ className }: BuildLoaderProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [logoIndex, setLogoIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  // Cycle through messages
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % buildMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through logos
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLogoIndex((prev) => (prev + 1) % logos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Logo with glow effect */}
      <div className="relative mb-8">
        <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150 animate-pulse" />
        <div className="relative w-32 h-32 animate-float">
          <Image
            src={logos[logoIndex]}
            alt="AEON"
            fill
            className="object-contain rounded-2xl transition-all duration-1000 ease-in-out"
            priority
          />
        </div>
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
        Powered by v0 • This usually takes 20-40 seconds
      </p>
    </div>
  );
}
