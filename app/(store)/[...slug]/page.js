import { notFound, redirect } from "next/navigation";
import { resolveSlug, titleFor, allStorefrontSlugs, COLLECTIONS } from "@/lib/catalog";
import { getCategoryData, getProduct, resolveDbSlug } from "@/lib/shop";
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import ProductDetail from "@/components/ProductDetail";
import ProductDetailLoader from "@/components/ProductDetailLoader";
import StaticPage from "@/components/StaticPage";
import OccasionPage from "@/components/OccasionPage";
import CategoryMain from "@/components/CategoryMain";
import CategoryView from "@/components/CategoryView";
import ShowcaseHeader from "@/components/ShowcaseHeader";
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

// Admin-editable slugs (renamed/added categories, sub-categories,
// collections) are NOT in generateStaticParams by design — they resolve
// live at request time via resolveDbSlug() below, so no rebuild is ever
// needed when content team edits a slug. Unknown paths render on demand.
export const dynamicParams = true;

export async function generateStaticParams() {
  const base = [...allStorefrontSlugs(), ["coming-soon"], ["the-vision"]];
  // Pre-render every product page at build time. On-demand renders of
  // uncached routes are currently unreliable in production, so products
  // must exist as static output — never rely on first-hit rendering.
  try {
    const products = unwrap(await apiGet("/Products", { params: { pageSize: 200 } }));
    for (const p of Array.isArray(products) ? products : []) {
      if (p?.product_slug) base.push(["product", p.product_slug]);
    }
  } catch {
    /* backend hiccup at build time: ship static routes, products render on demand */
  }
  return base.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const key = Array.isArray(slug) ? slug.join("/") : slug;
  if (key === "coming-soon") return { title: "Coming Soon" };
  if (key === "the-vision") return { title: "The Vision" };
  const resolved = resolveSlug(slug);
  if (!resolved) {
    // Not a hardcoded route — maybe an admin-edited DB slug.
    const db = await resolveDbSlug(slug).catch(() => null);
    if (!db) return { title: "Not Found" };
    if (db.type === "product") {
      try {
        const product = await getProduct(db.id);
        if (product) return { title: product.name, description: product.description };
      } catch {
        /* fall through to generic title */
      }
      return { title: "Product" };
    }
    return { title: db.title, description: `${db.title} — bespoke menswear by Harry Clinton.` };
  }
  if (resolved.type === "product") {
    try {
      const product = await getProduct(resolved.id);
      if (!product) return { title: "Product Not Found" };
      return { title: product.name, description: product.description };
    } catch {
      return { title: "Product" };
    }
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
  let resolved = resolveSlug(slug);
  if (!resolved) {
    // Admin-edited DB slug (no hardcoded catalog.js entry) — resolve live.
    const db = await resolveDbSlug(slug).catch(() => null);
    if (!db) notFound();
    // Top-level product slug — flows into the standard product branch below.
    if (db.type === "product") {
      resolved = { type: "product", id: db.id };
    } else {
    if (db.redirect && db.redirect.startsWith("/")) redirect(db.redirect);
    const data = await getCategoryData(null, db.keywords);
    if (db.type === "db-collection") {
      let bannerImage = null;
      try {
        const media = await apiGet("/Style-Collection-Media").then(unwrap).catch(() => []);
        const list = Array.isArray(media) ? media : [];
        const hit =
          list.find((m) => String(m.style_collection_id) === String(db.row?.style_collection_id) && m.isprimary) ||
          list.find((m) => String(m.style_collection_id) === String(db.row?.style_collection_id));
        bannerImage = resolveUploadUrl(hit?.media_url) || null;
      } catch {
        /* banner stays empty */
      }
      return (
        <CollectionView
          meta={{
            title: db.title,
            eyebrow: "Style by HC",
            description: db.row?.description || "",
            bannerImage,
          }}
          products={data.products}
          sizes={data.sizes}
          clothTypes={data.clothTypes}
          colors={data.colors}
        />
      );
    }
    return (
      <>
        <ShowcaseHeader eyebrow="Harry Clinton" title={db.title} />
        <CategoryView
          products={data.products}
          sizes={data.sizes}
          clothTypes={data.clothTypes}
          colors={data.colors}
          emptyTitle={`Nothing in ${db.title} yet`}
        />
      </>
    );
    }
  }

  if (resolved.type === "product") {
    // Fetch outside the try/catch: React renders the returned element later,
    // so JSX inside a try/catch cannot catch render errors (and the linter
    // flags it). Here we only resolve the data; rendering happens below.
    let product = null;
    let failed = false;
    try {
      product = await getProduct(resolved.id);
    } catch (e) {
      console.error("product load failed", resolved.id, e);
      failed = true;
    }
    // Server catalog came back empty (slow/unreachable backend) or threw — do
    // NOT notFound(). The product usually exists; the browser can reach the
    // API even when the server-side fetch failed. Fall back to a client-side
    // fetch so the product still renders.
    if (failed || !product) return <ProductDetailLoader id={resolved.id} />;
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
