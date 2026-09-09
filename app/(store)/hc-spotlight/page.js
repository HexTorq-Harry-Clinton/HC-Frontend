import Link from "next/link";
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";

export const revalidate = 300;
export const metadata = { title: "HC Spotlight" };

const MARQUEE = ["HC SPOTLIGHT", "·", "EDITORIAL", "·", "BEHIND THE SEAMS", "·", "HARRY CLINTON", "·", "THE CRAFT", "·"];

// Spotlight editorial: same structure/texts as the previous UI,
// plus live entries appended from the API.
export default async function HCSpotlightPage() {
  const [entries, media] = await Promise.all([
    apiGet("/Spotlight-Entries").then(unwrap).catch(() => []),
    apiGet("/Spotlight-Media").then(unwrap).catch(() => []),
  ]);
  const live = (Array.isArray(entries) ? entries : []).filter((e) => e.isactive !== false).map((e) => {
    const m = (Array.isArray(media) ? media : []).find((x) => x.spotlight_entry_id === e.spotlight_entry_id);
    return { title: e.title, sub: e.description, img: resolveUploadUrl(m?.media_url) };
  });

  return (
    <div>
      <section className="bg-neutral-950 py-20 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Harry Clinton</p>
        <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">HC Spotlight</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-300">Editorials, stories and craft features from the world of Harry Clinton.</p>
        <a href="#spotlight-content" className="btn-primary mt-6 !bg-white !text-neutral-950 hover:!bg-gold">
          Read Now
        </a>
      </section>

      <div className="overflow-hidden border-b border-neutral-200 bg-white">
        <div className="animate-marquee py-3">
          {Array(4).fill(MARQUEE).flat().map((word, idx) => (
            <span key={idx} className="mx-4 font-bold uppercase">{word}</span>
          ))}
        </div>
      </div>

      <div id="spotlight-content" className="mx-auto max-w-7xl px-4 py-14">
        <p className="eyebrow text-neutral-500">Cover Story</p>
        <div className="mt-4 border border-neutral-200 p-8 md:p-12">
          <p className="eyebrow text-gold">Cover Story</p>
          <h2 className="mt-2 font-display text-4xl font-bold">The Art of the Perfect Suit</h2>
          <p className="mt-3 max-w-3xl text-neutral-600">
            From the first drape of fabric to the final stitch, every Harry Clinton suit is a study in restraint and precision. We go behind the seams of our most celebrated silhouette.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-500">Editorial · June 2025</p>
        </div>

        <p className="eyebrow mt-14 text-neutral-500">More Spotlights</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SpotCard badge="Spotlight" title="The Wedding Edit" sub="Ceremonial Tailoring · 2025" />
          <SpotCard badge="Spotlight" title="Smart Casual Redefined" sub="Everyday Luxury · 2025" />
          <SpotCard badge="New" title="Nano Collection Preview" sub="Designer Series · 2025" />
          {live.map((e, i) => (
            <SpotCard key={`live-${i}`} badge="Spotlight" title={e.title} sub={e.sub} img={e.img} />
          ))}
        </div>

        <div className="mt-14 border border-neutral-200 p-8 md:p-12">
          <p className="eyebrow text-gold">In Focus</p>
          <h2 className="mt-2 font-display text-4xl font-bold">Travel Ready, Always Refined</h2>
          <p className="mt-3 max-w-3xl text-neutral-600">
            Our Travel Collection is engineered for the man who moves between boardrooms and airports without losing a single crease. Wrinkle-resistant, breathable, impeccable.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-500">Collection Feature · May 2025</p>
        </div>

        <blockquote className="mx-auto mt-14 max-w-3xl text-center">
          <p className="font-display text-2xl italic leading-snug md:text-3xl">
            &ldquo;A suit is not merely clothing — it is the architecture of a man&apos;s presence.&rdquo;
          </p>
          <cite className="mt-3 block text-xs uppercase tracking-[0.25em] text-neutral-500 not-italic">
            — Harry Clinton, Founder
          </cite>
        </blockquote>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <Link href="/business" className="group border border-neutral-200 p-8 transition-colors hover:border-gold">
            <p className="eyebrow text-gold">Business</p>
            <p className="mt-2 font-display text-2xl font-bold">Power Dressing, Perfected</p>
            <span className="link-sweep mt-3 inline-block text-xs font-semibold uppercase tracking-[0.2em]">Explore</span>
          </Link>
          <Link href="/wedding" className="group border border-neutral-200 p-8 transition-colors hover:border-gold">
            <p className="eyebrow text-gold">Occasion</p>
            <p className="mt-2 font-display text-2xl font-bold">Celebrations in Style</p>
            <span className="link-sweep mt-3 inline-block text-xs font-semibold uppercase tracking-[0.2em]">Explore</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SpotCard({ badge, title, sub, img }) {
  return (
    <div className="border border-neutral-200">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={title} loading="lazy" style={{ height: "220px", width: "100%", objectFit: "cover" }} />
      ) : (
        <div className="flex h-56 items-center justify-center bg-neutral-100">
          <span className="font-display text-xl text-neutral-300">HC</span>
        </div>
      )}
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{badge}</p>
        <p className="mt-1 font-display text-xl font-bold">{title}</p>
        <p className="mt-1 text-xs text-neutral-500">{sub}</p>
      </div>
    </div>
  );
}
