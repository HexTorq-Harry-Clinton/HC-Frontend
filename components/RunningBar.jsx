"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";

// Top black ticker (running bar) — traditional train carousel.
//
// Data rule (tbl_running_bars 1:N tbl_running_bar_items):
// - parents: isactive = 1 AND isdeleted = 0 only
// - children of EACH active parent: isactive = 1 AND isdeleted = 0,
//   ordered by display_order ASC (queue order)
// - each child holds center-screen for its own duration_seconds
//
// Motion per item: enters from the right viewport edge (fast start,
// eases to a stop at center) -> holds for DB seconds -> exits via the
// left viewport edge (slow start, speeds up), next item rolls in.
const DEFAULT_MS = 4000;
const ENTER_MS = 850;
const EXIT_MS = 850;
const DEFAULT_SLIDES = [
  { text: "Closet under Construction!", ms: DEFAULT_MS },
  { text: "Fashion Hub coming soon", ms: DEFAULT_MS },
  { text: "New collection loading", ms: DEFAULT_MS },
];

const isOn = (v) => v === 1 || v === true;
const isOff = (v) => v === 1 || v === true;

export default function RunningBar() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [entry, setEntry] = useState("right");
  const [phase, setPhase] = useState("enter");
  const [isPaused, setIsPaused] = useState(false);
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const timerRef = useRef(null);
  const pendingRef = useRef(null);

  // Load: active bars -> their active items (display_order ASC) -> queue.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [barsRaw, itemsRaw] = await Promise.all([
          apiFetch("/Running-Bar").then(unwrap).catch(() => []),
          apiFetch("/Running-Bar-Items").then(unwrap).catch(() => []),
        ]);
        const bars = (Array.isArray(barsRaw) ? barsRaw : []).filter(
          (b) => isOn(b.isactive) && !isOff(b.isdeleted)
        );
        const items = (Array.isArray(itemsRaw) ? itemsRaw : []).filter(
          (it) =>
            isOn(it.isactive ?? 1) && !isOff(it.isdeleted) && it.itemsdata
        );
        // One queue, grouped per active parent family, each family in
        // display_order ASC.
        let queue = [];
        if (bars.length > 0) {
          for (const bar of bars) {
            const family = items
              .filter((it) => String(it.running_bar_id) === String(bar.running_bar_id))
              .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
            for (const it of family) {
              const secs = Number(it.duration_seconds);
              queue.push({
                text: String(it.itemsdata).trim(),
                ms: Number.isFinite(secs) && secs > 0 ? secs * 1000 : DEFAULT_MS,
              });
            }
          }
        } else {
          // No active parent (data drift) — still show active items in order.
          queue = items
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
            .map((it) => {
              const secs = Number(it.duration_seconds);
              return {
                text: String(it.itemsdata).trim(),
                ms: Number.isFinite(secs) && secs > 0 ? secs * 1000 : DEFAULT_MS,
              };
            });
        }
        queue = queue.filter((s) => s.text);
        if (live && queue.length > 0) {
          setSlides(queue);
          setCurrentIndex(0);
          setEntry("right");
        }
      } catch {
        /* keep defaults — ticker never breaks the header */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Travel distance: viewport half + text half, so the text starts/ends
  // fully outside the strip edges. Measured pre-paint per slide.
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const el = textRef.current;
    if (!vp || !el) return;
    const travel = vp.clientWidth / 2 + el.offsetWidth / 2 + 24;
    vp.style.setProperty("--rb-travel", `${travel}px`);
  }, [currentIndex, slides]);

  const arm = (ms, run) => {
    clearTimeout(timerRef.current);
    pendingRef.current = { run, deadline: Date.now() + ms, remaining: null };
    timerRef.current = setTimeout(() => {
      pendingRef.current = null;
      run();
    }, ms);
  };

  // Motion chain per slide: enter -> hold (DB seconds) -> exit -> next.
  useEffect(() => {
    if (slides.length === 0) return undefined;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const enterMs = reduce ? 0 : ENTER_MS;
    const exitMs = reduce ? 0 : EXIT_MS;
    const holdMs = slides[currentIndex]?.ms || DEFAULT_MS;
    setPhase("enter");
    arm(enterMs, () => {
      setPhase("hold");
      arm(holdMs, () => {
        setPhase("exit");
        arm(exitMs, () => {
          setEntry("right");
          setCurrentIndex((prev) => (prev + 1) % slides.length);
        });
      });
    });
    return () => {
      clearTimeout(timerRef.current);
      pendingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, slides, entry]);

  // Hover pause: freeze CSS mid-flight + suspend the pending step, resume
  // with remaining time so DB seconds stay exact.
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
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
    setEntry("right");
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;
  // itemsdata may be plain text or HTML — HTML is sanitized before render.
  const raw = slides[currentIndex]?.text || "";
  const html = /<[a-z][\s\S]*>/i.test(raw) ? sanitizeHtml(raw) : null;
  const animCls =
    phase === "enter"
      ? entry === "left"
        ? "rb-in-left"
        : "rb-in-right"
      : phase === "exit"
        ? "rb-out-left"
        : "";

  return (
    <div
      className={`flex items-center justify-between overflow-hidden bg-neutral-950 px-3 py-1.5 text-white${
        isPaused ? " rb-paused" : ""
      }`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button type="button" onClick={showPrev} aria-label="Previous announcement" className="px-2">
        &#10094;
      </button>
      <div ref={viewportRef} className="flex-1 overflow-hidden text-center">
        {html ? (
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
        )}
      </div>
      <button type="button" onClick={showNext} aria-label="Next announcement" className="px-2">
        &#10095;
      </button>
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
