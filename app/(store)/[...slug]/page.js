import { notFound } from "next/navigation";
import { resolveSlug, titleFor, allStorefrontSlugs, COLLECTIONS } from "@/lib/catalog";
import { getCategoryData, getProduct } from "@/lib/shop";
import CategoryView from "@/components/CategoryView";
import ShowcaseHeader from "@/components/ShowcaseHeader";
import Breadcrumb from "@/components/Breadcrumb";
import ProductDetail from "@/components/ProductDetail";
import StaticPage from "@/components/StaticPage";
import OccasionPage from "@/components/OccasionPage";
import CategoryMain from "@/components/CategoryMain";

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

  if (resolved.type === "occasion") {
    return <OccasionPage page={resolved.page} />;
  }

  if (resolved.type === "category") {
    return <CategoryMain category={resolved.category} />;
  }

  const data = await getCategoryData(resolved);
  const title = titleFor(resolved);
  const tagline = `The ${COLLECTIONS[resolved.collection].title}`;

  return (
    <div id="shop">
      <div className="bg-neutral-950 pb-2"><Breadcrumb dark trail={[{ label: title }]} /></div>
      <ShowcaseHeader dark title={title} sub={tagline} />
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
