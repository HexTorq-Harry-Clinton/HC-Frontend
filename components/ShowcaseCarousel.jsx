"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";

// Horizontal auto-scroll showcase: same behavior as the previous UI —
// fixed overlay title, scroll-snap cards, dots, hover/touch pause,
// click-through to entry link or fallback page.
export default function ShowcaseCarousel({
  title,
  entriesEndpoint,
  mediaEndpoint,
  mediaFk,
  fallbackLink,
  intervalMs = 1800,
  backward = false,
}) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let live = true;
    const fetchData = async () => {
      try {
        const [entriesRes, mediaRes] = await Promise.all([
          apiFetch(entriesEndpoint).then(unwrap).catch(() => []),
          apiFetch(mediaEndpoint).then(unwrap).catch(() => []),
        ]);
        if (!live) return;
        const entries = Array.isArray(entriesRes) ? entriesRes : [];
        const media = Array.isArray(mediaRes) ? mediaRes : [];
        const mapped =
          media.length > 0
            ? media.map((m) => ({
                img: resolveUploadUrl(m.media_url || m.image_url),
                text: m.alt_text || title,
                link: m.redirect_link || null,
              }))
            : entries.map((e) => ({
                img: resolveUploadUrl(e.image_url || e.media_url),
                text: e.title || title,
                link: e.redirect_link || null,
              }));
        setItems(mapped.filter((m) => m.img));
      } catch {
        if (live) setItems([]);
      }
    };
    fetchData();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesEndpoint, mediaEndpoint]);

  const itemWidthPx = isMobile ? (typeof window !== "undefined" ? window.innerWidth * 0.75 : 280) : 700;
  const gapPx = 7;
  const stepPx = itemWidthPx + gapPx;

  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;
    const slider = sliderRef.current;
    if (!slider || items.length === 0) return;
    const index = Math.round(slider.scrollLeft / stepPx);
    setActiveIndex(((index % items.length) + items.length) % items.length);
  };

  const goToSlide = useCallback(
    (index) => {
      if (!sliderRef.current || items.length === 0) return;
      isProgrammaticScroll.current = true;
      sliderRef.current.scrollTo({ left: index * stepPx, behavior: "smooth" });
      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 650);
    },
    [stepPx, items.length]
  );

  useEffect(() => {
    if (isPaused || items.length === 0) return undefined;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (backward ? (prev - 1 + items.length) % items.length : (prev + 1) % items.length));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isPaused, items.length, intervalMs, backward]);

  useEffect(() => {
    goToSlide(activeIndex);
  }, [activeIndex, goToSlide]);

  if (items.length === 0) return null;

  return (
    <div style={{ position: "relative", width: "100%", height: isMobile ? "300px" : "500px" }}>
      <div
        style={{
          position: "absolute", bottom: "0", left: "0",
          width: isMobile ? "75vw" : "700px",
          padding: isMobile ? "6px 16px" : "8px 24px",
          color: "white", fontSize: isMobile ? "24px" : "48px", fontWeight: "bold",
          fontFamily: "var(--font-display), Arial, sans-serif",
          textShadow: "0px 2px 8px rgba(0,0,0,0.6)", zIndex: 5, pointerEvents: "none",
        }}
      >
        {title}
      </div>

      <div
        ref={sliderRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="hc-slider"
        style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", height: "100%" }}
      >
        <div style={{ display: "inline-flex" }}>
          {items.map((item, i) => (
            <div
              key={i}
              onClick={() => router.push(item.link || fallbackLink)}
              style={{
                position: "relative",
                width: isMobile ? "75vw" : "700px",
                height: isMobile ? "300px" : "500px",
                marginRight: `${gapPx}px`,
                overflow: "hidden",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.img}
                alt={title}
                loading="lazy"
                decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hc-slider-dots" style={{ textAlign: "center", padding: "10px 0" }}>
        {items.map((_, i) => (
          <span
            key={i}
            onClick={() => goToSlide(i)}
            style={{
              display: "inline-block", width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: activeIndex === i ? "white" : "#bbb",
              cursor: "pointer", transition: "0.3s", margin: "0 4px",
            }}
          />
        ))}
      </div>
      <style jsx>{`
        .hc-slider::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
