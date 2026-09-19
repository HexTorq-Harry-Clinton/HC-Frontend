"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { apiCached, precacheMedia, resolveUploadUrl } from '@/lib/api';
import { COLLECTIONS } from '@/lib/catalog';

const collections = [
  {
    key: "tuxedo",
    name: "Tuxedo",
    href: "/tuxedo",
    eyebrow: "Evening refinement",
    description: "Precision tailoring and expressive details for black-tie evenings.",
    bgGradient: "bg-gradient-to-r from-gray-900 to-gray-800", // charcoal
  },
  {
    key: "extreme-poppins",
    name: "Extreme Poppins",
    href: "/extreme-poppins",
    eyebrow: "Statement tailoring",
    description: "Bold proportions, rich fabrics, and modern ceremonial dressing.",
    bgGradient: "bg-gradient-to-r from-slate-900 to-blue-950", // navy
  },
  {
    key: "gurkha-trousers",
    name: "Gurkha Trousers",
    href: "/gurkha-trousers",
    eyebrow: "A tailoring icon",
    description: "High-waisted silhouettes, signature waist detailing.",
    bgGradient: "bg-gradient-to-r from-stone-900 to-red-950", // burgundy
  },
  {
    key: "linen-shirts-trousers",
    name: "Linen Shirts and Trousers",
    href: "/linen-shirts-trousers",
    eyebrow: "Relaxed sophistication",
    description: "Breathable natural texture meets clean tailoring.",
    bgGradient: "bg-gradient-to-r from-zinc-900 to-emerald-950", // olive
  },
  {
    key: "cigarettes",
    name: "88 Cigarettes",
    href: "/cigarettes",
    eyebrow: "The signature line",
    description: "Sharp, directional collection built around sleek lines.",
    bgGradient: "bg-gradient-to-r from-neutral-900 to-slate-900", // slate
  }
];

export default function CollectionsEditorial() {
  // TEMPORARY imagery: random live DB assets per collection until the content
  // team uploads final editorial photos. Keyword-matched, de-duplicated.
  const [images, setImages] = useState({});

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
        for (const key of Object.keys(COLLECTIONS)) {
          const def = COLLECTIONS[key];
          const keywords = [...(def.keywords || []), def.category, def.title]
            .map((k) => String(k || "").toLowerCase())
            .filter(Boolean);
          const hitProduct = products.find((p) => {
            const text = `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
            return keywords.some((k) => text.includes(k));
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
    <section className="py-24 px-4 md:px-8 bg-[#f7f4ec]">
      <div className="max-w-7xl mx-auto">
        <SectionHeading 
          eyebrow="SIGNATURE COLLECTIONS" 
          title="The Edits" 
        />
        
        <div className="mt-16 space-y-12">
          {collections.map((collection, index) => {
            const isEven = index % 2 === 0;
            return (
              <Reveal key={collection.name}>
                <Link href={collection.href} className="block group">
                  <div className={`relative w-full rounded-2xl overflow-hidden shadow-xl transition-all duration-700 ease-out hover:shadow-2xl hover:scale-[1.01] ${collection.bgGradient}`}>
                    {images[collection.key] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={images[collection.key]}
                          alt={collection.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-neutral-950/55 transition-colors duration-700 group-hover:bg-neutral-950/65" />
                      </>
                    ) : null}
                    <div className={`absolute top-0 bottom-0 w-1/2 pointer-events-none opacity-20 bg-gradient-to-b from-white/10 to-transparent transition-opacity duration-700 group-hover:opacity-30 ${isEven ? 'left-0' : 'right-0'}`} />
                    
                    <div className={`flex flex-col relative z-10 px-8 py-16 md:px-16 md:py-24 w-full md:w-3/5 lg:w-1/2 ${isEven ? 'ml-auto text-left' : 'mr-auto text-left md:text-right md:items-end'}`}>
                      <span className="text-[#c6a15b] font-semibold tracking-widest text-sm uppercase mb-4 block">
                        {collection.eyebrow}
                      </span>
                      <h3 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
                        {collection.name}
                      </h3>
                      <p className={`font-sans text-gray-300 text-lg md:text-xl mb-10 leading-relaxed max-w-md ${isEven ? '' : 'md:text-right'}`}>
                        {collection.description}
                      </p>
                      <div className="flex items-center text-[#c6a15b] font-medium tracking-wide uppercase text-sm group/link w-fit">
                        <span className="mr-2">Explore Collection</span>
                        <svg 
                          className="w-5 h-5 transform transition-transform duration-300 group-hover/link:translate-x-2" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
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
