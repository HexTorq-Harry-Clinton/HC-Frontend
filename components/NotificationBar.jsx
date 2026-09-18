"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import MarqueeTape from "./MarqueeTape";

// TOP black strip (notification bar) — single table, no parent.
// Flowing right-to-left marquee: isactive = 1 AND isdeleted = 0,
// ORDER BY orderpriority ASC. The schema carries no per-item duration,
// so every item counts a default 5s toward the tape speed.
const DEFAULT_SLIDES = [
  { text: "Closet under Construction!", secs: 5 },
  { text: "Fashion Hub coming soon", secs: 5 },
  { text: "New collection loading", secs: 5 },
];

export default function NotificationBar() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  useEffect(() => {
    let live = true;
    apiFetch("/Notification-Bar")
      .then(unwrap)
      .then((rows) => {
        const items = (Array.isArray(rows) ? rows : [])
          .filter((r) => (r.isactive === 1 || r.isactive === true) && r.isdeleted !== 1 && r.isdeleted !== true && r.notification_text)
          .sort((a, b) => (Number(a.orderpriority) || 0) - (Number(b.orderpriority) || 0))
          .map((r) => ({ text: String(r.notification_text).trim(), secs: 5 }))
          .filter((s) => s.text);
        if (live && items.length > 0) setSlides(items);
      })
      .catch(() => {
        /* keep defaults — strip never breaks the header */
      });
    return () => {
      live = false;
    };
  }, []);

  return <MarqueeTape slides={slides} dark logoMarks />;
}
