"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

// Shared train-carousel engine for the two ticker strips.
// One slide at a time: rolls in from the right edge (fast start, eases to a
// stop at center) -> holds slides[i].ms -> rolls out the left edge (slow
// start, speeds up). Props:
// - slides: [{ text, ms }] (text may be plain or HTML, sanitized on render)
// - dark: black strip (notification bar) vs white strip (running bar)
// - arrows: show prev/next buttons (default true)
// - flankLeft / flankRight: static nodes pinned at the strip edges
const ENTER_MS = 850;
const EXIT_MS = 850;

export const TRAIN_DEFAULT_MS = 4000;

export default function TrainTicker({ slides, dark = true, arrows = true, flankLeft = null, flankRight = null }) {
  const list = Array.isArray(slides) && slides.length > 0 ? slides : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [entry, setEntry] = useState("right");
  const [phase, setPhase] = useState("enter");
  const [isPaused, setIsPaused] = useState(false);
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const timerRef = useRef(null);
  const pendingRef = useRef(null);

  // Travel distance: viewport half + text half, so text starts/ends fully
  // outside the strip edges. Measured pre-paint per slide.
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const el = textRef.current;
    if (!vp || !el) return;
    const travel = vp.clientWidth / 2 + el.offsetWidth / 2 + 24;
    vp.style.setProperty("--rb-travel", `${travel}px`);
  }, [currentIndex, list]);

  const arm = (ms, run) => {
    clearTimeout(timerRef.current);
    pendingRef.current = { run, deadline: Date.now() + ms, remaining: null };
    timerRef.current = setTimeout(() => {
      pendingRef.current = null;
      run();
    }, ms);
  };

  // Motion chain per slide: enter -> hold (slide ms) -> exit -> next.
  useEffect(() => {
    if (list.length === 0) return undefined;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const enterMs = reduce ? 0 : ENTER_MS;
    const exitMs = reduce ? 0 : EXIT_MS;
    const holdMs = list[currentIndex]?.ms || TRAIN_DEFAULT_MS;
    setPhase("enter");
    arm(enterMs, () => {
      setPhase("hold");
      arm(holdMs, () => {
        setPhase("exit");
        arm(exitMs, () => {
          setEntry("right");
          setCurrentIndex((prev) => (prev + 1) % list.length);
        });
      });
    });
    return () => {
      clearTimeout(timerRef.current);
      pendingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, list, entry]);

  // Hover pause: freeze CSS mid-flight + suspend the pending step, resume
  // with remaining time so configured seconds stay exact.
  const handleEnter = () => {
    setIsPaused(true);
    const p = pendingRef.current;
    if (p) {
      clearTimeout(timerRef.current);
      p.remaining = Math.max(0, p.deadline - Date.now());
    }
  };

  const handleLeave = () => {
    setIsPaused(false);
    const p = pendingRef.current;
    if (p && p.remaining != null) {
      const { run, remaining } = p;
      pendingRef.current = { run, deadline: Date.now() + remaining, remaining: null };
      timerRef.current = setTimeout(() => {
        pendingRef.current = null;
        run();
      }, remaining);
    }
  };

  const showPrev = () => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
    setEntry("left");
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const showNext = () => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
    setEntry("right");
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  if (list.length === 0) return null;
  // itemsdata may be plain text or HTML — HTML is sanitized before render.
  const raw = list[currentIndex]?.text || "";
  const html = /<[a-z][\s\S]*>/i.test(raw) ? sanitizeHtml(raw) : null;
  const animCls =
    phase === "enter"
      ? entry === "left"
        ? "rb-in-left"
        : "rb-in-right"
      : phase === "exit"
        ? "rb-out-left"
        : "";
  const skin = dark
    ? "bg-neutral-950 text-white"
    : "border-y border-neutral-200 bg-white text-neutral-900";
  const arrowCls = dark ? "text-white" : "text-neutral-900";

  const textNode = html ? (
    <span
      key={currentIndex}
      ref={textRef}
      className={`rb-anim whitespace-nowrap text-xs font-medium uppercase tracking-widest ${animCls}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span key={currentIndex} ref={textRef} className={`rb-anim whitespace-nowrap text-xs font-medium uppercase tracking-widest ${animCls}`}>
      {raw}
    </span>
  );

  return (
    <div
      className={`flex items-center justify-between overflow-hidden px-3 py-1.5 ${skin}${
        isPaused ? " rb-paused" : ""
      }`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {flankLeft}
      {arrows && (
        <button type="button" onClick={showPrev} aria-label="Previous announcement" className={`px-2 ${arrowCls}`}>
          &#10094;
        </button>
      )}
      <div ref={viewportRef} className="flex-1 overflow-hidden text-center">
        {textNode}
      </div>
      {arrows && (
        <button type="button" onClick={showNext} aria-label="Next announcement" className={`px-2 ${arrowCls}`}>
          &#10095;
        </button>
      )}
      {flankRight}
      <style jsx>{`
        .rb-anim { display: inline-block; will-change: transform; }
        .rb-in-right { animation: rb-in-right 0.85s cubic-bezier(0.16, 0.8, 0.24, 1) both; }
        .rb-in-left { animation: rb-in-left 0.85s cubic-bezier(0.16, 0.8, 0.24, 1) both; }
        .rb-out-left { animation: rb-out-left 0.85s cubic-bezier(0.55, 0.06, 0.75, 0.4) both; }
        .rb-paused .rb-anim { animation-play-state: paused; }
        @keyframes rb-in-right {
          from { opacity: 0; transform: translateX(var(--rb-travel, 60vw)); }
          55% { opacity: 1; }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes rb-in-left {
          from { opacity: 0; transform: translateX(calc(var(--rb-travel, 60vw) * -1)); }
          55% { opacity: 1; }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes rb-out-left {
          from { opacity: 1; transform: translateX(0); }
          45% { opacity: 1; }
          to { opacity: 0; transform: translateX(calc(var(--rb-travel, 60vw) * -1)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rb-in-right, .rb-in-left, .rb-out-left { animation: none; }
        }
      `}</style>
    </div>
  );
}
