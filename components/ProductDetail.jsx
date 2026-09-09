"use client";

import { useState } from "react";
import Image from "next/image";
import { inr } from "@/lib/api";
import { useCart } from "./CartProvider";
import { PLACEHOLDER_IMAGE } from "./ProductCard";
import ProductCard from "./ProductCard";
import Breadcrumb from "./Breadcrumb";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import ReviewsSection from "./ReviewsSection";

// Product detail: breadcrumb, gallery + sticky info + accordions + related + reviews.
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
    <>
      <Breadcrumb trail={[{ label: "Shop", href: "/suits" }, { label: product.name }]} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid items-start gap-10 md:grid-cols-2">
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

        <Reveal className="md:sticky md:top-24">
          <p className="eyebrow text-neutral-500">Harry Clinton</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{product.name}</h1>
          <p className="mt-3 text-2xl font-bold">{inr(product.price)}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-green-700">In atelier • ships in 5–7 days</p>
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
            <button onClick={addToBag} className="btn-primary flex-1 !py-3">
              {added ? "Added to Bag ✓" : "Add to Bag"}
            </button>
            <button
              onClick={() => cart?.toggleWishlist({ id: product.id, name: product.name, price: product.price, image: gallery[0] })}
              aria-label="Toggle wishlist"
              className="border border-neutral-300 px-5 py-3 text-sm font-semibold transition hover:border-gold hover:text-gold-deep"
            >
              ♥
            </button>
          </div>

          <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
            {product.fullDescription && product.fullDescription !== product.description && (
              <details className="group py-4" open>
                <summary className="cursor-pointer text-sm font-semibold uppercase tracking-widest marker:text-gold">Details</summary>
                <div className="mt-2 text-sm text-neutral-600" dangerouslySetInnerHTML={{ __html: product.fullDescription }} />
              </details>
            )}
            <details className="group py-4">
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-widest marker:text-gold">Shipping & Returns</summary>
              <p className="mt-2 text-sm text-neutral-600">Dispatched in 5–7 working days. Easy 7-day returns on unworn pieces with tags intact.</p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-widest marker:text-gold">Care</summary>
              <p className="mt-2 text-sm text-neutral-600">Dry clean only. Store on a broad hanger in the garment bag provided.</p>
            </details>
          </div>
        </Reveal>
      </div>
      </div>

      {product.related?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeading eyebrow="Pairs Well" title="Complete the Look" />
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {product.related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="bg-cream">
        <ReviewsSection
          productId={product.id}
          initialReviews={product.reviews || []}
          summary={product.ratingSummary}
        />
      </div>
    </>
  );
}
