"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { inr } from "@/lib/api";
import { useCart } from "./CartProvider";

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.06 }}
      className="group"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Link href={href} aria-label={product.name}>
          <Image
            src={product.image || PLACEHOLDER_IMAGE}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        </Link>
        <button
          onClick={() => cart?.toggleWishlist(product)}
          aria-label="Toggle wishlist"
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow transition-all duration-300 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 ${
            wished ? "bg-gold text-neutral-950" : "bg-white/90 text-neutral-800 hover:bg-gold"
          }`}
        >
          ♥
        </button>
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
          <button
            onClick={() => cart?.addToCart({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image })}
            className="w-full bg-neutral-950 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gold hover:text-neutral-950"
          >
            Add to Bag
          </button>
        </div>
      </div>
      <Link href={href} className="block pt-3 text-center">
        <p className="link-sweep inline text-sm font-medium">{product.name}</p>
        <p className="mt-1 text-sm font-bold">{inr(product.price)}</p>
      </Link>
    </motion.div>
  );
}
