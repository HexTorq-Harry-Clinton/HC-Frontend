"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "./ProductCard";
import EmptyState from "./EmptyState";

// Filter sidebar + grid: same labels/options/flow as the previous UI
// (Filters/Reset, Size, Fabric, Color, Price Range Min–Max, Range footer).
// Receives server-fetched products as props (SEO-friendly SSR).
// showToolbar=false hides the count/sort row (occasion storytelling pages).
export default function CategoryView({ products, sizes = [], clothTypes = [], colors = [], showToolbar = true, showSort = true, emptyTitle = "No pieces yet" }) {
  const [size, setSize] = useState("");
  const [clothType, setClothType] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");

  const reset = () => {
    setSize("");
    setClothType("");
    setColor("");
    setMinPrice("");
    setMaxPrice("");
  };

  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => Number(p.price) || 0);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (size && !(p.sizes || []).includes(size)) return false;
      if (clothType && !(p.clothTypes || []).includes(clothType)) return false;
      if (color && (p.color || "").toLowerCase() !== color.toLowerCase()) return false;
      if (minPrice && Number(p.price) < Number(minPrice)) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
      return true;
    });
    if (sort === "price-low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, size, clothType, color, minPrice, maxPrice, sort]);

  const selectCls = "mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between">
          <h5 className="mb-0 font-semibold">Filters</h5>
          <button onClick={reset} className="text-sm text-neutral-500 underline hover:text-neutral-900">
            Reset
          </button>
        </div>
        {sizes.length > 0 && (
          <div>
            <label className="text-sm font-medium">Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className={selectCls}>
              <option value="">All sizes</option>
              {sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        {clothTypes.length > 0 && (
          <div>
            <label className="text-sm font-medium">Fabric</label>
            <select value={clothType} onChange={(e) => setClothType(e.target.value)} className={selectCls}>
              <option value="">All fabrics</option>
              {clothTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        {colors.length > 0 && (
          <div>
            <label className="text-sm font-medium">Color</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} className={selectCls}>
              <option value="">All colors</option>
              {colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Price Range</label>
          <div className="mt-2 flex gap-2">
            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min" className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none" />
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max" className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none" />
          </div>
        </div>
        {priceRange.min !== undefined && priceRange.max !== undefined && (
          <p className="text-xs text-neutral-500">
            Range: ₹{priceRange.min.toLocaleString("en-IN")} - ₹{priceRange.max.toLocaleString("en-IN")}
          </p>
        )}
      </aside>

      <div>
        {showToolbar && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              {filtered.length} piece{filtered.length === 1 ? "" : "s"}
            </p>
            {showSort && (
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="border border-neutral-300 bg-white px-3 py-2 text-xs uppercase tracking-widest focus:border-gold focus:outline-none">
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            )}
          </div>
        )}
        {filtered.length === 0 ? (
          <EmptyState
            title={emptyTitle}
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
