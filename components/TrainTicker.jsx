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
  const rideMs = holdMs;

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
    const total = list[currentIndex]?.ms || TRAIN_DEFAULT_MS;
    const enterMs = total * 0.2;
    const exitStartMs = total * 0.8;
    const anim = el.animate(
      [
        { opacity: "0", transform: `translateX(${dir * travel}px)`, easing: ENTER_EASE, offset: 0 },
        { opacity: "1", transform: "translateX(0px)", offset: enterMs / total },
        { opacity: "1", transform: "translateX(0px)", easing: EXIT_EASE, offset: exitStartMs / total },
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
    ? "bg-[#080003] text-white"
    : "border-y border-neutral-200 bg-white text-neutral-900";
  const btnCls = dark
    ? "ticker-nav-btn text-white/70 hover:text-[#c6a15b] hover:bg-white/10"
    : "ticker-nav-btn text-neutral-600 hover:text-[#c6a15b] hover:bg-black/5";

  const textNode = html ? (
    <span
      key={currentIndex}
      ref={textRef}
      className="rb-anim whitespace-nowrap text-[12px] md:text-[14px] font-normal leading-[20px] tracking-[0.3px]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span
      key={currentIndex}
      ref={textRef}
      className="rb-anim whitespace-nowrap text-[12px] md:text-[14px] font-normal leading-[20px] tracking-[0.3px]"
    >
      {raw}
    </span>
  );

  return (
    <div
      className={`hc-bar-font relative flex h-[25px] md:h-[20px] items-center justify-center overflow-hidden px-8 select-none ${skin}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {flankLeft}
      {arrows && (
        <button
          type="button"
          onClick={showPrev}
          aria-label="Previous announcement"
          className={`${btnCls} ticker-prev`}
        >
          <svg className="ticker-arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      <div ref={viewportRef} className="w-full max-w-4xl overflow-hidden text-center px-4">
        {textNode}
      </div>
      {arrows && (
        <button
          type="button"
          onClick={showNext}
          aria-label="Next announcement"
          className={`${btnCls} ticker-next`}
        >
          <svg className="ticker-arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
      {flankRight}
      <style jsx>{`
        .ticker-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 38px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          margin: 0;
          color: #fff !important;
          opacity: 1 !important;
          visibility: visible !important;
          background: rgba(255, 255, 255, 0.12) !important;
          background-color: rgba(255, 255, 255, 0.12) !important;
          border: none !important;
          border-radius: 50% !important;
          outline: none !important;
          box-shadow: none !important;
          cursor: pointer;
          transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
        }
        .ticker-nav-btn:hover {
          color: #c6a15b !important;
          background: rgba(198, 161, 91, 0.18) !important;
          background-color: rgba(198, 161, 91, 0.18) !important;
        }
        .ticker-prev {
          left: 10px;
        }
        .ticker-next {
          right: 10px;
        }
        @media (max-width: 768px) {
          .ticker-nav-btn {
            width: 30px;
            height: 22px;
            padding: 4px 8px;
          }
          .ticker-arrow-icon {
            width: 14px;
            height: 14px;
          }
          .ticker-prev {
            left: 8px;
          }
          .ticker-next {
            right: 8px;
          }
        }
      `}</style>
    </div>
  );
}
