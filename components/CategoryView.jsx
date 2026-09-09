"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "./ProductCard";
import EmptyState from "./EmptyState";

// Client-side filter + sort + grid. Receives server-fetched products as props
// (SEO-friendly SSR, interactive filtering without refetch).
export default function CategoryView({ products, sizes = [], clothTypes = [], colors = [] }) {
  const [size, setSize] = useState("");
  const [cloth, setCloth] = useState("");
  const [color, setColor] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (size && !(p.sizes || []).includes(size)) return false;
      if (cloth && !(p.clothTypes || []).includes(cloth)) return false;
      if (color && (p.color || "").toLowerCase() !== color.toLowerCase()) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
      return true;
    });
    if (sort === "price-low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, size, cloth, color, maxPrice, sort]);

  const selectCls = "mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="eyebrow text-neutral-500">Size</p>
          <select value={size} onChange={(e) => setSize(e.target.value)} className={selectCls}>
            <option value="">All sizes</option>
            {sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="eyebrow text-neutral-500">Fabric</p>
          <select value={cloth} onChange={(e) => setCloth(e.target.value)} className={selectCls}>
            <option value="">All fabrics</option>
            {clothTypes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {colors.length > 0 && (
          <div>
            <p className="eyebrow text-neutral-500">Colour</p>
            <select value={color} onChange={(e) => setColor(e.target.value)} className={selectCls}>
              <option value="">All colours</option>
              {colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <p className="eyebrow text-neutral-500">Max price (₹)</p>
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="numeric" placeholder="e.g. 5000" className={selectCls} />
        </div>
      </aside>

      <div>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            {filtered.length} piece{filtered.length === 1 ? "" : "s"}
          </p>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="border border-neutral-300 bg-white px-3 py-2 text-xs uppercase tracking-widest focus:border-gold focus:outline-none">
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title="No pieces yet"
            text="Our stylists are curating this collection. Please check back soon."
          />
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
