// Variant pricing: `price` is the MRP; discount_type/discount_value are optional.
// discount_type: "none" | "amount" | "percentage" (missing/unknown = no discount).

export const DISCOUNT_TYPES = ["none", "amount", "percentage"];

export function normalizeDiscountType(value) {
  const v = String(value || "").trim().toLowerCase();
  return DISCOUNT_TYPES.includes(v) ? v : "none";
}

// Single source of truth for variant selling-price math.
// Returns { mrp, finalPrice, discountType, discountValue, hasDiscount, discountPct }.
export function resolveVariantPrice(variant, fallbackMrp = 0) {
  const v = variant || {};
  const mrp = Math.max(
    0,
    Number(v.price ?? v.mrp ?? fallbackMrp) || 0
  );
  const discountType = normalizeDiscountType(v.discount_type ?? v.discountType);
  const discountValue = Math.max(0, Number(v.discount_value ?? v.discountValue) || 0);

  if (!mrp || discountType === "none" || !discountValue) {
    return { mrp, finalPrice: mrp, discountType: "none", discountValue: 0, hasDiscount: false, discountPct: 0 };
  }

  let finalPrice = mrp;
  if (discountType === "amount") {
    finalPrice = Math.max(0, mrp - Math.min(discountValue, mrp));
  } else {
    const pct = Math.min(discountValue, 100);
    finalPrice = Math.round(mrp * (1 - pct / 100) * 100) / 100;
  }
  const hasDiscount = finalPrice < mrp;
  return {
    mrp,
    finalPrice,
    discountType: hasDiscount ? discountType : "none",
    discountValue: hasDiscount ? discountValue : 0,
    hasDiscount,
    discountPct: hasDiscount ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0,
  };
}

// Attach pricing fields to a raw variant row without dropping existing keys.
export function withVariantPricing(variant, fallbackMrp = 0) {
  const pricing = resolveVariantPrice(variant, fallbackMrp);
  return {
    ...variant,
    mrp: pricing.mrp,
    finalPrice: pricing.finalPrice,
    discountType: pricing.discountType,
    discountValue: pricing.discountValue,
    hasDiscount: pricing.hasDiscount,
    discountPct: pricing.discountPct,
  };
}

// Cheapest selling variant in a list (for product cards). Null when empty.
export function minVariantPrice(variants, fallbackMrp = 0) {
  const list = (Array.isArray(variants) ? variants : []).map((v) => withVariantPricing(v, fallbackMrp));
  if (list.length === 0) return null;
  return list.reduce((best, cur) => (cur.finalPrice < best.finalPrice ? cur : best));
}
