"use client";

import { useEffect, useState } from "react";
import { apiCached, precacheMedia, resolveUploadUrl } from "@/lib/api";
import TwoRowMarquee from "./TwoRowMarquee";

// Style By HC — the second editorial block, sitting under HC Spotlight. Uses
// the SAME two-row slider as Spotlight (shared TwoRowMarquee component, so the
// two blocks can't drift apart), but is fed by the Style Collections tables
// instead of Spotlight.
const isLive = (r) =>
  (r.isactive === 1 || r.isactive === true || r.isactive === undefined || r.isactive === null) &&
  r.isdeleted !== 1 && r.isdeleted !== true;

export function StyleByHC({ title = "Style By HC" }) {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [collectionsRaw, mediaRaw] = await Promise.all([
          apiCached("/Style-Collections").catch(() => []),
          apiCached("/Style-Collection-Media").catch(() => []),
        ]);
        const collections = (Array.isArray(collectionsRaw) ? collectionsRaw : []).filter(isLive);
        const nameById = Object.fromEntries(
          collections.map((c) => [String(c.style_collection_id), c.collection_name || c.collection_slug || ""])
        );
        const list = (Array.isArray(mediaRaw) ? mediaRaw : [])
          .filter(
            (m) =>
              isLive(m) &&
              m.media_url &&
              (m.media_type || "image") !== "video" &&
              !/\.(mp4|webm|mov)(\?|#|$)/i.test(m.media_url)
          )
          .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
          .map((m) => ({
            id: m.style_collection_media_id,
            src: resolveUploadUrl(m.media_url),
            caption: nameById[String(m.style_collection_id)] || m.alt_text || "",
          }))
          .filter((c) => c.src);
        if (!live) return;
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

  return <TwoRowMarquee cards={cards} title={title} href="/style-by-hc" eyebrow="Collections" />;
}
