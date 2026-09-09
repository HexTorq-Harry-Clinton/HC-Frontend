import Link from "next/link";
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import NewArrivalsGrid from "@/components/NewArrivalsGrid";

export const revalidate = 300;
export const metadata = { title: "New Arrivals" };

// New Arrivals: same structure/texts as the previous UI.
export default async function NewArrivalsPage() {
  const [products, media] = await Promise.all([
    apiGet("/Products").then(unwrap).catch(() => []),
    apiGet("/Products-Media").then(unwrap).catch(() => []),
  ]);
  const latest = products
    .filter((p) => p.isdeleted !== true && (p.isactive === 1 || p.isactive === true || p.is_active === 1 || p.is_active === true))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 24)
    .map((p) => {
      const m =
        media.find((x) => x.product_id === p.product_id && (x.isprimary === 1 || x.isprimary === true)) ||
        media.find((x) => x.product_id === p.product_id);
      return {
        id: p.product_id,
        slug: p.product_slug,
        name: p.product_name,
        price: p.base_price,
        image: resolveUploadUrl(m?.media_url || m?.image_url) || null,
      };
    });

  const marquee = ["NEW ARRIVALS", "·", "JUST DROPPED", "·", "LATEST CUTS", "·", "FRESH STYLES", "·", "HARRY CLINTON", "·"];

  return (
    <div>
      <section className="bg-neutral-950 py-20 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Just Dropped</p>
        <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">New Arrivals</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-300">The latest additions,crafted for the modern gentleman.</p>
        <a href="#new-arrivals-grid" className="btn-primary mt-6 !bg-white !text-neutral-950 hover:!bg-gold">
          Explore Now
        </a>
      </section>

      <div className="overflow-hidden border-b border-neutral-200 bg-white">
        <div className="animate-marquee py-3">
          {Array(4).fill(marquee).flat().map((word, idx) => (
            <span key={idx} className="mx-4 font-bold uppercase">
              {word}
            </span>
          ))}
        </div>
      </div>

      <div id="new-arrivals-grid" className="mx-auto max-w-7xl px-4 py-12">
        <NewArrivalsGrid products={latest} />
      </div>
    </div>
  );
}
