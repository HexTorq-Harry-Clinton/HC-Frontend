"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/order-items", label: "Order Items" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/product-variants", label: "Variants" },
  { href: "/admin/product-media", label: "Product Media" },
  { href: "/admin/product-seo", label: "SEO" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/user-roles", label: "User Roles" },
  { href: "/admin/profiles", label: "Profiles" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/sub-categories", label: "Sub-Categories" },
  { href: "/admin/category-sync", label: "Category Sync" },
  { href: "/admin/sizes", label: "Sizes" },
  { href: "/admin/cloth-types", label: "Cloth Types" },
  { href: "/admin/care", label: "Care" },
  { href: "/admin/attributes", label: "Attributes" },
  { href: "/admin/attribute-values", label: "Attr Values" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/date-slots", label: "Date Slots" },
  { href: "/admin/slot-blocks", label: "Slot Blocks" },
  { href: "/admin/time-slots", label: "Time Slots" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/coupon-usage", label: "Coupon Usage" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/discount-targets", label: "Discount Targets" },
  { href: "/admin/order-promotions", label: "Order Promos" },
  { href: "/admin/order-status-master", label: "Order Statuses" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/shipments", label: "Shipments" },
  { href: "/admin/shipment-events", label: "Ship Events" },
  { href: "/admin/courier-partners", label: "Couriers" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/support-contacts", label: "Support" },
  { href: "/admin/legal-headers", label: "Legal Pages" },
  { href: "/admin/legal-sections", label: "Legal Sections" },
  { href: "/admin/running-bars", label: "Running Bars" },
  { href: "/admin/running-bar-items", label: "Running Items" },
  { href: "/admin/image-sliders", label: "Sliders" },
  { href: "/admin/menu-video", label: "Menu Video" },
  { href: "/admin/spotlight", label: "Spotlight" },
  { href: "/admin/spotlight-media", label: "Spotlight Media" },
  { href: "/admin/style-collections", label: "Style" },
  { href: "/admin/style-collection-media", label: "Style Media" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  // JWT lives in localStorage (invisible to the server), so the admin gate
  // must run client-side after mount. Mount-sync check is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const role = (localStorage.getItem("hc_role") || "").toLowerCase();
    const token = localStorage.getItem("hc_token");
    if (!token || !role.includes("admin")) {
      router.replace("/login");
    } else {
      setAllowed(true);
    }
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!allowed) return <p className="p-10 text-sm text-neutral-500">Checking admin access…</p>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-neutral-950 p-4 text-neutral-200">
        <Link href="/admin" className="block px-2 py-3 font-display text-lg font-bold text-white">
          HC Admin
        </Link>
        <nav className="mt-2 max-h-[75vh] space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded px-3 py-2 text-sm ${pathname === n.href ? "bg-neutral-800 text-white" : "hover:bg-neutral-900"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mt-4 block px-3 py-2 text-xs text-neutral-400 hover:text-white">
          ← Back to store
        </Link>
      </aside>
      <div className="flex-1 bg-neutral-50 p-6">{children}</div>
    </div>
  );
}
