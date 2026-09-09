"use client";

import Link from "next/link";
import { useState } from "react";

const FILTERS = ["All", "Formal", "Smart Casual", "Wedding", "Travel"];

const LOOKS = [
  { title: "The Ivory Ceremony", tag: "Wedding", badge: "Bridal Season", desc: "Ivory double-breasted suit with hand-stitched lapels." },
  { title: "The Designer Cut", tag: "Formal", badge: "New Season", desc: "Structured silhouette for the modern executive." },
  { title: "Jet Set Traveller", tag: "Travel", badge: "Essential", desc: "Wrinkle-resistant linen blend, cabin-ready." },
  { title: "Smart Weekend", tag: "Smart Casual", badge: "Weekend Edit", desc: "Relaxed tailoring without compromising on elegance." },
  { title: "Label Edition", tag: "Formal", badge: "Signature", desc: "Our signature label cut — timeless, authoritative." },
  { title: "Nano Collection", tag: "Smart Casual", badge: "Limited", desc: "Micro-textured fabric for a next-gen smart casual look." },
];

const TIPS = [
  { no: "01", title: "Fit First", desc: "No fabric compensates for poor fit. Always start with the silhouette." },
  { no: "02", title: "Fabric for Occasion", desc: "Wool for formal, linen for warm climates, blends for travel." },
  { no: "03", title: "Colour Confidence", desc: "Navy and charcoal are universals. Build from there." },
  { no: "04", title: "Detail Matters", desc: "Buttons, lapels and pocket squares are the punctuation of a suit." },
];

// Style by HC editorial: same structure/texts as the previous UI,
// plus live collections appended from the API.
export default function StyleByHCView({ liveCollections }) {
  const [filter, setFilter] = useState("All");
  const looks = LOOKS.filter((l) => filter === "All" || l.tag === filter);

  return (
    <div>
      <section className="bg-neutral-950 py-20 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Harry Clinton</p>
        <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">Style by HC</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-300">Curated looks, style guides and outfit inspiration from our in-house stylists.</p>
        <a href="#style-content" className="btn-primary mt-6 !bg-white !text-neutral-950 hover:!bg-gold">
          Explore Looks
        </a>
      </section>

      <div className="overflow-hidden border-b border-neutral-200 bg-white">
        <div className="animate-marquee py-3">
          {Array(4).fill(["STYLE BY HC", "·", "THE LOOK", "·", "HOW TO WEAR IT", "·", "HARRY CLINTON", "·", "CURATED STYLE", "·"]).flat().map((word, idx) => (
            <span key={idx} className="mx-4 font-bold uppercase">{word}</span>
          ))}
        </div>
      </div>

      <div id="style-content" className="mx-auto max-w-7xl px-4 py-14">
        <p className="eyebrow text-neutral-500">Style Guide</p>
        <div className="mt-4 border border-neutral-200 p-8 md:p-12">
          <p className="eyebrow text-gold">Style Guide</p>
          <h2 className="mt-2 font-display text-4xl font-bold">How to Dress for the Boardroom</h2>
          <p className="mt-3 max-w-3xl text-neutral-600">
            Power dressing is not about loudness. It is about precision — the right fit, the right fabric, the right cut. Our stylists break down the anatomy of a commanding business ensemble.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-500">Style Guide · June 2025</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map((t) => (
            <div key={t.no} className="border border-neutral-200 p-6">
              <p className="font-display text-3xl font-bold text-gold">{t.no}</p>
              <p className="mt-2 font-semibold">{t.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{t.desc}</p>
            </div>
          ))}
        </div>

        <p className="eyebrow mt-14 text-neutral-500">Curated Looks</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`border px-5 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                filter === f ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 hover:border-neutral-950"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {looks.map((l) => (
            <div key={l.title} className="border border-neutral-200 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{l.badge}</p>
              <p className="mt-1 font-display text-xl font-bold">{l.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{l.tag}</p>
              <p className="mt-2 text-sm text-neutral-600">{l.desc}</p>
            </div>
          ))}
          {(liveCollections || []).map((c) => (
            <div key={c.style_collection_id} className="border border-neutral-200 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Collection</p>
              <p className="mt-1 font-display text-xl font-bold">{c.style_collection_name}</p>
              <p className="mt-2 text-sm text-neutral-600">{c.description || c.short_description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 border border-neutral-200 p-8 md:p-12">
          <p className="eyebrow text-gold">Travel Style</p>
          <h2 className="mt-2 font-display text-4xl font-bold">Packing Light, Dressing Heavy</h2>
          <p className="mt-3 max-w-3xl text-neutral-600">
            The seasoned traveller knows: one suit, infinite occasions. Our Travel edit ensures you look impeccable from take-off to keynote.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-500">Style Guide · May 2025</p>
        </div>

        <blockquote className="mx-auto mt-14 max-w-3xl text-center">
          <p className="font-display text-2xl italic leading-snug md:text-3xl">
            &ldquo;Style is not what you wear — it is how you carry what you wear.&rdquo;
          </p>
          <cite className="mt-3 block text-xs uppercase tracking-[0.25em] text-neutral-500 not-italic">
            — HC House of Style
          </cite>
        </blockquote>

        <div className="mt-14 bg-neutral-950 px-6 py-12 text-center text-white">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to build your look?</h2>
          <p className="mx-auto mt-2 max-w-xl text-neutral-300">Book a Personal Styling Session</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-neutral-400">Sit with one of our in-house stylists and let us curate your wardrobe from scratch.</p>
          <Link href="/book-appointment" className="btn-primary mt-6 !bg-gold !text-neutral-950 hover:!bg-white">
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
