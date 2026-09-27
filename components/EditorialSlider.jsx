"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// Shared editorial slider — the reference site's design for BOTH the
// "HC Spotlight" and "Style By HC" blocks:
//   * horizontal slider, 700x500 slides, object-fit cover, 2 visible at a time
//   * the heading sits ON TOP of the imagery, flush to the bottom-left of the
//     track, 48px/700 white with a soft drop shadow
//   * a row of 8px round dots underneath, the active one goes white
// Props:
// - cards:  [{ id, src, caption }]  slide content
// - title:  heading drawn over the first slide
// - href:   link target for every slide
const SLIDE_W = 700;
const SLIDE_H = 500;
const GAP = 16;
const TITLE_CLASS =
  "hc-display-font absolute bottom-0 left-0 z-[5] px-6 py-2 text-[48px] font-bold leading-[1.5] text-white";
const TITLE_SHADOW = { textShadow: "rgba(0, 0, 0, 0.6) 0px 2px 8px" };

export default function EditorialSlider({ cards = [], title, href = "/" }) {
  const [page, setPage] = useState(0);
  const trackRef = useRef(null);

  // Track which dot is active as the user scrolls the strip.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / (SLIDE_W + GAP)));
  }, []);

  const goTo = useCallback((i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * (SLIDE_W + GAP), behavior: "smooth" });
  }, []);

  if (!cards.length) return null;

  return (
    <section className="overflow-hidden bg-white">
      {/* full-width image band; the heading is overlaid on the first slide */}
      <div className="relative w-full" style={{ height: SLIDE_H }}>
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex h-full snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {cards.map((c, i) => (
            <Link
              key={c.id}
              href={href}
              className="relative block shrink-0 snap-start overflow-hidden bg-neutral-950"
              style={{ width: SLIDE_W, height: SLIDE_H }}
              aria-label={c.caption || title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.src}
                alt={c.caption || title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>

        {/* Heading sits on top of the imagery, bottom-left — as on the reference */}
        <h2 className={TITLE_CLASS} style={{ ...TITLE_SHADOW, width: SLIDE_W }}>
          {title}
        </h2>
      </div>

      {cards.length > 1 && (
        <div className="flex h-5 items-center justify-center gap-2">
          {cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === page}
              className="hc-dot h-2 w-2 transition-colors duration-300"
              style={{ backgroundColor: i === page ? "#ffffff" : "#bbbbbb" }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
