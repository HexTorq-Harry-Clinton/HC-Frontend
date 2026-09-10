"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, inr, revalidateSite } from "@/lib/api";
import AdminModulePage from "../AdminModule";

// Admin order fulfilment: list orders, advance status toward delivered,
// and Open any order to manage items, addresses, history, payments,
// shipments and invoices inline (ids auto-inherited).
const WORKSPACE_TABS = [
  ["order-items", "Items"],
  ["order-addresses", "Addresses"],
  ["order-history", "History"],
  ["payments", "Payments"],
  ["shipments", "Shipments"],
  ["invoices", "Invoices"],
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState(0);

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
    revalidateSite();
  };

  if (workspace) {
    const child = WORKSPACE_TABS[workspaceTab] || WORKSPACE_TABS[0];
    const label = `${workspace.order_number || workspace.order_id}`;
    return (
      <div>
        <button onClick={() => { setWorkspace(null); setRefresh((n) => n + 1); }} className="text-sm underline">
          ← Back to Orders
        </button>
        <h1 className="mt-2 text-2xl font-bold">{label}</h1>
        <p className="mt-1 text-xs text-neutral-500">
          Everything below automatically belongs to this order — no need to pick it again.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {WORKSPACE_TABS.map(([slug, title], i) => (
            <button
              key={slug}
              onClick={() => setWorkspaceTab(i)}
              className={`border px-4 py-2 text-sm font-semibold ${
                workspaceTab === i ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
        <div className="mt-4" key={child[0]}>
          <AdminModulePage
            module={child[0]}
            lock={{ field: "order_id", value: workspace.order_id, label }}
          />
        </div>
      </div>
    );
  }

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
              <button onClick={() => { setWorkspace(o); setWorkspaceTab(0); }} className="border border-neutral-950 px-3 py-1 font-semibold">Open</button>
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
