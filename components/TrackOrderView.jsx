"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, currentUserId, unwrap } from "@/lib/api";

const labelize = (value) => String(value || "—").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function TrackOrderView() {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const userId = currentUserId();
      if (!userId) {
        setError("Please sign in to track your orders.");
        setLoading(false);
        return;
      }
      try {
        const result = unwrap(await apiFetch(`/Orders/user/${encodeURIComponent(userId)}`));
        const list = Array.isArray(result) ? result : [];
        setOrders(list);
        if (list[0]) setSelectedId(list[0].order_id);
      } catch {
        setError("We could not load your orders right now.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    apiFetch(`/Orders/detail/${encodeURIComponent(selectedId)}?user_id=${encodeURIComponent(currentUserId() || "")}`)
      .then(unwrap)
      .then(setDetail)
      .catch(() => setError("Tracking details could not be loaded."));
  }, [selectedId]);

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-neutral-500">Loading tracking...</main>;
  if (error && !orders.length) return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-sm text-red-700">{error}</p><Link href="/login" className="mt-5 inline-block bg-neutral-950 px-5 py-3 text-sm text-white">Sign in</Link></main>;

  const order = orders.find((item) => item.order_id === selectedId);
  const history = [...(detail?.history || []), ...(detail?.events || [])]
    .sort((a, b) => new Date(b.orderstatustime || b.event_timestamp || b.rcm || 0) - new Date(a.orderstatustime || a.event_timestamp || a.rcm || 0));
  const shipment = detail?.shipments?.[0];
  const courier = detail?.couriers?.find((item) => item.courier_partner_id === shipment?.courier_partner_id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-5">
        <div><p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Harry Clinton</p><h1 className="mt-2 font-display text-3xl text-neutral-950">Track your order</h1></div>
        <Link href="/orders" className="text-sm underline underline-offset-4">View all orders</Link>
      </div>
      {error && <p className="mt-4 bg-orange-50 p-3 text-sm text-orange-800">{error}</p>}
      <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-neutral-600">Select order</label>
      <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 w-full border border-neutral-300 bg-white px-3 py-3 text-sm">
        {orders.map((item) => <option key={item.order_id} value={item.order_id}>{item.order_number || item.order_id} — {item.orderstatus || "Order placed"}</option>)}
      </select>
      {order && <section className="mt-8 border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-neutral-500">Order</p><h2 className="text-xl font-semibold text-neutral-950">{order.order_number || order.order_id}</h2><p className="mt-1 text-sm text-neutral-500">Placed {dateTime(order.placed_at || order.rcm)}</p></div><span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">{labelize(order.orderstatus || "Pending")}</span></div>
        {shipment && <div className="mt-6 rounded bg-neutral-50 p-4"><p className="text-xs uppercase tracking-wider text-neutral-500">Shipment</p><p className="mt-1 font-semibold">{courier?.courier_name || "Courier partner"}</p><p className="mt-1 text-sm text-neutral-600">Tracking: {shipment.tracking_number || "Not available yet"}</p><p className="text-sm text-neutral-600">Status: {labelize(shipment.shipment_status)}</p></div>}
        <div className="mt-6"><h3 className="text-sm font-bold uppercase tracking-wider">Tracking timeline</h3>{history.length ? <ol className="mt-4 space-y-4 border-l border-neutral-200 pl-5">{history.map((event, index) => <li key={`${event.order_status_history_id || event.shipment_event_id || event.event_status}-${index}`} className="relative"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-neutral-950 ring-1 ring-neutral-300" /><p className="font-semibold text-neutral-950">{labelize(event.orderstatus || event.event_status)}</p><p className="text-xs text-neutral-500">{dateTime(event.orderstatustime || event.event_timestamp || event.rcm)}</p><p className="mt-1 text-sm text-neutral-600">{event.event_description || event.remarks || "Your order status was updated."}</p></li>)}</ol> : <p className="mt-4 text-sm text-neutral-500">Tracking updates will appear here as your order progresses.</p>}</div>
      </section>}
    </main>
  );
}
