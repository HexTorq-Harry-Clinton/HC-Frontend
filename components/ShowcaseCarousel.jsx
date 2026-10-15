"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCached, resolveUploadUrl } from "@/lib/api";
import Reveal from "@/components/Reveal";

// Horizontal auto-scroll showcase: same behavior as the previous UI —
// fixed overlay title, scroll-snap cards, dots, hover/touch pause,
// click-through to entry link or fallback page.
export default function ShowcaseCarousel({
  title,
  entriesEndpoint,
  mediaEndpoint,
  mediaFk,
  fallbackLink,
  detailBase = null,
  intervalMs = 1800,
  backward = false,
  hasBorder = true,
  topBorder = false,
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

  const [failed, setFailed] = useState({});

  const isPlaceholderUrl = (u) => !u || u.includes("cdn.example.com") || u.includes("example.com");

  const fallbackItems = [
    { img: "/slides/slider1.png", text: title, link: fallbackLink },
    { img: "/slides/slider6.png", text: title, link: fallbackLink },
    { img: "/slides/slider7.png", text: title, link: fallbackLink },
    { img: "/slides/slider8.png", text: title, link: fallbackLink },
    { img: "/slides/slider3.png", text: title, link: fallbackLink },
    { img: "/slides/slider5.png", text: title, link: fallbackLink },
  ];

  useEffect(() => {
    let live = true;
    const fetchData = async () => {
      try {
        const [entriesRes, mediaRes] = await Promise.all([
          apiCached(entriesEndpoint).catch(() => []),
          apiCached(mediaEndpoint).catch(() => []),
        ]);
        if (!live) return;
        const entries = Array.isArray(entriesRes) ? entriesRes : [];
        const rawMedia = Array.isArray(mediaRes) ? mediaRes : [];
        const media = rawMedia.filter((m) => !isPlaceholderUrl(m.media_url || m.image_url));
        const entryById = Object.fromEntries(
          entries.map((e) => [String(e.spotlight_entry_id || e.style_collection_id || ""), e])
        );
        const mediatorLink = (entry) => {
          if (!entry || !detailBase) return null;
          const id = entry.spotlight_entry_id || entry.style_collection_id;
          if (!id) return null;
          // Product-linked entries open the mediator story page; its
          // VIEW DETAILS button continues to the real product page.
          // Editorial-only entries keep their configured redirect link.
          if (entry.product_id) return `${detailBase}/${id}`;
          return entry.redirect_link || null;
        };
        const mapped =
          media.length > 0
            ? media.map((m) => {
                const entry = entryById[String(m[mediaFk] || "")];
                return {
                  img: resolveUploadUrl(m.media_url || m.image_url),
                  text: m.alt_text || entry?.title || entry?.collection_name || title,
                  link: mediatorLink(entry) || m.redirect_link || entry?.redirect_link || null,
                };
              })
            : entries
                .filter((e) => !isPlaceholderUrl(e.image_url || e.media_url))
                .map((e) => ({
                  img: resolveUploadUrl(e.image_url || e.media_url),
                  text: e.title || title,
                  link: mediatorLink(e) || e.redirect_link || null,
                }));
        const valid = mapped.filter((m) => m.img && !isPlaceholderUrl(m.img));
        setItems(valid.length > 0 ? valid : fallbackItems);
      } catch {
        if (live) setItems(fallbackItems);
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

  const onImgError = (idx) => setFailed((m) => ({ ...m, [idx]: true }));
  // Keep the section visible while the live backend is slow or unavailable.
  // API content replaces these fallback slides as soon as it arrives.
  const displayItems = items.length > 0 ? items : fallbackItems;

  return (
    <div style={{ position: "relative", width: "100%", height: isMobile ? "300px" : "500px" }}>
      <div
        style={{
          position: "absolute",
          bottom: isMobile ? "16px" : "36px",
          left: isMobile ? "16px" : "36px",
          width: "fit-content",
          maxWidth: isMobile ? "85vw" : "700px",
          padding: isMobile ? "8px 20px" : "12px 32px",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          color: "#000000",
           fontSize: isMobile ? "18px" : "28px",
          fontWeight: "bold",
          fontFamily: "var(--font-mainlux), 'MAINLUX', Arial, sans-serif",
          lineHeight: 1.15,
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.25)",
          zIndex: 5,
          pointerEvents: "none",
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
      >
        <div style={{ display: "inline-flex" }}>
          {displayItems.map((item, i) =>
            failed[i] ? null : (
              <div
                key={i}
                onClick={() => router.push(item.link || fallbackLink)}
                style={{
                  position: "relative",
                  width: isMobile ? "75vw" : "700px",
                  height: isMobile ? "300px" : "500px",
                  marginRight: `${gapPx}px`,
                  borderRadius: "0",
                  overflow: "hidden",
                  flexShrink: 0,
                  cursor: "pointer",
                  background: "#111",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  alt={item.text || title}
                  loading="lazy"
                  decoding="async"
                  onError={() => onImgError(i)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )
          )}
        </div>
      </div>

      <div className="hc-slider-dots">
        {displayItems.map((_, i) =>
          failed[i] ? null : (
            <span
              key={i}
              onClick={() => goToSlide(i)}
              className="dot"
              style={{
                display: "inline-block",
                width: isMobile ? "6px" : "8px",
                height: isMobile ? "6px" : "8px",
                minWidth: isMobile ? "6px" : "8px",
                minHeight: isMobile ? "6px" : "8px",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                appearance: "none",
                WebkitAppearance: "none",
                padding: 0,
                backgroundColor: activeIndex === i ? "white" : "rgba(255,255,255,0.45)",
                cursor: "pointer",
                transition: "0.3s",
              }}
            />
          )
        )}
      </div>
      <style jsx>{`
        .hc-slider {
          box-sizing: border-box;
          white-space: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          width: 100%;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
          border-bottom: ${hasBorder ? "10px solid white" : "none"};
           border-top: ${hasBorder && topBorder ? "10px solid white" : "none"};
          border-left: ${hasBorder ? "10px solid white" : "none"};
          border-right: none;
          height: 100%;
        }
        .hc-slider::-webkit-scrollbar {
          display: none;
        }
        .hc-slider-dots {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 12px;
          border-radius: 20px;
          display: flex;
          gap: 8px;
          z-index: 6;
        }
      `}</style>
    </div>
  );
}
