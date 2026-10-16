"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { apiCached, homeKV, precacheMedia, resolveUploadUrl } from "@/lib/api";
import { CATEGORIES } from "@/lib/catalog";

const FALLBACK_TILES = [
  {
    key: "suits",
    name: "Suits",
    href: "/suits",
    tagline: "For the Men Who Wear Royalty, Not Just Suits.",
    bgClass: "bg-gradient-to-br from-gray-900 via-neutral-900 to-black",
    // Equal mobile card height; the feature tile grows only at tablet/desktop.
    spanClass: "min-h-[300px] md:col-span-2 md:min-h-[400px] lg:col-span-2 lg:row-span-2 lg:min-h-[600px]",
  },
  {
    key: "shirts",
    name: "Shirts",
    href: "/shirts",
    tagline: "Sharp shirts for every hour of the day.",
    bgClass: "bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950",
    spanClass: "col-span-1 min-h-[300px]",
  },
  {
    key: "trousers",
    name: "Trousers",
    href: "/trousers",
    tagline: "Tailored trousers, cut to move with you.",
    bgClass: "bg-gradient-to-br from-stone-800 via-stone-900 to-black",
    spanClass: "col-span-1 min-h-[300px]",
  },
  {
    key: "indowestern",
    name: "Indo-Western",
    href: "/indowestern",
    tagline: "Heritage craft meets modern tailoring.",
    bgClass: "bg-gradient-to-br from-red-950 via-rose-950 to-black",
    spanClass: "col-span-1 min-h-[300px]",
  },
  {
    key: "babysuits",
    name: "Baby Suits",
    href: "/babysuits",
    tagline: "Little gentlemen, dressed to the nines.",
    bgClass: "bg-gradient-to-br from-emerald-950 via-teal-950 to-black",
    spanClass: "col-span-1 min-h-[300px]",
  },
];

const CATEGORY_KEYS = ["suits", "shirts", "trousers", "indowestern", "babysuits"];

// Admin tile → card: first tile takes the big feature slot, the rest small.
// Admin image wins; else keyword-matched live DB photo; else gradient.
function toCards(tiles) {
  return tiles.map((t, i) => {
    const fb = FALLBACK_TILES[i % FALLBACK_TILES.length];
    const key = (t.link || fb.href || "").replace(/\//g, "") || fb.key;
    return {
      key,
      name: t.name || fb.name,
      href: t.link || fb.href,
      tagline: t.tagline || fb.tagline,
      adminImage: t.image_url || "",
      bgClass: fb.bgClass,
      spanClass: i === 0 ? FALLBACK_TILES[0].spanClass : fb.spanClass,
    };
  });
}

export default function CategoryShowcase() {
  // Tiles + copy come from admin (tbl_settings home_collection_*); keyword-
  // matched live DB photos fill any tile without its own image.
  const [eyebrow, setEyebrow] = useState("THE COLLECTION");
  const [title, setTitle] = useState("Explore Our World");
  const [cards, setCards] = useState(() => toCards(FALLBACK_TILES.map((t) => ({ ...t, link: t.href, image_url: "" }))));
  const [images, setImages] = useState({});

  // Admin tile photos join the browser cache too.
  useEffect(() => {
    precacheMedia(cards.map((c) => (c.adminImage ? resolveUploadUrl(c.adminImage) : "")).filter(Boolean));
  }, [cards]);

  useEffect(() => {
    let live = true;
    homeKV()
      .then((kv) => {
        if (!live) return;
        if (kv.home_collection_eyebrow) setEyebrow(kv.home_collection_eyebrow);
        if (kv.home_collection_title) setTitle(kv.home_collection_title);
        try {
          const arr = JSON.parse(kv.home_collection_json || "[]");
          if (Array.isArray(arr) && arr.length > 0) {
            const liveTiles = arr
              .filter((t) => t.active !== false && t.active !== 0)
              .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
            if (liveTiles.length > 0) setCards(toCards(liveTiles));
          }
        } catch {
          /* hardcoded tiles stay */
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [productsRaw, mediaRaw] = await Promise.all([
          apiCached("/Products", { params: { pageSize: 200 } }).catch(() => []),
          apiCached("/Products-Media", { params: { pageSize: 200 } }).catch(() => []),
        ]);
        const products = (Array.isArray(productsRaw) ? productsRaw : []).filter(
          (p) => p.isdeleted !== 1 && p.isdeleted !== true
        );
        const media = (Array.isArray(mediaRaw) ? mediaRaw : []).filter(
          (m) => m.isdeleted !== 1 && m.isdeleted !== true && m.media_url
        );
        const byProduct = {};
        for (const m of media) {
          (byProduct[m.product_id] ||= []).push(m);
        }
        const used = new Set();
        const pick = {};
        const pool = [...media];
        for (const key of CATEGORY_KEYS) {
          const keywords = (CATEGORIES[key]?.keywords || [key]).map((k) => String(k).toLowerCase());
          const hitProduct = products.find((p) => {
            const text = `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
            return keywords.some((k) => k && text.includes(k));
          });
          let hit = (byProduct[hitProduct?.product_id] || []).find((m) => !used.has(m.product_media_id));
          if (!hit) hit = pool.find((m) => !used.has(m.product_media_id));
          if (hit) {
            used.add(hit.product_media_id);
            pick[key] = resolveUploadUrl(hit.media_url);
          }
        }
        if (live) setImages(pick);
        // Warm the browser image cache so back-nav never re-downloads.
        precacheMedia(Object.values(pick));
      } catch {
        /* gradients stay — section never breaks */
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  return (
    <section className="py-12 bg-[#f7f4ec] text-[#101010] md:py-16">
      <div className="w-full px-0">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            titleClassName="!text-[20px] sm:!text-[25px] md:!text-[30px] !text-neutral-500"
            eyebrowClassName="!text-[20px] sm:!text-[25px] md:!text-[30px] !leading-tight !font-display !font-bold !text-neutral-900"
          />
        </Reveal>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {cards.map((category, index) => {
            const src = category.adminImage ? resolveUploadUrl(category.adminImage) : images[category.key];
            return (
            <Reveal
              key={category.name}
              delay={index * 0.1}
              className={category.spanClass}
            >
              <Link
                href={category.href}
                className="group relative block w-full h-full overflow-hidden bg-[#101010]"
              >
                {/* Background Layer with Scale Effect (admin photo, else live DB photo, gradient fallback) */}
                {src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={src}
                    alt={category.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105 ${category.bgClass}`}
                  />
                )}
                
                {/* Overlay gradient to darken on hover */}
                <div className="absolute inset-0 bg-black/30 transition-colors duration-700 group-hover:bg-black/60" />

                {/* Animated Gold Border Layer */}
                <div className="absolute inset-4 border border-transparent transition-colors duration-700 group-hover:border-[#c6a15b]/60 z-10 pointer-events-none" />

                {/* Content */}
                <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end text-[#f7f4ec] z-20">
                  <div>
                    <h3 className="font-display !text-[32px] !leading-tight mb-0 text-[#f7f4ec] font-medium tracking-wide">
                      {category.name}
                    </h3>
                    <p className="mt-0 max-h-0 max-w-xs overflow-hidden text-[#f7f4ec]/80 opacity-0 translate-y-2 transition-all duration-500 ease-out group-hover:mt-3 group-hover:mb-5 group-hover:max-h-24 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:mb-5 group-focus-within:max-h-24 group-focus-within:translate-y-0 group-focus-within:opacity-100 !text-[15px] leading-relaxed font-sans font-light">
                      {category.tagline}
                    </p>
                    <div className="inline-flex items-center space-x-3 text-[#c6a15b] uppercase tracking-[0.2em] !text-[14px] font-semibold group-hover:text-[#f7f4ec] transition-colors duration-500">
                      <span>Discover</span>
                      <motion.span 
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="inline-block"
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
