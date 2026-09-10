"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ToastProvider, useToast } from "./ToastProvider";
import { ConfirmProvider, useConfirm } from "./ConfirmProvider";

const GROUPS = [
  { key: "dashboard", label: "Dashboard", paths: ["/admin"], labels: ["Dashboard"] },
  { key: "users", label: "User Management", labels: ["Users", "Roles", "Customer Profiles"] },
  {
    key: "catalog",
    label: "Catalog & Products",
    labels: ["Products & Media", "Categories & Subcategories", "Product Media", "Product Sizes", "Cloth Types", "Care Instructions", "Product SEO"],
  },
  {
    key: "marketing",
    label: "Marketing & Content",
    labels: ["Running Bar & Items", "Coupons", "Discounts", "Newsletters", "Reviews", "Spotlight Media", "Style Collections", "Home Video", "Home Image Sliders"],
  },
  {
    key: "sales",
    label: "Sales & Orders",
    labels: ["Orders", "Payments", "Invoices", "Appointments", "Appointment Availability"],
  },
  {
    key: "shipping",
    label: "Shipping & Logistics",
    labels: ["Courier Partners", "Shipments", "Returns & Refunds", "Refunds"],
  },
  {
    key: "support",
    label: "Support & Pages",
    labels: ["FAQs", "Support Contacts", "Legal Pages"],
  },
  { key: "settings", label: "Settings", labels: ["Settings"] },
];

const NAV = [
  { href: "/admin", label: "Dashboard", group: "dashboard" },
  { href: "/admin/users", label: "Users", group: "users" },
  { href: "/admin/roles", label: "Roles", group: "users" },
  { href: "/admin/profiles", label: "Customer Profiles", group: "users" },
  { href: "/admin/products", label: "Products & Media", group: "catalog" },
  { href: "/admin/categories", label: "Categories & Subcategories", group: "catalog" },
  { href: "/admin/running-bars", label: "Running Bar & Items", group: "marketing" },
  { href: "/admin/coupons", label: "Coupons", group: "marketing" },
  { href: "/admin/discounts", label: "Discounts", group: "marketing" },
  { href: "/admin/newsletter", label: "Newsletters", group: "marketing" },
  { href: "/admin/reviews", label: "Reviews", group: "marketing" },
  { href: "/admin/spotlight", label: "Spotlight Media", group: "marketing" },
  { href: "/admin/style-collections", label: "Style Collections", group: "marketing" },
  { href: "/admin/menu-video", label: "Home Video", group: "marketing" },
  { href: "/admin/image-sliders", label: "Home Image Sliders", group: "marketing" },
  { href: "/admin/orders", label: "Orders", group: "sales" },
  { href: "/admin/payments", label: "Payments", group: "sales" },
  { href: "/admin/invoices", label: "Invoices", group: "sales" },
  { href: "/admin/appointments", label: "Appointments", group: "sales" },
  { href: "/admin/date-slots", label: "Appointment Availability", group: "sales" },
  { href: "/admin/courier-partners", label: "Courier Partners", group: "shipping" },
  { href: "/admin/shipments", label: "Shipments", group: "shipping" },
  { href: "/admin/returns", label: "Returns & Refunds", group: "shipping" },
  { href: "/admin/refunds", label: "Refunds", group: "shipping" },
  { href: "/admin/faqs", label: "FAQs", group: "support" },
  { href: "/admin/support-contacts", label: "Support Contacts", group: "support" },
  { href: "/admin/legal-headers", label: "Legal Pages", group: "support" },
  { href: "/admin/settings", label: "Settings", group: "settings" },
];

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("hc_user") || "null");
  } catch {
    return null;
  }
}

function AdminShellInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [allowed, setAllowed] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(["dashboard"]);

  // JWT lives in localStorage (invisible to the server), so the admin gate
  // must run client-side after mount. Mount-sync check is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const role = (localStorage.getItem("hc_role") || "").toLowerCase();
    const token = localStorage.getItem("hc_token");
    const u = readUser();
    if (!token || !role.includes("admin")) {
      router.replace("/login");
    } else {
      setAllowed(true);
      setUser(u);
    }
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-expand the active group when navigating — intentional mount sync.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const active = NAV.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    );
    if (active) {
      setOpenGroups((prev) => (prev.includes(active.group) ? prev : [...prev, active.group]));
    }
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!allowed) return <p className="p-10 text-sm text-neutral-500">Checking admin access…</p>;

  const displayName = user?.full_name || user?.email || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  const toggleGroup = (key) =>
    setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const logout = async () => {
    const ok = await confirm({
      title: "Log out?",
      message: "You'll need to sign in again to access the admin panel.",
      confirmLabel: "Log Out",
      danger: true,
    });
    if (!ok) return;
    ["hc_token", "hc_user", "hc_role", "hc_session"].forEach((k) => localStorage.removeItem(k));
    router.push("/login");
  };

  return (
    <div className="admin-shell flex min-h-screen flex-col bg-[#f4f2ee]">
      <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between bg-[#17161a] px-[22px] text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
            className="border border-white/30 px-2 py-1 text-sm text-white lg:hidden"
          >
            ☰
          </button>
          <div className="flex items-center gap-2 font-semibold">
            <span className="bg-[#b08d57] px-2 py-0.5 text-sm font-bold text-[#17161a]">HC</span>
            <span>Harry Clinton Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3ead9] font-bold text-[#6b4f24]">
              {initial}
            </span>
            <span>{displayName}</span>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-white/30 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={`fixed bottom-0 left-0 top-[60px] z-50 w-[252px] overflow-y-auto bg-[#1b1a1f] px-3 pb-10 pt-[18px] text-[#d8d6dd] transition-transform duration-200 lg:sticky lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex flex-col">
            {GROUPS.map((group) => {
              const items = NAV.filter((n) => n.group === group.key);
              if (items.length === 0) return null;
              const isOpen = openGroups.includes(group.key);
              return (
                <div key={group.key} className="mb-0.5">
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center justify-between px-2.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-white/55 transition hover:text-white"
                  >
                    <span>{group.label}</span>
                    <span className="text-[10px] opacity-60">{isOpen ? "▼" : "▶"}</span>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-px pb-2 pl-1">
                      {items.map((item) => {
                        const active =
                          item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-[13.5px] transition ${
                              active
                                ? "border-[#b08d57] bg-[rgba(176,141,87,0.16)] font-semibold text-[#f1e4cb]"
                                : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-60px)] flex-1 px-4 pb-12 pt-5 md:px-8 md:pt-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminShellInner>{children}</AdminShellInner>
      </ConfirmProvider>
    </ToastProvider>
  );
}
