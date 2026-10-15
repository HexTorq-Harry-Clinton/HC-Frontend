"use client";

import { useEffect, useState } from "react";
import { homeKV } from "@/lib/api";
import ShowcaseCarousel from "./ShowcaseCarousel";

// Spotlight + Style carousels with admin titles, matching the shared slider
// frame applied by the reference styles to both carousel sections.
function useHomeTitle(column, fallback) {
  const [title, setTitle] = useState(fallback);

  useEffect(() => {
    let live = true;
    homeKV()
      .then((kv) => {
        if (!live) return;
        if (kv[column]) setTitle(kv[column]);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [column, fallback]);

  return title;
}

// HC Spotlight: single-row infinite carousel with bottom-left overlay title, exactly matching hc-home-page
export function Spotlight() {
  const title = useHomeTitle("home_spotlight_title", "HC Spotlight");

  return (
    <ShowcaseCarousel
      title={title}
      entriesEndpoint="/Spotlight-Entries"
      mediaEndpoint="/Spotlight-Media"
      mediaFk="spotlight_entry_id"
      fallbackLink="/hc-spotlight"
      detailBase="/hc-spotlight"
      intervalMs={1800}
      hasBorder={true}
      topBorder={true}
    />
  );
}

// Style By HC: single-row infinite carousel with bottom-left overlay title, exactly matching hc-home-page
export function StyleByHC() {
  const title = useHomeTitle("home_style_by_hc_title", "Style By HC");

  return (
    <ShowcaseCarousel
      title={title}
      entriesEndpoint="/Style-Collections"
      mediaEndpoint="/Style-Collection-Media"
      mediaFk="style_collection_id"
      fallbackLink="/style-by-hc"
      detailBase="/style-by-hc"
      intervalMs={2000}
      backward={true}
      hasBorder={true}
    />
  );
}
