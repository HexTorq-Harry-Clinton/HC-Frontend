"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";

// HC Spotlight homepage rows: TWO slow marquees — row 1 drifts left→right,
// row 2 drifts right→left — and live page-scroll velocity bends both tapes
// (scroll down flings them, release eases back to cruise). Pauses offscreen.
// Images only (videos play on the /hc-spotlight detail page); click any card
// to open the full gallery.
const BASE_PX = 0.5; // cruise speed, px per frame (~30px/s)
const SCROLL_K = 0.12; // scroll-velocity coupling
const MAX_KICK = 9; // clamp scroll fling, px per frame

export default function SpotlightMarquee({ title = "HC Spotlight" }) {
  const [rows, setRows] = useState([[], []]);
  const sectionRef = useRef(null);
  const trackA = useRef(null);
  const trackB = useRef(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [entriesRaw, mediaRaw] = await Promise.all([
          apiFetch("/Spotlight-Entries").then(unwrap).catch(() => []),
          apiFetch("/Spotlight-Media").then(unwrap).catch(() => []),
        ]);
        const entries = (Array.isArray(entriesRaw) ? entriesRaw : []).filter(
          (e) => (e.isactive === 1 || e.isactive === true) && e.isdeleted !== 1 && e.isdeleted !== true
        );
        const titleById = Object.fromEntries(
          entries.map((e) => [String(e.spotlight_entry_id), e.title || ""])
        );
        const cards = (Array.isArray(mediaRaw) ? mediaRaw : [])
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
        if (cards.length === 0) {
          setRows([[], []]);
          return;
        }
        // Alternate into two rows so both tapes stay balanced.
        const a = [];
        const b = [];
        cards.forEach((c, i) => (i % 2 === 0 ? a : b).push(c));
        if (b.length === 0) b.push(...a);
        if (a.length === 0) a.push(...b);
        setRows([a, b]);
      } catch {
        /* section hides when unreachable */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || rows[0].length === 0) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let raf = 0;
    let visible = true;
    let posA = 0;
    let posB = 0;
    let lastY = window.scrollY;
    let kick = 0;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(section);
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) {
        lastY = window.scrollY;
        return;
      }
      const y = window.scrollY;
      const target = (y - lastY) * SCROLL_K;
      lastY = y;
      kick += (Math.max(-MAX_KICK, Math.min(MAX_KICK, target)) - kick) * 0.12;
      posA += BASE_PX + kick;
      posB += BASE_PX + kick;
      const elA = trackA.current;
      const elB = trackB.current;
      if (elA) {
        const w = elA.scrollWidth / 2 || 1;
        elA.style.transform = `translate3d(${((posA % w) + w) % w - w}px, 0, 0)`;
      }
      if (elB) {
        const w = elB.scrollWidth / 2 || 1;
        elB.style.transform = `translate3d(${-(posB % w)}px, 0, 0)`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [rows]);

  if (rows[0].length === 0) return null;

  const renderTape = (cards, ref) => (
    <div className="overflow-hidden">
      <div ref={ref} className="flex w-max will-change-transform">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-stretch gap-4 pr-4" aria-hidden={dup > 0}>
            {cards.map((c) => (
              <Link
                key={`${dup}-${c.id}`}
                href="/hc-spotlight"
                tabIndex={dup > 0 ? -1 : 0}
                className="group w-64 shrink-0 overflow-hidden rounded-xl bg-neutral-950 md:w-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt={c.caption || "HC Spotlight"}
                  loading="lazy"
                  decoding="async"
                  className="h-44 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 md:h-56"
                />
                {c.caption && (
                  <p className="truncate px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                    {c.caption}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} className="overflow-hidden bg-white py-16">
      <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="eyebrow text-gold-deep">Showcase</p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            {title}
          </h2>
        </div>
        <Link
          href="/hc-spotlight"
          className="link-sweep text-xs font-semibold uppercase tracking-[0.25em] text-neutral-900"
        >
          Explore
        </Link>
      </div>
      <div className="space-y-4">
        {renderTape(rows[0], trackA)}
        {renderTape(rows[1], trackB)}
      </div>
    </section>
  );
}
