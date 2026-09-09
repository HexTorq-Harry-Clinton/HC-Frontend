"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { inr } from "@/lib/api";
import { PLACEHOLDER_IMAGE } from "@/components/ProductCard";

export default function CartPage() {
  const cart = useCart();
  if (!cart?.ready) return <p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading your bag…</p>;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold">Your bag is empty</h1>
        <p className="mt-3 text-neutral-500">Sharp looks await. Start with the edit.</p>
        <Link href="/suits" className="mt-6 inline-block bg-neutral-950 px-8 py-3 text-sm font-semibold text-white">
          Shop Suits
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Your Bag ({cart.count})</h1>
      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
        <ul className="space-y-6">
          {cart.items.map((i) => (
            <li key={i.id} className="flex gap-4 border-b border-neutral-200 pb-6">
              <div className="relative h-32 w-24 shrink-0 bg-neutral-100">
                <Image src={i.image || PLACEHOLDER_IMAGE} alt={i.name} fill sizes="100px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{i.name}</p>
                {i.size && <p className="text-xs text-neutral-500">Size: {i.size}</p>}
                <p className="mt-1 font-bold">{inr(i.price)}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <button onClick={() => cart.updateQty(i.id, i.qty - 1)} className="border px-2">−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => cart.updateQty(i.id, i.qty + 1)} className="border px-2">+</button>
                  <button onClick={() => cart.removeFromCart(i.id)} className="ml-3 text-xs underline text-neutral-500">Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit border border-neutral-200 p-6">
          <p className="flex justify-between text-sm"><span>Subtotal</span><span>{inr(cart.subtotal)}</span></p>
          {cart.discount > 0 && <p className="mt-2 flex justify-between text-sm text-green-700"><span>Coupon</span><span>−{inr(cart.discount)}</span></p>}
          <p className="mt-3 flex justify-between border-t border-neutral-200 pt-3 font-bold"><span>Total</span><span>{inr(cart.total)}</span></p>
          <Link href="/checkout" className="mt-5 block bg-neutral-950 py-3 text-center text-sm font-semibold text-white">
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
