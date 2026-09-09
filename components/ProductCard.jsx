"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { inr } from "@/lib/api";

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#e9ecef"/><text x="200" y="250" font-family="Arial" font-size="20" fill="#6c757d" text-anchor="middle">Harry Clinton</text></svg>`
  );

// Product card with motion hover. Image is next/image (auto WebP + lazy).
export default function ProductCard({ product, index = 0 }) {
  const href = `/product/${product.slug || product.id}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07 }}
    >
      <Link href={href} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          <Image
            src={product.image || PLACEHOLDER_IMAGE}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="pt-3 text-center">
          <p className="text-sm font-medium">{product.name}</p>
          <p className="mt-1 text-sm font-bold">{inr(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
}
