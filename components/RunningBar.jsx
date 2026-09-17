"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

// Top black ticker (running bar) — horizontal carousel.
//
// Data rule (tbl_running_bars 1:N tbl_running_bar_items):
// - parents: isactive = 1 AND isdeleted = 0 only
// - children of EACH active parent: isactive = 1 AND isdeleted = 0,
//   ordered by display_order ASC (queue order)
// - each child stays on screen for its own duration_seconds
// Falls back to default texts when the API is empty/unreachable.
const DEFAULT_MS = 4000;
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
  const [direction, setDirection] = useState("next");
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

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
          setDirection("next");
        }
      } catch {
        /* keep defaults — ticker never breaks the header */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Each slide lives for its own duration_seconds.
  useEffect(() => {
    if (isPaused || slides.length === 0) return undefined;
    const ms = slides[currentIndex]?.ms || DEFAULT_MS;
    timerRef.current = setTimeout(() => {
      setDirection("next");
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, ms > 0 ? ms : DEFAULT_MS);
    return () => clearTimeout(timerRef.current);
  }, [isPaused, slides, currentIndex]);

  const showPrev = () => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;
  const animCls = direction === "prev" ? "slide-from-left" : "slide-from-right";

  return (
    <div
      className="flex items-center justify-between overflow-hidden bg-neutral-950 px-3 py-1.5 text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <button type="button" onClick={showPrev} aria-label="Previous announcement" className="px-2">
        &#10094;
      </button>
      <div className="flex-1 overflow-hidden text-center">
        <span key={currentIndex} className={`${animCls} text-xs font-medium uppercase tracking-widest`}>
          {slides[currentIndex]?.text}
        </span>
      </div>
      <button type="button" onClick={showNext} aria-label="Next announcement" className="px-2">
        &#10095;
      </button>
      <style jsx>{`
        .slide-from-right { display: inline-block; animation: slide-r 0.45s ease; }
        .slide-from-left { display: inline-block; animation: slide-l 0.45s ease; }
        @keyframes slide-r { from { opacity: 0; transform: translateX(48px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slide-l { from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
