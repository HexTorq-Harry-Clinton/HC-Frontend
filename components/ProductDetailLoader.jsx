"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiCached, resolveUploadUrl } from "@/lib/api";
import { minVariantPrice, withVariantPricing } from "@/lib/pricing";
import ProductDetail from "./ProductDetail";
import { PLACEHOLDER_IMAGE } from "./ProductCard";
import { generatedColor } from "@/lib/colors";

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
    media.find((m) => String(m.product_id) === String(p.product_id) && (m.isprimary === 1 || m.isprimary === true)) ||
    media.find((m) => String(m.product_id) === String(p.product_id));
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
        const [products, media, variants, sizes, clothTypes, reviews, ratingSummary, attrs, attrValues, productDetails, sizeChart] = await Promise.all([
          apiCached("/Products", { params: { pageSize: 200 } }).catch(() => []),
          apiCached("/Products-Media", { params: { pageSize: 200 } }).catch(() => []),
          apiCached("/Products-Variants", { params: { pageSize: 200 } }).catch(() => []),
          apiCached("/Products-Sizes").catch(() => []),
          apiCached("/Products-Cloth-Types").catch(() => []),
          apiCached("/Reviews").catch(() => []),
          apiCached("/Product-Rating-Summary").catch(() => []),
          apiCached("/Products-Attributes").catch(() => []),
          apiCached("/Products-Attributes-Values", { params: { pageSize: 200 } }).catch(() => []),
          apiCached("/Product-Details", { params: { product_id: id } }).catch(() => null),
          apiCached("/Products-Size-Charts", { params: { product_id: id } }).catch(() => []),
        ]);
        if (!live) return;

        const p = (Array.isArray(products) ? products : []).find(
          (x) => String(x.product_id) === String(id) || String(x.product_slug) === String(id)
        );
        if (!p) {
          setStatus("missing");
          return;
        }
        const resolvedProductDetails = productDetails || await apiCached("/Product-Details", { params: { product_id: p.product_id } }).catch(() => null);
        const resolvedSizeChart = (Array.isArray(sizeChart) && sizeChart.length > 0)
          ? sizeChart
          : await apiCached("/Products-Size-Charts", { params: { product_id: p.product_id } }).catch(() => []);
        const mediaList = Array.isArray(media) ? media : [];
        const allProductMedia = mediaList.filter((m) => String(m.product_id) === String(p.product_id));
        const productLevelMedia = allProductMedia.filter((m) => !m.product_variant_id);
        const variantMedia = allProductMedia.filter((m) => m.product_variant_id);
        const gallery = productLevelMedia
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map((m) => resolveUploadUrl(m.media_url))
          .filter(Boolean);
        const sizesList = Array.isArray(sizes) ? sizes : [];
        const clothList = Array.isArray(clothTypes) ? clothTypes : [];
        const colorAttr = (Array.isArray(attrs) ? attrs : []).find(
          (a) => a.attribute_slug?.toLowerCase() === "color" || a.attribute_name?.toLowerCase() === "color"
        );
        const splitColors = (value) => String(value || "")
          .split(/[\\/|,]+/)
          .map((s) => s.trim())
          .filter((s) => s && !["nil", "f"].includes(s.toLowerCase()));
        const variantColor = (variantId) =>
          (Array.isArray(attrValues) ? attrValues : [])
            .filter((v) => String(v.product_variant_id) === String(variantId) && v.attribute_id === colorAttr?.attribute_id)
            .flatMap((v) => splitColors(v.attribute_value));

        const builtVariants = (Array.isArray(variants) ? variants : [])
          .filter((v) => v.product_id === p.product_id)
          .map((v, idx) => {
            const sizeRow = sizesList.find((s) => s.size_id === v.size_id);
            const clothRow = clothList.find((c) => c.cloth_type_id === v.cloth_type_id);
            const ownMedia = variantMedia.filter((m) => m.product_variant_id === v.product_variant_id);
            const priced = withVariantPricing(v, Number(p.base_price) || 0);
            return {
              ...v,
              ...priced,
              key: v.product_variant_id || v.size_id || `${v.variant_name || "size"}-${idx}`,
              label: sizeRow?.size_name || v.variant_name || "M",
              sizeName: sizeRow?.size_name || "",
              clothName: clothRow?.cloth_type_name || "",
              color: variantColor(v.product_variant_id)[0] || null,
              available:
                v.stock_qty === undefined || v.stock_qty === null
                  ? true
                  : Number(v.stock_qty) > 0,
              image: resolveUploadUrl(ownMedia[0]?.media_url) || null,
            };
          });
        const variantGalleryForColor = (colorName) => {
          const ids = builtVariants
            .filter((v) => !v.color || v.color.toLowerCase() === colorName.toLowerCase())
            .map((v) => v.product_variant_id);
          return variantMedia
            .filter((m) => ids.includes(m.product_variant_id))
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((m) => resolveUploadUrl(m.media_url))
            .filter(Boolean);
        };

        const reviewsList = Array.isArray(reviews) ? reviews : [];
        const price = Number(p.base_price) || 0;
        const related = (Array.isArray(products) ? products : [])
          .filter((x) => x.product_id !== p.product_id && x.isdeleted !== true && x.isactive !== false)
          .map((x) => ({ x, diff: Math.abs((Number(x.base_price) || 0) - price) }))
          .sort((a, b) => a.diff - b.diff)
          .slice(0, 4)
          .map(({ x }) => mapProduct(x, mediaList));

        // Colors belong to variants of this product. Do not use sibling
        // products with similar names as color options.
        const LUXURY_PALETTE = {
          "obsidian black": { name: "Obsidian Black", hex: "#0a0a0a", border: "#222222" },
          "platinum silver": { name: "Platinum Silver", hex: "#c0c0c0", border: "#9e9e9e" },
          "royal black": { name: "Royal Black", hex: "#000000", border: "#333333" },
          "luxury gold": { name: "Luxury Gold", hex: "#d4af37", border: "#b7950b" },
          "velvet maroon": { name: "Velvet Maroon", hex: "#800000", border: "#5c0000" },
          "royal cream": { name: "Royal Cream", hex: "#f5f5dc", border: "#d8d0b0" },
          "emerald green": { name: "Emerald Green", hex: "#0b6623", border: "#145a32" },
          "classic black": { name: "Classic Black", hex: "#000000", border: "#333333" },
          "midnight blue": { name: "Midnight Blue", hex: "#191970", border: "#0f1a4a" },
          "silver mist": { name: "Silver Mist", hex: "#c0c0c0", border: "#a9a9a9" },
          "pearl white": { name: "Pearl White", hex: "#f8f8ff", border: "#dcdcdc" },
          "champagne gold": { name: "Champagne Gold", hex: "#f7e7ce", border: "#d6c29c" },
          "ruby red": { name: "Ruby Red", hex: "#9b111e", border: "#7b0d18" },
          black: { name: "Black", hex: "#111111" },
          white: { name: "White", hex: "#fcfcfc", border: "#dcd6c8" },
          ivory: { name: "Ivory", hex: "#f7f4ec", border: "#dcd6c8" },
          cream: { name: "Cream", hex: "#f5f0e6", border: "#dcd6c8" },
          navy: { name: "Navy", hex: "#152238" },
          "royal blue": { name: "Royal Blue", hex: "#1e3a8a" },
          "midnight blue": { name: "Midnight Blue", hex: "#1c3150" },
          blue: { name: "Blue", hex: "#2563eb" },
          beige: { name: "Beige", hex: "#d8cebe" },
          brown: { name: "Brown", hex: "#4a2f1c" },
          "mocha brown": { name: "Mocha Brown", hex: "#4a2f1c" },
          "emerald green": { name: "Emerald Green", hex: "#1e3d2f" },
          emerald: { name: "Emerald", hex: "#124032" },
          green: { name: "Green", hex: "#234a36" },
          red: { name: "Red", hex: "#8a1c1c" },
          "crimson red": { name: "Crimson Red", hex: "#8a1c1c" },
          burgundy: { name: "Burgundy", hex: "#4f111e" },
          wine: { name: "Wine", hex: "#441019" },
          grey: { name: "Grey", hex: "#42454a" },
          gray: { name: "Grey", hex: "#42454a" },
          charcoal: { name: "Charcoal", hex: "#292a2d" },
          gold: { name: "Gold", hex: "#c6a15b" },
          "champagne gold": { name: "Champagne Gold", hex: "#c6a15b" },
          silver: { name: "Silver", hex: "#c4c8cc" },
          platinum: { name: "Platinum", hex: "#e5e4e2", border: "#bebebe" },
          ice: { name: "Menthol Ice", hex: "#00ffff", border: "#00ced1" },
          violet: { name: "Violet", hex: "#3e1c4a" },
          purple: { name: "Purple", hex: "#361842" },
          yellow: { name: "Yellow", hex: "#d4a017" },
          olive: { name: "Olive", hex: "#4d533c" },
          khaki: { name: "Khaki", hex: "#c3b091" },
        };
        const COLOR_KEYS = Object.keys(LUXURY_PALETTE).sort((a, b) => b.length - a.length);
        const COLOR_REGEX = new RegExp(`\\b(${COLOR_KEYS.join("|")})\\b`, "gi");

        const detectColor = (text) => {
          if (!text) return null;
          const low = String(text).toLowerCase();
          for (const k of COLOR_KEYS) {
            if (new RegExp(`\\b${k}\\b`, "i").test(low)) return LUXURY_PALETTE[k];
          }
          return null;
        };

        const selfColorMeta = detectColor(p.product_name);
        const productVariants = builtVariants;
        let rawColors = productVariants.flatMap((v) => variantColor(v.product_variant_id));
        const hasVariantColors = rawColors.length > 0;
        if (colorAttr) {
          const pVals = (Array.isArray(attrValues) ? attrValues : []).filter(
            (v) => String(v.product_id) === String(p.product_id) && !v.product_variant_id && v.attribute_id === colorAttr.attribute_id
          );
          for (const v of pVals) {
            rawColors.push(...splitColors(v.attribute_value));
          }
        }
        if (selfColorMeta && rawColors.length === 0) {
          rawColors.unshift(selfColorMeta.name);
        }
        const colorList = [...new Set(rawColors.map((c) => c.trim()).filter(Boolean))];
        const variantsForColor = (colorName) => {
          const matching = productVariants.filter((v) => !hasVariantColors || (v.color && v.color.toLowerCase() === colorName.toLowerCase()));
          return matching.length > 0 ? matching : productVariants;
        };

        const colorVariants = (colorList.length ? colorList : ["Original"]).map((colName) => {
          const key = colName.toLowerCase();
          const meta = LUXURY_PALETTE[key] || generatedColor(colName);
          return {
            name: meta.name || colName,
            hex: meta.hex || "#333333",
            border: meta.border || null,
            slug: p.product_slug,
            productId: p.product_id,
            title: p.product_name,
            price: minVariantPrice(variantsForColor(colName), price)?.finalPrice ?? price,
            images: variantGalleryForColor(colName).length > 0 ? variantGalleryForColor(colName) : gallery,
            variants: variantsForColor(colName),
          };
        });

        setProduct({
          ...mapProduct(p, mediaList),
           gallery,
           media: productLevelMedia,
           variantMedia,
          variants: builtVariants,
          colors: colorVariants.map((c) => c.name),
          colorVariants,
          reviews: reviewsList.filter(
           (r) => String(r.product_id) === String(p.product_id) && r.is_approved !== false && r.isdeleted !== true
          ),
           ratingSummary: (Array.isArray(ratingSummary) ? ratingSummary : []).find(
             (s) => String(s.product_id) === String(p.product_id)
           ) || null,
           details: resolvedProductDetails || null,
           sizeChart: Array.isArray(resolvedSizeChart) ? resolvedSizeChart : [],
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
