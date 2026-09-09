"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import Hamburger from "./Hamburger";
import ProfileDropdown from "./ProfileDropdown";
import SearchDropdown from "./SearchDropdown";
import CIconModal from "./CIconModal";

// Header: exact structure of the previous UI —
// LEFT (hamburger, C-icon appointment, search) | CENTER (logo) | RIGHT (wishlist, bag, profile).
export default function HeaderBar({ categories }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const profileRef = useRef(null);

  const cartCount = cart?.count || 0;
  const wishlistCount = cart?.wishlist.length || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {searchOpen && <SearchDropdown onClose={() => setSearchOpen(false)} />}

      <header className="sticky top-0 z-[80] flex items-center justify-between bg-white px-3 py-2">
        <div className="flex items-center gap-3">
          <Hamburger categories={categories} />

          <div className="c-home">
            <button
              type="button"
              className="c-icon"
              aria-label="Book a custom appointment"
              onClick={() => setModalOpen(true)}
            >
              C
            </button>
          </div>

          <div className="search">
            <i
              className="bi bi-search fs-4"
              style={{ cursor: "pointer" }}
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            />
          </div>
        </div>

        <div className="logo mx-auto text-center">
          <Link href="/" aria-label="Harry Clinton home">
            <Image src="/brand/logo-black.png" alt="Logo" width={150} height={40} priority />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/wishlist" className="relative text-neutral-900" aria-label="Wishlist">
            <i className="bi bi-heart fs-4"></i>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative text-neutral-900" aria-label="Bag">
            <i className="bi bi-bag fs-4"></i>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <div ref={profileRef} style={{ position: "relative" }}>
            <i
              className="bi bi-person-circle fs-4"
              style={{ cursor: "pointer" }}
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Account"
            ></i>
            {open && <ProfileDropdown onClose={() => setOpen(false)} />}
          </div>
        </div>
      </header>

      <CIconModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <style jsx>{`
        .fs-4 { font-size: 1.4rem; }
        .c-icon {
          width: 38px; height: 38px; border-radius: 50%;
          border: 1.5px solid #111; background: #fff;
          font-family: var(--font-display); font-weight: 700; font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.25s ease;
        }
        .c-icon:hover { background: #111; color: #c6a15b; border-color: #111; }
      `}</style>
    </>
  );
}
