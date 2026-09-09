"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { inr } from "@/lib/api";
import { PLACEHOLDER_IMAGE } from "@/components/ProductCard";

// Cart: same structure/texts as the previous UI —
// "Shopping Bag", item cards, "Order Summary" with coupon + shipping rows.
export default function CartPage() {
  const cart = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  if (!cart?.ready) return <p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading cart...</p>;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h2 className="font-display text-4xl font-bold">Your bag is empty</h2>
        <p className="mt-3 text-neutral-500">Add items to your cart to see them here.</p>
        <Link href="/" className="mt-6 inline-block bg-neutral-950 px-8 py-3 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    setCouponError("");
    try {
      await cart.applyCoupon(couponCode);
      setCouponCode("");
    } catch (e) {
      setCouponError(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="font-display text-4xl font-bold">Shopping Bag</h2>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {cart.items.map((i) => (
            <div key={i.id} className="flex gap-4 border-b border-neutral-200 pb-6">
              <div className="relative h-36 w-28 shrink-0 bg-neutral-100">
                <Image src={i.image || PLACEHOLDER_IMAGE} alt={i.name} fill sizes="120px" className="object-cover" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium">{i.name}</h5>
                {i.size && <p className="text-xs text-neutral-500">Size: {i.size}</p>}
                <p className="mt-1">₹{Number(i.price).toLocaleString("en-IN")}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <button onClick={() => cart.updateQty(i.id, (i.qty || 1) - 1)} className="border border-neutral-300 px-2">-</button>
                  <span>{i.qty || 1}</span>
                  <button onClick={() => cart.updateQty(i.id, (i.qty || 1) + 1)} className="border border-neutral-300 px-2">+</button>
                  <button onClick={() => cart.removeFromCart(i.id)} className="ml-3 text-xs underline text-neutral-500">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="h-fit border border-neutral-200 bg-white p-6">
          <h4 className="font-semibold">Order Summary</h4>
          <p className="mt-3 flex justify-between text-sm"><span>Subtotal</span><span>₹{cart.subtotal.toLocaleString("en-IN")}</span></p>
          {cart.coupon && (
            <p className="mt-2 flex items-center justify-between text-sm">
              <span>Discount ({cart.coupon.coupon_code})</span>
              <button onClick={cart.removeCoupon} className="text-xs underline">Remove</button>
              <span>-{inr(cart.discount)}</span>
            </p>
          )}
          <p className="mt-2 flex justify-between text-sm"><span>Shipping</span><span>Calculated at checkout</span></p>
          <hr className="my-3" />
          <p className="flex justify-between font-bold"><span>Total</span><span>{inr(cart.total)}</span></p>
          <div className="mt-4 flex gap-2">
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="flex-1 border border-neutral-300 px-3 py-2 text-sm" />
            <button onClick={applyCoupon} className="border border-neutral-900 px-4 text-sm font-semibold">Apply</button>
          </div>
          {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
          <Link href="/checkout" className="mt-5 block bg-neutral-950 py-3 text-center text-sm font-semibold text-white">
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
