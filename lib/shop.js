import { apiGet, unwrap, resolveUploadUrl } from "./api";
import { keywordsFor } from "./catalog";

// Server-side shop data. All pages render from the live backend —
// no hardcoded catalog anywhere in v2.

// Fetch-once helper: catalog endpoints in parallel, tolerant of single failures.
async function catalogBundle() {
  const [products, media, variants, attrValues, attributes, sizes, clothTypes] =
    await Promise.all([
      apiGet("/Products").then(unwrap).catch(() => []),
      apiGet("/Products-Media").then(unwrap).catch(() => []),
      apiGet("/Products-Variants").then(unwrap).catch(() => []),
      apiGet("/Products-Attributes-Values").then(unwrap).catch(() => []),
      apiGet("/Products-Attributes").then(unwrap).catch(() => []),
      apiGet("/Products-Sizes").then(unwrap).catch(() => []),
      apiGet("/Products-Cloth-Types").then(unwrap).catch(() => []),
    ]);
  return { products, media, variants, attrValues, attributes, sizes, clothTypes };
}

export function mapProduct(p, media) {
  const primary =
    media.find((m) => m.product_id === p.product_id && m.isprimary === true) ||
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
export async function getCategoryData(resolved) {
  const bundle = await catalogBundle();
  const keywords = keywordsFor(resolved);
  const filtered = filterByKeywords(
    bundle.products.filter((p) => p.isdeleted !== true),
    keywords
  );
  const products = filtered.map((p) => {
    const mapped = mapProduct(p, bundle.media);
  const pv = bundle.variants.filter((v) => v.product_id === p.product_id);
  const sizes = bundle.sizes;
  const variants = pv.map((v) => {
    const sizeRow = sizes.find((s) => s.size_id === v.size_id);
    return {
      ...v,
      label: sizeRow?.size_name || v.variant_name || "M",
      available: v.stock_qty === undefined || v.stock_qty === null ? true : Number(v.stock_qty) > 0,
    };
  });
    return {
      ...mapped,
      sizes: [...new Set(pv.map((v) => v.size_id).filter(Boolean))],
      clothTypes: [...new Set(pv.map((v) => v.cloth_type_id).filter(Boolean))],
    };
  });
  const colorAttr = bundle.attributes.find(
    (a) => a.attribute_slug?.toLowerCase() === "color" || a.attribute_name?.toLowerCase() === "color"
  );
  const colors = colorAttr
    ? [...new Set(bundle.attrValues.filter((v) => v.attribute_id === colorAttr.attribute_id).map((v) => v.attribute_value).filter(Boolean))]
    : [];
  return {
    products,
    sizes: bundle.sizes.map((s) => s.size_name).filter(Boolean),
    clothTypes: bundle.clothTypes.map((c) => c.cloth_type_name).filter(Boolean),
    colors,
  };
}

export async function getProduct(idOrSlug) {
  const bundle = await catalogBundle();
  const p = bundle.products.find(
    (x) => x.product_id === idOrSlug || x.product_slug === idOrSlug
  );
  if (!p) return null;
  const gallery = bundle.media
    .filter((m) => m.product_id === p.product_id)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map((m) => resolveUploadUrl(m.media_url))
    .filter(Boolean);
  const pv = bundle.variants.filter((v) => v.product_id === p.product_id);
  const [reviews, ratingSummary] = await Promise.all([
    apiGet("/Reviews").then(unwrap).catch(() => []),
    apiGet("/Product-Rating-Summary").then(unwrap).catch(() => []),
  ]);
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
  return { ...mapProduct(p, bundle.media), gallery, variants, reviews: productReviews, ratingSummary: summary, related };
}

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
