"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

// Runs pre-paint on the client (no-op on the server): lets us hide the
// splash synchronously for returning visitors without a flash frame.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Opening splash: brand video plays once per session, then reveals the store.
// Dismiss ONLY via the Skip button, Esc key, or video end — taps elsewhere
// on the screen must NOT skip it. Frontend-only asset by design.
export default function SplashScreen() {
  // Start VISIBLE so the server HTML already covers the homepage — no
  // homepage flash before the splash. Returning visitors are hidden
  // synchronously pre-paint below, so they never see a flicker either.
  const [show, setShow] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useIsomorphicLayoutEffect(() => {
    if (sessionStorage.getItem("hc_splash_seen")) {
      setShow(false);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const dismiss = useCallback(() => {
    sessionStorage.setItem("hc_splash_seen", "1");
    setShow(false);
  }, []);

  useEffect(() => {
    if (!show) return;
    const onKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    // Freeze the homepage behind the video: no scrollbar, no scroll.
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950"
      role="dialog"
      aria-label="Harry Clinton intro"
    >
      <video
        src="/brand/hc-splash.mp4"
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={dismiss}
      />
      <div className="absolute bottom-5 flex flex-col items-center">
        <button onClick={dismiss} className="px-2 py-1 text-[10px] uppercase leading-none tracking-[0.25em] text-neutral-400/80 hover:text-white">
          Skip
        </button>
      </div>
    </div>
  );
}
