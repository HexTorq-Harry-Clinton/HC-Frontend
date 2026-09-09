"use client";

import { useEffect, useRef, useState } from "react";

// Announcement ticker: same structure/texts as the previous UI —
// rotating sentences with prev/next arrows, pause on hover.
const DEFAULT_SENTENCES = [
  "Closet under Construction!",
  "Fashion Hub coming soon",
  "New collection loading",
];

export default function RunningBar() {
  const sentences = DEFAULT_SENTENCES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isPaused && sentences.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % sentences.length);
      }, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, sentences.length]);

  const showPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + sentences.length) % sentences.length);
  };

  const showNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sentences.length);
  };

  return (
    <div
      className="flex items-center justify-between bg-neutral-950 px-3 py-1.5 text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <button type="button" onClick={showPrev} aria-label="Previous announcement" className="px-2">
        &#10094;
      </button>
      <div className="flex-1 text-center">
        <span key={currentIndex} className="fly-centered text-xs font-medium uppercase tracking-widest">
          {sentences[currentIndex]}
        </span>
      </div>
      <button type="button" onClick={showNext} aria-label="Next announcement" className="px-2">
        &#10095;
      </button>
      <style jsx>{`
        .fly-centered { display: inline-block; animation: fly-in 0.5s ease; }
        @keyframes fly-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
