"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
};

function labelFor(segment) {
  if (PATH_LABELS[segment]) return PATH_LABELS[segment];
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumb({ trail, dark = false }) {
  const pathname = usePathname();
  const segments = (trail
    ? trail.map((t) => ({ label: t.label, to: t.href }))
    : pathname
        .split("/")
        .filter((x) => x && x.trim() && !["collection", "product"].includes(x))
        .map((s) => ({ label: labelFor(decodeURIComponent(s)), to: `/${s}` })));

  const dim = dark ? "text-neutral-400" : "text-neutral-500";
  const strong = dark ? "text-white" : "text-neutral-900";
  const linkCls = dark ? "breadcrumb-link hover:text-white" : "breadcrumb-link hover:text-neutral-900";

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-wrap">
      <ol className={`mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 pt-6 text-xs uppercase tracking-widest ${dim}`}>
        <li className="breadcrumb-item">
          <Link href="/" className={linkCls}>
            <i className="bi bi-house-door-fill"></i>
            <span className="ml-1">Home</span>
          </Link>
        </li>
        {segments.map((s, i) => {
          const isLast = i === segments.length - 1;
          const to = s.to || `/${segments.slice(0, i + 1).map((x) => x.label).join("/")}`;
          return (
            <li key={i} className="breadcrumb-item flex items-center gap-2">
              <span className="text-gold">/</span>
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
