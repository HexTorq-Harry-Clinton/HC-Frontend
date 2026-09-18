"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

// Wishlist heart with an Instagram-reels-style tap burst: the icon pops,
// mini hearts fly out, and the fill flips red. Drop-in anywhere via className.
const FLY = [
  { dx: "-26px", dy: "-30px" },
  { dx: "26px", dy: "-30px" },
  { dx: "-22px", dy: "12px" },
  { dx: "22px", dy: "12px" },
  { dx: "0px", dy: "-40px" },
];

export default function WishlistHeart({ product, className = "" }) {
  const cart = useCart();
  const wished = cart?.wishlist.some((i) => i.id === product.id);
  const [burst, setBurst] = useState(0);

  const tap = () => {
    const willWish = !wished;
    cart?.toggleWishlist(product);
    if (willWish) setBurst((n) => n + 1);
  };

  return (
    <button
      type="button"
      onClick={tap}
      aria-label="Toggle wishlist"
      aria-pressed={!!wished}
      className={`relative ${className}`}
    >
      <span key={burst} className="wh-pop">
        <i className={wished ? "bi bi-heart-fill text-rose-600" : "bi bi-heart"} />
      </span>
      {burst > 0 && (
        <span key={`b-${burst}`} className="wh-burst" aria-hidden>
          {FLY.map((f, i) => (
            <i
              key={i}
              className="bi bi-heart-fill"
              style={{ "--dx": f.dx, "--dy": f.dy, animationDelay: `${i * 0.03}s` }}
            />
          ))}
        </span>
      )}
      <style jsx>{`
        .wh-pop { display: inline-flex; line-height: 1; animation: whPop 0.45s cubic-bezier(0.2, 1.6, 0.4, 1); }
        @keyframes whPop {
          0% { transform: scale(0.3); }
          55% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .wh-burst { position: absolute; inset: 0; pointer-events: none; }
        .wh-burst i {
          position: absolute; left: 50%; top: 50%;
          font-size: 10px; color: #e11d48; opacity: 0;
          animation: whFly 0.7s ease-out forwards;
        }
        @keyframes whFly {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wh-pop, .wh-burst i { animation: none; }
        }
      `}</style>
    </button>
  );
}
