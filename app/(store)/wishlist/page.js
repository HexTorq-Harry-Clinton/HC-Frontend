"use client";

import { useCart } from "@/components/CartProvider";
import EmptyState from "@/components/EmptyState";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const cart = useCart();
  if (!cart?.ready) return <p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading wishlist…</p>;

  if (cart.wishlist.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold">Wishlist</h1>
        <EmptyState
          title="Nothing saved yet"
          text="Tap the heart on any piece to keep it here."
          actionHref="/suits"
          actionLabel="Explore"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Wishlist ({cart.wishlist.length})</h1>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {cart.wishlist.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
