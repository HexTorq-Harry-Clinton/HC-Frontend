"use client";

import { useEffect, useState } from "react";
import { homeKV } from "@/lib/api";
import ShowcaseCarousel from "./ShowcaseCarousel";
import SpotlightMarquee from "./SpotlightMarquee";

// Spotlight + Style carousels with admin titles (key-value store,
// legacy key rows, then defaults).
function useHomeTitle(column, legacyKey, fallback) {
  const [title, setTitle] = useState(fallback);

  useEffect(() => {
    let live = true;
    homeKV()
      .then((kv) => {
        if (!live) return;
        if (kv[column]) {
          setTitle(kv[column]);
          return;
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [column, legacyKey, fallback]);

  return title;
}

// Spotlight + Style carousels with settings-driven titles, exactly like before.
export function Spotlight() {
  const title = useHomeTitle("home_spotlight_title", "home_spotlight_title", "HC Spotlight");

  return (
    <SpotlightMarquee
      title={title}
    />
  );
}

export function StyleByHC() {
  const title = useHomeTitle("home_style_by_hc_title", "home_style_by_hc_title", "Style By HC");

  return (
    <ShowcaseCarousel
      title={title}
      entriesEndpoint="/Style-Collections"
      mediaEndpoint="/Style-Collection-Media"
      fallbackLink="/style-by-hc"
      intervalMs={2000}
      backward
    />
  );
}
