"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { apiFetch, inr } from "@/lib/api";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const apply = async () => {
    setError("");
    try {
      await cart?.applyCoupon(couponCode);
      setCouponCode("");
    } catch (e) {
      setError(e.message);
    }
  };

  const placeOrder = async () => {
    setError("");
    if (!name || !phone || !address) {
      setError("Please fill name, phone and address.");
      return;
    }
    if (!cart || cart.items.length === 0) {
      setError("Your bag is empty.");
      return;
    }
    // Backend requires user_id + order_status_id (NOT NULL columns).
    let userId = null;
    try {
      const stored = JSON.parse(localStorage.getItem("hc_user") || "null");
      userId = stored?.user_id || stored?.id || null;
    } catch {
      userId = null;
    }
    if (!userId) {
      setError("Please log in to place your order.");
      router.push("/login");
      return;
    }
    setPlacing(true);
    try {
      const statuses = await apiFetch("/Order-Status-Master").then((r) => r?.data?.data || r?.data || r).catch(() => []);
      const list = Array.isArray(statuses) ? statuses : [];
      const pending = list.find((s) => s.status_code === "PENDING") || list.find((s) => s.isactive !== false) || list[0];
      if (!pending?.order_status_id) throw new Error("Order statuses not configured. Contact support.");
      const orderNumber = `ORD-${Date.now()}`;
      const orderRes = await apiFetch("/Orders", {
        method: "POST",
        body: {
          user_id: userId,
          order_number: orderNumber,
          order_status_id: pending.order_status_id,
          subtotal: cart.subtotal,
          discount: cart.discount,
          shipping: 0,
          tax: 0,
          total: cart.total,
          payment_status: "pending",
          notes: `${name} | ${phone} | ${address}, ${city}`,
          rcu: "website",
        },
      });
      const order = orderRes?.data || orderRes;
      const orderId = order?.order_id;
      await Promise.all(
        cart.items.map((i) =>
          apiFetch("/Order-Items", {
            method: "POST",
            body: {
              order_id: orderId, product_id: i.id,
              product_name: i.name, qty: i.qty,
              unit_price: i.price, total_price: Number(i.price) * i.qty,
              rcu: "website",
            },
          }).catch(() => null)
        )
      );
      cart.clearCart();
      cart.removeCoupon();
      router.push(`/orders?placed=${orderNumber}`);
    } catch (e) {
      setError(e.message || "Could not place order. Try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (!cart?.ready) return <p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading checkout…</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Checkout</h1>
      {error && <p className="mt-4 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border border-neutral-300 px-4 py-3 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border border-neutral-300 px-4 py-3 text-sm" />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" rows={3} className="w-full border border-neutral-300 px-4 py-3 text-sm" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full border border-neutral-300 px-4 py-3 text-sm" />
          <div className="flex gap-2">
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="flex-1 border border-neutral-300 px-4 py-3 text-sm" />
            <button onClick={apply} className="border border-neutral-900 px-5 text-sm font-semibold">Apply</button>
          </div>
        </div>
        <aside className="h-fit border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">{cart.count} item(s)</p>
          <p className="mt-2 flex justify-between text-sm"><span>Subtotal</span><span>{inr(cart.subtotal)}</span></p>
          {cart.discount > 0 && <p className="mt-2 flex justify-between text-sm text-green-700"><span>Discount</span><span>−{inr(cart.discount)}</span></p>}
          <p className="mt-3 flex justify-between border-t border-neutral-200 pt-3 font-bold"><span>Total</span><span>{inr(cart.total)}</span></p>
          <button onClick={placeOrder} disabled={placing} className="mt-5 w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {placing ? "Placing order…" : "Place Order"}
          </button>
        </aside>
      </div>
    </div>
  );
}
