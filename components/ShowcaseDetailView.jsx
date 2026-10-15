"use client";

import Link from "next/link";
import { useState } from "react";
import ReviewsSection from "./ReviewsSection";

// Shared mediator template for HC Spotlight and Style by HC detail pages.
// Editorial hero (left image, right story) → tabs → ratings/reviews →
// related looks. Buying never happens here: VIEW DETAILS opens the real
// product page (/product/<slug>) where price, cart and checkout live.
function Stars({ value = 5 }) {
  const full = Math.round(Number(value) || 0);
  return (
    <span aria-label={`${full} out of 5 stars`} className="inline-flex items-center gap-0.5 text-neutral-950">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "" : "opacity-25"}>★</span>
      ))}
    </span>
  );
}

const TABS = ["Outfit Image", "Outfit Video", "Description"];

export default function ShowcaseDetailView({
  eyebrow = "HC Spotlight",
  entry,
  product,
  productSlug,
  rating,
  featuredReview,
  related = [],
  relatedHeading = "Try it yourself",
}) {
  const [tab, setTab] = useState("Outfit Image");
  const gallery = (entry.gallery || []).filter((g) => g.src);
  const images = gallery.filter((g) => g.type !== "video");
  const video = entry.video || (gallery.find((g) => g.type === "video") || {}).src || null;
  const heroImage = entry.image || (images[0] || {}).src || null;
  const detailsHref = productSlug ? `/product/${productSlug}` : entry.redirectLink || null;
  const paragraphs = String(entry.description || product?.fullDescription || product?.description || "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-white">
      {/* ===== HERO: left image, right editorial ===== */}
      <section className="mx-auto grid max-w-7xl gap-0 px-4 py-8 md:grid-cols-2 md:py-12">
        <div className="relative min-h-[420px] overflow-hidden bg-neutral-100 md:min-h-[640px]">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt={entry.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400">No image yet</div>
          )}
        </div>
        <div className="flex flex-col justify-center bg-[#faf7f1] px-6 py-10 md:px-12 md:py-14">
          <p className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-900">
            {eyebrow}
            <span className="inline-block h-px w-20 bg-neutral-900" />
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] text-neutral-950 md:text-6xl">
            {entry.title}
          </h1>
          {entry.subtitle && (
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.35em] text-neutral-700">
              {entry.subtitle}
            </p>
          )}
          {paragraphs.length > 0 && (
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-neutral-600">
              {paragraphs.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
          {featuredReview && (
            <div className="mt-8 border-t border-neutral-300 pt-6">
              <p className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.3em] text-neutral-900">
                Review <Stars value={featuredReview.stars} />
              </p>
              <p className="mt-3 font-display text-lg italic leading-relaxed text-neutral-700">
                “{featuredReview.quote}”
              </p>
              <p className="mt-2 text-sm text-neutral-500">— {featuredReview.author}</p>
            </div>
          )}
          {detailsHref && (
            <Link
              href={detailsHref}
              className="mt-8 inline-flex w-fit items-center gap-3 bg-neutral-950 px-10 py-4 text-[12px] font-bold uppercase tracking-[0.3em] text-white transition hover:bg-[#c6a15b] hover:text-neutral-950"
            >
              {entry.ctaText || "View Details"} <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </section>

      {/* ===== TABS: image / video / description ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="border border-neutral-200 p-6 md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">{eyebrow}</p>
              <h2 className="mt-1 font-display text-3xl font-bold text-neutral-950">{entry.title}</h2>
            </div>
          </div>
          <div className="mt-6 flex gap-8 border-b border-neutral-200 text-sm">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`-mb-px pb-3 font-semibold transition ${tab === t ? "border-b-2 border-neutral-950 text-neutral-950" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-6">
            {tab === "Outfit Image" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="overflow-hidden bg-neutral-100">
                  {heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroImage} alt={entry.title} className="h-full max-h-[560px] w-full object-cover" />
                  ) : (
                    <p className="p-10 text-sm text-neutral-500">No outfit image yet.</p>
                  )}
                </div>
                <div>
                  {video ? (
                    <video src={video} className="max-h-[300px] w-full bg-neutral-950" controls playsInline preload="metadata" />
                  ) : (
                    <p className="text-sm text-neutral-500">No outfit video yet.</p>
                  )}
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-500">Outfit of the month</p>
                  <h3 className="mt-1 font-display text-3xl font-bold text-neutral-950">{entry.title}</h3>
                  {paragraphs.length > 0 && <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{paragraphs[0]}</p>}
                </div>
              </div>
            )}
            {tab === "Outfit Video" && (
              video ? (
                <video src={video} className="max-h-[70vh] w-full bg-neutral-950" controls playsInline preload="metadata" />
              ) : (
                <p className="text-sm text-neutral-500">No outfit video yet — check back soon.</p>
              )
            )}
            {tab === "Description" && (
              <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-neutral-600">
                {paragraphs.length > 0 ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p>No description yet.</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== RATINGS + REVIEWS (linked product) ===== */}
      {product ? (
        <div className="bg-[#faf7f1]">
          <ReviewsSection productId={product.id} initialReviews={product.reviews || []} summary={product.ratingSummary} />
          {productSlug && (
            <div className="mx-auto max-w-7xl px-4 pb-12 text-center">
              <Link
                href={`/product/${productSlug}`}
                className="inline-flex items-center gap-3 bg-neutral-950 px-10 py-4 text-[12px] font-bold uppercase tracking-[0.3em] text-white transition hover:bg-[#c6a15b] hover:text-neutral-950"
              >
                Shop this look <span aria-hidden>→</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        rating && (
          <section className="mx-auto max-w-7xl px-4 py-10">
            <p className="flex items-center gap-3 text-sm text-neutral-600">
              <Stars value={rating.avg} />
              <span>{Number(rating.avg || 0).toFixed(1)} · {rating.count || 0} reviews</span>
            </p>
          </section>
        )
      )}

      {/* ===== TRY IT YOURSELF ===== */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">{eyebrow}</p>
              <h2 className="mt-1 font-display text-4xl font-bold text-neutral-950">{relatedHeading}</h2>
            </div>
            <Link href={related.length ? related[0].href.split("/").slice(0, 2).join("/") : "#"} className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-900">
              Explore all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={r.href} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : null}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-left">
                    <span className="block font-display text-xl font-bold text-white">{r.title}</span>
                    {r.subtitle && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">{r.subtitle}</span>}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
