"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Hamburger mega-menu: CATEGORIES (live) + COLLECTIONS + SERVICES + Vision tile.
// Same structure/items as the previous UI.
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
  const sidebarRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest(".hamburger")
      ) {
        setIsActive(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
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
      <div ref={sidebarRef} className={`sidebar ${isActive ? "show" : ""}`} id="sidebar">
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
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 6px; }
        .hamburger span { display: block; width: 22px; height: 2px; background: #111; transition: all 0.3s ease; }
        .hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.active span:nth-child(2) { opacity: 0; }
        .hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: min(92vw, 720px); background: #fff; z-index: 90; transform: translateX(-105%); transition: transform 0.35s ease; overflow-y: auto; box-shadow: 8px 0 30px rgba(0,0,0,0.12); }
        .sidebar.show { transform: translateX(0); }
        .Hdropdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 2rem; }
        .Hdropdown strong { font-size: 0.72rem; letter-spacing: 0.25em; }
        .Hdropdown ul { margin-top: 0.75rem; display: grid; gap: 0.5rem; }
        .Hdropdown button { font-size: 0.9rem; }
        .Hdropdown button:hover { color: #a8823f; }
        .Hdropdown-image-box { position: relative; grid-column: 1 / -1; min-height: 180px; background: #101010; color: #fff; display: flex; align-items: flex-end; }
        .Hdropdown-overlay { padding: 1.25rem; }
        .Hdropdown-overlay h4 { font-family: var(--font-display); font-size: 1.5rem; }
        .Hdropdown-overlay button { margin-top: 0.5rem; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; border-bottom: 1px solid #c6a15b; padding-bottom: 2px; }
        @media (max-width: 640px) { .Hdropdown { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </>
  );
}
