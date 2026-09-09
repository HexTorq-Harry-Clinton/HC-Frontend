import Link from "next/link";
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import { inr } from "@/lib/api";

// Product grid: same structure/texts as the previous UI —
// "Shop {keyword}" / "Shop All Products" heading, name-filtered cards.
export default async function ProductGrid({ keyword = "" }) {
  let products = [];
  let error = "";
  try {
    const [productsRes, mediaRes] = await Promise.all([
      apiGet("/Products"),
      apiGet("/Products-Media").catch(() => ({ data: [] })),
    ]);
    const apiProducts = unwrap(productsRes);
    const apiMedia = unwrap(mediaRes);
    const keywordLower = keyword.toLowerCase();
    products = apiProducts
      .map((p) => {
        const media = apiMedia.find((m) => m.product_id === p.product_id && m.isprimary === true);
        return {
          id: p.product_id,
          slug: p.product_slug,
          name: p.product_name,
          price: p.base_price || 0,
          currency: p.currency_code || "INR",
          image: resolveUploadUrl(media?.media_url) || null,
        };
      })
      .filter((p) => (!keywordLower || p.name.toLowerCase().includes(keywordLower)));
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
          <div className="col" key={product.id}>
            <Link href={`/product/${product.slug || product.id}`} className="text-decoration-none text-dark">
              <div className="card h-100 border-0 shadow-sm">
                {product.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} loading="lazy" className="card-img-top" style={{ objectFit: "cover", height: "280px" }} />
                )}
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
        .card { border: 1px solid #eee; background: #fff; }
        .card-img-top { width: 100%; }
        .card-body { padding: 1rem; text-align: center; }
        .card-title { font-size: 1rem; margin-bottom: 0.25rem; }
        .card-text.fw-bold { font-weight: 700; }
        .text-decoration-none { text-decoration: none; }
        .text-dark { color: #111; }
        .h-100 { height: 100%; } .border-0 { border: 0; } .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .mb-4 { margin-bottom: 1.5rem; } .text-center { text-align: center; }
        .py-5 { padding-top: 3rem; padding-bottom: 3rem; } .py-3 { padding-top: 1rem; padding-bottom: 1rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .text-sm { font-size: 0.875rem; } .text-red-600 { color: #dc2626; }
      `}</style>
    </div>
  );
}
