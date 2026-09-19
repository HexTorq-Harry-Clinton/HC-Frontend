"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiCached, precacheMedia, resolveUploadUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

// Admin column count → desktop grid class (mobile stays 2-up for thumbs).
const COLS_CLS = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Admin controls (tbl_settings home_new_arrivals_*): copy, how many, cols.
  const [cfg, setCfg] = useState({ eyebrow: "CURATED FOR YOU", title: "New Arrivals", sub: "The latest additions to our bespoke collection.", count: 8, cols: 4 });

  useEffect(() => {
    async function loadProducts() {
      try {
        const [productsData, mediaData, settingsData] = await Promise.all([
          apiCached("/Products"),
          apiCached("/Products-Media"),
          apiCached("/Settings").catch(() => []),
        ]);

        const row = (Array.isArray(settingsData) ? settingsData : [])[0] || {};
        const count = Math.min(24, Math.max(1, Number(row.home_new_arrivals_count) || 8));
        const cols = [2, 3, 4, 5].includes(Number(row.home_new_arrivals_cols))
          ? Number(row.home_new_arrivals_cols)
          : 4;
        setCfg({
          eyebrow: row.home_new_arrivals_eyebrow || "CURATED FOR YOU",
          title: row.home_new_arrivals_title || "New Arrivals",
          sub: row.home_new_arrivals_subtitle || "The latest additions to our bespoke collection.",
          count,
          cols,
        });

        const activeProducts = (productsData || [])
          .filter((p) => p.isactive !== false && p.isdeleted !== true)
          .slice(0, count);

        const mappedProducts = activeProducts.map((p) => {
          const productMedia = (mediaData || []).filter((m) => m.product_id === p.product_id);
          const primaryMedia =
            productMedia.find((m) => m.isprimary === 1 || m.isprimary === true) || productMedia[0];

          return {
            id: p.product_id,
            slug: p.product_slug || p.product_id,
            name: p.product_name,
            price: Number(p.base_price) || 0,
            image: resolveUploadUrl(primaryMedia?.media_url),
          };
        });

        setProducts(mappedProducts);
        // Warm the browser image cache so back-nav never re-downloads.
        precacheMedia(mappedProducts.map((p) => p.image));
      } catch (error) {
        console.error("Failed to load featured products:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="w-48 h-8 bg-gray-200 animate-pulse mb-8 mx-auto"></div>
          <div className={`grid grid-cols-2 gap-4 md:gap-6 ${COLS_CLS[cfg.cols] || "md:grid-cols-4"}`}>
            {[...Array(cfg.count)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading
          eyebrow={cfg.eyebrow}
          title={cfg.title}
          sub={cfg.sub}
        />

        <div className={`grid grid-cols-2 gap-4 md:gap-6 mt-10 ${COLS_CLS[cfg.cols] || "md:grid-cols-4"}`}>
          {products.map((product, index) => (
            <Reveal key={product.id} delay={index * 0.1}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/new-arrivals" className="btn-ghost">
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
