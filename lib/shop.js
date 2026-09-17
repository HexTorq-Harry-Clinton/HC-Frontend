import { apiGet, unwrap, resolveUploadUrl } from "./api";
import { keywordsFor } from "./catalog";

// Server-side shop data. All pages render from the live backend —
// no hardcoded catalog anywhere in v2.

// Fetch-once helper: catalog endpoints in parallel, tolerant of single failures.
// /Products is paged server-side (default pageSize 50) — without an explicit
// large page size, anything past the first 50 products silently disappears
// from every storefront list and the admin table.
async function catalogBundle() {
  const [products, media, variants, attrValues, attributes, sizes, clothTypes] =
    await Promise.all([
      apiGet("/Products", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Media", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Variants", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Attributes-Values", { params: { pageSize: 200 }, revalidate: 0 }).then(unwrap).catch(() => []),
      apiGet("/Products-Attributes").then(unwrap).catch(() => []),
      apiGet("/Products-Sizes").then(unwrap).catch(() => []),
      apiGet("/Products-Cloth-Types").then(unwrap).catch(() => []),
    ]);
  return { products, media, variants, attrValues, attributes, sizes, clothTypes };
}

export function mapProduct(p, media) {
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
  const filtered = filterByKeywords(
    bundle.products.filter((p) => p.isdeleted !== true),
    keywords
  );
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
    return {
      ...mapped,
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
    (x) => x.product_id === idOrSlug || x.product_slug === idOrSlug
  );
  if (!p) return null;
  const allProductMedia = bundle.media.filter((m) => m.product_id === p.product_id);
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
  const productReviews = reviews.filter(
    (r) => r.product_id === p.product_id && r.is_approved !== false && r.isdeleted !== true
  );
  const summary = ratingSummary.find((s) => s.product_id === p.product_id) || null;
  const price = Number(p.base_price) || 0;
  const related = bundle.products
    .filter((x) => x.product_id !== p.product_id && x.isdeleted !== true && x.isactive !== false)
    .map((x) => ({ x, diff: Math.abs((Number(x.base_price) || 0) - price) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 4)
    .map(({ x }) => mapProduct(x, bundle.media));
  return {
    ...mapProduct(p, bundle.media),
    gallery,
    variants,
    reviews: productReviews,
    ratingSummary: summary,
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
