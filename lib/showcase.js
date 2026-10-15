import { apiGet, unwrap, resolveUploadUrl } from "./api";
import { getProduct } from "./shop";

// Shared showcase backend for HC Spotlight and Style by HC.
// Both sections share one template: an admin-curated entry optionally linked
// to a catalog product (+ variant). Listing cards and homepage carousels open
// a mediator detail page (/hc-spotlight/<id>, /style-by-hc/<id>); only the
// mediator's VIEW DETAILS button opens the real product page (/product/<slug>)
// where price, cart and buying live. Catalog data is never duplicated.

export const SHOWCASE = {
  spotlight: {
    entriesEndpoint: "/Spotlight-Entries",
    mediaEndpoint: "/Spotlight-Media",
    entryIdKey: "spotlight_entry_id",
    basePath: "/hc-spotlight",
    eyebrow: "HC Spotlight",
    title: "HC Spotlight",
    blurb: "A closer look at the standout look of the moment. Refined, versatile, and unmistakably Harry Clinton.",
  },
  style: {
    entriesEndpoint: "/Style-Collections",
    mediaEndpoint: "/Style-Collection-Media",
    entryIdKey: "style_collection_id",
    basePath: "/style-by-hc",
    eyebrow: "Style by HC",
    title: "Style by HC",
    blurb: "Curated looks, style guides and outfit inspiration from our in-house stylists.",
  },
};

export const isLiveRow = (r) =>
  (r.isactive === 1 || r.isactive === true || r.isactive === undefined || r.isactive === null) &&
  r.isdeleted !== 1 && r.isdeleted !== true;

const toInt = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function entryMedia(allMedia, entryId) {
  return (Array.isArray(allMedia) ? allMedia : [])
    .filter((m) => String(m.spotlight_entry_id || m.style_collection_id || "") === String(entryId) && isLiveRow(m) && m.media_url)
    .sort((a, b) => toInt(a.display_order) - toInt(b.display_order));
}

export function primaryMediaUrl(mediaList) {
  const list = Array.isArray(mediaList) ? mediaList : [];
  const primary = list.find((m) => m.isprimary === 1 || m.isprimary === true) || list[0];
  return primary ? resolveUploadUrl(primary.media_url) : null;
}

// Product-level fallback image for an entry linked to a catalog product.
export function productImageFor(productId, products, allMedia) {
  if (!productId) return null;
  const pid = String(productId);
  const own = (Array.isArray(allMedia) ? allMedia : []).filter(
    (m) => String(m.product_id) === pid && !m.product_variant_id && m.media_url
  );
  const primary =
    own.find((m) => m.isprimary === 1 || m.isprimary === true) ||
    own.find((m) => !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(String(m.media_url || ""))) ||
    own[0];
  return primary ? resolveUploadUrl(primary.media_url) : null;
}

function mediatorHref(basePath, entryId) {
  return `${basePath}/${entryId}`;
}

// Listing cards: image = showcase media first, linked product image fallback.
export async function getShowcaseListing(kind) {
  const cfg = SHOWCASE[kind];
  if (!cfg) return { cfg: null, cards: [] };
  const [entriesRaw, mediaRaw, productsRaw, productMediaRaw] = await Promise.all([
    apiGet(cfg.entriesEndpoint).then(unwrap).catch(() => []),
    apiGet(cfg.mediaEndpoint).then(unwrap).catch(() => []),
    apiGet("/Products", { params: { pageSize: 200 } }).then(unwrap).catch(() => []),
    apiGet("/Products-Media", { params: { pageSize: 200 } }).then(unwrap).catch(() => []),
  ]);
  const entries = (Array.isArray(entriesRaw) ? entriesRaw : [])
    .filter(isLiveRow)
    .sort((a, b) => toInt(a.display_order) - toInt(b.display_order));
  const liveById = {};
  for (const p of (Array.isArray(productsRaw) ? productsRaw : [])) {
    liveById[String(p.product_id)] = p.isdeleted !== true && p.isactive !== false
      ? { slug: p.product_slug, name: p.product_name }
      : null;
  }
  const cards = entries.map((e) => {
    const id = e[cfg.entryIdKey];
    const media = entryMedia(mediaRaw, id);
    const image =
      primaryMediaUrl(media) || productImageFor(e.product_id, productsRaw, productMediaRaw);
    const videoRow = media.find((m) => (m.media_type || "").toLowerCase() === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(String(m.media_url || "")));
    return {
      id,
      title: e.title || e.collection_name || "Untitled",
      subtitle: e.subtitle || e.eyebrow || "",
      description: e.description || "",
      image,
      video: videoRow ? resolveUploadUrl(videoRow.media_url) : null,
      gallery: media.map((m) => ({ src: resolveUploadUrl(m.media_url), type: m.media_type || "image", alt: m.alt_text || "" })).filter((g) => g.src),
      productId: e.product_id || null,
      productMeta: (e.product_id && liveById[String(e.product_id)]) || null,
      productVariantId: e.product_variant_id || null,
      redirectLink: e.redirect_link || null,
      ctaText: e.cta_text || null,
      href: mediatorHref(cfg.basePath, id),
    };
  }).filter((c) => c.id);
  return { cfg, cards };
}

// Mediator detail: entry + gallery + full linked product (or null) + siblings.
export async function getShowcaseDetail(kind, entryId) {
  const { cfg, cards } = await getShowcaseListing(kind);
  if (!cfg) return null;
  const card = cards.find((c) => String(c.id) === String(entryId));
  if (!card) return null;
  let product = null;
  if (card.productId && card.productMeta) {
    try {
      product = await getProduct(card.productId);
    } catch {
      product = null;
    }
  }
  const related = cards.filter((c) => String(c.id) !== String(entryId)).slice(0, 6);
  return { cfg, card, product, related };
}
