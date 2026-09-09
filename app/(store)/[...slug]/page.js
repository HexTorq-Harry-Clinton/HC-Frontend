import { notFound } from "next/navigation";
import { resolveSlug, titleFor, allStorefrontSlugs, COLLECTIONS } from "@/lib/catalog";
import { getCategoryData, getProduct } from "@/lib/shop";
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import ProductDetail from "@/components/ProductDetail";
import StaticPage from "@/components/StaticPage";
import OccasionPage from "@/components/OccasionPage";
import CategoryMain from "@/components/CategoryMain";
import CollectionView from "@/components/CollectionView";
import ServicePage from "@/components/ServicePage";
import ServicesHub from "@/components/ServicesHub";
import ComingSoonView from "@/components/ComingSoonView";
import FAQsView from "@/components/FAQsView";
import TheVisionView from "@/components/TheVisionView";
import AboutUsView from "@/components/AboutUsView";
import AboutDesignerView from "@/components/AboutDesignerView";
import ContactUsView from "@/components/ContactUsView";
import LegalView from "@/components/LegalView";
import PoliciesView from "@/components/PoliciesView";
import HelpCenterView from "@/components/HelpCenterView";
import { servicePage } from "@/lib/services";

export const revalidate = 300;

export async function generateStaticParams() {
  return [...allStorefrontSlugs(), ["coming-soon"], ["the-vision"]].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const key = Array.isArray(slug) ? slug.join("/") : slug;
  if (key === "coming-soon") return { title: "Coming Soon" };
  if (key === "the-vision") return { title: "The Vision" };
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
  const key = Array.isArray(slug) ? slug.join("/") : slug;
  if (key === "coming-soon") {
    return <ComingSoonView />;
  }
  if (key === "aboutUs") {
    return <AboutUsView />;
  }
  if (key === "about-designer") {
    return <AboutDesignerView />;
  }
  if (key === "contact-us") {
    return <ContactUsView />;
  }
  if (key === "Policies") {
    return <PoliciesView />;
  }
  if (key === "help-center") {
    return <HelpCenterView />;
  }
  if (key === "privacy-policy") {
    return <LegalView doc="privacy" />;
  }
  if (key === "terms-and-conditions") {
    return <LegalView doc="terms" />;
  }
  if (key === "the-vision") {
    return <TheVisionView />;
  }
  if (key === "FAQs") {
    return <FAQsView />;
  }
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

  if (resolved.type === "service") {
    if (resolved.slug === "services") return <ServicesHub />;
    const config = servicePage(resolved.slug);
    if (!config) notFound();
    return <ServicePage config={config} />;
  }

  if (resolved.type === "occasion") {
    return <OccasionPage page={resolved.page} />;
  }

  if (resolved.type === "category") {
    return <CategoryMain category={resolved.category} />;
  }

  if (resolved.type === "collection") {
    const def = COLLECTIONS[resolved.collection];
    const data = await getCategoryData(resolved);
    let meta = {
      title: def.title,
      eyebrow: def.eyebrow,
      description: def.description,
      bannerImage: null,
    };
    try {
      const [collections, media] = await Promise.all([
        apiGet("/Style-Collections").then(unwrap).catch(() => []),
        apiGet("/Style-Collection-Media").then(unwrap).catch(() => []),
      ]);
      const list = Array.isArray(collections) ? collections : [];
      const mediaList = Array.isArray(media) ? media : [];
      const matched = list.find(
        (sc) =>
          (sc.style_collection_slug || sc.style_collection_name?.toLowerCase().replace(/\s+/g, "-")) ===
          def.category
      );
      if (matched) {
        const matchedMedia =
          mediaList.find((m) => m.style_collection_id === matched.style_collection_id && m.isprimary) ||
          mediaList.find((m) => m.style_collection_id === matched.style_collection_id);
        meta = {
          title: matched.title || matched.style_collection_name || def.title,
          eyebrow: matched.eyebrow || matched.eyebrow_text || matched.subtitle || def.eyebrow,
          description: matched.description || matched.short_description || def.description,
          bannerImage:
            resolveUploadUrl(matchedMedia?.media_url) ||
            resolveUploadUrl(matched.banner_image_url || matched.image_url) ||
            null,
        };
      }
    } catch {
      /* keep defaults */
    }
    return (
      <CollectionView
        meta={meta}
        products={data.products}
        sizes={data.sizes}
        clothTypes={data.clothTypes}
        colors={data.colors}
      />
    );
  }

  notFound();
}
