"use client";

import Image from "next/image";
import { sanitizeHtml } from "@/lib/sanitize";

// Shared flowing marquee tape for the two ticker strips.
// Continuous right-to-left scroll, seamless -50% loop, pause on hover.
// Props:
// - slides: [{ text, secs }] in queue order (text may be plain or HTML)
// - dark: black strip (notification bar) vs white strip (running bar)
// - logoMarks: show brand logo separators between messages (running bar)
const COPIES = 4;

function TapeText({ text, logoMarks, light, pad }) {
  const inner = /<[a-z][\s\S]*>/i.test(text) ? (
    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
  ) : (
    text
  );
  return (
    <span className={`flex items-center whitespace-nowrap ${pad} text-xs font-medium uppercase tracking-widest`}>
      {inner}
      {logoMarks && (
        <Image
          src={light ? "/brand/logo-white.png" : "/brand/logo-black.png"}
          alt=""
          aria-hidden
          width={20}
          height={20}
          className="ml-6 inline-block"
        />
      )}
    </span>
  );
}

export default function MarqueeTape({ slides, dark = true, logoMarks = false, showLogoPerItem = false, pad = "px-6" }) {
  const list = Array.isArray(slides) ? slides.filter((s) => s.text) : [];
  // The queue repeats per half so the tape is always wider than the viewport
  // — no blank gap, no pop-in. Loop time = sum of DB seconds x copies, so
  // scroll speed stays proportional to the configured seconds.
  const tape = Array(COPIES).fill(list.length > 0 ? list : [{ text: "", secs: 5 }]).flat();
  const loopSecs = Math.max(
    list.reduce((s, it) => s + (Number(it.secs) || 0), 0) * COPIES,
    10
  );
  const skin = dark
    ? "bg-neutral-950 text-white"
    : "border-y border-neutral-200 bg-white text-neutral-900";

  return (
    <div className={`overflow-hidden ${skin} py-1.5`}>
      <div className="animate-marquee items-center" style={{ animationDuration: `${loopSecs}s` }}>
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup > 0}>
            {tape.map((s, i) => (
              <TapeText
                key={i}
                text={s.text}
                logoMarks={showLogoPerItem ? s.showLogo !== false : logoMarks}
                light={dark}
                pad={pad}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
