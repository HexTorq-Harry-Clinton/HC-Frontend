"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiCached, precacheMedia, resolveUploadUrl } from "@/lib/api";

// HC Spotlight — mirrors the reference site:
//   * horizontal slider, 700x500 slides, object-fit cover, 2 visible at a time
//   * the "HC Spotlight" heading sits ON TOP of the imagery, flush to the
//     bottom-left of the track, 48px/700 white with a soft drop shadow
//   * a row of 8px round dots underneath, active one goes white
// Images only (videos play on the /hc-spotlight detail page); clicking any
// slide opens the full gallery.
const SLIDE_W = 700;
const SLIDE_H = 500;
const TITLE_CLASS =
  `hc-display-font absolute bottom-0 left-0 z-[5] px-6 py-2 text-[48px] font-bold leading-[1.5] text-white`;
const TITLE_W = SLIDE_W; // reference heading box spans one full slide
const TITLE_SHADOW = { textShadow: "rgba(0, 0, 0, 0.6) 0px 2px 8px" };

export default function SpotlightMarquee({ title = "HC Spotlight" }) {
  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [entriesRaw, mediaRaw] = await Promise.all([
          apiCached("/Spotlight-Entries").catch(() => []),
          apiCached("/Spotlight-Media").catch(() => []),
        ]);
        const entries = (Array.isArray(entriesRaw) ? entriesRaw : []).filter(
          (e) => (e.isactive === 1 || e.isactive === true) && e.isdeleted !== 1 && e.isdeleted !== true
        );
        const titleById = Object.fromEntries(
          entries.map((e) => [String(e.spotlight_entry_id), e.title || ""])
        );
        const list = (Array.isArray(mediaRaw) ? mediaRaw : [])
          .filter(
            (m) =>
              (m.isactive === 1 || m.isactive === true) &&
              m.isdeleted !== 1 && m.isdeleted !== true &&
              m.media_url &&
              (m.media_type || "image") !== "video" &&
              !/\.(mp4|webm|mov)(\?|#|$)/i.test(m.media_url)
          )
          .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
          .map((m) => ({
            id: m.spotlight_media_id,
            src: resolveUploadUrl(m.media_url),
            caption: titleById[String(m.spotlight_entry_id)] || m.alt_text || "",
          }))
          .filter((c) => c.src);
        if (!live) return;
        precacheMedia(list.map((c) => c.src));
        setCards(list);
      } catch {
        /* section hides when unreachable */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Track which dot is active as the user scrolls the strip.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const per = SLIDE_W + 16; // slide + gap
    setPage(Math.round(el.scrollLeft / per));
  }, []);

  const goTo = useCallback((i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * (SLIDE_W + 16), behavior: "smooth" });
  }, []);

  if (cards.length === 0) return null;

  return (
    <section className="overflow-hidden bg-white">
      {/* 1440x500 image band; the heading is overlaid on the first slide */}
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
              href="/hc-spotlight"
              className="relative block shrink-0 snap-start overflow-hidden bg-neutral-950"
              style={{ width: SLIDE_W, height: SLIDE_H }}
              aria-label={c.caption || "HC Spotlight"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.src}
                alt={c.caption || "HC Spotlight"}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>

        {/* Heading sits on top of the imagery, bottom-left — as on the reference */}
        <h2
          className={TITLE_CLASS}
          style={{ ...TITLE_SHADOW, width: TITLE_W }}
        >
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
              aria-label={`Go to spotlight ${i + 1}`}
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
