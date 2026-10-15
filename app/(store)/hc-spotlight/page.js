import ShowcaseListing from "@/components/ShowcaseListing";
import { getShowcaseListing } from "@/lib/showcase";

export const metadata = { title: "HC Spotlight" };
export const dynamic = "force-dynamic";

export default async function HCSpotlightPage() {
  const { cfg, cards } = await getShowcaseListing("spotlight");
  return (
    <ShowcaseListing
      eyebrow={cfg?.eyebrow || "HC Spotlight"}
      title={cfg?.title || "HC Spotlight"}
      blurb={cfg?.blurb || ""}
      cards={cards}
    />
  );
}
