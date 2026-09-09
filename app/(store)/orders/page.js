"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, unwrap, inr } from "@/lib/api";

// User-specific page: never prerender (reads ?placed= at request time).
export const dynamic = "force-dynamic";

function OrdersInner() {
  const params = useSearchParams();
  const placed = params.get("placed");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/Orders")
      .then(unwrap)
      .then((list) => setOrders(Array.isArray(list) ? list : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Your Orders</h1>
      {placed && (
        <p className="mt-4 bg-green-50 p-3 text-sm text-green-700">
          Order {placed} placed. Thank you for shopping with Harry Clinton.
        </p>
      )}
      {loading ? (
        <p className="mt-6 text-sm text-neutral-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li key={o.order_id} className="flex items-center justify-between border border-neutral-200 p-4">
              <div>
                <p className="font-medium">{o.order_number}</p>
                <p className="text-xs text-neutral-500">{o.orderstatus || o.order_status || "Placed"}</p>
              </div>
              <p className="font-bold">{inr(o.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading orders…</p>}>
      <OrdersInner />
    </Suspense>
  );
}
