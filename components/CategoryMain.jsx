import Link from "next/link";
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import { CATEGORY_MAINS } from "@/lib/catalog";
import { PLACEHOLDER_IMAGE } from "./ProductCard";
import ProductGrid from "./ProductGrid";

// Category main page: same structure as the previous UI —
// hero + Shop Now, marquee, subcategory cards (3 + rest), tail grid.
export default async function CategoryMain({ category }) {
  const main = CATEGORY_MAINS[category];
  const [cats, subs, settings] = await Promise.all([
    apiGet("/Menu-Category").then(unwrap).catch(() => []),
    apiGet("/Menu-Sub-Category").then(unwrap).catch(() => []),
    apiGet("/Settings").then(unwrap).catch(() => []),
  ]);

  const get = (key) => {
    const m = (Array.isArray(settings) ? settings : []).find(
      (s) => s.setting_key?.toLowerCase() === key || s.key?.toLowerCase() === key
    );
    return m?.setting_value ?? m?.value ?? "";
  };
  const key = (suffix) => `category_${category.toLowerCase().replace(/\s+/g, "_")}_${suffix}`;
  const tryParse = (str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const heroTitle = get(key("hero_title")) || main.heroTitle;
  const heroSubtitle = get(key("hero_subtitle")) || main.heroSubtitle;
  const marquee = tryParse(get(key("marquee_words"))) || main.marquee;

  const matched = (Array.isArray(cats) ? cats : []).find(
    (c) =>
      c.menu_category_slug?.toLowerCase() === category.toLowerCase() ||
      c.menu_category_name?.toLowerCase() === category.toLowerCase()
  );
  let subcategories = main.subs;
  if (matched) {
    const filtered = (Array.isArray(subs) ? subs : [])
      .filter((s) => s.menu_category_id === matched.menu_category_id)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((s, idx) => ({
        name: s.menu_subcategory_name,
        link:
          (s.redirect_link || "").replace(/^\/collection\//, "/") ||
          `/${s.menu_subcategory_slug || s.menu_subcategory_name.toLowerCase().replace(/\s+/g, "-")}`,
        image: resolveUploadUrl(s.menu_subcategory_image_url || s.image_url) || null,
        video: resolveUploadUrl(s.video_url) || null,
      }));
    if (filtered.length > 0) subcategories = filtered;
  }

  return (
    <>
      <section className="relative bg-neutral-950">
        <div className="flex min-h-[480px] flex-col items-start justify-center px-6 text-white md:px-16">
          <h1 className="font-display text-5xl font-bold md:text-6xl">{heroTitle}</h1>
          <h5 className="mt-2 text-lg font-normal">{heroSubtitle}</h5>
          <a href="#category-grid" className="btn-primary mt-4 !rounded-full !bg-white !text-neutral-950 hover:!bg-gold">
            Shop Now
          </a>
        </div>
      </section>

      <div className="overflow-hidden bg-neutral-100">
        <div className="animate-marquee py-4">
          {Array(4).fill(marquee).flat().map((word, idx) => (
            <span key={idx} className="mx-4 font-bold uppercase">
              {word}
            </span>
          ))}
        </div>
      </div>

      <div id="category-grid" className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-2 md:grid-cols-3">
          {subcategories.slice(0, 3).map((cat, i) => (
            <CategoryCard key={i} cat={cat} />
          ))}
        </div>
        {subcategories.length > 3 && (
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {subcategories.slice(3).map((cat, i) => (
              <CategoryCard key={i} cat={cat} />
            ))}
          </div>
        )}
      </div>

      <ProductGrid keyword="" />
    </>
  );
}

function CategoryCard({ cat }) {
  const inner = (
    <>
      {cat.video ? (
        <video src={cat.video} className="h-80 w-full object-cover" autoPlay loop muted playsInline />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cat.image || PLACEHOLDER_IMAGE} alt={cat.name} loading="lazy" className="h-80 w-full object-cover" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-lg font-semibold text-white">
        {cat.name}
      </div>
    </>
  );
  if (!cat.link) {
    return <div className="relative cursor-pointer overflow-hidden shadow-sm">{inner}</div>;
  }
  return (
    <Link href={cat.link} className="relative block overflow-hidden shadow-sm">
      {inner}
    </Link>
  );
}
