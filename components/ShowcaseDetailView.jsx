import Link from "next/link";

// Single mediator page between the homepage sliders and the full product
// page — exactly two sections: hero banner with shop button, then the
// story row (left description + feature bullets + shop button, right full
// portrait). Buying never happens here: both shop buttons open the real
// product page (/product/<slug>) where price, cart and checkout live.
export default function ShowcaseDetailView({ eyebrow = "HC Spotlight", entry, product, productSlug, related = [], relatedHeading = "Explore more styles" }) {
  const gallery = ((entry && entry.gallery) || []).filter((g) => g.src);
  const images = gallery.filter((g) => g.type !== "video");
  const heroImage = (entry && entry.image) || (images[0] || {}).src || null;
  const detailsHref = productSlug ? `/product/${productSlug}` : (entry && entry.redirectLink) || null;
  const paragraphs = String((entry && entry.description) || product?.fullDescription || product?.description || "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Feature bullets drawn from the linked product's own details so the
  // story row always describes the real garment.
  const details = product?.details || {};
  const featureBullets = [
    { label: "Timeless Silhouette", value: details.product_fit || details.model_fit || "" },
    { label: "Exceptional Fabrics", value: details.fabric_details || "" },
    { label: "Effortless Versatility", value: details.wash_care || details.construction_type || "" },
  ].filter((b) => b.value);

  return (
    <div className="bg-white">
      {/* ===== HERO BANNER with shop button ===== */}
      <section className="relative flex min-h-[380px] items-center overflow-hidden bg-neutral-950 md:min-h-[440px]">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt={entry.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="relative w-full px-6 py-14 md:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/85">
            {entry.subtitle || "Featured story"}
          </p>
          <h1 className="mt-3 max-w-xl font-display text-5xl font-bold leading-[1.05] text-white md:text-6xl">
            {eyebrow}
          </h1>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.35em] text-white/85">
            {entry.title}
          </p>
          {detailsHref && (
            <Link
              href={detailsHref}
              className="mt-7 inline-flex items-center gap-3 border border-white/70 px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-neutral-950"
            >
              Shop the product <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </section>

      {/* ===== STORY ROW: description left, full portrait right ===== */}
      <section className="grid w-full items-stretch gap-0 px-6 py-12 md:grid-cols-2 md:gap-10 md:px-10 md:py-16">
        <div className="flex flex-col justify-center py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-neutral-500">
            The signature look
          </p>
          <span className="mt-4 block h-px w-16 bg-neutral-300" />
          <h2 className="mt-4 font-display text-5xl font-bold leading-[1.05] text-neutral-950 md:text-6xl">
            {entry.title}
          </h2>
          <span className="mt-5 block h-px w-16 bg-neutral-300" />
          {paragraphs.length > 0 ? (
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-neutral-600">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ) : (
            <p className="mt-6 text-[16px] leading-relaxed text-neutral-600">
              A closer look at the standout look of the moment. Refined, versatile, and unmistakably Harry Clinton.
            </p>
          )}
          {featureBullets.length > 0 && (
            <div className="mt-8">
              {featureBullets.map((b) => (
                <div key={b.label} className="border-t border-neutral-200 py-5 last:border-b">
                  <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-neutral-900">{b.label}</p>
                  <p className="mt-1.5 font-display text-lg text-neutral-600">{b.value}</p>
                </div>
              ))}
            </div>
          )}
          {detailsHref && (
            <Link
              href={detailsHref}
              className="mt-9 inline-flex w-fit items-center gap-3 bg-neutral-950 px-10 py-4 text-[12px] font-bold uppercase tracking-[0.3em] text-white transition hover:bg-[#c6a15b] hover:text-neutral-950"
            >
              Shop the style <span aria-hidden>→</span>
            </Link>
          )}
        </div>
        <div className="relative min-h-[480px] overflow-hidden bg-neutral-100 md:min-h-[720px]">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt={`${entry.title} — full outfit`} className="absolute inset-0 h-full w-full object-cover object-top" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400">No image yet</div>
          )}
        </div>
      </section>
      {/* ===== EXPLORE MORE STYLES ===== */}
      {related.length > 0 && (
        <section className="w-full px-6 pb-16 md:px-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-3xl font-bold text-neutral-950 md:text-4xl">
              {relatedHeading}
            </h2>
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
