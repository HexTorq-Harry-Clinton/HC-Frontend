"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";

const FALLBACK_SLIDES = [
  {
    src: "/brand/logo-black.png",
    alt: "Harry Clinton Atelier",
    redirect: "/suits",
    secs: 4,
  },
];

// Hero carousel: same behavior as the previous UI — arrows, dots, autoplay,
// pause on hover, slide counter. Slides come from the Image-Sliders API
// (all imagery is backend-served by design).
export default function VideoImageSlider() {
  const router = useRouter();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState({});
  const timer = useRef(null);
  const touchX = useRef(null);

  useEffect(() => {
    let live = true;
    apiFetch("/Image-Sliders")
      .then(unwrap)
      .then((data) => {
        if (!live) return;
        const list = (Array.isArray(data) ? data : [])
          .filter((s) => s.isactive !== false)
          .map((item) => ({
            src: resolveUploadUrl(item.image_url || item.media_url || item.src),
            alt: item.title || item.alt_text || "Harry Clinton",
            redirect: item.redirect_link || null,
            secs: Number(item.auto_slide_interval_seconds) || 4,
          }))
          .filter((s) => s.src && !s.src.includes("cdn.example.com") && !s.src.includes("example.com"));
        // If backend has no valid slides (all filtered or empty), fall back to local brand asset so hero is never black.
        setSlides(list.length > 0 ? list : FALLBACK_SLIDES);
      })
      .catch(() => {
        if (live) setSlides(FALLBACK_SLIDES);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const go = useCallback(
    (dir) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length]
  );

  // Per-slide autoplay: each slide's own auto_slide_interval_seconds
  // (clamped 2–12s), so the DB controls pacing per image.
  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const secs = Number(slides[index]?.secs) || 4;
    const ms = Math.min(Math.max(secs, 2), 12) * 1000;
    timer.current = setTimeout(() => go(1), ms);
    return () => clearTimeout(timer.current);
  }, [paused, slides, index, go]);

  // Mobile swipe: horizontal drag flips slides (40px threshold).
  const onTouchStart = (e) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40 || slides.length < 2) return;
    go(dx < 0 ? 1 : -1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading slider...</span>
        </div>
        <style jsx>{`
          .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius: 50%; animation: sd-spin 0.75s linear infinite; }
          @keyframes sd-spin { to { transform: rotate(360deg); } }
          .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
        `}</style>
      </div>
    );
  }

  // Effective slides with per-item broken-image fallback
  const effectiveSlides = slides.map((s, i) => (failed[i] ? FALLBACK_SLIDES[0] : s));

  if (slides.length === 0) return null;

  const current = effectiveSlides[index] || FALLBACK_SLIDES[0];

  return (
    <div
      className="slider-container group relative overflow-hidden bg-neutral-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[16/7] w-full bg-neutral-900">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${index}-${failed[index] ? "fb" : "ok"}`}
            className="absolute inset-0 cursor-pointer"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => current.redirect && router.push(current.redirect)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.alt}
              className="h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              onError={() => {
                if (!failed[index]) setFailed((m) => ({ ...m, [index]: true }));
              }}
            />
            {failed[index] && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 text-white">
                <span className="rounded bg-white/15 px-3 py-1 text-xs tracking-widest">HARRY CLINTON</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(-1)}
              className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-neutral-950/55 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:border-gold hover:bg-gold hover:text-neutral-950 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <i className="bi bi-chevron-left text-lg leading-none" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(1)}
              className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-neutral-950/55 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:border-gold hover:bg-gold hover:text-neutral-950 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <i className="bi bi-chevron-right text-lg leading-none" />
            </button>
          </>
        )}
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
