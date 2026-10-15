"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCached } from "@/lib/api";

// Breadcrumb: same structure/labels as the previous UI —
// home icon + Home, auto path segments with label map, last non-link.
const PATH_LABELS = {
  login: "Login", register: "Register",
  aboutUs: "About Us", "about-designer": "About the Designer",
  "contact-us": "Contact Us", "privacy-policy": "Privacy Policy",
  "terms-and-conditions": "Terms & Conditions", FAQs: "FAQs",
  Policies: "Shipping, Returns & Cancellation", "help-center": "Help Center",
  product: "Product",
  babysuits: "Baby Suits", suits: "Suits", indowestern: "Indo Western",
  shirts: "Shirts", trousers: "Trousers",
  wedding: "Wedding", business: "Business", designer: "Designer",
  travel: "Travel", "smart-casual": "Smart Casual",
  "wedding-baby": "Wedding Baby Suit", "business-baby": "Business Baby Suit",
  "designer-baby": "Designer Baby Suit", "travel-baby": "Travel Baby Suit",
  "casual-baby": "Casual Baby Suit",
  "indo-wedding": "Indo Wedding", "indo-business": "Indo Business",
  "indo-designer": "Indo Designer", "indo-travel": "Indo Travel",
  "indo-casual": "Indo Casual",
  "wedding-shirts": "Wedding Shirts", "business-shirts": "Business Shirts",
  "designer-shirts": "Designer Shirts", "travel-shirts": "Travel Shirts",
  "casual-shirts": "Casual Shirts",
  "wedding-trouser": "Wedding Trouser", "business-trouser": "Business Trouser",
  "designer-trouser": "Designer Trouser", "travel-trouser": "Travel Trouser",
  "smart-casual-trouser": "Smart Casual Trouser",
  tuxedo: "Tuxedo Collection", "extreme-poppins": "Extreme Poppins",
  "gurkha-trousers": "Gurkha Trousers", "linen-shirts-trousers": "Linen Collection",
  cigarettes: "Cigarette Collection",
  collections: "Collections", services: "Services",
  "hc-spotlight": "HC Spotlight", "style-by-hc": "Style by HC",
  "new-arrivals": "New Arrivals", "forgot-password": "Forgot Password",
  "reset-password": "Reset Password", "book-appointment": "Book Appointment",
  appointments: "Appointments", checkout: "Checkout", orders: "Orders",
  profile: "Profile", addresses: "Addresses", cart: "Cart",
  wishlist: "Wishlist", search: "Search", "coming-soon": "Coming Soon",
  "the-vision": "The Vision", auth: "Login",
};

const BREADCRUMB_PARENTS = {
  wedding: { label: "Suits", href: "/suits" },
  business: { label: "Suits", href: "/suits" },
  designer: { label: "Suits", href: "/suits" },
  travel: { label: "Suits", href: "/suits" },
  "smart-casual": { label: "Suits", href: "/suits" },
  "wedding-baby": { label: "Baby Suits", href: "/babysuits" },
  "business-baby": { label: "Baby Suits", href: "/babysuits" },
  "designer-baby": { label: "Baby Suits", href: "/babysuits" },
  "travel-baby": { label: "Baby Suits", href: "/babysuits" },
  "casual-baby": { label: "Baby Suits", href: "/babysuits" },
  "indo-wedding": { label: "Indo Western", href: "/indowestern" },
  "indo-business": { label: "Indo Western", href: "/indowestern" },
  "indo-designer": { label: "Indo Western", href: "/indowestern" },
  "indo-travel": { label: "Indo Western", href: "/indowestern" },
  "indo-casual": { label: "Indo Western", href: "/indowestern" },
  "wedding-shirts": { label: "Shirts", href: "/shirts" },
  "business-shirts": { label: "Shirts", href: "/shirts" },
  "designer-shirts": { label: "Shirts", href: "/shirts" },
  "travel-shirts": { label: "Shirts", href: "/shirts" },
  "casual-shirts": { label: "Shirts", href: "/shirts" },
  "wedding-trouser": { label: "Trousers", href: "/trousers" },
  "business-trouser": { label: "Trousers", href: "/trousers" },
  "designer-trouser": { label: "Trousers", href: "/trousers" },
  "travel-trouser": { label: "Trousers", href: "/trousers" },
  "smart-casual-trouser": { label: "Trousers", href: "/trousers" },
};

function labelFor(segment) {
  if (PATH_LABELS[segment]) return PATH_LABELS[segment];
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumb({ trail, dark = false }) {
  const pathname = usePathname();
  // { path, title }: render-phase reset keeps the label in sync with
  // navigation without a synchronous setState inside the effect below.
  const [resolved, setResolved] = useState({ path: pathname, title: null });
  if (resolved.path !== pathname) setResolved({ path: pathname, title: null });
  const storyTitle = resolved.title;

  // Mediator story pages (/hc-spotlight/<id>, /style-by-hc/<id>) carry a raw
  // entry id in the URL — resolve it to the admin-given story title.
  useEffect(() => {
    if (trail) return;
    const parts = (pathname || "").split("/").filter(Boolean);
    if (parts.length !== 2) return;
    const config =
      parts[0] === "hc-spotlight"
        ? { endpoint: "/Spotlight-Entries", idKey: "spotlight_entry_id", titleKey: "title" }
        : parts[0] === "style-by-hc"
          ? { endpoint: "/Style-Collections", idKey: "style_collection_id", titleKey: "collection_name" }
          : null;
    if (!config || parts[1].length < 8) return;
    let live = true;
    apiCached(config.endpoint)
      .then((rows) => {
        if (!live) return;
        const match = (Array.isArray(rows) ? rows : []).find(
          (r) => String(r[config.idKey]) === parts[1]
        );
        if (match?.[config.titleKey]) setResolved({ path: pathname, title: match[config.titleKey] });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [pathname, trail]);

  if (!trail && pathname === "/") return null;
  const pathSegments = pathname
    .split("/")
    .filter((x) => x && x.trim() && !["collection", "product"].includes(x));
  const segments = trail
    ? trail.map((t) => ({ label: t.label, to: t.href }))
    : pathSegments.map((segment, index) => ({
        label: index === pathSegments.length - 1 && storyTitle ? storyTitle : labelFor(decodeURIComponent(segment)),
        to: `/${pathSegments.slice(0, index + 1).join("/")}`,
      }));
  if (!trail && pathSegments.length && BREADCRUMB_PARENTS[pathSegments[0]]) {
    const parent = BREADCRUMB_PARENTS[pathSegments[0]];
    segments.unshift({ label: parent.label, to: parent.href });
  }

  const strong = dark ? "breadcrumb-current breadcrumb-current-dark" : "breadcrumb-current";
  const linkCls = dark ? "breadcrumb-link breadcrumb-link-dark" : "breadcrumb-link";

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-wrap">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link href="/" className={linkCls}>
            <i className="bi bi-house-door-fill"></i>
            <span>Home</span>
          </Link>
        </li>
        {segments.map((s, i) => {
          const isLast = i === segments.length - 1;
          const to = s.to || `/${segments.slice(0, i + 1).map((x) => x.label).join("/")}`;
          return (
            <li key={i} className="breadcrumb-item flex items-center gap-2">
              {isLast ? (
                <span className={`breadcrumb-current ${strong}`}>{s.label}</span>
              ) : (
                <Link href={to} className={linkCls}>{s.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
      <style jsx>{`
        .breadcrumb-item a { display: inline-flex; align-items: center; }
      `}</style>
    </nav>
  );
}
