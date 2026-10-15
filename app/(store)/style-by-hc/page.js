import ShowcaseListing from "@/components/ShowcaseListing";
import { getShowcaseListing } from "@/lib/showcase";

export const metadata = { title: "Style by HC" };
export const dynamic = "force-dynamic";

export default async function StyleByHCPage() {
  const { cfg, cards } = await getShowcaseListing("style");
  return (
    <ShowcaseListing
      eyebrow={cfg?.eyebrow || "Style by HC"}
      title={cfg?.title || "Style by HC"}
      blurb={cfg?.blurb || ""}
      cards={cards}
    />
  );
}
