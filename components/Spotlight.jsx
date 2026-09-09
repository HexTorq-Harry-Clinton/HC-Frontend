"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import ShowcaseCarousel from "./ShowcaseCarousel";

// Spotlight + Style carousels with settings-driven titles, exactly like before.
export function Spotlight() {
  const [title, setTitle] = useState("HC Spotlight");

  useEffect(() => {
    let live = true;
    apiFetch("/Settings")
      .then(unwrap)
      .then((settings) => {
        if (!live) return;
        const list = Array.isArray(settings) ? settings : [];
        const match = list.find(
          (s) => s.setting_key?.toLowerCase() === "home_spotlight_title" || s.key?.toLowerCase() === "home_spotlight_title"
        );
        if (match?.setting_value || match?.value) setTitle(match.setting_value || match.value);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <ShowcaseCarousel
      title={title}
      entriesEndpoint="/Spotlight-Entries"
      mediaEndpoint="/Spotlight-Media"
      fallbackLink="/hc-spotlight"
      intervalMs={1800}
    />
  );
}

export function StyleByHC() {
  const [title, setTitle] = useState("Style By HC");

  useEffect(() => {
    let live = true;
    apiFetch("/Settings")
      .then(unwrap)
      .then((settings) => {
        if (!live) return;
        const list = Array.isArray(settings) ? settings : [];
        const match = list.find(
          (s) => s.setting_key?.toLowerCase() === "home_style_by_hc_title" || s.key?.toLowerCase() === "home_style_by_hc_title"
        );
        if (match?.setting_value || match?.value) setTitle(match.setting_value || match.value);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

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
