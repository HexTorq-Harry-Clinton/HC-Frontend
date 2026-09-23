import Link from "next/link";
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import { inr } from "@/lib/api";
import WishlistHeart from "./WishlistHeart";

// Product grid: same structure/texts as the previous UI —
// "Shop {keyword}" / "Shop All Products" heading, filtered cards with hearts.
// keywords[] (category vocabulary) filters properly; legacy single keyword
// still works. Hearts need no data — WishlistHeart reads the bag context.
export default async function ProductGrid({ keyword = "", keywords = [] }) {
  let products = [];
  let error = "";
  try {
    const [productsRes, mediaRes] = await Promise.all([
      apiGet("/Products", { params: { pageSize: 200 } }),
      apiGet("/Products-Media", { params: { pageSize: 200 } }).catch(() => ({ data: [] })),
    ]);
    const apiProducts = unwrap(productsRes);
    const apiMedia = unwrap(mediaRes);
    const keywordLower = keyword.toLowerCase();
    const keys = [...keywords, keyword]
      .map((k) => String(k || "").toLowerCase())
      .filter(Boolean);
    products = apiProducts
      .map((p) => {
        const media = apiMedia.find((m) => m.product_id === p.product_id && (m.isprimary === 1 || m.isprimary === true));
        return {
          id: p.product_id,
          slug: p.product_slug,
          name: p.product_name,
          price: p.base_price || 0,
          currency: p.currency_code || "INR",
          image: resolveUploadUrl(media?.media_url) || null,
          _hay: `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase(),
        };
      })
      .filter((p) => {
        if (keys.length > 0) return keys.some((k) => p._hay.includes(k));
        return !keywordLower || (p.name || "").toLowerCase().includes(keywordLower);
      });
  } catch (err) {
    error = err.message || "Failed to load products";
  }

  if (error) {
    return <div className="py-3 text-sm text-red-600">{error}</div>;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="container-fluid px-4 py-5">
      <h3 className="mb-4 text-center">{keyword ? `Shop ${keyword}` : "Shop All Products"}</h3>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {products.map((product) => (
          <div className="col group relative" key={product.id}>
            {/* Server grid can't read liked-state: always visible (liked
                hearts fill red via WishlistHeart itself). */}
            <WishlistHeart
              product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image }}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center  bg-black/70 text-[#f7f4ec] shadow transition hover:bg-gold hover:text-neutral-950"
            />
            <Link href={`/product/${product.slug || product.id}`} className="text-decoration-none text-cream">
              <div className="card h-100 border-0 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image || "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#1a1a1a"/><text x="200" y="250" font-family="Arial" font-size="20" fill="#c6a15b" text-anchor="middle">Harry Clinton</text></svg>')}
                  alt={product.name}
                  loading="lazy"
                  className="card-img-top"
                  style={{ objectFit: "cover", height: "280px", background: "#1a1a1a" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text fw-bold">{inr(product.price)}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <style>{`
        .container-fluid { width: 100%; }
        .row { display: flex; flex-wrap: wrap; }
        .g-4 { gap: 1.5rem; }
        .row-cols-1 > * { flex: 0 0 auto; width: 100%; }
        @media (min-width: 576px) { .row-cols-sm-2 > * { width: 50%; } }
        @media (min-width: 768px) { .row-cols-md-3 > * { width: 33.3333%; } }
        @media (min-width: 1024px) { .row-cols-lg-4 > * { width: 25%; } }
        .col { padding: 0 0.75rem; }
        .card { border: 1px solid rgba(255,255,255,0.12); background: #141414; }
        .card-img-top { width: 100%; }
        .card-body { padding: 1rem; text-align: center; }
        .card-title { font-size: 1rem; margin-bottom: 0.25rem; color: #f7f4ec; }
        .card-text.fw-bold { font-weight: 700; color: #c6a15b; }
        .text-decoration-none { text-decoration: none; }
        .text-cream { color: #f7f4ec; }
        .h-100 { height: 100%; } .border-0 { border: 0; } .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .mb-4 { margin-bottom: 1.5rem; } .text-center { text-align: center; }
        .py-5 { padding-top: 3rem; padding-bottom: 3rem; } .py-3 { padding-top: 1rem; padding-bottom: 1rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .text-sm { font-size: 0.875rem; } .text-red-600 { color: #dc2626; }
      `}</style>
    </div>
  );
}
