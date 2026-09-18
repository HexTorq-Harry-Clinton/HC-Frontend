"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import TrainTicker, { TRAIN_DEFAULT_MS } from "./TrainTicker";

// TOP black strip (notification bar) — single table, no parent.
// Train motion (NOT the running-bar marquee): one item at a time rolls in
// from the right, holds, rolls out left. Queue: isactive = 1 AND
// isdeleted = 0, ORDER BY orderpriority ASC. The schema carries no per-item
// duration, so every item holds the default.
const DEFAULT_SLIDES = [
  { text: "Closet under Construction!", ms: TRAIN_DEFAULT_MS },
  { text: "Fashion Hub coming soon", ms: TRAIN_DEFAULT_MS },
  { text: "New collection loading", ms: TRAIN_DEFAULT_MS },
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
          .map((r) => ({ text: String(r.notification_text).trim(), ms: TRAIN_DEFAULT_MS }))
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

  return <TrainTicker slides={slides} dark arrows />;
}
