"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

// Shared train-carousel engine for the ticker strips.
// One slide at a time. Motion runs on the Web Animations API (element.
// animate) with per-slide computed offsets — no CSS keyframe parsing, no
// fill-mode cascade, identical on dev and production. JS advances the index
// when the full ride (enter + DB hold + exit) completes.
// Props:
// - slides: [{ text, ms }] (text may be plain or HTML, sanitized on render)
// - dark: black strip (notification bar) vs white strip (running bar)
// - arrows: show prev/next buttons (default true)
// - flankLeft / flankRight: static nodes pinned at the strip edges
const ENTER_MS = 850;
const EXIT_MS = 850;
const ENTER_EASE = "cubic-bezier(0.16, 0.8, 0.24, 1)";
const EXIT_EASE = "cubic-bezier(0.55, 0.06, 0.75, 0.4)";

export const TRAIN_DEFAULT_MS = 4000;

export default function TrainTicker({ slides, dark = true, arrows = true, flankLeft = null, flankRight = null }) {
  const list = useMemo(
    () => (Array.isArray(slides) && slides.length > 0 ? slides : []),
    [slides]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fromLeft, setFromLeft] = useState(false);
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const timerRef = useRef(null);
  const pendingRef = useRef(null);
  const animRef = useRef(null);

  const holdMs = list[currentIndex]?.ms || TRAIN_DEFAULT_MS;
  const rideMs = holdMs + ENTER_MS + EXIT_MS;

  // The ride: fast entry from the correct side, eased center stop, exact DB
  // hold, slow-start exit left. Fresh animation object per slide.
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const el = textRef.current;
    if (!vp || !el || list.length === 0) return undefined;
    if (typeof el.animate !== "function") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const travel = vp.clientWidth / 2 + el.offsetWidth / 2 + 24;
    const dir = fromLeft ? -1 : 1;
    const total = (list[currentIndex]?.ms || TRAIN_DEFAULT_MS) + ENTER_MS + EXIT_MS;
    const anim = el.animate(
      [
        { opacity: "0", transform: `translateX(${dir * travel}px)`, easing: ENTER_EASE, offset: 0 },
        { opacity: "1", transform: "translateX(0px)", offset: ENTER_MS / total },
        { opacity: "1", transform: "translateX(0px)", easing: EXIT_EASE, offset: (ENTER_MS + (list[currentIndex]?.ms || TRAIN_DEFAULT_MS)) / total },
        { opacity: "0", transform: `translateX(${-travel}px)`, offset: 1 },
      ],
      { duration: total, fill: "both" }
    );
    animRef.current = anim;
    return () => {
      animRef.current = null;
      try {
        anim.cancel();
      } catch {
        /* already finished */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, list]);

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

  // Hover pause: freeze the ride mid-flight + suspend the index timer,
  // resume both with remaining time so configured seconds stay exact.
  const handleEnter = () => {
    try {
      animRef.current?.pause();
    } catch {
      /* no active ride */
    }
    const p = pendingRef.current;
    if (p) {
      clearTimeout(timerRef.current);
      p.remaining = Math.max(0, p.deadline - Date.now());
    }
  };

  const handleLeave = () => {
    try {
      animRef.current?.play();
    } catch {
      /* no active ride */
    }
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
  const skin = dark
    ? "bg-neutral-950 text-white"
    : "border-y border-neutral-200 bg-white text-neutral-900";
  const arrowCls = dark ? "text-white" : "text-neutral-900";

  const textNode = html ? (
    <span
      key={currentIndex}
      ref={textRef}
      className="rb-anim whitespace-nowrap text-xs font-medium uppercase tracking-widest"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span
      key={currentIndex}
      ref={textRef}
      className="rb-anim whitespace-nowrap text-xs font-medium uppercase tracking-widest"
    >
      {raw}
    </span>
  );

  return (
    <div
      className={`flex items-center justify-between overflow-hidden px-3 py-1.5 ${skin}`}
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
    </div>
  );
}
