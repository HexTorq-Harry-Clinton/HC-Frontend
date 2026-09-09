import Link from "next/link";
import { getHomeData } from "@/lib/shop";
import { apiGet, unwrap } from "@/lib/api";
import Hero from "@/components/Hero";
import OfferBar from "@/components/OfferBar";
import HomeVideo from "@/components/HomeVideo";
import SplashScreen from "@/components/SplashScreen";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import NewsletterForm from "@/components/NewsletterForm";

export const revalidate = 300;

const COLLECTION_TILES = [
  { href: "/suits", title: "Suits", note: "Boardroom to ballroom" },
  { href: "/shirts", title: "Shirts", note: "Cut closer, worn sharper" },
  { href: "/trousers", title: "Trousers", note: "Tailored to move" },
  { href: "/indowestern", title: "Indo-Western", note: "Heritage, modern cut" },
  { href: "/babysuits", title: "Baby Suits", note: "Little gentlemen" },
];

const SERVICES = [
  { href: "/custom-tailoring", title: "Custom Tailoring", note: "Measured, cut and sewn for one body — yours." },
  { href: "/embroidery", title: "Embroidery", note: "Hand threadwork that signs your piece." },
  { href: "/alterations", title: "Alterations", note: "A perfect fit, even after the fact." },
  { href: "/personal-styling", title: "Personal Styling", note: "A stylist in your corner, on call." },
];

export default async function HomePage() {
  const [{ sliders, spotlight, styleCollections, faqs, featured }, reviews] = await Promise.all([
    getHomeData(),
    apiGet("/Reviews").then(unwrap).catch(() => []),
  ]);
  const testimonials = reviews
    .filter((r) => r.is_approved !== false && r.isdeleted !== true)
    .slice(0, 3);

  return (
    <>
      <SplashScreen />
      <Hero
        title="Wear Royalty, Not Just Suits."
        tagline="Bespoke menswear from Harry Clinton — suits, shirts, trousers and Indo-Western, cut for your moments."
        ctaHref="#featured"
      />

      <OfferBar />

      <section id="featured" className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <SectionHeading eyebrow="Featured" title="The Edit" sub="This season's sharpest cuts." />
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

      <section className="bg-ink py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading dark eyebrow="Collections" title="Shop by Craft" sub="Five disciplines, one standard." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLLECTION_TILES.map((t, i) => (
              <Reveal key={t.href} delay={i * 0.07}>
                <Link
                  href={t.href}
                  className="group flex min-h-56 flex-col justify-end border border-neutral-800 bg-neutral-900 p-6 transition-colors duration-300 hover:border-gold"
                >
                  <p className="eyebrow text-gold">0{i + 1}</p>
                  <p className="mt-2 font-display text-2xl font-bold transition-transform duration-300 group-hover:-translate-y-1">{t.title}</p>
                  <p className="mt-1 text-sm text-neutral-400">{t.note}</p>
                  <span className="link-sweep mt-3 w-fit text-xs font-semibold uppercase tracking-[0.2em]">Explore →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {sliders.length > 0 && (
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <SectionHeading eyebrow="Highlights" title="This Week at HC" />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {sliders.slice(0, 3).map((s, i) => (
                <Reveal key={s.image_slider_id} delay={i * 0.08}>
                  <div className="bg-white p-8 text-center shadow-sm transition-shadow duration-300 hover:shadow-md">
                    <p className="font-display text-xl">{s.title || s.heading}</p>
                    {(s.subtitle || s.description) && (
                      <p className="mt-2 text-sm text-neutral-500">{s.subtitle || s.description}</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {spotlight.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <SectionHeading eyebrow="HC Spotlight" title="In the Limelight" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {spotlight.slice(0, 3).map((s, i) => (
              <Reveal key={s.spotlight_entry_id} delay={i * 0.08}>
                <div className="group border border-neutral-200 p-6 transition-colors duration-300 hover:border-gold">
                  <p className="font-display text-xl">{s.title}</p>
                  {s.description && <p className="mt-2 text-sm text-neutral-500">{s.description}</p>}
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/hc-spotlight" className="link-sweep text-sm font-semibold">View all</Link>
          </div>
        </section>
      )}

      <section className="bg-ink py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading dark eyebrow="Atelier" title="Services Beyond the Rack" sub="The house takes care of the rest." />
          <div className="mt-10 grid gap-px bg-neutral-800 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <Link key={s.href} href={s.href} className="group bg-neutral-950 p-8 transition-colors duration-300 hover:bg-neutral-900">
                <p className="font-display text-xl font-bold group-hover:text-gold">{s.title}</p>
                <p className="mt-2 text-sm text-neutral-400">{s.note}</p>
                <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gold">Discover →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {styleCollections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <SectionHeading eyebrow="Lookbook" title="Style by HC" />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {styleCollections.slice(0, 6).map((c) => (
              <span key={c.style_collection_id} className="rounded-full border border-neutral-300 px-5 py-2 text-sm transition hover:border-gold hover:text-gold-deep">
                {c.style_collection_name}
              </span>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/style-by-hc" className="link-sweep text-sm font-semibold">Explore</Link>
          </div>
        </section>
      )}

      <HomeVideo />

      {testimonials.length > 0 && (
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <SectionHeading eyebrow="Word of Mouth" title="Worn & Loved" />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.review_id} delay={i * 0.08}>
                  <figure className="flex h-full flex-col bg-white p-8 shadow-sm">
                    <p className="text-gold">{"★".repeat(Math.min(Number(t.rating) || 5, 5))}</p>
                    <blockquote className="mt-3 flex-1 font-display text-lg leading-snug">
                      “{t.review_text}”
                    </blockquote>
                    <figcaption className="mt-4 text-xs uppercase tracking-[0.2em] text-neutral-500">
                      {t.review_title || "Verified patron"}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-8 bg-ink p-10 text-white md:grid-cols-2 md:p-14">
          <Reveal>
            <p className="eyebrow text-gold">By Appointment</p>
            <h2 className="mt-2 font-display text-4xl font-bold">Sit With a Stylist</h2>
            <p className="mt-3 text-neutral-300">Measurements, fabric, occasion — sorted over a single sitting.</p>
          </Reveal>
          <Reveal delay={0.1} className="md:text-right">
            <Link href="/book-appointment" className="btn-primary !bg-gold !text-neutral-950 hover:!bg-white">
              Book Appointment
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-4 pt-4">
        <SectionHeading eyebrow="The Circle" title="First to Know" sub="Drops, trunk shows and private previews." />
        <div className="mx-auto mt-6 max-w-md">
          <NewsletterForm />
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-16 md:py-24">
          <SectionHeading eyebrow="Help" title="Questions, Answered" />
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <details key={f.faq_id} className="group border border-neutral-200 bg-white p-5 transition-colors open:border-gold">
                <summary className="cursor-pointer font-medium marker:text-gold">{f.question}</summary>
                <p className="mt-2 text-sm text-neutral-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
