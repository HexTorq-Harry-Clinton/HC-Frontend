"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Top-reveal mega-menu (previous-UI style, no sidebar): CATEGORIES (live)
// + COLLECTIONS + SERVICES + Vision tile drop down from under the header.
// Hamburger lines draw in on mount, morph to X while open; links stagger in.
const COLLECTIONS = [
  { label: "Tuxedo", to: "/tuxedo" },
  { label: "Extreme Poppins", to: "/extreme-poppins" },
  { label: "Gurkha Trousers", to: "/gurkha-trousers" },
  { label: "Linen Shirts & Trousers", to: "/linen-shirts-trousers" },
  { label: "88 Cigarettes", to: "/cigarettes" },
];

const SERVICES = [
  { label: "Embroidery", to: "/embroidery" },
  { label: "Alterations", to: "/alterations" },
  { label: "Personal Styling", to: "/personal-styling" },
  { label: "Custom Tailoring", to: "/custom-tailoring" },
];

const FALLBACK_CATEGORIES = [
  { label: "Suits", to: "/suits" },
  { label: "Indo-Western", to: "/indowestern" },
  { label: "Shirts", to: "/shirts" },
  { label: "Trousers", to: "/trousers" },
  { label: "Baby Suits", to: "/babysuits" },
];

export default function Hamburger({ categories }) {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const menuRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest(".hamburger")
      ) {
        setIsActive(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setIsActive(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const cats = categories?.length > 0 ? categories : FALLBACK_CATEGORIES;
  const go = (to) => {
    setIsActive(false);
    router.push(to);
  };

  return (
    <>
      <div className={`hamburger ${isActive ? "active" : ""}`} onClick={() => setIsActive((v) => !v)} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div ref={menuRef} className={`topmenu ${isActive ? "show" : ""}`}>
        <div className="Hdropdown grid-3col">
          <div>
            <strong>CATEGORIES</strong>
            <ul>
              {cats.map((c) => (
                <li key={c.to}>
                  <button onClick={() => go(c.to)}>{c.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>COLLECTIONS</strong>
            <ul>
              {COLLECTIONS.map((c) => (
                <li key={c.to}>
                  <button onClick={() => go(c.to)}>{c.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>SERVICES</strong>
            <ul>
              {SERVICES.map((c) => (
                <li key={c.to}>
                  <button onClick={() => go(c.to)}>{c.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="Hdropdown-image-box">
            <div className="Hdropdown-image-ph" aria-hidden />
            <div className="Hdropdown-overlay">
              <h4>The Vision</h4>
              <button onClick={() => go("/the-vision")}>Explore</button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .hamburger { width: 28px; height: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
        .hamburger span {
          display: block; width: 18px; height: 2px; background: #111;
          transform-origin: left center; transition: all 0.3s ease;
          animation: lineIn 0.5s ease backwards;
        }
        .hamburger span:nth-child(2) { animation-delay: 0.08s; }
        .hamburger span:nth-child(3) { animation-delay: 0.16s; }
        @keyframes lineIn { from { transform: scaleX(0); opacity: 0; } to { transform: scaleX(1); opacity: 1; } }
        .hamburger:hover span:nth-child(2) { width: 12px; }
        .hamburger.active span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .hamburger.active span:nth-child(2) { opacity: 0; }
        .hamburger.active span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
        .topmenu {
          position: absolute; top: 100%; left: 0; right: 0; background: #fff; z-index: 70;
          max-height: 0; opacity: 0; transform: translateY(-14px); overflow: hidden;
          transition: max-height 0.45s ease, opacity 0.3s ease, transform 0.35s ease;
          box-shadow: 0 30px 40px -20px rgba(0,0,0,0.18);
        }
        .topmenu.show { max-height: calc(100vh - 120px); opacity: 1; transform: translateY(0); overflow-y: auto; }
        .Hdropdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 2rem; }
        .Hdropdown strong { font-size: 0.72rem; letter-spacing: 0.25em; }
        .Hdropdown ul { margin-top: 0.75rem; display: grid; gap: 0.5rem; }
        .Hdropdown button { font-size: 0.9rem; }
        .Hdropdown button:hover { color: #a8823f; }
        .topmenu.show li { animation: itemIn 0.35s ease backwards; }
        .topmenu.show li:nth-child(2) { animation-delay: 0.05s; }
        .topmenu.show li:nth-child(3) { animation-delay: 0.1s; }
        .topmenu.show li:nth-child(4) { animation-delay: 0.15s; }
        .topmenu.show li:nth-child(5) { animation-delay: 0.2s; }
        .topmenu.show li:nth-child(6) { animation-delay: 0.25s; }
        @keyframes itemIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .Hdropdown-image-box { position: relative; grid-column: 1 / -1; min-height: 180px; background: #101010; color: #fff; display: flex; align-items: flex-end; }
        .Hdropdown-overlay { padding: 1.25rem; }
        .Hdropdown-overlay h4 { font-family: var(--font-display); font-size: 1.5rem; }
        .Hdropdown-overlay button { margin-top: 0.5rem; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; border-bottom: 1px solid #c6a15b; padding-bottom: 2px; }
        @media (max-width: 640px) { .Hdropdown { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </>
  );
}
