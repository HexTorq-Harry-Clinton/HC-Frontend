"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SPLASH_MS = 3000;
const SPLASH_SRC = "/brand/hc-splash.mp4";
const SPLASH_CACHE = "hc-splash-v1";
const SPLASH_VISIBILITY_EVENT = "hc:splash-visibility";

// Opening splash: the store is revealed only after the complete video emits
// `ended`. There is intentionally no duration shortcut or timeout fallback.
export default function SplashScreen() {
  // Start VISIBLE so the server HTML already covers the homepage — no
  // homepage flash before the splash. Returning visitors are hidden
  // synchronously pre-paint below, so they never see a flicker either.
  const [show, setShow] = useState(true);
  const [videoSrc, setVideoSrc] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!sessionStorage.getItem("hc_splash_seen")) return undefined;
    const timer = window.setTimeout(() => setShow(false), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem("hc_splash_seen", "1");
    setShow(false);
  }, []);

  useEffect(() => {
    window.__hcSplashActive = show;
    window.dispatchEvent(new CustomEvent(SPLASH_VISIBILITY_EVENT, { detail: { active: show } }));
    return () => {
      window.__hcSplashActive = false;
      window.dispatchEvent(new CustomEvent(SPLASH_VISIBILITY_EVENT, { detail: { active: false } }));
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const onKey = (event) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    // Freeze the homepage behind the video: no scrollbar, no scroll — native
    // AND Lenis (which drives wheel scrolling past overflow locks).
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    try {
      window.lenis?.stop();
    } catch {
      /* no smooth scroller */
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      try {
        window.lenis?.start();
      } catch {
        /* no smooth scroller */
      }
    };
  }, [show, dismiss]);

  // Fully fetch the splash before attaching it to the video element. Cache
  // Storage keeps the blob available for fast repeat visits on this client;
  // next.config also gives the static asset a long server/CDN cache lifetime.
  useEffect(() => {
    if (!show) return undefined;
    let live = true;
    let objectUrl = null;
    const load = async () => {
      try {
        let response;
        if ("caches" in window) {
          const cache = await window.caches.open(SPLASH_CACHE);
          response = await cache.match(SPLASH_SRC);
          if (!response) {
            response = await fetch(SPLASH_SRC, { cache: "force-cache" });
            if (!response.ok) throw new Error(`Splash video failed: ${response.status}`);
            await cache.put(SPLASH_SRC, response.clone());
          }
        } else {
          response = await fetch(SPLASH_SRC, { cache: "force-cache" });
          if (!response.ok) throw new Error(`Splash video failed: ${response.status}`);
        }
        const blob = await response.blob();
        if (!live) return;
        objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);
      } catch {
        // Keep the splash visible and allow the native URL to retry rather
        // than sending the visitor to the homepage before the intro plays.
        if (live) setVideoSrc(SPLASH_SRC);
      }
    };
    load();
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [show]);

  // Restore the intended 3-second intro by speeding up the complete source
  // clip rather than cutting it off at an arbitrary timestamp.
  useEffect(() => {
    if (!show) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    const speedUp = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      video.defaultPlaybackRate = video.duration / (SPLASH_MS / 1000);
      video.playbackRate = video.defaultPlaybackRate;
    };
    speedUp();
    video.addEventListener("loadedmetadata", speedUp);
    return () => video.removeEventListener("loadedmetadata", speedUp);
  }, [show]);

  const startVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.defaultPlaybackRate = video.duration / (SPLASH_MS / 1000);
      video.playbackRate = video.defaultPlaybackRate;
    }
    video.play().catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      role="dialog"
      aria-label="Harry Clinton intro"
    >
      <video
        ref={videoRef}
        src={videoSrc || undefined}
        className="h-full w-full object-cover lg:scale-[1.12] xl:scale-[1.22] 2xl:scale-[1.3]"
        muted
        playsInline
        preload="auto"
        onCanPlayThrough={startVideo}
        onEnded={dismiss}
      />
    <button
        type="button"
        onClick={dismiss}
        aria-label="Skip intro video"
        className="!border-0 !bg-transparent !shadow-none absolute bottom-6 z-20 cursor-pointer px-3 py-2 !text-[12px] !font-normal uppercase tracking-[0.12em] !text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Skip
      </button>
    </div>
  );
}
