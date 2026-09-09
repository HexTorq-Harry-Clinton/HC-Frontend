import { apiGet, unwrap } from "@/lib/api";
import HeaderBar from "./HeaderBar";

export const revalidate = 300;

// Server header: category links come from the live Menu-Category API for the
// hamburger mega-menu; the bar itself mirrors the previous UI exactly.
export default async function Header() {
  let categories = [];
  try {
    const list = unwrap(await apiGet("/Menu-Category"));
    categories = list
      .filter((c) => c.isactive !== false)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .slice(0, 6)
      .map((c) => ({
        label: c.menu_category_name,
        to: `/${c.menu_category_slug || c.menu_category_id}`,
      }));
  } catch {
    categories = [];
  }
  return <HeaderBar categories={categories} />;
}
