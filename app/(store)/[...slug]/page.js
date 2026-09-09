import { notFound } from "next/navigation";
import { resolveSlug, titleFor, allStorefrontSlugs, CATEGORIES, OCCASIONS, COLLECTIONS } from "@/lib/catalog";
import { getCategoryData, getProduct } from "@/lib/shop";
import CategoryView from "@/components/CategoryView";
import Reveal from "@/components/Reveal";
import ProductDetail from "@/components/ProductDetail";
import StaticPage from "@/components/StaticPage";

export const revalidate = 300;

export async function generateStaticParams() {
  return allStorefrontSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);
  if (!resolved) return { title: "Not Found" };
  if (resolved.type === "product") {
    const product = await getProduct(resolved.id);
    if (!product) return { title: "Product Not Found" };
    return { title: product.name, description: product.description };
  }
  const title = titleFor(resolved);
  return { title, description: `${title} — bespoke menswear by Harry Clinton.` };
}

export default async function SlugPage({ params }) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);
  if (!resolved) notFound();

  if (resolved.type === "product") {
    const product = await getProduct(resolved.id);
    if (!product) notFound();
    return <ProductDetail product={product} />;
  }

  if (resolved.type === "static") {
    return <StaticPage slug={resolved.slug} />;
  }

  const data = await getCategoryData(resolved);
  const title = titleFor(resolved);
  const tagline =
    resolved.type === "category"
      ? CATEGORIES[resolved.category].tagline
      : resolved.type === "collection"
        ? `The ${COLLECTIONS[resolved.collection].title}`
        : `${OCCASIONS[resolved.occasion].title} — ${CATEGORIES[resolved.category].title}`;

  return (
    <div id="shop">
      <section className="bg-neutral-950 py-20 text-center text-white">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Harry Clinton</p>
          <h1 className="mt-2 font-display text-5xl font-bold">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-neutral-300">{tagline}</p>
        </Reveal>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <CategoryView
          products={data.products}
          sizes={data.sizes}
          clothTypes={data.clothTypes}
          colors={data.colors}
        />
      </section>
    </div>
  );
}
