"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Shared listing template for /hc-spotlight and /style-by-hc:
// hero slider → section header → photo collage → explore-all grid.
// Every card opens the mediator detail page; buying stays on /product/<slug>.
export default function ShowcaseListing({ eyebrow, title, blurb, cards = [] }) {
  const slides = cards.filter((c) => c.image).slice(0, 8);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const [lead, ...rest] = cards;

  return (
    <div className="bg-white">
      {/* ===== HERO SLIDER ===== */}
      {slides.length > 0 && (
        <section className="relative h-[62vh] min-h-[420px] overflow-hidden bg-neutral-950">
          {slides.map((s, i) => (
            <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            </div>
          ))}
          <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-4 md:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80">
              {slides[active]?.subtitle || eyebrow}
            </p>
            <h1 className="mt-2 max-w-xl font-display text-5xl font-bold leading-tight text-white md:text-6xl">
              {slides[active]?.title}
            </h1>
            <Link
              href={slides[active]?.href || "#spotlight-grid"}
              className="mt-6 inline-flex w-fit items-center gap-2 border border-white/60 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white hover:text-neutral-950"
            >
              View the story →
            </Link>
          </div>
          {slides.length > 1 && (
            <div className="absolute bottom-5 right-6 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-white/80">
              <span>0{active + 1}</span>
              <span className="inline-block h-px w-8 bg-white/60" />
              <span>0{slides.length}</span>
            </div>
          )}
        </section>
      )}

      {/* ===== SECTION HEADER ===== */}
      <section className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-10 md:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-500">
            {eyebrow === "Style by HC" ? "The best of this month" : "The best of this month"}
          </p>
          <h2 className="mt-1 font-display text-4xl font-bold text-neutral-950 md:text-5xl">{title}</h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-neutral-500">{blurb}</p>
        <a href="#spotlight-grid" className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-900">
          Explore all →
        </a>
      </section>

      {/* ===== PHOTO COLLAGE ===== */}
      {lead && (
        <section className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-2 md:px-8">
          <Link href={lead.href} className="group relative block min-h-[420px] overflow-hidden bg-neutral-100 md:min-h-[560px]">
            {lead.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lead.image} alt={lead.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-16">
              {lead.subtitle && <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">{lead.subtitle}</span>}
              <span className="mt-1 block font-display text-3xl font-bold text-white">{lead.title}</span>
            </span>
          </Link>
          <div className="grid grid-rows-2 gap-4">
            {rest.slice(0, 1).map((c) => (
              <Link key={c.id} href={c.href} className="group relative block min-h-[200px] overflow-hidden bg-neutral-100">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
                  <span className="block font-display text-2xl font-bold text-white">{c.title}</span>
                </span>
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-4">
              {rest.slice(1, 3).map((c) => (
                <Link key={c.id} href={c.href} className="group relative block min-h-[200px] overflow-hidden bg-neutral-100">
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                    <span className="block font-display text-lg font-bold leading-tight text-white">{c.title}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== EXPLORE ALL ===== */}
      <section id="spotlight-grid" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-500">Explore all</p>
        {cards.length === 0 ? (
          <p className="mt-4 border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            New stories are being styled — check back soon.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map((c) => (
              <Link key={c.id} href={c.href} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                    {c.subtitle && <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">{c.subtitle}</span>}
                    <span className="mt-1 block font-display text-xl font-bold leading-tight text-white">{c.title}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
