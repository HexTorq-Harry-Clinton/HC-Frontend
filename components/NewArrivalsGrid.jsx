"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { PLACEHOLDER_IMAGE } from "./ProductCard";

// New Arrivals grid: count, Newest First sort, New badge,
// Quick Add / Added to Bag, Price on request — as before.
export default function NewArrivalsGrid({ products }) {
  const cart = useCart();
  const [addedId, setAddedId] = useState(null);

  const quickAdd = (p) => {
    cart?.addToCart(
      { id: p.id, slug: p.slug, name: p.name, price: Number(p.price) || 0, image: p.image },
      1
    );
    setAddedId(p.id);
    setTimeout(() => setAddedId((cur) => (cur === p.id ? null : cur)), 2000);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {products.length} {products.length === 1 ? "Piece" : "Pieces"}
        </p>
        <select disabled aria-label="Sort" className="border border-neutral-300 bg-white px-3 py-2 text-sm">
          <option>Newest First</option>
        </select>
      </div>
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">🧵</p>
          <p className="mt-4 text-neutral-500">New pieces are being crafted. Check back soon.</p>
          <Link href="/" className="mt-6 inline-block bg-neutral-950 px-8 py-3 text-sm font-semibold text-white">
            Back to Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="group relative bg-white shadow-sm">
              <span className="absolute left-3 top-3 z-10 bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-950">
                New
              </span>
              <Link href={`/product/${p.slug || p.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image || PLACEHOLDER_IMAGE}
                  alt={p.name}
                  loading="lazy"
                  style={{ height: "300px", width: "100%", objectFit: "cover" }}
                />
              </Link>
              <div className="p-4 text-center">
                <Link href={`/product/${p.slug || p.id}`} className="font-medium hover:underline">
                  {p.name}
                </Link>
                <p className="mt-1 text-sm font-bold">
                  {p.price ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Price on request"}
                </p>
                <button
                  onClick={() => quickAdd(p)}
                  className={`mt-3 w-full py-2 text-xs font-semibold uppercase tracking-widest text-white transition ${
                    addedId === p.id ? "bg-green-700" : "bg-neutral-950 hover:bg-gold hover:text-neutral-950"
                  }`}
                >
                  {addedId === p.id ? "Added to Bag ✓" : "Quick Add"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
