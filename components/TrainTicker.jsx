"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

// Shared train-carousel engine for the ticker strips.
// One slide at a time, driven by ONE keyframe track per slide (no JS phase
// machine, so there is nothing to stall; no animation pair, so there is no
// fill-mode cascade burying the entry): the full ride — fast entry, center
// hold, slow-start exit — is baked into a single `rb-ride` animation whose
// percentage stops are computed from the slide's own DB seconds. JS only
// advances the index when the full ride completes.
// Props:
// - slides: [{ text, ms }] (text may be plain or HTML, sanitized on render)
// - dark: black strip (notification bar) vs white strip (running bar)
// - arrows: show prev/next buttons (default true)
// - flankLeft / flankRight: static nodes pinned at the strip edges
const ENTER_MS = 850;
const EXIT_MS = 850;

export const TRAIN_DEFAULT_MS = 4000;

export default function TrainTicker({ slides, dark = true, arrows = true, flankLeft = null, flankRight = null }) {
  const list = useMemo(
    () => (Array.isArray(slides) && slides.length > 0 ? slides : []),
    [slides]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fromLeft, setFromLeft] = useState(false);
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

  const rideMs = (list[currentIndex]?.ms || TRAIN_DEFAULT_MS) + ENTER_MS + EXIT_MS;

  // Single timer per slide: when the full ride ends, roll the next item in.
  useEffect(() => {
    if (list.length === 0) return undefined;
    clearTimeout(timerRef.current);
    pendingRef.current = { deadline: Date.now() + rideMs };
    timerRef.current = setTimeout(() => {
      pendingRef.current = null;
      setFromLeft(false);
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, rideMs);
    return () => {
      clearTimeout(timerRef.current);
      pendingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, list]);

  // Hover pause: freeze CSS mid-flight + suspend the ride timer, resume with
  // remaining time so configured seconds stay exact.
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
      const remaining = p.remaining;
      pendingRef.current = { deadline: Date.now() + remaining, remaining: null };
      timerRef.current = setTimeout(() => {
        pendingRef.current = null;
        setFromLeft(false);
        setCurrentIndex((prev) => (prev + 1) % list.length);
      }, remaining);
    }
  };

  const showPrev = () => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
    setFromLeft(true);
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const showNext = () => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
    setFromLeft(false);
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  if (list.length === 0) return null;
  // itemsdata may be plain text or HTML — HTML is sanitized before render.
  const raw = list[currentIndex]?.text || "";
  const html = /<[a-z][\s\S]*>/i.test(raw) ? sanitizeHtml(raw) : null;
  const holdMs = list[currentIndex]?.ms || TRAIN_DEFAULT_MS;
  // Whole-ride stops: enter 0→ENTER_MS, hold until ENTER+hold, exit to total.
  const totalMs = holdMs + ENTER_MS + EXIT_MS;
  const enterPct = (ENTER_MS / totalMs) * 100;
  const exitPct = ((ENTER_MS + holdMs) / totalMs) * 100;
  const textStyle = {
    "--rb-dir": fromLeft ? -1 : 1,
    animationDuration: `${totalMs}ms`,
  };
  const skin = dark
    ? "bg-neutral-950 text-white"
    : "border-y border-neutral-200 bg-white text-neutral-900";
  const arrowCls = dark ? "text-white" : "text-neutral-900";

  const textNode = html ? (
    <span
      key={currentIndex}
      ref={textRef}
      className="rb-anim whitespace-nowrap text-xs font-medium uppercase tracking-widest"
      style={textStyle}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span
      key={currentIndex}
      ref={textRef}
      className="rb-anim whitespace-nowrap text-xs font-medium uppercase tracking-widest"
      style={textStyle}
    >
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
        .rb-anim { display: inline-block; will-change: transform; animation-name: rb-ride; animation-timing-function: linear; animation-fill-mode: both; }
        .rb-paused .rb-anim { animation-play-state: paused; }
        @keyframes rb-ride {
          0% {
            opacity: 0;
            transform: translateX(calc(var(--rb-dir, 1) * var(--rb-travel, 60vw)));
            animation-timing-function: cubic-bezier(0.16, 0.8, 0.24, 1);
          }
          ${enterPct}% { opacity: 1; transform: translateX(0); }
          ${exitPct}% {
            opacity: 1;
            transform: translateX(0);
            animation-timing-function: cubic-bezier(0.55, 0.06, 0.75, 0.4);
          }
          100% { opacity: 0; transform: translateX(calc(var(--rb-travel, 60vw) * -1)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rb-anim { animation: none; }
        }
      `}</style>
    </div>
  );
}
