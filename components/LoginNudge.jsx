"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoginPopup from "./LoginPopup";

// Guest nudge trigger: guests only, after scroll AND 30s, never on /login.
// Dismissing (Continue as Guest) suppresses the popup for 24 hours.
const GUEST_SNOOZE_KEY = "hc_guest_snooze_until";
const GUEST_SNOOZE_MS = 24 * 60 * 60 * 1000;

export function snoozeGuestNudge() {
  try {
    localStorage.setItem(GUEST_SNOOZE_KEY, String(Date.now() + GUEST_SNOOZE_MS));
  } catch {
    /* storage unavailable — popup simply shows again */
  }
}

function guestSnoozed() {
  try {
    return Date.now() < Number(localStorage.getItem(GUEST_SNOOZE_KEY) || 0);
  } catch {
    return false;
  }
}
// Same flow as the previous UI.
export default function LoginNudge() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hc_token");
    const session = localStorage.getItem("hc_session");
    if (token || session || pathname === "/login" || guestSnoozed()) {
      // Logged in, on login, or snoozed within 24h: never show.
      return;
    }
    let scrolled = false;
    let timerDone = false;
    const tryShow = () => {
      if (scrolled && timerDone) setShow(true);
    };
    const onScroll = () => {
      if (!scrolled) {
        scrolled = true;
        tryShow();
      }
    };
    const timer = setTimeout(() => {
      timerDone = true;
      tryShow();
    }, 30000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  // Hidden while closed, on /login, or once logged in (re-checked on navigation).
  if (!show || pathname === "/login") return null;
  return (
    <LoginPopup
      onSkip={() => {
        snoozeGuestNudge();
        setShow(false);
      }}
    />
  );
}
