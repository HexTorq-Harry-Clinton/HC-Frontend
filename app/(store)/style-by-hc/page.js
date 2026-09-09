import { apiGet, unwrap } from "@/lib/api";
import StyleByHCView from "@/components/StyleByHCView";

export const revalidate = 300;
export const metadata = { title: "Style by HC" };

export default async function StyleByHCPage() {
  const collections = await apiGet("/Style-Collections").then(unwrap).catch(() => []);
  const live = (Array.isArray(collections) ? collections : []).filter((c) => c.isactive !== false);
  return <StyleByHCView liveCollections={live} />;
}
