import { apiGet, unwrap } from "@/lib/api";
import { mapProduct } from "@/lib/shop";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export const revalidate = 300;
export const metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage() {
  const [products, media] = await Promise.all([
    apiGet("/Products").then(unwrap).catch(() => []),
    apiGet("/Products-Media").then(unwrap).catch(() => []),
  ]);
  const latest = products
    .filter((p) => p.isdeleted !== true)
    .sort((a, b) => new Date(b.rcm || 0) - new Date(a.rcm || 0))
    .slice(0, 12)
    .map((p) => mapProduct(p, media));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <Reveal>
        <h1 className="text-center font-display text-5xl font-bold">New Arrivals</h1>
        <p className="mt-3 text-center text-neutral-500">Fresh off the cutting table.</p>
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {latest.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
