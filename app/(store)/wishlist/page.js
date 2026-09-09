"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { PLACEHOLDER_IMAGE } from "@/components/ProductCard";
import { inr } from "@/lib/api";

// Wishlist: same structure/texts as the previous UI.
export default function WishlistPage() {
  const cart = useCart();
  if (!cart?.ready) return <p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading wishlist...</p>;

  if (cart.wishlist.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h2 className="font-display text-4xl font-bold">Your wishlist is empty</h2>
        <p className="mt-3 text-neutral-500">Save items you love to see them here.</p>
        <Link href="/" className="mt-6 inline-block bg-neutral-950 px-8 py-3 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-4 font-display text-4xl font-bold">Your Wishlist</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cart.wishlist.map((item) => (
          <div key={item.wishlist_item_id || item.id} className="border-0 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image || PLACEHOLDER_IMAGE}
              alt={item.name}
              loading="lazy"
              style={{ height: "280px", width: "100%", objectFit: "cover" }}
            />
            <div className="p-4 text-center">
              <h5 className="font-medium">{item.name}</h5>
              <p className="mt-1 text-sm font-bold">{inr(item.price)}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    cart.addToCart(
                      {
                        id: item.product_id || item.id,
                        name: item.name,
                        price: item.unit_price || item.price || 0,
                        image: item.image,
                        size: item.size_label,
                      },
                      1
                    )
                  }
                  className="flex-1 bg-neutral-950 py-2 text-xs font-semibold text-white"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => cart.toggleWishlist(item)}
                  className="border border-red-600 px-3 py-2 text-xs font-semibold text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
