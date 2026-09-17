"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";

// Running bar — the white strip BELOW the hero slider.
// Continuous scrollbar tape (NOT one-at-a-time): items stream in queue order
// and the next follows while the first is still exiting, seamless loop.
// Data rule (tbl_running_bars 1:N tbl_running_bar_items):
// - parents: isactive = 1 AND isdeleted = 0 only
// - children of EACH active parent: isactive = 1 AND isdeleted = 0,
//   ordered by display_order ASC
// - tape speed honors the DB: one full loop takes the SUM of duration_seconds
const DEFAULT_TEXT = "Enjoy an Exclusive 50% Privilege on All Orders Today Only !";
const DEFAULT_SECS = 30;

const isOn = (v) => v === 1 || v === true;
const isOff = (v) => v === 1 || v === true;

function TapeText({ text }) {
  const html = /<[a-z][\s\S]*>/i.test(text) ? sanitizeHtml(text) : null;
  if (html) {
    return (
      <span
        className="flex items-center whitespace-nowrap px-6 text-sm font-medium"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <span className="flex items-center whitespace-nowrap px-6 text-sm font-medium">
      {text}
      <Image src="/brand/logo-black.png" alt="" aria-hidden width={28} height={28} className="ml-6 inline-block" />
    </span>
  );
}

export default function OfferBar() {
  // slides: [{ text, secs }] in queue order.
  const [slides, setSlides] = useState([{ text: DEFAULT_TEXT, secs: DEFAULT_SECS }]);

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

  // Full loop = sum of DB seconds x copies (speed stays proportional to the
  // configured seconds no matter how many repeats fill the screen).
  // The queue repeats 4x per half so the tape is always wider than the
  // viewport — no blank gap, no pop-in, seamless -50% loop.
  const COPIES = 4;
  const tape = Array(COPIES).fill(slides).flat();
  const loopSecs = Math.max(
    slides.reduce((s, it) => s + (Number(it.secs) || 0), 0) * COPIES,
    10
  );

  return (
    <div className="overflow-hidden border-y border-neutral-200 bg-white py-2">
      <div className="animate-marquee items-center" style={{ animationDuration: `${loopSecs}s` }}>
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup > 0}>
            {tape.map((s, i) => (
              <TapeText key={i} text={s.text} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
