"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/api";
import { useCart } from "./CartProvider";

// Mini-bag drawer: slide-in from the right while browsing — full line detail
// (photo, name, size, qty stepper, line total, remove), subtotal, plus
// buttons into the full /cart page and checkout. Overlay/Esc to collapse.
export default function CartDrawer({ open, onClose }) {
  const cart = useCart();
  const router = useRouter();
  const [pendingRemove, setPendingRemove] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const items = cart?.items || [];

  const go = (to) => {
    onClose?.();
    router.push(to);
  };

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-label="Shopping bag">
      <div className="absolute inset-0 bg-neutral-950/55" onClick={onClose} />
      <aside className="cart-drawer absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#141414] text-[#f7f4ec] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-[#f7f4ec]">
            Your Bag {cart?.count > 0 && <span className="text-sm font-normal text-neutral-400">({cart.count})</span>}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close bag" className="flex h-9 w-9 items-center justify-center  transition hover:bg-white/10">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">👜</p>
              <p className="mt-4 text-sm text-neutral-400">Your bag is empty.</p>
              <button
                type="button"
                onClick={() => go("/new-arrivals")}
                className="mt-6 bg-neutral-950 px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gold hover:text-neutral-950"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {items.map((it) => {
                const key = it.key || it.id;
                return (
                  <li key={key} className="flex gap-4 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image || "/brand/logo-black.png"}
                      alt={it.name || ""}
                      className="h-20 w-16 shrink-0  border border-white/15 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#f7f4ec]">{it.name}</p>
                      {it.size && <p className="mt-0.5 text-xs text-neutral-400">Size: {it.size}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center border border-white/25">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={(it.qty || 1) <= 1}
                            onClick={() => cart?.updateQty(key, (it.qty || 1) - 1)}
                            className="px-2.5 py-1 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm">{it.qty || 1}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => cart?.updateQty(key, (it.qty || 1) + 1)}
                            className="px-2.5 py-1 text-sm transition hover:bg-white/10"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-bold">{inr((Number(it.price) || 0) * (it.qty || 1))}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingRemove(key)}
                      aria-label="Remove item"
                      className="self-start p-1 text-neutral-400 transition hover:text-red-600"
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/15 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="font-bold">{inr(cart?.subtotal || 0)}</span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">Shipping + taxes calculated at checkout.</p>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => go("/cart")}
                className="w-full border border-[#f7f4ec] py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-white/10"
              >
                View Full Bag
              </button>
              <button
                type="button"
                onClick={() => go("/checkout")}
                className="w-full bg-neutral-950 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gold hover:text-neutral-950"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
      {pendingRemove && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setPendingRemove(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs  border border-white/15 bg-[#1a1a1a] p-5 shadow-xl"
          >
            <h3 className="font-display text-base font-bold text-[#f7f4ec]">Remove this item?</h3>
            <p className="mt-1 text-xs text-neutral-400">
              {items.find((x) => (x.key || x.id) === pendingRemove)?.name || "This item"} will be
              removed from your bag.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingRemove(null)}
                className=" border border-white/25 bg-transparent px-4 py-2 text-xs font-semibold text-[#f7f4ec] transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { cart?.removeFromCart(pendingRemove); setPendingRemove(null); }}
                className=" bg-red-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .cart-drawer { animation: drawerIn 0.32s cubic-bezier(0.16, 0.8, 0.24, 1); }
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .cart-drawer { animation: none; } }
      `}</style>
    </div>
  );
}
