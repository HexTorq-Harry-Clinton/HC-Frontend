"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import MarqueeTape from "./MarqueeTape";

// Running bar — the white strip BELOW the hero slider.
// Flowing right-to-left marquee tape.
// Data rule (tbl_running_bars 1:N tbl_running_bar_items):
// - parents: isactive = 1 AND isdeleted = 0 only
// - children of EACH active parent: isactive = 1 AND isdeleted = 0,
//   ordered by display_order ASC
// - tape speed honors the DB: loop time = sum of duration_seconds
const DEFAULT_SLIDES = [
  { text: "Enjoy an Exclusive 50% Privilege on All Orders Today Only !", secs: 30, showLogo: true },
];

const isOn = (v) => v === 1 || v === true;
const isOff = (v) => v === 1 || v === true;

export default function OfferBar() {
  // slides: [{ text, secs, showLogo }] in queue order.
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [barsRaw, itemsRaw] = await Promise.all([
          apiFetch("/Running-Bar").then(unwrap).catch(() => []),
          apiFetch("/Running-Bar-Items").then(unwrap).catch(() => []),
        ]);
        const bars = (Array.isArray(barsRaw) ? barsRaw : []).filter(
          (b) => isOn(b.isactive) && !isOff(b.isdeleted)
        );
        const items = (Array.isArray(itemsRaw) ? itemsRaw : []).filter(
          (it) => isOn(it.isactive ?? 1) && !isOff(it.isdeleted) && it.itemsdata
        );
        // One tape, grouped per active parent family, each family in
        // display_order ASC.
        let queue = [];
        const toSlide = (it) => {
          const secs = Number(it.duration_seconds);
          return {
            text: String(it.itemsdata).trim(),
            secs: Number.isFinite(secs) && secs > 0 ? secs : 5,
            showLogo: it.show_logo === 0 || it.show_logo === false ? false : true,
          };
        };
        if (bars.length > 0) {
          for (const bar of bars) {
            const family = items
              .filter((it) => String(it.running_bar_id) === String(bar.running_bar_id))
              .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
            for (const it of family) queue.push(toSlide(it));
          }
        } else {
          // No active parent (data drift) — still show active items in order.
          queue = items
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
            .map(toSlide);
        }
        queue = queue.filter((s) => s.text);
        if (live && queue.length > 0) setSlides(queue);
      } catch {
        /* keep default — strip never breaks the page */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return <MarqueeTape slides={slides} logoMarks={false} showLogoPerItem pad="px-12" />;
}
