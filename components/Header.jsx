import { apiGet, unwrap } from "@/lib/api";
import NavBar from "./NavBar";

export const revalidate = 300;

// Server header: nav links come from the live Menu-Category API,
// interactivity (mobile menu, search, account) lives in the NavBar island.
export default async function Header() {
  let categories = [];
  try {
    categories = unwrap(await apiGet("/Menu-Category"));
  } catch {
    categories = [];
  }
  const links =
    categories.length > 0
      ? categories
          .filter((c) => c.isactive !== false)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .slice(0, 6)
          .map((c) => ({
            href: `/${c.menu_category_slug || c.menu_category_id}`,
            label: c.menu_category_name,
          }))
      : [
          { href: "/suits", label: "Suits" },
          { href: "/shirts", label: "Shirts" },
          { href: "/trousers", label: "Trousers" },
          { href: "/indowestern", label: "Indo-Western" },
          { href: "/babysuits", label: "Baby Suits" },
        ];

  return <NavBar links={links} />;
}
