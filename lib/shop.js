import { apiGet, unwrap, resolveUploadUrl } from "./api";
import { minVariantPrice, withVariantPricing } from "./pricing";
import { keywordsFor } from "./catalog";
import { generatedColor } from "./colors";

// Server-side shop data. All pages render from the live backend —
// no hardcoded catalog anywhere in v2.

// Fetch-once helper: catalog endpoints in parallel, tolerant of single failures.
// /Products is paged server-side (default pageSize 50) — without an explicit
// large page size, anything past the first 50 products silently disappears
// from every storefront list and the admin table.
async function catalogBundle() {
  const [products, media, variants, attrValues, attributes, sizes, clothTypes, collections] =
    await Promise.all([
      apiGet("/Products", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Media", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Variants", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Attributes-Values", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Attributes").then(unwrap).catch(() => []),
      apiGet("/Products-Sizes").then(unwrap).catch(() => []),
      apiGet("/Products-Cloth-Types").then(unwrap).catch(() => []),
      apiGet("/Style-Collections").then(unwrap).catch(() => []),
    ]);
  return { products, media, variants, attrValues, attributes, sizes, clothTypes, collections };
}

export function mapProduct(p, media) {
  const productMedia = media.filter(
    (m) => String(m.product_id) === String(p.product_id) && !m.product_variant_id
  );
  const isVideoMedia = (m) =>
    String(m?.media_type || "").toLowerCase() === "video" ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(String(m?.media_url || ""));
  const imageMedia = productMedia.find((m) => !isVideoMedia(m));
  const videoMedia = productMedia.find(isVideoMedia);
  const primary =
    productMedia.find((m) => m.isprimary === 1 || m.isprimary === true) ||
    imageMedia ||
    media.find((m) => String(m.product_id) === String(p.product_id));
  return {
    id: p.product_id || p.product_slug,
    slug: p.product_slug,
    name: p.product_name,
    subtitle: p.short_description || "",
    price: Number(p.base_price) || 0,
    originalPrice: Number(p.original_price) || null,
    collectionDisplayOrder: Number(p.collection_display_order) || 0,
    styleCollectionId: p.style_collection_id || null,
    currency: p.currency_code || "INR",
    image: isVideoMedia(primary)
      ? resolveUploadUrl(imageMedia?.media_url) || null
      : resolveUploadUrl(primary?.media_url) || null,
    video: resolveUploadUrl(videoMedia?.media_url) || null,
    description: p.short_description || "",
    fullDescription: p.description || p.short_description || "",
  };
}

export function filterByKeywords(products, keywords) {
  const lowered = keywords.map((k) => k.toLowerCase());
  if (lowered.length === 0) return products;
  return products.filter((p) => {
    const text =
      `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
    return lowered.some((k) => text.includes(k));
  });
}

// Products for a category/occasion/collection page + filter metadata.
// overrideKeywords lets DB-driven pages (admin-editable slugs with no
// hardcoded entry in catalog.js) reuse the same grid pipeline.
export async function getCategoryData(resolved, overrideKeywords) {
  const bundle = await catalogBundle();
  const keywords = overrideKeywords || keywordsFor(resolved);
  const collection = resolved?.type === "collection"
    ? (Array.isArray(bundle.collections) ? bundle.collections : []).find((row) =>
        String(row.collection_slug || row.collection_name?.toLowerCase().replace(/\s+/g, "-")) === String(resolved.collection)
      )
    : null;
  const collectionProducts = collection
    ? await apiGet("/Products", {
        params: { style_collection_id: collection.style_collection_id, pageSize: 200 },
        revalidate: 0,
      }).then(unwrap).catch(() => [])
    : bundle.products;
  const sourceProducts = collection && collectionProducts.length > 0
    ? collectionProducts
    : filterByKeywords(bundle.products, keywords);
  const filtered = sourceProducts
    .filter((p) => p.isdeleted !== true)
    .sort((a, b) => (a.collection_display_order || 0) - (b.collection_display_order || 0));
  const colorAttr = bundle.attributes.find(
    (a) => a.attribute_slug?.toLowerCase() === "color" || a.attribute_name?.toLowerCase() === "color"
  );
  const colors = colorAttr
    ? [...new Set(bundle.attrValues.filter((v) => v.attribute_id === colorAttr.attribute_id).map((v) => v.attribute_value).filter(Boolean))]
    : [];
  // Per-product colors from attribute values (Color attribute → product),
  // keyed by the ORIGINAL product_id (the mapped id may fall back to slug).
  const colorsByProduct = {};
  if (colorAttr) {
    for (const v of bundle.attrValues) {
      if (v.attribute_id === colorAttr.attribute_id && v.attribute_value && v.product_id) {
        (colorsByProduct[v.product_id] ||= []).push(v.attribute_value);
      }
    }
  }
  const products = filtered.map((p) => {
    const mapped = mapProduct(p, bundle.media);
    const pv = bundle.variants.filter((v) => v.product_id === p.product_id);
    // Resolve IDs to human-readable names so CategoryView's filter compares
    // apples to apples (sizeName / clothName strings, not UUIDs).
    const sizeNameById = Object.fromEntries(
      bundle.sizes.map((s) => [s.size_id, s.size_name])
    );
    const clothNameById = Object.fromEntries(
      bundle.clothTypes.map((c) => [c.cloth_type_id, c.cloth_type_name])
    );
    const productColors = colorsByProduct[p.product_id] || [];
    const bestPrice = minVariantPrice(pv, Number(p.base_price) || 0);
    return {
      ...mapped,
      price: bestPrice ? bestPrice.finalPrice : mapped.price,
      originalPrice: bestPrice?.hasDiscount ? bestPrice.mrp : mapped.originalPrice,
      hasDiscount: Boolean(bestPrice?.hasDiscount),
      discountPct: bestPrice?.discountPct || 0,
      sizes: [
        ...new Set(
          pv.map((v) => sizeNameById[v.size_id]).filter(Boolean)
        ),
      ],
      clothTypes: [
        ...new Set(
          pv.map((v) => clothNameById[v.cloth_type_id]).filter(Boolean)
        ),
      ],
      colors: productColors,
      color: productColors[0] || null,
    };
  });
  return {
    products,
    sizes: bundle.sizes.map((s) => s.size_name).filter(Boolean),
    clothTypes: bundle.clothTypes.map((c) => c.cloth_type_name).filter(Boolean),
    colors,
  };
}

export async function getProduct(idOrSlug) {
  try {
  // Fetch bundle + reviews in parallel to avoid sequential 10s timeout on Vercel (catalog 7 fetches + 2 more = ~10s serial).
  const [bundle, reviews, ratingSummary] = await Promise.all([
    catalogBundle(),
    apiGet("/Reviews").then(unwrap).catch(() => []),
    apiGet("/Product-Rating-Summary").then(unwrap).catch(() => []),
  ]);
  const p = bundle.products.find(
    (x) => String(x.product_id) === String(idOrSlug) || String(x.product_slug) === String(idOrSlug)
  );
  if (!p) return null;
  const productDetails = await apiGet("/Product-Details", { params: { product_id: p.product_id } }).then(unwrap).catch(() => null);
  const sizeChart = await apiGet("/Products-Size-Charts", { params: { product_id: p.product_id } }).then(unwrap).catch(() => []);
  const allProductMedia = bundle.media.filter((m) => String(m.product_id) === String(p.product_id));
  const productLevelMedia = allProductMedia.filter((m) => !m.product_variant_id);
  const variantMedia = allProductMedia.filter((m) => m.product_variant_id);
  const gallery = productLevelMedia
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map((m) => resolveUploadUrl(m.media_url))
    .filter(Boolean);
  const sizes = bundle.sizes;
  const variants = bundle.variants
    .filter((v) => v.product_id === p.product_id)
    .map((v) => {
      const sizeRow = sizes.find((s) => s.size_id === v.size_id);
      const clothRow = bundle.clothTypes.find((c) => c.cloth_type_id === v.cloth_type_id);
      const ownMedia = variantMedia.filter((m) => m.product_variant_id === v.product_variant_id);
      const priced = withVariantPricing(v, Number(p.base_price) || 0);
      return {
        ...v,
        ...priced,
        key: v.product_variant_id || v.size_id || `${v.variant_name || "size"}`,
        label: sizeRow?.size_name || v.variant_name || "M",
        sizeName: sizeRow?.size_name || "",
        clothName: clothRow?.cloth_type_name || "",
        available:
          v.stock_qty === undefined || v.stock_qty === null
            ? true
            : Number(v.stock_qty) > 0,
        image: resolveUploadUrl(ownMedia[0]?.media_url) || null,
      };
    });
  const productReviews = reviews.filter(
    (r) => String(r.product_id) === String(p.product_id) && r.is_approved !== false && r.isdeleted !== true
  );
  const summary = ratingSummary.find((s) => String(s.product_id) === String(p.product_id)) || null;
  const price = Number(p.base_price) || 0;
  const related = bundle.products
    .filter((x) => x.product_id !== p.product_id && x.isdeleted !== true && x.isactive !== false)
    .map((x) => ({ x, diff: Math.abs((Number(x.base_price) || 0) - price) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 4)
    .map(({ x }) => mapProduct(x, bundle.media));

  // --- COLORWAY PIPELINE ---
  // A color is a variant attribute of this product. It must never resolve to
  // another product just because that product has a similar name.
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

  function detectColor(text) {
    if (!text) return null;
    const low = String(text).toLowerCase();
    for (const k of COLOR_KEYS) {
      if (new RegExp(`\\b${k}\\b`, "i").test(low)) {
        return LUXURY_PALETTE[k];
      }
    }
    return null;
  }

  const colorAttr = bundle.attributes.find(
    (a) => a.attribute_slug?.toLowerCase() === "color" || a.attribute_name?.toLowerCase() === "color"
  );
  const splitColors = (value) => String(value || "")
    .split(/[\\/|,]+/)
    .map((s) => s.trim())
    .filter((s) => s && !["nil", "f"].includes(s.toLowerCase()));
  const variantColor = (variantId) => {
    if (!colorAttr || !variantId) return [];
    return bundle.attrValues
      .filter((v) => String(v.product_variant_id) === String(variantId) && v.attribute_id === colorAttr.attribute_id)
      .flatMap((v) => splitColors(v.attribute_value));
  };
  const productVariants = bundle.variants.filter((v) => String(v.product_id) === String(p.product_id));
  const productColorValues = colorAttr
    ? bundle.attrValues
        .filter((v) => String(v.product_id) === String(p.product_id) && v.attribute_id === colorAttr.attribute_id)
        .flatMap((v) => splitColors(v.attribute_value))
    : [];
  const variantColorValues = productVariants.flatMap((v) => variantColor(v.product_variant_id));
  const hasVariantColors = variantColorValues.length > 0;
  const selfColorMeta = detectColor(p.product_name);
  const rawColors = [...variantColorValues, ...productColorValues];
  if (selfColorMeta && rawColors.length === 0) rawColors.push(selfColorMeta.name);
  const colorList = [...new Set(rawColors.map((c) => c.trim()).filter(Boolean))];
  const normalizedColor = (value) => String(value || "").trim().toLowerCase();
  const colorMatches = (variant, colorName) => {
    const values = variantColor(variant.product_variant_id);
    return !hasVariantColors || values.some((value) => normalizedColor(value) === normalizedColor(colorName));
  };

  const buildVariantsForColor = (prodPrice, colorFilter = "") => {
    const filteredVars = colorFilter
      ? productVariants.filter((v) => colorMatches(v, colorFilter))
      : productVariants;
    if (filteredVars.length === 0) {
      return [{ key: "default", label: "M", price: prodPrice, available: true, image: null, variant: null }];
    }
    return filteredVars.map((v, idx) => {
      const sizeRow = sizes.find((s) => s.size_id === v.size_id);
      const clothRow = bundle.clothTypes.find((c) => c.cloth_type_id === v.cloth_type_id);
      const ownMedia = variantMedia.filter((m) => m.product_variant_id === v.product_variant_id);
      const priced = withVariantPricing(v, prodPrice);
      return {
        ...v,
        ...priced,
        key: v.product_variant_id || v.size_id || `${v.variant_name || "size"}-${idx}`,
        label: sizeRow?.size_name || v.variant_name || "M",
        sizeName: sizeRow?.size_name || "",
        clothName: clothRow?.cloth_type_name || "",
         color: variantColor(v.product_variant_id)[0] || null,
        price: priced.finalPrice,
        available: v.stock_qty === undefined || v.stock_qty === null ? true : Number(v.stock_qty) > 0,
        image: resolveUploadUrl(ownMedia[0]?.media_url) || null,
        variant: v,
      };
    });
  };

  const variantGalleryForColor = (colorName) => {
    const variantIds = productVariants
      .filter((v) => colorMatches(v, colorName))
      .map((v) => v.product_variant_id);
    return variantMedia
      .filter((m) => variantIds.includes(m.product_variant_id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((m) => resolveUploadUrl(m.media_url))
      .filter(Boolean);
  };

  // Every color option keeps the current product identity. Only its variant
  // rows, price/stock, and variant media change.
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
      price: minVariantPrice(buildVariantsForColor(price, colName), price)?.finalPrice ?? price,
      description: p.short_description || p.description || "",
      images: variantGalleryForColor(colName).length > 0 ? variantGalleryForColor(colName) : gallery,
      variants: buildVariantsForColor(price, colName),
    };
  });

  return {
    ...mapProduct(p, bundle.media),
    gallery,
    media: productLevelMedia,
    variantMedia,
    variants,
    colors: colorVariants.map((c) => c.name),
    colorVariants,
    reviews: productReviews,
    ratingSummary: summary,
    details: productDetails || null,
    sizeChart: Array.isArray(sizeChart) ? sizeChart : [],
    related,
  };
  } catch (e) {
    console.error("getProduct failed", idOrSlug, e);
    return null;
  }
}

/**
 * @deprecated Unused reference — do not import.
 * Home sections now fetch their own data (VideoImageSlider, Spotlight,
 * HomeFaqs, OfferBar). Kept for reference only.
 */
export async function getHomeData() {
  const [sliders, spotlight, styleCollections, faqs, settings, products, media] =
    await Promise.all([
      apiGet("/Image-Sliders").then(unwrap).catch(() => []),
      apiGet("/Spotlight-Entries").then(unwrap).catch(() => []),
      apiGet("/Style-Collections").then(unwrap).catch(() => []),
      apiGet("/FAQs").then(unwrap).catch(() => []),
      apiGet("/Settings").then(unwrap).catch(() => []),
      apiGet("/Products").then(unwrap).catch(() => []),
      apiGet("/Products-Media").then(unwrap).catch(() => []),
    ]);
  const live = products.filter((p) => p.isdeleted !== true && p.isactive !== false).slice(0, 8);
  return {
    sliders: sliders.filter((s) => s.isactive !== false),
    spotlight: spotlight.filter((s) => s.isactive !== false),
    styleCollections: styleCollections.filter((s) => s.isactive !== false),
    faqs: faqs.filter((f) => f.isactive !== false).slice(0, 6),
    settings,
    featured: live.map((p) => mapProduct(p, media)),
  };
}

// DB-slug fallback: single-segment URLs the hardcoded catalog.js keys don't
// know (admin-renamed/added Menu-Category, Menu-Sub-Category,
// Style-Collection, or Product slugs). Returns a renderable descriptor.
// Hardcoded slugs always win — call only when resolveSlug() misses.
// Lookups are always fresh (revalidate: 0): they run only when a cached page
// regenerates, so correctness costs ~4 API calls per regeneration, not per visit.
export async function resolveDbSlug(slugParts) {
  if (!Array.isArray(slugParts) || slugParts.length !== 1) return null;
  const key = String(slugParts[0] || "").toLowerCase();
  if (!key) return null;
  const fresh = { revalidate: 0 };
  try {
    const [cats, subs, cols, prods] = await Promise.all([
      apiGet("/Menu-Category", fresh).then(unwrap).catch(() => []),
      apiGet("/Menu-Sub-Category", fresh).then(unwrap).catch(() => []),
      apiGet("/Style-Collections", fresh).then(unwrap).catch(() => []),
      apiGet("/Products", { params: { pageSize: 200 }, ...fresh }).then(unwrap).catch(() => []),
    ]);
    const cat = (Array.isArray(cats) ? cats : []).find(
      (c) =>
        String(c.menu_category_slug || "").toLowerCase() === key &&
        c.isactive !== false &&
        c.isdeleted !== true
    );
    if (cat) {
      return {
        type: "db-category",
        title: cat.menu_category_name || cat.menu_category_slug,
        keywords: [cat.menu_category_name, cat.menu_category_slug].filter(Boolean),
      };
    }
    const sub = (Array.isArray(subs) ? subs : []).find(
      (s) =>
        String(s.menu_subcategory_slug || "").toLowerCase() === key &&
        s.isactive !== false &&
        s.isdeleted !== true
    );
    if (sub) {
      return {
        type: "db-category",
        title: sub.menu_subcategory_name || sub.menu_subcategory_slug,
        keywords: [sub.menu_subcategory_name, sub.menu_subcategory_slug].filter(Boolean),
        redirect: sub.redirect_link || null,
      };
    }
    const col = (Array.isArray(cols) ? cols : []).find(
      (c) =>
        String(c.collection_slug || "").toLowerCase() === key &&
        c.isactive !== false &&
        c.isdeleted !== true
    );
    if (col) {
      return {
        type: "db-collection",
        title: col.collection_name || col.collection_slug,
        keywords: [col.collection_name, col.collection_slug].filter(Boolean),
        row: col,
      };
    }
    // Top-level product slug (/<product-slug> without the /product/ prefix).
    // Last resort — categories, subs and collections win on collision.
    const prod = (Array.isArray(prods) ? prods : []).find(
      (p) =>
        String(p.product_slug || "").toLowerCase() === key &&
        p.isactive !== false &&
        p.isdeleted !== true
    );
    if (prod) {
      return { type: "product", id: prod.product_slug };
    }
  } catch {
    /* unreachable backend — caller falls through to notFound */
  }
  return null;
}
