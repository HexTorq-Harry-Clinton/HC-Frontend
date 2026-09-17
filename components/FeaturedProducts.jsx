"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const [productsData, mediaData] = await Promise.all([
          apiFetch("/Products").then(unwrap),
          apiFetch("/Products-Media").then(unwrap),
        ]);

        const activeProducts = (productsData || [])
          .filter((p) => p.isactive !== false && p.isdeleted !== true)
          .slice(0, 8);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
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
          eyebrow="CURATED FOR YOU"
          title="New Arrivals"
          sub="The latest additions to our bespoke collection."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10">
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
