"use client";

import { useMemo, useState } from "react";
import ProductCard, { PLACEHOLDER_IMAGE } from "./ProductCard";

// Client-side filter + grid. Receives server-fetched products as props (SEO-friendly SSR,
// interactive filtering without refetch).
export default function CategoryView({ products, sizes = [], clothTypes = [], colors = [] }) {
  const [size, setSize] = useState("");
  const [cloth, setCloth] = useState("");
  const [color, setColor] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (size && !(p.sizes || []).includes(size)) return false;
      if (cloth && !(p.clothTypes || []).includes(cloth)) return false;
      if (color && (p.color || "").toLowerCase() !== color.toLowerCase()) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
      return true;
    });
  }, [products, size, cloth, color, maxPrice]);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Size</p>
          <select value={size} onChange={(e) => setSize(e.target.value)} className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm">
            <option value="">All sizes</option>
            {sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Fabric</p>
          <select value={cloth} onChange={(e) => setCloth(e.target.value)} className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm">
            <option value="">All fabrics</option>
            {clothTypes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {colors.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Colour</p>
            <select value={color} onChange={(e) => setColor(e.target.value)} className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm">
              <option value="">All colours</option>
              {colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Max price (₹)</p>
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="numeric" placeholder="e.g. 5000" className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </aside>

      <div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PLACEHOLDER_IMAGE} alt="No pieces yet" className="mx-auto w-28 opacity-70" />
            <h3 className="mt-4 font-display text-2xl">No pieces yet</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Our stylists are curating this collection. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
