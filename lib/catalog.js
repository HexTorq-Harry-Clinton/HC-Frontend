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

// slug -> page config. Texts are verbatim from the previous UI
// (heroTitle/heroSubtitle/marquee/descTitle/footer/keywords per page).
const SUB = "For the Men Who Wear Royalty, Not Just Suits.";
const VELVET =
  "Command attention with this masterpiece of craftsmanship: a luxurious black velvet tuxedo intricately hand-embroidered with golden threadwork and shimmering sequins. The blazer features an ornate front design, extending seamlessly to an equally detailed back, showcasing royal patterns inspired by heritage artistry. Paired with a sleek black shirt, bow tie, and trousers, the look is finished with a golden pocket square for the perfect touch of elegance.\n\nThis outfit blends modern tailoring with timeless hand embroidery, making it the ideal choice for weddings, receptions, red carpet events, and any occasion where sophistication meets grandeur.";

const OCCASION_PAGES = {
  // suits
  wedding: { category: "suits", heroTitle: "Wedding", marquee: ["Wedding"], descTitle: "The Wedding Edit", footer: "The Wedding Collection", keywords: ["wedding", "sangeet", "reception", "engagement", "mehendi", "haldi", "church", "destination"] },
  business: { category: "suits", heroTitle: "Business", marquee: ["Business"], descTitle: "The Business Edit", footer: "The Business Collection", keywords: ["suit", "business", "formal", "office"] },
  designer: { category: "suits", heroTitle: "Designer", marquee: ["Designer"], descTitle: "The Designer Edit", footer: "The Designer Collection", keywords: ["suit", "designer"] },
  travel: { category: "suits", heroTitle: "Travel", marquee: ["Travel"], descTitle: "The Travel Edit", footer: "The Travel Collection", keywords: ["suit", "travel"] },
  "smart-casual": { category: "suits", heroTitle: "Smart casual", marquee: ["Smart casual"], descTitle: "The Smart casual Edit", footer: "The Smart casual Collection", keywords: ["suit", "smart", "casual"] },
  // baby suits
  "wedding-baby": { category: "babysuits", heroTitle: "Wedding & Ring Bearer Suits", marquee: ["Wedding & Ring Bearer Suits"], descTitle: "The Wedding & Ring Bearer Suits Edit", footer: "The Wedding & Ring Bearer Suits Collection", keywords: ["baby", "wedding"] },
  "business-baby": { category: "babysuits", heroTitle: "Business Baby Suits", marquee: ["Business Baby Suits"], descTitle: "The Business Baby Suits Edit", footer: "The Business Baby Suits Collection", keywords: ["baby", "business", "formal"] },
  "designer-baby": { category: "babysuits", heroTitle: "Designer Baby Suits", marquee: ["Designer Baby Suits"], descTitle: "The Designer Baby Suits Edit", footer: "The Designer Baby Suits Collection", keywords: ["baby", "designer"] },
  "travel-baby": { category: "babysuits", heroTitle: "Travel Baby Suits", marquee: ["Travel Baby Suits"], descTitle: "The Travel Baby Suits Edit", footer: "The Travel Baby Suits Collection", keywords: ["baby", "travel"] },
  "casual-baby": { category: "babysuits", heroTitle: "Smart Casual Baby Suits", marquee: ["Smart Casual Baby Suits"], descTitle: "The Smart Casual Baby Suits Edit", footer: "The Smart Casual Baby Suits Collection", keywords: ["baby", "smart", "casual"] },
  // indo-western
  "indo-wedding": { category: "indowestern", heroTitle: "Wedding Indo Western", marquee: ["Wedding Indo Western"], descTitle: "The Wedding Indo Western Edit", footer: "The Wedding Indo Western Collection", keywords: ["indowestern", "indo-western", "wedding", "sangeet", "reception", "engagement"] },
  "indo-business": { category: "indowestern", heroTitle: "Business Indo Western", marquee: ["Business Indo Western"], descTitle: "The Business Indo Western Edit", footer: "The Business Indo Western Collection", keywords: ["indowestern", "indo-western", "business", "office", "corporate", "executive"] },
  "indo-designer": { category: "indowestern", heroTitle: "Designer IW", marquee: ["Designer IW"], descTitle: "The Designer IW Edit", footer: "The Designer IW Collection", keywords: ["indowestern", "indo-western", "designer"] },
  "indo-travel": { category: "indowestern", heroTitle: "Travel Indo Western", marquee: ["Travel Indo Western"], descTitle: "The Travel Indo Western Edit", footer: "The Travel Indo Western Collection", keywords: ["indowestern", "indo-western", "travel"] },
  "indo-casual": { category: "indowestern", heroTitle: "Smart Casual Indo Western", marquee: ["Smart Casual Indo Western"], descTitle: "The Smart Casual Indo Western Edit", footer: "The Smart Casual Indo Western Collection", keywords: ["indowestern", "indo-western", "smart", "casual"] },
  // shirts
  "wedding-shirts": { category: "shirts", heroTitle: "Wedding Shirts", marquee: ["Wedding Shirts"], descTitle: "The Wedding Shirts Edit", footer: "The Wedding Shirts Collection", keywords: ["shirt", "wedding"] },
  "business-shirts": { category: "shirts", heroTitle: "Business", marquee: ["Business"], descTitle: "The Business Edit", footer: "The Business Collection", keywords: ["shirt", "business", "office", "corporate"] },
  "designer-shirts": { category: "shirts", heroTitle: "Designer", marquee: ["Designer"], descTitle: "The Designer Edit", footer: "The Designer Collection", keywords: ["shirt", "designer"] },
  "travel-shirts": { category: "shirts", heroTitle: "Travel Shirts", marquee: ["Travel Shirts"], descTitle: "The Travel Shirts Edit", footer: "The Travel Shirts Collection", keywords: ["shirt", "travel"] },
  "casual-shirts": { category: "shirts", heroTitle: "Casual", marquee: ["Casual"], descTitle: "The Casual Edit", footer: "The Casual Collection", keywords: ["shirt", "smart", "casual"] },
  // trousers
  "wedding-trouser": { category: "trousers", heroTitle: "Wedding Trousers", marquee: ["Wedding Trousers"], descTitle: "The Wedding Trousers Edit", footer: "The Wedding Trousers Collection", keywords: ["trouser", "wedding"] },
  "business-trouser": { category: "trousers", heroTitle: "Business Trousers", marquee: ["Business Trousers"], descTitle: "The Business Trousers Edit", footer: "The Business Trousers Collection", keywords: ["trouser", "business", "office", "corporate"] },
  "designer-trouser": { category: "trousers", heroTitle: "Designer", marquee: ["Designer"], descTitle: "The Designer Edit", footer: "The Designer Collection", keywords: ["trouser", "designer"] },
  "travel-trouser": { category: "trousers", heroTitle: "Travel Trousers", marquee: ["Travel Trousers"], descTitle: "The Travel Trousers Edit", footer: "The Travel Trousers Collection", keywords: ["trouser", "travel"] },
  "smart-casual-trouser": { category: "trousers", heroTitle: "Casual", marquee: ["Casual"], descTitle: "The Casual Edit", footer: "The Casual Collection", keywords: ["trouser", "smart", "casual"] },
};

export function occasionPage(slug) {
  const page = OCCASION_PAGES[slug];
  if (!page) return null;
  return { ...page, heroSubtitle: SUB, descText: VELVET };
}

// Category main pages: hero/marquee/subcategory cards verbatim from before.
export const CATEGORY_MAINS = {
  suits: {
    heroTitle: "Own the Room", heroSubtitle: "Power dressing starts with a perfectly tailored suit.",
    marquee: ["Wedding", "Business", "Designer", "Travel", "Smart casual"],
    subs: [
      { name: "Wedding", link: "/wedding" },
      { name: "Business", link: "/business" },
      { name: "Designer", link: "/designer" },
      { name: "Travel", link: "/travel" },
      { name: "Smart Casual", link: "/smart-casual" },
    ],
  },
  shirts: {
    heroTitle: "New Arrivals", heroSubtitle: "Power dressing starts with a perfectly tailored shirt.",
    marquee: ["Formal", "Casual", "Designer", "Ceremonial", "Business"],
    subs: [
      { name: "Formal", link: "/coming-soon" },
      { name: "Casual", link: "/casual-shirts" },
      { name: "Designer", link: "/designer-shirts" },
      { name: "Ceremonial", link: "/coming-soon" },
      { name: "Business", link: "/business-shirts" },
    ],
  },
  trousers: {
    heroTitle: "Own the Room", heroSubtitle: "Power dressing starts with perfectly tailored trousers.",
    marquee: ["Formal", "Casual", "Designer"],
    subs: [
      { name: "Formal", link: "/coming-soon" },
      { name: "Casual", link: "/smart-casual-trouser" },
      { name: "Designer", link: "/designer-trouser" },
    ],
  },
  indowestern: {
    heroTitle: "Own the Room", heroSubtitle: "Power dressing starts with a perfectly tailored Indo-Western.",
    marquee: ["Wedding Indo Western", "Designer IW", "Wedding Guest IW", "Haldi IW", "Sangeet IW"],
    subs: [
      { name: "Wedding Indo Western", link: "/indo-wedding" },
      { name: "Designer IW", link: "/indo-designer" },
      { name: "Wedding Guest IW", link: "/coming-soon" },
      { name: "Haldi IW", link: "/coming-soon" },
      { name: "Sangeet IW", link: "/coming-soon" },
    ],
  },
  babysuits: {
    heroTitle: "Own the Room", heroSubtitle: "Power dressing starts with perfectly tailored baby suits.",
    marquee: ["Baby First Birthday Suits", "Baptism & Christening Suits", "Wedding & Ring Bearer Suits", "Family Photoshoot Suits", "Formal & Party Wear Suits"],
    subs: [
      { name: "Baby First Birthday Suits", link: "/coming-soon" },
      { name: "Baptism & Christening Suits", link: "/coming-soon" },
      { name: "Wedding & Ring Bearer Suits", link: "/wedding-baby" },
      { name: "Family Photoshoot Suits", link: "/coming-soon" },
      { name: "Formal & Party Wear Suits", link: "/coming-soon" },
    ],
  },
};

export const COLLECTIONS = {
  tuxedo: { title: "The Tuxedo Collection", keywords: ["tuxedo"] },
  "extreme-poppins": { title: "Extreme Poppins", keywords: ["poppins"] },
  "gurkha-trousers": { title: "Gurkha Trousers", keywords: ["gurkha"] },
  "linen-shirts-trousers": { title: "Linen Shirts & Trousers", keywords: ["linen"] },
  cigarettes: { title: "88 Cigarettes", keywords: ["cigarette", "88"] },
};

// Static/content pages rendered from backend Legal/FAQ/Settings APIs.
// (Service pages have dedicated routes below.)
export const STATIC_PAGES = [
  "aboutUs", "about-designer", "contact-us", "privacy-policy",
  "terms-and-conditions", "FAQs", "Policies", "help-center",
  "coming-soon", "the-vision",
];

// Service editorial pages with dedicated templates.
export const SERVICE_ROUTES = [
  "services", "embroidery", "alterations", "personal-styling", "custom-tailoring",
];

export function resolveSlug(slugParts) {
  const slug = slugParts.join("/");
  if (slugParts[0] === "product" && slugParts[1]) {
    return { type: "product", id: slugParts[1] };
  }
  if (CATEGORIES[slug]) return { type: "category", category: slug };
  if (OCCASION_PAGES[slug]) {
    return { type: "occasion", slug, page: occasionPage(slug) };
  }
  if (COLLECTIONS[slug]) return { type: "collection", collection: slug };
  if (SERVICE_ROUTES.includes(slug)) return { type: "service", slug };
  if (STATIC_PAGES.includes(slug)) return { type: "static", slug };
  return null;
}

export function keywordsFor(resolved) {
  if (!resolved) return [];
  if (resolved.type === "category") return CATEGORIES[resolved.category].keywords;
  if (resolved.type === "collection") return COLLECTIONS[resolved.collection].keywords;
  if (resolved.type === "occasion") return resolved.page.keywords;
  return [];
}

export function titleFor(resolved) {
  if (!resolved) return "";
  if (resolved.type === "category") return CATEGORIES[resolved.category].title;
  if (resolved.type === "collection") return COLLECTIONS[resolved.collection].title;
  if (resolved.type === "occasion") return resolved.page.heroTitle;
  if (resolved.type === "service") {
    const map = {
      services: "Our Services", embroidery: "Embroidery",
      alterations: "Alterations", "personal-styling": "Personal Styling",
      "custom-tailoring": "Custom Tailoring",
    };
    return map[resolved.slug] || resolved.slug;
  }
  return resolved.slug;
}

// Every prerenderable storefront path (used by generateStaticParams).
export function allStorefrontSlugs() {
  const slugs = [
    ...Object.keys(CATEGORIES).map((c) => [c]),
    ...Object.keys(OCCASION_PAGES).map((o) => [o]),
    ...Object.keys(COLLECTIONS).map((c) => [c]),
    ...SERVICE_ROUTES.map((s) => [s]),
    ...STATIC_PAGES.map((s) => [s]),
    ["new-arrivals"], ["hc-spotlight"], ["style-by-hc"], ["search"],
  ];
  return slugs;
}
