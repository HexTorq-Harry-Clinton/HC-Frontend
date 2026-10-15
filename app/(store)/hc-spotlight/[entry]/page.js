import { notFound } from "next/navigation";
import ShowcaseDetailView from "@/components/ShowcaseDetailView";
import { getShowcaseDetail } from "@/lib/showcase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { entry } = await params;
  const detail = await getShowcaseDetail("spotlight", entry).catch(() => null);
  return { title: detail ? `${detail.card.title} | HC Spotlight` : "HC Spotlight" };
}

function pickFeaturedReview(reviews) {
  const withText = (Array.isArray(reviews) ? reviews : []).filter((r) => r.review_text || r.review_title);
  if (withText.length === 0) return null;
  const top = [...withText].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0];
  return {
    quote: top.review_text || top.review_title,
    author: top.reviewer_name || "Verified Customer",
    stars: Number(top.rating || 5),
  };
}

export default async function HCSpotlightDetailPage({ params }) {
  const { entry } = await params;
  const detail = await getShowcaseDetail("spotlight", entry).catch(() => null);
  if (!detail) notFound();
  const { cfg, card, product, related } = detail;
  const reviews = product?.reviews || [];
  const rating = reviews.length > 0
    ? { avg: reviews.reduce((n, r) => n + Number(r.rating || 0), 0) / reviews.length, count: reviews.length }
    : null;
  return (
    <ShowcaseDetailView
      eyebrow={cfg.eyebrow}
      entry={card}
      product={product}
      productSlug={product?.slug || card.productMeta?.slug || null}
      rating={rating}
      featuredReview={pickFeaturedReview(reviews)}
      related={related}
      relatedHeading="Try it yourself"
    />
  );
}
