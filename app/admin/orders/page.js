"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, inr } from "@/lib/api";

// Admin order fulfilment: list orders, advance status toward delivered.
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [refresh, setRefresh] = useState(0);

  // Mount + refresh fetch: state updates happen only in the async continuation.
  useEffect(() => {
    let live = true;
    apiFetch("/Orders")
      .then(unwrap)
      .then((list) => {
        if (live) setOrders(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (live) setOrders([]);
      });
    return () => {
      live = false;
    };
  }, [refresh]);

  const setStatus = async (o, orderstatus) => {
    await apiFetch("/Orders", {
      method: "PUT",
      body: { order_id: o.order_id, orderstatus, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    setRefresh((n) => n + 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="mt-4 space-y-3">
        {orders.length === 0 && <p className="bg-white p-5 text-sm text-neutral-500 shadow-sm">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.order_id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 shadow-sm">
            <div>
              <p className="font-medium">{o.order_number}</p>
              <p className="text-xs text-neutral-500">Total {inr(o.total)} • {o.payment_status}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                {o.orderstatus || "placed"}
              </span>
              <button onClick={() => setStatus(o, "confirmed")} className="border px-3 py-1">Confirm</button>
              <button onClick={() => setStatus(o, "shipped")} className="border px-3 py-1">Ship</button>
              <button onClick={() => setStatus(o, "delivered")} className="border border-green-700 px-3 py-1 text-green-700">Deliver</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
