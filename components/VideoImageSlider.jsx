"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";

// Hero carousel: same behavior as the previous UI — arrows, dots, autoplay,
// pause on hover, slide counter. Slides come from the Image-Sliders API
// (all imagery is backend-served by design).
export default function VideoImageSlider() {
  const router = useRouter();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

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
          }))
          .filter((s) => s.src);
        setSlides(list);
      })
      .catch(() => {
        if (live) setSlides([]);
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

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    timer.current = setInterval(() => go(1), 4000);
    return () => clearInterval(timer.current);
  }, [paused, slides.length, go]);

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

  if (slides.length === 0) return null;

  return (
    <div
      className="slider-container relative overflow-hidden bg-neutral-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/7] w-full">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={index}
            className="absolute inset-0 cursor-pointer"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => slides[index].redirect && router.push(slides[index].redirect)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slides[index].src} alt={slides[index].alt} className="h-full w-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
          </motion.div>
        </AnimatePresence>
        <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-lg shadow hover:bg-white">
          ‹
        </button>
        <button type="button" aria-label="Next slide" onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-lg shadow hover:bg-white">
          ›
        </button>
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
