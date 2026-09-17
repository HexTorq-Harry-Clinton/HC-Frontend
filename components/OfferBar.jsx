"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import TrainTicker, { TRAIN_DEFAULT_MS } from "./TrainTicker";

// Running bar — the white strip BELOW the hero slider.
// Data rule (tbl_running_bars 1:N tbl_running_bar_items):
// - parents: isactive = 1 AND isdeleted = 0 only
// - children of EACH active parent: isactive = 1 AND isdeleted = 0,
//   ordered by display_order ASC (queue order)
// - each child holds center-screen for its own duration_seconds
const DEFAULT_SLIDES = [
  { text: "Enjoy an Exclusive 50% Privilege on All Orders Today Only !", ms: TRAIN_DEFAULT_MS },
];

const isOn = (v) => v === 1 || v === true;
const isOff = (v) => v === 1 || v === true;

function LogoMark() {
  return (
    <Image
      src="/brand/logo-black.png"
      alt=""
      aria-hidden
      width={28}
      height={28}
      className="shrink-0"
    />
  );
}

export default function OfferBar() {
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
          (it) =>
            isOn(it.isactive ?? 1) && !isOff(it.isdeleted) && it.itemsdata
        );
        // One queue, grouped per active parent family, each family in
        // display_order ASC.
        let queue = [];
        if (bars.length > 0) {
          for (const bar of bars) {
            const family = items
              .filter((it) => String(it.running_bar_id) === String(bar.running_bar_id))
              .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
            for (const it of family) {
              const secs = Number(it.duration_seconds);
              queue.push({
                text: String(it.itemsdata).trim(),
                ms: Number.isFinite(secs) && secs > 0 ? secs * 1000 : TRAIN_DEFAULT_MS,
              });
            }
          }
        } else {
          // No active parent (data drift) — still show active items in order.
          queue = items
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
            .map((it) => {
              const secs = Number(it.duration_seconds);
              return {
                text: String(it.itemsdata).trim(),
                ms: Number.isFinite(secs) && secs > 0 ? secs * 1000 : TRAIN_DEFAULT_MS,
              };
            });
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

  return (
    <TrainTicker
      slides={slides}
      arrows={false}
      flankLeft={<LogoMark />}
      flankRight={<LogoMark />}
    />
  );
}
