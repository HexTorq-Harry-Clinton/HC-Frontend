"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useCart } from "./CartProvider";
import { PLACEHOLDER_IMAGE } from "./ProductCard";
import ProductCard from "./ProductCard";
import Breadcrumb from "./Breadcrumb";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import ReviewsSection from "./ReviewsSection";

// Product detail: same structure/texts as the previous UI —
// gallery, name, short, variant price, Description, Size, qty,
// Add to Cart, wishlist, Continue Shopping — plus related + reviews below.
export default function ProductDetail({ product }) {
  const cart = useCart();
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState("");

  const gallery = product.gallery?.length > 0 ? product.gallery : [product.image || PLACEHOLDER_IMAGE];
  const baseSizes =
    (product.variants || []).length > 0
      ? product.variants.map((v) => ({
          label: v.label || v.size_id || "M",
          price: v.price || product.price,
          available: v.available !== false,
          variant: v,
        }))
      : [{ label: "M", price: product.price, available: true, variant: null }];
  const [size, setSize] = useState(baseSizes.length === 1 ? baseSizes[0].label : "");

  const selected = baseSizes.find((s) => s.label === size);
  const displayPrice = selected?.price ?? product.price;

  const addToBag = () => {
    if (baseSizes.length > 1 && !size) {
      setSizeError("Please select a size");
      return;
    }
    setSizeError("");
    cart?.addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: displayPrice,
        image: gallery[0],
        size: size || baseSizes[0].label,
        product_id: product.id,
        product_variant_id: selected?.variant?.product_variant_id || null,
        unit_price: displayPrice,
      },
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
          <h1 className="font-display text-4xl font-bold">{product.name}</h1>
          {product.description && <p className="mt-1 text-neutral-500">{product.description}</p>}
          <h3 className="mt-3 text-2xl font-bold">{inr(displayPrice)}</h3>
          {product.fullDescription && product.fullDescription !== product.description && (
            <>
              <h5 className="mt-5 font-semibold">Description</h5>
              <div className="mt-1 text-sm text-neutral-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.fullDescription) }} />
            </>
          )}

          {baseSizes.length > 1 && (
            <div className="mt-6">
              <h5 className="font-semibold">Size</h5>
              <div className="mt-2 flex flex-wrap gap-2">
                {baseSizes.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => { setSize(s.label); setSizeError(""); }}
                    disabled={!s.available}
                    className={`border px-4 py-2 text-sm disabled:opacity-40 ${
                      size === s.label ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {sizeError && <p className="mt-2 text-sm text-red-600">{sizeError}</p>}

          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="border border-neutral-300 px-3 py-1">−</button>
            <span className="w-8 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="border border-neutral-300 px-3 py-1">+</button>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={addToBag} className={`flex-1 py-3 text-sm font-semibold text-white transition ${added ? "bg-green-700" : "bg-neutral-950 hover:bg-neutral-800"}`}>
              {added ? "Added to Cart" : "Add to Cart"}
            </button>
            <button
              onClick={() => cart?.toggleWishlist({ id: product.id, name: product.name, price: displayPrice, image: gallery[0] })}
              title="Add to wishlist"
              className="border border-neutral-300 px-5 py-3 text-lg transition hover:border-gold"
            >
              ♡
            </button>
          </div>
          <button onClick={() => router.back()} className="link-sweep mt-4 text-sm font-semibold">
            ← Continue Shopping
          </button>

          <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
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
