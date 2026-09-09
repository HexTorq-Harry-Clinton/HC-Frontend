"use client";

import { useState } from "react";
import Image from "next/image";
import { inr } from "@/lib/api";
import { useCart } from "./CartProvider";
import { PLACEHOLDER_IMAGE } from "./ProductCard";
import Reveal from "./Reveal";
import ReviewsSection from "./ReviewsSection";

// Product detail: gallery + variant/size picker + bag + wishlist + reviews.
export default function ProductDetail({ product }) {
  const cart = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const gallery = product.gallery?.length > 0 ? product.gallery : [product.image || PLACEHOLDER_IMAGE];
  const sizes = [...new Set((product.variants || []).map((v) => v.size_id).filter(Boolean))];

  const addToBag = () => {
    cart?.addToCart(
      { id: product.id, slug: product.slug, name: product.name, price: product.price, image: gallery[0], size },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
            <Image
              src={gallery[activeImg]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-square overflow-hidden bg-neutral-100 ${i === activeImg ? "ring-2 ring-neutral-900" : ""}`}
                >
                  <Image src={src} alt={`${product.name} ${i + 1}`} fill sizes="150px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Harry Clinton</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{product.name}</h1>
          <p className="mt-3 text-2xl font-bold">{inr(product.price)}</p>
          {product.description && <p className="mt-4 text-neutral-600">{product.description}</p>}

          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`border px-4 py-2 text-sm ${size === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest">Qty</p>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="border border-neutral-300 px-3 py-1">−</button>
            <span className="w-8 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="border border-neutral-300 px-3 py-1">+</button>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={addToBag} className="flex-1 bg-neutral-950 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
              {added ? "Added to Bag ✓" : "Add to Bag"}
            </button>
            <button
              onClick={() => cart?.toggleWishlist({ id: product.id, name: product.name, price: product.price, image: gallery[0] })}
              className="border border-neutral-300 px-5 py-3 text-sm font-semibold"
            >
              ♥
            </button>
          </div>

          {product.fullDescription && product.fullDescription !== product.description && (
            <div className="mt-8 border-t border-neutral-200 pt-6 text-sm text-neutral-600" dangerouslySetInnerHTML={{ __html: product.fullDescription }} />
          )}
        </Reveal>
      </div>
      <ReviewsSection
        productId={product.id}
        initialReviews={product.reviews || []}
        summary={product.ratingSummary}
      />
    </div>
  );
}
