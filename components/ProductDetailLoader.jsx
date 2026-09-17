"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";
import ProductDetail from "./ProductDetail";
import { PLACEHOLDER_IMAGE } from "./ProductCard";

// Fallback renderer for product pages.
//
// Why this exists: the product route first tries to build the page on the
// server (fast, ISR-friendly). When the backend is slow or a server-side
// catalog fetch comes back empty, the server can't produce the product and
// used to call notFound() — which turned a temporary data problem into a
// hard 500 (and before the not-found boundary existed, a broken page).
//
// Instead, the route renders this component. The browser CAN reach the API
// (the admin panel proves it), so we re-fetch client-side with a skeleton,
// and the product shows. If the product genuinely doesn't exist, we say so
// instead of crashing.

function mapProduct(p, media) {
  const primary =
    media.find((m) => m.product_id === p.product_id && (m.isprimary === 1 || m.isprimary === true)) ||
    media.find((m) => m.product_id === p.product_id);
  return {
    id: p.product_id || p.product_slug,
    slug: p.product_slug,
    name: p.product_name,
    price: Number(p.base_price) || 0,
    currency: p.currency_code || "INR",
    image: resolveUploadUrl(primary?.media_url) || null,
    description: p.short_description || "",
    fullDescription: p.description || p.short_description || "",
  };
}

export default function ProductDetailLoader({ id }) {
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [products, media, variants, sizes, clothTypes, reviews, ratingSummary] = await Promise.all([
          apiFetch("/Products", { params: { pageSize: 200 } }).then(unwrap).catch(() => []),
          apiFetch("/Products-Media", { params: { pageSize: 200 } }).then(unwrap).catch(() => []),
          apiFetch("/Products-Variants", { params: { pageSize: 200 } }).then(unwrap).catch(() => []),
          apiFetch("/Products-Sizes").then(unwrap).catch(() => []),
          apiFetch("/Products-Cloth-Types").then(unwrap).catch(() => []),
          apiFetch("/Reviews").then(unwrap).catch(() => []),
          apiFetch("/Product-Rating-Summary").then(unwrap).catch(() => []),
        ]);
        if (!live) return;

        const p = (Array.isArray(products) ? products : []).find(
          (x) => x.product_id === id || x.product_slug === id
        );
        if (!p) {
          setStatus("missing");
          return;
        }
        const mediaList = Array.isArray(media) ? media : [];
        const allProductMedia = mediaList.filter((m) => m.product_id === p.product_id);
        const productLevelMedia = allProductMedia.filter((m) => !m.product_variant_id);
        const variantMedia = allProductMedia.filter((m) => m.product_variant_id);
        const gallery = productLevelMedia
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map((m) => resolveUploadUrl(m.media_url))
          .filter(Boolean);
        const sizesList = Array.isArray(sizes) ? sizes : [];
        const clothList = Array.isArray(clothTypes) ? clothTypes : [];

        const builtVariants = (Array.isArray(variants) ? variants : [])
          .filter((v) => v.product_id === p.product_id)
          .map((v) => {
            const sizeRow = sizesList.find((s) => s.size_id === v.size_id);
            const clothRow = clothList.find((c) => c.cloth_type_id === v.cloth_type_id);
            const ownMedia = variantMedia.filter((m) => m.product_variant_id === v.product_variant_id);
            return {
              ...v,
              label: sizeRow?.size_name || v.variant_name || "M",
              sizeName: sizeRow?.size_name || "",
              clothName: clothRow?.cloth_type_name || "",
              available:
                v.stock_qty === undefined || v.stock_qty === null
                  ? true
                  : Number(v.stock_qty) > 0,
              image:
                resolveUploadUrl(ownMedia[0]?.media_url) ||
                resolveUploadUrl(productLevelMedia[0]?.media_url) ||
                null,
            };
          });

        const reviewsList = Array.isArray(reviews) ? reviews : [];
        const price = Number(p.base_price) || 0;
        const related = (Array.isArray(products) ? products : [])
          .filter((x) => x.product_id !== p.product_id && x.isdeleted !== true && x.isactive !== false)
          .map((x) => ({ x, diff: Math.abs((Number(x.base_price) || 0) - price) }))
          .sort((a, b) => a.diff - b.diff)
          .slice(0, 4)
          .map(({ x }) => mapProduct(x, mediaList));

        setProduct({
          ...mapProduct(p, mediaList),
          gallery,
          variants: builtVariants,
          reviews: reviewsList.filter(
            (r) => r.product_id === p.product_id && r.is_approved !== false && r.isdeleted !== true
          ),
          ratingSummary: (Array.isArray(ratingSummary) ? ratingSummary : []).find(
            (s) => s.product_id === p.product_id
          ) || null,
          related,
        });
        setStatus("ready");
      } catch {
        if (live) setStatus("missing");
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  if (status === "ready" && product) {
    return <ProductDetail product={product} />;
  }

  if (status === "missing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Image src="/brand/logo-black.png" alt="Harry Clinton" width={180} height={48} className="mx-auto" />
        <h1 className="mt-8 font-display text-3xl font-bold">Product Not Available</h1>
        <p className="mt-3 max-w-md text-neutral-500">
          This product may have been removed or is temporarily unavailable.
        </p>
        <Link href="/suits" className="mt-8 bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
          Browse the Collection
        </Link>
      </div>
    );
  }

  // Loading skeleton — matches the detail layout so the shift on load is minimal.
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid items-start gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-[4/5] w-full animate-pulse bg-neutral-100" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square w-full animate-pulse bg-neutral-100" />
            ))}
          </div>
        </div>
        <div>
          <div className="h-9 w-2/3 animate-pulse bg-neutral-100" />
          <div className="mt-4 h-4 w-1/2 animate-pulse bg-neutral-100" />
          <div className="mt-6 h-7 w-1/3 animate-pulse bg-neutral-100" />
          <div className="mt-8 h-11 w-full animate-pulse bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
