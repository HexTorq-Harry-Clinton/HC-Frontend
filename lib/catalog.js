// Single source of truth for every storefront route.
// Categories, occasions, collections and static pages are all data here —
// the [...slug] router renders them through shared templates (no copy-paste pages).

export const CATEGORIES = {
  suits: { title: "Suits", tagline: "For the Men Who Wear Royalty, Not Just Suits.", keywords: ["suit", "blazer", "tuxedo"] },
  shirts: { title: "Shirts", tagline: "Sharp shirts for every hour of the day.", keywords: ["shirt"] },
  trousers: { title: "Trousers", tagline: "Tailored trousers, cut to move with you.", keywords: ["trouser", "pant", "cigarette", "gurkha", "linen"] },
  indowestern: { title: "Indo-Western", tagline: "Heritage craft meets modern tailoring.", keywords: ["indo", "kurta", "sherwani", "nehru"] },
  babysuits: { title: "Baby Suits", tagline: "Little gentlemen, dressed to the nines.", keywords: ["baby", "kids"] },
};

export const OCCASIONS = {
  wedding: { title: "Wedding", keywords: ["wedding", "sangeet", "reception", "engagement", "mehendi", "haldi", "church", "destination"] },
  business: { title: "Business", keywords: ["business", "formal", "office", "corporate"] },
  designer: { title: "Designer", keywords: ["designer", "embroidery", "premium", "luxury"] },
  travel: { title: "Travel", keywords: ["travel", "casual", "comfort"] },
  "smart-casual": { title: "Smart Casual", keywords: ["casual", "smart", "minimalist"] },
};

// slug -> { category, occasion } for every legacy occasion URL.
const OCCASION_SLUGS = {
  // suits
  wedding: ["suits", "wedding"], business: ["suits", "business"], designer: ["suits", "designer"],
  travel: ["suits", "travel"], "smart-casual": ["suits", "smart-casual"],
  // baby suits
  "wedding-baby": ["babysuits", "wedding"], "business-baby": ["babysuits", "business"],
  "designer-baby": ["babysuits", "designer"], "travel-baby": ["babysuits", "travel"],
  "casual-baby": ["babysuits", "smart-casual"],
  // indo-western
  "indo-wedding": ["indowestern", "wedding"], "indo-business": ["indowestern", "business"],
  "indo-designer": ["indowestern", "designer"], "indo-travel": ["indowestern", "travel"],
  "indo-casual": ["indowestern", "smart-casual"],
  // shirts
  "wedding-shirts": ["shirts", "wedding"], "business-shirts": ["shirts", "business"],
  "designer-shirts": ["shirts", "designer"], "travel-shirts": ["shirts", "travel"],
  "casual-shirts": ["shirts", "smart-casual"],
  // trousers
  "wedding-trouser": ["trousers", "wedding"], "business-trouser": ["trousers", "business"],
  "designer-trouser": ["trousers", "designer"], "travel-trouser": ["trousers", "travel"],
  "smart-casual-trouser": ["trousers", "smart-casual"],
};

export const COLLECTIONS = {
  tuxedo: { title: "The Tuxedo Collection", keywords: ["tuxedo"] },
  "extreme-poppins": { title: "Extreme Poppins", keywords: ["poppins"] },
  "gurkha-trousers": { title: "Gurkha Trousers", keywords: ["gurkha"] },
  "linen-shirts-trousers": { title: "Linen Shirts & Trousers", keywords: ["linen"] },
  cigarettes: { title: "88 Cigarettes", keywords: ["cigarette", "88"] },
};

// Static/content pages rendered from backend Legal/FAQ/Settings APIs.
export const STATIC_PAGES = [
  "aboutUs", "about-designer", "contact-us", "privacy-policy",
  "terms-and-conditions", "FAQs", "Policies", "help-center",
  "services", "embroidery", "alterations", "personal-styling",
  "custom-tailoring", "coming-soon", "the-vision",
];

export function resolveSlug(slugParts) {
  const slug = slugParts.join("/");
  if (slugParts[0] === "product" && slugParts[1]) {
    return { type: "product", id: slugParts[1] };
  }
  if (CATEGORIES[slug]) return { type: "category", category: slug };
  if (OCCASION_SLUGS[slug]) {
    const [category, occasion] = OCCASION_SLUGS[slug];
    return { type: "occasion", category, occasion, slug };
  }
  if (COLLECTIONS[slug]) return { type: "collection", collection: slug };
  if (STATIC_PAGES.includes(slug)) return { type: "static", slug };
  return null;
}

export function keywordsFor(resolved) {
  if (!resolved) return [];
  if (resolved.type === "category") return CATEGORIES[resolved.category].keywords;
  if (resolved.type === "collection") return COLLECTIONS[resolved.collection].keywords;
  if (resolved.type === "occasion") {
    return [
      ...CATEGORIES[resolved.category].keywords,
      ...OCCASIONS[resolved.occasion].keywords,
    ];
  }
  return [];
}

export function titleFor(resolved) {
  if (!resolved) return "";
  if (resolved.type === "category") return CATEGORIES[resolved.category].title;
  if (resolved.type === "collection") return COLLECTIONS[resolved.collection].title;
  if (resolved.type === "occasion") {
    const cat = CATEGORIES[resolved.category].title.replace(/s$/, "");
    return `${OCCASIONS[resolved.occasion].title} ${cat}`;
  }
  return resolved.slug;
}

// Every prerenderable storefront path (used by generateStaticParams).
export function allStorefrontSlugs() {
  const slugs = [
    ...Object.keys(CATEGORIES).map((c) => [c]),
    ...Object.keys(OCCASION_SLUGS).map((o) => [o]),
    ...Object.keys(COLLECTIONS).map((c) => [c]),
    ...STATIC_PAGES.map((s) => [s]),
    ["new-arrivals"], ["hc-spotlight"], ["style-by-hc"], ["search"],
  ];
  return slugs;
}
