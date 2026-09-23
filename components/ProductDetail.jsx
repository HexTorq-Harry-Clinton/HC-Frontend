"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useCart } from "./CartProvider";
import WishlistHeart from "./WishlistHeart";
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
  // Each size option carries a unique key (variant id first): two variants
  // sharing a display label (e.g. "M" in different cloths) stay distinct.
  const baseSizes =
    (product.variants || []).length > 0
      ? product.variants.map((v, idx) => ({
          key: v.product_variant_id || v.size_id || `${v.label || "size"}-${idx}`,
          label: v.label || v.size_id || "M",
          price: v.price || product.price,
          available: v.available !== false,
          image: v.image || null,
          variant: v,
        }))
      : [{ key: "default", label: "M", price: product.price, available: true, image: null, variant: null }];
  const [size, setSize] = useState(baseSizes.length === 1 ? baseSizes[0].key : "");

  const selected = baseSizes.find((s) => s.key === size);
  const displayPrice = selected?.price ?? product.price;
  // Bag line for THIS product + size/variant (same key as the cart): when it
  // exists the page shows its stepper + qty instead of Add to Bag.
  const bagKey = [product.id, selected?.variant?.product_variant_id || null, selected?.label || baseSizes[0].label]
    .filter((v) => v !== undefined && v !== null && v !== "")
    .join("|");
  const bagLine = (cart?.items || []).find((i) => (i.key || [i.id, i.product_variant_id, i.size].filter((v) => v !== undefined && v !== null && v !== "").join("|")) === bagKey);
  // When a size is selected, swap the main image to that variant's image (if any).
  const variantImage = selected?.image || null;
  const effectiveGallery = variantImage
    ? [variantImage, ...gallery.filter((g) => g !== variantImage)]
    : gallery;

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
        image: effectiveGallery[0],
        size: selected?.label || baseSizes[0].label,
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
          <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
            <Image
              src={effectiveGallery[activeImg] || effectiveGallery[0]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {effectiveGallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {effectiveGallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-square overflow-hidden bg-neutral-900 ${i === activeImg ? "ring-2 ring-gold" : ""}`}
                >
                  <Image src={src} alt={`${product.name} ${i + 1}`} fill sizes="150px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <Reveal className="md:sticky md:top-24">
          <h1 className="font-display text-4xl font-bold">{product.name}</h1>
          {product.description && <p className="mt-1 text-neutral-400">{product.description}</p>}
          <h3 className="mt-3 text-2xl font-bold">{inr(displayPrice)}</h3>
          {product.fullDescription && product.fullDescription !== product.description && (
            <>
              <h5 className="mt-5 font-semibold">Description</h5>
              <div className="mt-1 text-sm text-neutral-300" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.fullDescription) }} />
            </>
          )}

          {baseSizes.length > 1 && (
            <div className="mt-6">
              <h5 className="font-semibold">Size</h5>
              <div className="mt-2 flex flex-wrap gap-2">
                {baseSizes.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { setSize(s.key); setSizeError(""); }}
                    disabled={!s.available}
                    className={`border px-4 py-2 text-sm disabled:opacity-40 ${
                      size === s.key ? "border-gold bg-gold text-neutral-950" : "border-white/25"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {sizeError && <p className="mt-2 text-sm text-red-600">{sizeError}</p>}

          {bagLine ? (
            <>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => cart?.updateQty(bagLine.key || bagLine.id, Math.max(1, (bagLine.qty || 1) - 1))}
                  disabled={(bagLine.qty || 1) <= 1}
                  className="border border-white/25 px-3 py-1 text-[#f7f4ec] disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold">{bagLine.qty || 1}</span>
                <button
                  onClick={() => cart?.updateQty(bagLine.key || bagLine.id, (bagLine.qty || 1) + 1)}
                  className="border border-white/25 px-3 py-1 text-[#f7f4ec]"
                  aria-label="Increase quantity"
                >
                  +
                </button>
                <span className="text-xs uppercase tracking-widest text-green-700">In your bag</span>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => router.push("/cart")} className="flex-1 bg-green-700 py-3 text-sm font-semibold text-white transition hover:bg-green-800">
                  Already Added — View Bag
                </button>
                <WishlistHeart
                  product={{ id: product.id, name: product.name, price: displayPrice, image: effectiveGallery[0] }}
                  className="border border-white/25 px-5 py-3 text-lg text-[#f7f4ec] transition hover:border-gold"
                />
              </div>
            </>
          ) : (
            <>
              <div className="mt-6 flex items-center gap-3" role="group" aria-label="Quantity">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="border border-white/25 px-3 py-1 text-[#f7f4ec]">−</button>
                <span className="w-8 text-center" aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="border border-white/25 px-3 py-1 text-[#f7f4ec]">+</button>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={addToBag} className={`flex-1 py-3 text-sm font-semibold text-white transition ${added ? "bg-green-700" : "bg-neutral-950 hover:bg-neutral-800"}`}>
                  {added ? "Added to Cart" : "Add to Cart"}
                </button>
                <WishlistHeart
                  product={{ id: product.id, name: product.name, price: displayPrice, image: effectiveGallery[0] }}
                  className="border border-white/25 px-5 py-3 text-lg text-[#f7f4ec] transition hover:border-gold"
                />
              </div>
            </>
          )}
          <button onClick={() => router.back()} className="link-sweep mt-4 text-sm font-semibold">
            ← Continue Shopping
          </button>

          <div className="mt-8 divide-y divide-white/15 border-y border-white/15">
            <details className="group py-4">
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-widest text-[#f7f4ec] marker:text-gold">Shipping & Returns</summary>
              <p className="mt-2 text-sm text-neutral-300">Dispatched in 5–7 working days. Easy 7-day returns on unworn pieces with tags intact.</p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-widest text-[#f7f4ec] marker:text-gold">Care</summary>
              <p className="mt-2 text-sm text-neutral-300">Dry clean only. Store on a broad hanger in the garment bag provided.</p>
            </details>
          </div>
        </Reveal>
      </div>
      </div>

      {product.related?.length > 0 && (
        <section className="mx-auto max-w-7xl bg-[#101010] px-4 py-14">
          <SectionHeading eyebrow="Pairs Well" title="Complete the Look" dark />
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {product.related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="bg-[#101010]">
        <ReviewsSection
          productId={product.id}
          initialReviews={product.reviews || []}
          summary={product.ratingSummary}
        />
      </div>
    </>
  );
}
