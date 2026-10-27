"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { apiCached, precacheMedia, resolveUploadUrl } from "@/lib/api";

const DEFAULT_SLIDES = [
  { src: "/slides/slider1.png", alt: "Harry Clinton collection look 1", kind: "image", secs: 4 },
  { src: "/slides/slider2.JPG", alt: "Harry Clinton collection look 2", kind: "image", secs: 4 },
  { src: "/slides/slider3.png", alt: "Harry Clinton collection look 3", kind: "image", secs: 4 },
  { src: "/slides/slider4.png", alt: "Harry Clinton collection look 4", kind: "image", secs: 4 },
  { src: "/slides/slider5.png", alt: "Harry Clinton collection look 5", kind: "image", secs: 4 },
  { src: "/slides/slider6.png", alt: "Harry Clinton collection look 6", kind: "image", secs: 4 },
  { src: "/slides/slider7.png", alt: "Harry Clinton collection look 7", kind: "image", secs: 4 },
  { src: "/slides/slider8.png", alt: "Harry Clinton collection look 8", kind: "image", secs: 4 },
];

const kindOf = (item, url) => {
  const t = String(item.media_type || "").toLowerCase();
  if (t === "video" || t === "image") return t;
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url || "") ? "video" : "image";
};

export default function VideoImageSlider() {
  const router = useRouter();
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState({});
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);
  const touchX = useRef(null);
  const videoRef = useRef(null);

  // Fresh video element per slide starts autoplay-muted; reset controls.
  /* eslint-disable react-hooks/set-state-in-effect -- reset controls for the newly mounted slide */
  useEffect(() => {
    setMuted(true);
    setPlaying(true);
  }, [index]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    let live = true;
    apiCached("/Image-Sliders")
      .then((data) => {
        if (!live) return;
        const list = (Array.isArray(data) ? data : [])
          .filter((s) => s.isactive !== false)
          .map((item) => {
            const url = resolveUploadUrl(item.image_url || item.media_url || item.src);
            return {
              src: url,
              alt: item.title || item.alt_text || "Harry Clinton",
              redirect: item.redirect_link || null,
              secs: Number(item.auto_slide_interval_seconds) || 4,
              kind: kindOf(item, url),
            };
          })
          .filter((s) => s.src && !s.src.includes("cdn.example.com") && !s.src.includes("example.com"));

        if (list.length > 0) {
          setSlides(list);
          precacheMedia(list.map((s) => s.src));
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      })
      .catch(() => {
        if (live) setSlides(DEFAULT_SLIDES);
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

  // Per-slide autoplay
  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    if (slides[index]?.kind === "video") {
      timer.current = setTimeout(() => go(1), 90000);
      return () => clearTimeout(timer.current);
    }
    const secs = Number(slides[index]?.secs) || 4;
    const ms = Math.min(Math.max(secs, 2), 12) * 1000;
    timer.current = setTimeout(() => go(1), ms);
    return () => clearTimeout(timer.current);
  }, [paused, slides, index, go]);

  // Hover pauses video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else if (playing) v.play().catch(() => {});
  }, [paused, playing, index]);

  // Mobile swipe
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
      <div className="slider-container d-flex justify-content-center align-items-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading slider...</span>
        </div>
        <style jsx>{`
          .slider-container {
            width: 100%;
            height: 87vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
          }
          @media (max-width: 768px) {
            .slider-container {
              height: 55vw;
            }
          }
          .spinner-border {
            width: 2.5rem;
            height: 2.5rem;
            border: 0.25em solid rgba(255, 255, 255, 0.2);
            border-top-color: #c6a15b;
            border-radius: 50%;
            animation: sd-spin 0.75s linear infinite;
          }
          @keyframes sd-spin { to { transform: rotate(360deg); } }
          .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
        `}</style>
      </div>
    );
  }

  const effectiveSlides = slides.map((s, i) => (failed[i] ? DEFAULT_SLIDES[i % DEFAULT_SLIDES.length] : s));
  if (effectiveSlides.length === 0) return null;

  const current = effectiveSlides[index] || DEFAULT_SLIDES[0];
  const isVideo = current.kind === "video" && !failed[index];

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (v) v.muted = next;
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause();
    else v.play().catch(() => {});
    setPlaying(!playing);
  };

  return (
    <div
      id="hero"
      className="slider-container"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${index}-${current.src}`}
          className="slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          onClick={() => current.redirect && router.push(current.redirect)}
          style={{ cursor: current.redirect ? "pointer" : "default" }}
        >
          {isVideo ? (
            <video
              key={current.src}
              ref={videoRef}
              src={current.src}
              className="slide-media"
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={() => go(1)}
              onError={() => {
                if (!failed[index]) setFailed((m) => ({ ...m, [index]: true }));
              }}
            />
          ) : (
            <img
              src={current.src}
              alt={current.alt}
              className="slide-media"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              onError={() => {
                if (!failed[index]) setFailed((m) => ({ ...m, [index]: true }));
              }}
            />
          )}

        </motion.div>
      </AnimatePresence>

      {/* Video controls */}
      {isVideo && (
        <div className="video-controls">
          <button
            type="button"
            aria-label={playing ? "Pause video" : "Play video"}
            onClick={togglePlay}
            className="video-btn"
          >
            <i className={`bi ${playing ? "bi-pause-fill" : "bi-play-fill"} leading-none`} />
          </button>
          <button
            type="button"
            aria-label={muted ? "Unmute video" : "Mute video"}
            onClick={toggleMute}
            className="video-btn"
          >
            <i className={`bi ${muted ? "bi-volume-mute-fill" : "bi-volume-up-fill"} leading-none`} />
          </button>
        </div>
      )}

      {/* Custom Chevron Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="custom-arrow custom-prev"
            onClick={() => go(-1)}
            aria-label="Previous slide"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="custom-arrow custom-next"
            onClick={() => go(1)}
            aria-label="Next slide"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicator Dots */}
      {slides.length > 1 && (
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`slider-dot ${i === index ? "active" : ""}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .slider-container {
          position: relative;
          width: 100%;
          height: 87vh;
          overflow: hidden;
          background-color: #000;
        }

        .slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .slide-media {
          width: 100%;
          height: 90vh;
          object-fit: cover;
          object-position: top;
          display: block;
        }

        /* Mobile — exact match to hc-home-page: 55vw height, object-fit contain, black background */
        @media (max-width: 768px) {
          .slider-container {
            height: 55vw !important;
          }
          .slide-media {
            height: 55vw !important;
            object-fit: contain !important;
            object-position: center !important;
            background-color: #000;
          }
        }

        /* Chevron arrows */
        .custom-arrow {
          position: absolute;
          top: 50%;
          z-index: 10;
          color: white;
          background: transparent;
          border: none;
          cursor: pointer;
          transform: translateY(-50%);
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease, transform 0.2s ease;
          opacity: 0.85;
        }

        .custom-arrow:hover {
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
        }

        .custom-prev { left: 15px; }
        .custom-next { right: 15px; }

        @media (max-width: 768px) {
          .custom-arrow {
            padding: 4px;
          }
          .custom-arrow svg {
            width: 20px;
            height: 20px;
          }
          .custom-prev { left: 8px; }
          .custom-next { right: 8px; }
        }

        /* Dots */
        .slider-dots {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .slider-dot {
          width: 8px;
          height: 8px;
          min-width: 8px;
          min-height: 8px;
          aspect-ratio: 1 / 1;
          display: block;
          appearance: none;
          -webkit-appearance: none;
          border-radius: 50% !important;
          background-color: rgba(255, 255, 255, 0.45);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .slider-dot.active {
          background-color: #ffffff;
          transform: scale(1.25);
        }

        @media (max-width: 768px) {
          .slider-dots {
            bottom: 8px;
            gap: 6px;
          }
          .slider-dot {
            width: 6px;
            height: 6px;
            min-width: 6px;
            min-height: 6px;
          }
        }

        .video-controls {
          position: absolute;
          bottom: 16px;
          right: 20px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .video-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 16, 16, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
        }

        .video-btn:hover {
          border-color: #c6a15b;
          color: #c6a15b;
        }

        @media (max-width: 768px) {
          .video-controls {
            bottom: 8px;
            right: 10px;
          }
          .video-btn {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
