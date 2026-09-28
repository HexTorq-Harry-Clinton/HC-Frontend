"use client";

import { useEffect, useState } from "react";
import { apiCached, precacheMedia, resolveUploadUrl } from "@/lib/api";
import TwoRowMarquee from "./TwoRowMarquee";

// HC Spotlight homepage block — two drifting image rows (see TwoRowMarquee).
// Images only; videos play on the /hc-spotlight detail page, and clicking any
// card opens the full gallery. Hides itself when the data is unreachable.
export default function SpotlightMarquee({ title = "HC Spotlight" }) {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [entriesRaw, mediaRaw] = await Promise.all([
          apiCached("/Spotlight-Entries").catch(() => []),
          apiCached("/Spotlight-Media").catch(() => []),
        ]);
        const entries = (Array.isArray(entriesRaw) ? entriesRaw : []).filter(
          (e) => (e.isactive === 1 || e.isactive === true) && e.isdeleted !== 1 && e.isdeleted !== true
        );
        const titleById = Object.fromEntries(
          entries.map((e) => [String(e.spotlight_entry_id), e.title || ""])
        );
        const list = (Array.isArray(mediaRaw) ? mediaRaw : [])
          .filter(
            (m) =>
              (m.isactive === 1 || m.isactive === true) &&
              m.isdeleted !== 1 && m.isdeleted !== true &&
              m.media_url &&
              (m.media_type || "image") !== "video" &&
              !/\.(mp4|webm|mov)(\?|#|$)/i.test(m.media_url)
          )
          .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
          .map((m) => ({
            id: m.spotlight_media_id,
            src: resolveUploadUrl(m.media_url),
            caption: titleById[String(m.spotlight_entry_id)] || m.alt_text || "",
          }))
          .filter((c) => c.src);
        if (!live) return;
        // Warm the browser image cache so back-nav never re-downloads.
        precacheMedia(list.map((c) => c.src));
        setCards(list);
      } catch {
        /* section hides when unreachable */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return <TwoRowMarquee cards={cards} title={title} href="/hc-spotlight" eyebrow="Showcase" />;
}
