"use client";

import { useCallback, useEffect, useState } from "react";

// Opening splash: brand video plays once per session, then reveals the store.
// Skippable (click / Esc / ends). Frontend-only asset by design.
export default function SplashScreen() {
  const [show, setShow] = useState(false);

  // sessionStorage is client-only: read after mount so server HTML (no splash)
  // matches first client paint. Mount-sync check is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!sessionStorage.getItem("hc_splash_seen")) {
      setShow(true);
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
    return () => window.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950"
      onClick={dismiss}
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
