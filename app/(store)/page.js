import Link from "next/link";
import { getHomeData } from "@/lib/shop";
import Hero from "@/components/Hero";
import OfferBar from "@/components/OfferBar";
import HomeVideo from "@/components/HomeVideo";
import SplashScreen from "@/components/SplashScreen";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export const revalidate = 300;

export default async function HomePage() {
  const { sliders, spotlight, styleCollections, faqs, featured } = await getHomeData();

  return (
    <>
      <SplashScreen />
      <Hero
        title="Wear Royalty, Not Just Suits."
        tagline="Bespoke menswear from Harry Clinton — suits, shirts, trousers and Indo-Western, cut for your moments."
        ctaHref="#featured"
      />

      <OfferBar />

      <section id="featured" className="mx-auto max-w-7xl px-4 py-16">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Featured</p>
          <h2 className="mt-2 text-center font-display text-4xl font-bold">The Edit</h2>
        </Reveal>
        {featured.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-500">
            Fresh pieces are being tailored — check back soon.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {sliders.length > 0 && (
        <section className="bg-neutral-100 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <Reveal>
              <h2 className="text-center font-display text-4xl font-bold">Highlights</h2>
            </Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {sliders.slice(0, 3).map((s) => (
                <div key={s.image_slider_id} className="bg-white p-6 text-center shadow-sm">
                  <p className="font-display text-xl">{s.title || s.heading}</p>
                  {(s.subtitle || s.description) && (
                    <p className="mt-2 text-sm text-neutral-500">{s.subtitle || s.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {spotlight.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <Reveal>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">HC Spotlight</p>
            <h2 className="mt-2 text-center font-display text-4xl font-bold">In the Limelight</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {spotlight.slice(0, 3).map((s) => (
              <div key={s.spotlight_entry_id} className="border border-neutral-200 p-6">
                <p className="font-display text-xl">{s.title}</p>
                {s.description && <p className="mt-2 text-sm text-neutral-500">{s.description}</p>}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/hc-spotlight" className="text-sm font-semibold underline">View all</Link>
          </div>
        </section>
      )}

      {styleCollections.length > 0 && (
        <section className="bg-neutral-950 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4">
            <Reveal>
              <h2 className="text-center font-display text-4xl font-bold">Style by HC</h2>
            </Reveal>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {styleCollections.slice(0, 6).map((c) => (
                <span key={c.style_collection_id} className="rounded-full border border-neutral-700 px-5 py-2 text-sm">
                  {c.style_collection_name}
                </span>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/style-by-hc" className="text-sm font-semibold underline">Explore</Link>
            </div>
          </div>
        </section>
      )}

      <HomeVideo />

      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-16">
          <Reveal>
            <h2 className="text-center font-display text-4xl font-bold">Questions, Answered</h2>
          </Reveal>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <details key={f.faq_id} className="border border-neutral-200 p-4">
                <summary className="cursor-pointer font-medium">{f.question}</summary>
                <p className="mt-2 text-sm text-neutral-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
