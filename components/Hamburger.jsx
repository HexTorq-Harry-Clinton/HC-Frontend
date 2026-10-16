"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Top-reveal mega-menu (previous-UI style, no sidebar): CATEGORIES (live)
// + COLLECTIONS + SERVICES + Vision tile drop down from under the header.
// Hamburger lines morph into an "H" shape when active (referenced from hc-home-page);
// links stagger in.
const COLLECTIONS = [
  { label: "Tuxedo", to: "/tuxedo" },
  { label: "Extreme Poppins", to: "/extreme-poppins" },
  { label: "Gurkha Trousers", to: "/gurkha-trousers" },
  { label: "Linen Shirts & Trousers", to: "/linen-shirts-trousers" },
  { label: "88 Cigarettes", to: "/cigarettes" },
];

const SERVICES = [
  // { label: "Services", to: "/services" },
  { label: "Embroidery", to: "/embroidery" },
  { label: "Alterations", to: "/alterations" },
  { label: "Personal Styling", to: "/personal-styling" },
  // { label: "Custom Tailoring", to: "/custom-tailoring" },
];

const FALLBACK_CATEGORIES = [
  { label: "Suits", to: "/suits" },
  { label: "Indo-Western", to: "/indowestern" },
  { label: "Shirts", to: "/shirts" },
  { label: "Trousers", to: "/trousers" },
  { label: "Baby Suits", to: "/babysuits" },
];

export default function Hamburger({ categories, onActiveChange }) {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const menuRef = useRef(null);

  const setMenuState = useCallback((next) => {
    setIsActive(next);
    onActiveChange?.(next);
  }, [onActiveChange]);

  useEffect(() => {
    const onDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest(".hamburger")
      ) {
        setMenuState(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuState(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [setMenuState]);

  const cats = categories?.length > 0 ? categories : FALLBACK_CATEGORIES;
  const go = (to) => {
    setMenuState(false);
    router.push(to);
  };

  return (
    <>
      <div
        className={`hamburger ${isActive ? "active" : ""}`}
        onClick={() => setMenuState(!isActive)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setMenuState(!isActive);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Menu"
        aria-expanded={isActive}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div ref={menuRef} className={`topmenu ${isActive ? "show" : ""}`}>
        <div className="Hdropdown grid-4col">
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
          {/* Vision tile temporarily hidden — empty slot kept as placeholder
          <div className="Hdropdown-image-box">
            {isActive && (
              <img src="/brand/vision_title.jpeg" alt="" aria-hidden="true" loading="lazy" decoding="async" className="Hdropdown-image" />
            )}
            <div className="Hdropdown-overlay">
              <h4>The Vision</h4>
              <button onClick={() => go("/the-vision")}>Explore</button>
            </div>
          </div>
          */}
          <div className="Hdropdown-image-box Hdropdown-image-box--empty" aria-hidden="true" />
        </div>
      </div>
      <style jsx>{`
        .hamburger {
          width: 25px;
          height: 25px;
          position: relative;
          cursor: pointer;
          border: 0;
          outline: none;
          background: transparent;
          padding: 0;
          z-index: 1000;
        }
        .hamburger:focus-visible { outline: none; }
        .hamburger span {
          position: absolute;
          height: 3px;
          width: 100%;
          background-color: black;
          transition: all 0.4s ease-in-out;
          left: 0;
          border-radius: 1px;
        }

        /* Default Positions */
        .hamburger span:nth-child(1) {
          top: 0;
          left: 0;
        }
        .hamburger span:nth-child(2) {
          top: 50%;
          transform: translateY(-50%);
          width: 60%;
          left: 20%;
        }
        .hamburger span:nth-child(3) {
          bottom: 0;
          right: 0;
          left: auto;
        }

        /* Active: H shape */
        .hamburger.active {
          transform: scale(1.0);
        }

        .hamburger.active span {
          background-color: #c6a15b;
        }

        .hamburger.active span:nth-child(1) {
          width: 3px;
          height: 100%;
          top: 0;
          left: 0;
        }

        .hamburger.active span:nth-child(2) {
          width: 100%;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 3px;
        }

        .hamburger.active span:nth-child(3) {
          width: 3px;
          height: 100%;
          top: 0;
          bottom: 0;
          left: auto;
          right: 0;
        }
        .topmenu {
          position: absolute; top: 100%; left: 0; right: 0; background: #fff; z-index: 70;
          height: 0; opacity: 1; transform: none; overflow: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          transition: height 0.4s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .topmenu::-webkit-scrollbar { display: none; }
        .topmenu.show { height: min(300px, calc(100vh - 80px)); overflow-y: auto; }
        .Hdropdown {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 2.3fr;
          gap: 20px;
          padding: 25px 60px;
          margin-left: 30px;
        }
        .Hdropdown strong { 
          font-family: var(--font-mainlux), 'MAINLUX', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: normal;
          color: #111;
          display: block;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .Hdropdown ul { margin: 0; list-style: none; padding: 0; }
        .Hdropdown li { margin-bottom: 10px; }
        .Hdropdown button { 
          font-family: var(--font-mainlux), 'MAINLUX', sans-serif;
          font-size: 16px;
          color: #111;
          background: none;
          border: none;
          padding: 0;
          text-align: left;
          cursor: pointer;
          display: inline-block;
          text-decoration: none;
          text-underline-offset: 3px;
          transition: text-decoration-color 0.2s ease;
        }
        .Hdropdown button:hover { 
          color: #1a1a1a;
          text-decoration: underline;
          text-decoration-color: currentColor;
        }
        .Hdropdown-image-box { 
          position: relative; 
          width: 100%;
          height: 290px;
          bottom: 20px;
          left: 70px;
          background: #101010; 
          color: #fff; 
          display: flex; 
          align-items: flex-end; 
          overflow: hidden;
        }
        .Hdropdown-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.75;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        .Hdropdown-image-box:hover .Hdropdown-image {
          transform: scale(1.06);
          opacity: 0.9;
        }
        .Hdropdown-overlay {
          position: absolute;
          bottom: 15px;
          left: 15px;
          right: 15px;
          z-index: 2;
          padding: 12px;
          text-align: center;
        }
        .Hdropdown-overlay h4 { 
          font-family: var(--font-mainlux), 'MAINLUX', sans-serif; 
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 8px;
        }
        .Hdropdown-overlay button { 
          font-family: var(--font-mainlux), 'MAINLUX', sans-serif;
          margin: 0;
          font-size: 14px;
          letter-spacing: normal;
          text-transform: none;
          font-weight: 700;
          color: #111;
          background: #fff;
          border: none;
          padding: 7px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .Hdropdown-overlay button:hover {
          color: #111;
          background: #ddd;
          text-decoration: none;
        }
        @media (max-width: 768px) {
          .topmenu {
            position: fixed;
            top: 0;
            left: -50%;
            right: auto;
            width: 50%;
            height: 100vh;
            z-index: 90;
            transition: left 0.3s ease;
          }
          .topmenu.show { left: 0; height: 100vh; }
          .Hdropdown {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 15px 12px;
            margin: 0;
          }
          .Hdropdown-image-box {
            width: 100%;
            height: 130px;
            left: 0;
            bottom: 0;
          }
          .Hdropdown-overlay { bottom: 8px; left: 8px; right: 8px; }
        }
        @media (max-width: 480px) {
          .topmenu { top: 80px; }
        }
      `}</style>
    </>
  );
}
