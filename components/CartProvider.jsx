"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

// Guest carts live in localStorage; logged-in carts sync with the backend.
// Same storage keys as the old app so existing guests keep their bags.
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [ready, setReady] = useState(false);

  // Hydrate guest cart from localStorage AFTER first paint so server HTML
  // (empty bag) matches first client render — no hydration mismatch.
  // Mount-sync localStorage read is intentional here (external store sync).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("hc_cart") || "[]"));
      setWishlist(JSON.parse(localStorage.getItem("hc_wishlist") || "[]"));
      setCoupon(JSON.parse(localStorage.getItem("hc_coupon") || "null"));
    } catch {
      /* corrupted storage -> start empty */
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (ready) localStorage.setItem("hc_cart", JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("hc_wishlist", JSON.stringify(wishlist));
  }, [wishlist, ready]);

  // Cart lines are keyed by product + variant + size: adding size M then L
  // creates two lines instead of merging into the first size's row.
  const lineKey = (p) =>
    p.key || [p.id, p.product_variant_id, p.size].filter((v) => v !== undefined && v !== null && v !== "").join("|");

  const addToCart = useCallback((product, qty = 1) => {
    const key = lineKey(product);
    setItems((prev) => {
      const found = prev.find((i) => (i.key || lineKey(i)) === key);
      if (found) {
        return prev.map((i) => ((i.key || lineKey(i)) === key ? { ...i, key, qty: i.qty + qty } : i));
      }
      return [...prev, { ...product, key, qty }];
    });
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => (i.key || i.id) !== id)
        : prev.map((i) => ((i.key || i.id) === id ? { ...i, qty } : i))
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems((prev) => prev.filter((i) => (i.key || i.id) !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) =>
      prev.some((i) => i.id === product.id)
        ? prev.filter((i) => i.id !== product.id)
        : [...prev, product]
    );
  }, []);

  const applyCoupon = useCallback(async (code) => {
    const coupons = unwrap(await apiFetch("/Coupons"));
    const match = coupons.find(
      (c) => c.coupon_code?.toLowerCase() === code.trim().toLowerCase()
    );
    if (!match) throw new Error("Invalid coupon code");
    setCoupon(match);
    localStorage.setItem("hc_coupon", JSON.stringify(match));
    return match;
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    localStorage.removeItem("hc_coupon");
  }, []);

  const { count, subtotal, discount, total } = useMemo(() => {
    const count = items.reduce((n, i) => n + (i.qty || 0), 0);
    const subtotal = items.reduce((n, i) => n + (Number(i.price) || 0) * (i.qty || 0), 0);
    let discount = 0;
    if (coupon) {
      if (coupon.discount_type === "percentage") {
        discount = (subtotal * Number(coupon.discount_value || 0)) / 100;
        if (coupon.max_discount_amount) discount = Math.min(discount, Number(coupon.max_discount_amount));
      } else {
        discount = Number(coupon.discount_value || 0);
      }
    }
    return { count, subtotal, discount, total: Math.max(subtotal - discount, 0) };
  }, [items, coupon]);

  const value = {
    items, wishlist, coupon, ready,
    count, subtotal, discount, total,
    addToCart, updateQty, removeFromCart, clearCart,
    toggleWishlist, applyCoupon, removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
