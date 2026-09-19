"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CategoryView from "./CategoryView";

// Collection view: hero + search + filters + cards, same as the previous UI.
export default function CollectionView({ meta, products, sizes, clothTypes, colors }) {
  const [search, setSearch] = useState("");

  const searched = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) =>
      `${p.name || ""} ${p.description || ""}`.toLowerCase().includes(needle)
    );
  }, [products, search]);

  const COLLECTION_VIDEOS = {
    cigarettes: "/brand/88-cigarettes.mp4",
    cigarette: "/brand/88-cigarettes.mp4",
    tuxedo: "/brand/luxury-wedding-home.mp4",
    "extreme-poppins": "/brand/wedding-label.mp4",
  };
  const bannerVideo = meta.bannerVideo || COLLECTION_VIDEOS[meta.category] || COLLECTION_VIDEOS[meta.slug] || null;

  return (
    <>
      <section className="relative overflow-hidden bg-neutral-950">
        {bannerVideo ? (
          <video
            src={bannerVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-[520px] w-full object-cover opacity-55"
          />
        ) : meta.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.bannerImage} alt={meta.title} className="h-[480px] w-full object-cover" />
        ) : (
          <div className="h-[380px] w-full bg-[radial-gradient(ellipse_at_top,#3a3a3a,#0a0a0a_70%)]" />
        )}
        <div className="absolute inset-0 flex flex-col items-start justify-center bg-black/40 px-6 text-white md:px-16">
          <span className="eyebrow text-gold">{meta.eyebrow}</span>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">{meta.title}</h1>
          <p className="mt-3 max-w-xl text-neutral-200">{meta.description}</p>
          <a href="#collection-products" className="btn-primary mt-6 !bg-white !text-neutral-950 hover:!bg-gold">
            Explore collection →
          </a>
        </div>
      </section>

      <div id="collection-products" className="mx-auto max-w-7xl px-4 py-12">
        <p className="eyebrow text-neutral-500">Curated by House of Cavani</p>
        <h2 className="mt-1 font-display text-3xl font-bold">{meta.title}</h2>
        <label className="mt-6 flex max-w-md items-center gap-2 border border-neutral-300 px-3 py-2">
          <span className="visually-hidden">Search this collection</span>
          <span aria-hidden>🔍</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collection"
            className="w-full text-sm focus:outline-none"
          />
        </label>
        <div className="mt-6">
          <CategoryView
            products={searched}
            sizes={sizes}
            clothTypes={clothTypes}
            colors={colors}
            showToolbar={true}
            showSort={false}
            emptyTitle="No pieces match your filters or search."
          />
        </div>
      </div>
      <style jsx>{`
        .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      `}</style>
    </>
  );
}
