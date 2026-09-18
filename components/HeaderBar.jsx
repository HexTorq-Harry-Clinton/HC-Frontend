"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import Hamburger from "./Hamburger";
import ProfileDropdown from "./ProfileDropdown";
import SearchDropdown from "./SearchDropdown";
import CartDrawer from "./CartDrawer";
import CIconModal from "./CIconModal";

// Header: exact structure of the previous UI —
// LEFT (hamburger, C-icon appointment, search) | CENTER (logo) | RIGHT (wishlist, bag, profile).
export default function HeaderBar({ categories }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [cPulse, setCPulse] = useState(0);
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

      <header className="topbar-enter sticky top-0 z-[80] flex items-center justify-between bg-white px-3 py-1">
        <div className="flex items-center gap-3">
          <Hamburger categories={categories} />

          <div className="c-home">
            <button
              type="button"
              className="c-icon"
              aria-label="Book a custom appointment"
              onClick={() => { setCPulse((n) => n + 1); setModalOpen(true); }}
            >
              C
            </button>
            {cPulse > 0 && <span key={cPulse} className="c-ring" aria-hidden />}
          </div>

          <div className="search hicon" onClick={() => setSearchOpen(true)} aria-label="Open search">
            <i
              className="bi bi-search"
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        <div className="logo mx-auto flex justify-center text-center">
          <Link href="/" aria-label="Harry Clinton home" className="block">
            <Image
              src="/brand/logo-black.png"
              alt="Harry Clinton"
              width={20}
              height={20}
              priority
              style={{ height: "20px", width: "auto", objectFit: "contain" }}
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/wishlist" className="hicon relative text-neutral-900" aria-label="Wishlist">
            <i className="bi bi-heart"></i>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button type="button" onClick={() => setBagOpen(true)} className="hicon relative text-neutral-900" aria-label="Open bag">
            <i className="bi bi-bag"></i>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <div ref={profileRef} className="hicon" style={{ position: "relative" }}>
            <i
              className="bi bi-person-circle"
              style={{ cursor: "pointer" }}
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Account"
            ></i>
            {open && <ProfileDropdown onClose={() => setOpen(false)} />}
          </div>
        </div>
      </header>

      <CIconModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <CartDrawer open={bagOpen} onClose={() => setBagOpen(false)} />

      <style jsx>{`
        .fs-4 { font-size: 1.4rem; }
        /* every topbar control rides in an identical 38px box so icons share
           one optical center — no floaters, no size drift. */
        .hicon {
          width: 28px; height: 28px; flex: none;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer;
        }
        .hicon > i { display: block; line-height: 1; }
        .topbar-enter { animation: topbarDrop 0.55s cubic-bezier(0.16, 0.8, 0.24, 1) both; }
        @keyframes topbarDrop { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: translateY(0); } }
        .c-home { position: relative; }
        .c-icon {
          width: 26px; height: 26px; border-radius: 50%;
          border: 1.5px solid #111; background: #fff;
          font-family: var(--font-display); font-weight: 700; font-size: 0.85rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform 0.15s ease, background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
        }
        .c-icon:hover { background: #111; color: #c6a15b; border-color: #111; }
        .c-icon:active { transform: scale(0.85); }
        .c-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 1.5px solid #c6a15b; pointer-events: none;
          animation: cRing 0.5s ease-out forwards;
        }
        @keyframes cRing { from { opacity: 0.9; transform: scale(1); } to { opacity: 0; transform: scale(1.8); } }
      `}</style>
    </>
  );
}
