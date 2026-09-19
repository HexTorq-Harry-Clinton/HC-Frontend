"use client";

import { useEffect } from "react";

// Body scroll lock for admin popups: while ANY popup is open the page behind
// is frozen and only the popup itself scrolls. Ref-counted so stacked popups
// (e.g. confirm over a form) can't unlock early. Usage:
//   useLockBody(!!modal);
let locks = 0;

export default function useLockBody(active) {
  useEffect(() => {
    if (!active) return undefined;
    locks += 1;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.style.overflow = prev;
    };
  }, [active]);
}
