"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

interface LoadingScreenProps {
    onComplete?: () => void;
    minDisplayTime?: number;
}

// Three amazing Aeon characters - URL encoded for safety
const AEON_CHARACTERS = [
    {
        src: "/00_AEON_PREMIUM_replicate-prediction-k1d8hqg6hxrma0crw17tztz9k8.png",
        alt: "Aeon Premium Character",
    },
    {
        src: "/Untitled%20design%20(1).png",
        alt: "Aeon Design Character",
    },
    {
        src: "/ChatGPT%20Image%20Dec%2027,%202025,%2003_46_26%20PM.png",
        alt: "Aeon AI Character",
    },
];

// Shuffle function to randomize array
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Random position generator for dynamic character placement
function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * 60) - 30, // -30 to 30 pixels offset
        y: Math.floor(Math.random() * 40) - 20, // -20 to 20 pixels offset
        rotation: Math.floor(Math.random() * 20) - 10, // -10 to 10 degrees
        scale: 0.85 + Math.random() * 0.3, // 0.85 to 1.15 scale
    };
}

export function LoadingScreen({ onComplete, minDisplayTime = 2500 }: LoadingScreenProps) {
    const [visibleCharacters, setVisibleCharacters] = useState<number[]>([]);
    const [isExiting, setIsExiting] = useState(false);

    // Randomize character order and positions on each mount
    const randomizedCharacters = useMemo(() => {
        return shuffleArray(AEON_CHARACTERS).map((char, idx) => ({
            ...char,
            delay: idx * 400, // Staggered delays based on new order
            position: getRandomPosition(),
        }));
    }, []);

    useEffect(() => {
        // Pop in each character one by one
        randomizedCharacters.forEach((char, index) => {
            setTimeout(() => {
                setVisibleCharacters((prev) => [...prev, index]);
            }, char.delay);
        });

        // Start exit animation after all characters shown
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, minDisplayTime);

        // Complete after exit animation
        const completeTimer = setTimeout(() => {
            onComplete?.();
        }, minDisplayTime + 600);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [minDisplayTime, onComplete, randomizedCharacters]);

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-500 ${isExiting ? "opacity-0 scale-110" : "opacity-100 scale-100"
                }`}
        >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main logo at top */}
            <div className="mb-8 animate-pulse">
                <Image
                    src="/aeon-badge-logo-hexagon.png"
                    alt="Aeon Protocol"
                    width={120}
                    height={120}
                    className="drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]"
                    priority
                />
            </div>

            {/* Character showcase - 3 characters popping up in random positions */}
            <div className="relative flex items-center justify-center w-full max-w-2xl h-64 px-4">
                {randomizedCharacters.map((char, index) => (
                    <div
                        key={char.src}
                        className={`absolute transition-all duration-700 ease-out ${visibleCharacters.includes(index)
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-50"
                            }`}
                        style={{
                            transform: visibleCharacters.includes(index)
                                ? `translateX(${(index - 1) * 180 + char.position.x}px) translateY(${char.position.y}px) rotate(${char.position.rotation}deg) scale(${char.position.scale})`
                                : `translateX(${(index - 1) * 180}px) translateY(50px) scale(0.5)`,
                            transitionDelay: `${index * 100}ms`,
                        }}
                    >
                        {/* Glow effect behind character */}
                        <div
                            className={`absolute inset-0 bg-gradient-radial from-amber-500/30 via-amber-500/10 to-transparent blur-2xl rounded-full transition-opacity duration-500 ${visibleCharacters.includes(index) ? "opacity-100" : "opacity-0"
                                }`}
                            style={{ width: "150%", height: "150%", left: "-25%", top: "-25%" }}
                        />

                        {/* Character image */}
                        <Image
                            src={char.src}
                            alt={char.alt}
                            width={200}
                            height={280}
                            className="relative z-10 w-32 md:w-44 lg:w-52 h-auto object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]"
                            priority
                            unoptimized
                        />

                        {/* Pop effect ring */}
                        <div
                            className={`absolute inset-0 rounded-full border-2 border-amber-500/60 transition-all duration-1000 ${visibleCharacters.includes(index)
                                    ? "scale-[2] opacity-0"
                                    : "scale-100 opacity-0"
                                }`}
                        />
                    </div>
                ))}
            </div>

            {/* Loading text with animated dots */}
            <div className="mt-16 flex items-center gap-2">
                <span className="text-amber-500/80 text-lg font-medium tracking-wider">
                    INITIALIZING AEON PROTOCOL
                </span>
                <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                </span>
            </div>

            {/* Progress bar */}
            <div className="mt-6 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-[2000ms] ease-out"
                    style={{
                        width: visibleCharacters.length === 3 ? "100%" : `${(visibleCharacters.length / 3) * 70}%`,
                    }}
                />
            </div>

            {/* Tagline */}
            <p className="mt-4 text-gray-500 text-sm tracking-widest">
                THE FUTURE OF AI-POWERED DEVELOPMENT
            </p>
        </div>
    );
}
