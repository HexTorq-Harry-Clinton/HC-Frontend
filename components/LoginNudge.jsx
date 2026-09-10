"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoginPopup from "./LoginPopup";

// Guest nudge trigger: guests only, after scroll AND 30s, never on /login.
// Same flow as the previous UI.
export default function LoginNudge() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hc_token");
    const session = localStorage.getItem("hc_session");
    if (token || session || pathname === "/login") {
      // Logged in or already on login: never show.
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
  return <LoginPopup onSkip={() => setShow(false)} />;
}
