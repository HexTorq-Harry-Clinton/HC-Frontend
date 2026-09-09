"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";

// Interactive navbar island: desktop links, mobile hamburger, live search,
// account menu. Rendered by the server Header with live category links.
export default function NavBar({ links }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const cart = useCart();

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("hc_token");
    localStorage.removeItem("hc_user");
    localStorage.removeItem("hc_role");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="p-2 text-xl md:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
          <Link href="/" className="font-display text-2xl font-bold tracking-wide">
            HARRY CLINTON
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-neutral-500">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-sm">
          <form onSubmit={search} className="hidden sm:block">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-36 border border-neutral-300 px-3 py-1.5 text-sm focus:w-52 focus:outline-none"
            />
          </form>
          <Link href="/wishlist" aria-label="Wishlist" className="hidden sm:inline">Wishlist</Link>
          <div className="relative">
            <button onClick={() => setAccountOpen((o) => !o)} className="font-medium">
              Account ▾
            </button>
            {accountOpen && (
              <div className="absolute right-0 mt-2 w-44 border border-neutral-200 bg-white py-2 shadow-lg">
                {["/profile|Profile", "/orders|Orders", "/addresses|Addresses", "/appointments|Appointments"].map((s) => {
                  const [href, label] = s.split("|");
                  return (
                    <Link key={href} href={href} onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-100">
                      {label}
                    </Link>
                  );
                })}
                <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-100">
                  Log out
                </button>
              </div>
            )}
          </div>
          <Link href="/cart" aria-label="Bag" className="font-semibold">
            Bag{cart && cart.count > 0 ? ` (${cart.count})` : ""}
          </Link>
        </div>
      </div>

      {open && (
        <nav className="border-t border-neutral-200 bg-white px-4 py-3 md:hidden">
          <form onSubmit={search} className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search suits, shirts…"
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
            />
          </form>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-neutral-100 py-2.5 text-sm font-medium last:border-0">
              {l.label}
            </Link>
          ))}
          <Link href="/wishlist" onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium">Wishlist</Link>
          <Link href="/book-appointment" onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium">Book Appointment</Link>
        </nav>
      )}
    </header>
  );
}
