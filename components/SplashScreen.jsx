"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

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
        className="max-h-full w-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={dismiss}
      />
      <div className="absolute bottom-8 flex flex-col items-center gap-3">
        <Image src="/brand/logo-white.png" alt="Harry Clinton" width={120} height={40} />
        <button onClick={dismiss} className="text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-white">
          Skip
        </button>
      </div>
    </div>
  );
}
