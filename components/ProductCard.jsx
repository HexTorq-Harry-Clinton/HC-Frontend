"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { inr } from "@/lib/api";
import { useCart } from "./CartProvider";
import WishlistHeart from "./WishlistHeart";

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#e9ecef"/><text x="200" y="250" font-family="Arial" font-size="20" fill="#6c757d" text-anchor="middle">Harry Clinton</text></svg>`
  );

// Product card: image zoom + slide-up quick actions (add to bag, wishlist)
// on hover; layout-animated so filtering/sorting feels alive.
export default function ProductCard({ product, index = 0 }) {
  const cart = useCart();
  const href = `/product/${product.slug || product.id}`;
  const wished = cart?.wishlist.some((i) => i.id === product.id);
  const [added, setAdded] = useState(false);

  const quickAdd = () => {
    cart?.addToCart({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.06 }}
      className="group relative"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Link href={href} aria-label={product.name} className="relative block h-full w-full">
          {/* Backend upload URLs may resolve to private infrastructure; keep
              them as native images instead of sending them through Next's
              server-side optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || PLACEHOLDER_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
          <button
            onClick={quickAdd}
            className={`w-full py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              added ? "bg-green-700 text-white" : "bg-neutral-950 text-white hover:bg-gold hover:text-neutral-950"
            }`}
          >
            {added ? "Added ✓" : "Add to Bag"}
          </button>
        </div>
      </div>
      {/* Heart floats top-right over the image only: hidden until hover,
          except already-liked pieces which stay visible always. Lives on the
          card root (NOT inside the overflow-hidden image box) so the tap
          burst is never clipped at the edges. */}
      <WishlistHeart
        product={product}
        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center  shadow transition-all duration-300 ${
          wished
            ? "bg-gold text-neutral-950"
            : "bg-white/90 text-neutral-800 hover:bg-gold lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
        }`}
      />
      <Link href={href} className="block pt-3 text-center">
        <p className="link-sweep inline text-base font-medium">{product.name}</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-base font-bold">
          <span>{inr(product.price)}</span>
          {product.hasDiscount && Number(product.originalPrice) > Number(product.price) && (
            <>
              <span className="text-sm font-medium text-neutral-400 line-through">{inr(product.originalPrice)}</span>
              {product.discountPct > 0 && (
                <span className="bg-green-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {product.discountPct}% off
                </span>
              )}
            </>
          )}
        </p>
      </Link>
    </motion.div>
  );
}
