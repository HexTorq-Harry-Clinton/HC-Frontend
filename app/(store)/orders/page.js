"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, unwrap, inr, currentUserId } from "@/lib/api";

// User-specific page: never prerender (reads ?placed= at request time).
export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
}

// Orders: same structure/texts/flows as the previous UI —
// cards with header, status, cancel, items, totals, shipment, return modal.
function OrdersInner() {
  const params = useSearchParams();
  const placed = params.get("placed");
  const [orders, setOrders] = useState([]);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [statusByOrder, setStatusByOrder] = useState({});
  const [shipments, setShipments] = useState([]);
  const [shipmentEvents, setShipmentEvents] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");
  const [returnModal, setReturnModal] = useState({ open: false, item: null, reason: "", busy: false, done: false, error: "" });

  const fetchAll = useCallback(async () => {
    try {
      const uid = currentUserId();
      const [profileRes, ordersRes, itemsRes, historyRes, shipmentsRes, eventsRes, couriersRes, returnsRes] =
        await Promise.all([
          apiFetch("/Profiles").then(unwrap).catch(() => []),
          apiFetch("/Orders").then(unwrap).catch(() => []),
          apiFetch("/Order-Items").then(unwrap).catch(() => []),
          apiFetch("/Order-Status-History").then(unwrap).catch(() => []),
          apiFetch("/Shipments").then(unwrap).catch(() => []),
          apiFetch("/Shipment-Events").then(unwrap).catch(() => []),
          apiFetch("/Courier-Partners").then(unwrap).catch(() => []),
          apiFetch("/Returns").then(unwrap).catch(() => []),
        ]);
      void profileRes;
      const allOrders = Array.isArray(ordersRes) ? ordersRes : [];
      const mine = (uid ? allOrders.filter((o) => o.user_id === uid) : allOrders).sort(
        (a, b) => new Date(b.order_date || b.created_at || 0) - new Date(a.order_date || a.created_at || 0)
      );
      setOrders(mine);
      const allItems = Array.isArray(itemsRes) ? itemsRes : [];
      const map = {};
      mine.forEach((o) => {
        map[o.order_id] = allItems.filter((i) => i.order_id === o.order_id);
      });
      setItemsByOrder(map);
      const history = Array.isArray(historyRes) ? historyRes : [];
      const smap = {};
      mine.forEach((o) => {
        const h = history
          .filter((x) => x.order_id === o.order_id)
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        smap[o.order_id] = h[0]?.orderstatus || o.orderstatus || o.order_status || "Pending";
      });
      setStatusByOrder(smap);
      setShipments(Array.isArray(shipmentsRes) ? shipmentsRes : []);
      setShipmentEvents(Array.isArray(eventsRes) ? eventsRes : []);
      setCouriers(Array.isArray(couriersRes) ? couriersRes : []);
      setReturns(Array.isArray(returnsRes) ? returnsRes : []);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount fetch (also reused by cancel/return flows) — intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCancel = async (o) => {
    setCancellingId(o.order_id);
    setCancelError("");
    setCancelSuccess("");
    try {
      let statuses = [];
      try {
        statuses = unwrap(await apiFetch("/Order-Status-Master"));
        if (!Array.isArray(statuses)) statuses = [];
      } catch {
        statuses = [];
      }
      const cancelled = statuses.find((s) => s.status_name?.toLowerCase() === "cancelled");
      await apiFetch("/Order-Status-History", {
        method: "POST",
        body: {
          order_id: o.order_id,
          order_status_id: cancelled?.order_status_id || null,
          orderstatus: "Cancelled",
          notes: "Cancelled by customer",
          rcu: "website",
        },
      });
      await apiFetch("/Orders", {
        method: "PUT",
        body: { order_id: o.order_id, orderstatus: "Cancelled", luu: "website" },
      }).catch(() => null);
      setCancelSuccess("Order cancelled successfully.");
      fetchAll();
    } catch {
      setCancelError("Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const openReturn = (item) => setReturnModal({ open: true, item, reason: "", busy: false, done: false, error: "" });
  const closeReturn = () => setReturnModal({ open: false, item: null, reason: "", busy: false, done: false, error: "" });

  const submitReturn = async (e) => {
    e.preventDefault();
    setReturnModal((m) => ({ ...m, busy: true, error: "" }));
    try {
      await apiFetch("/Returns", {
        method: "POST",
        body: {
          order_item_id: returnModal.item?.order_item_id,
          return_reason: returnModal.reason,
          return_status: "requested",
          rcu: "website",
        },
      });
      const list = unwrap(await apiFetch("/Returns").catch(() => []));
      setReturns(Array.isArray(list) ? list : []);
      setReturnModal((m) => ({ ...m, busy: false, done: true }));
      setTimeout(closeReturn, 1500);
    } catch {
      setReturnModal((m) => ({ ...m, busy: false, error: "Failed to submit return request." }));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
        <SpinnerStyle />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <div className="bg-red-50 p-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="font-display text-4xl font-bold">No orders yet</h2>
        <p className="mt-3 text-neutral-500">Your order history will appear here.</p>
        <Link href="/" className="mt-6 inline-block bg-neutral-950 px-8 py-3 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="mb-4 font-display text-4xl font-bold">My Orders</h2>
      {placed && (
        <p className="mb-4 bg-green-50 p-3 text-sm text-green-700">
          Order {placed} placed. Thank you for shopping with Harry Clinton.
        </p>
      )}
      {cancelError && <div className="mb-3 bg-red-50 p-2 text-sm text-red-700">{cancelError}</div>}
      {cancelSuccess && <div className="mb-3 bg-green-50 p-2 text-sm text-green-700">{cancelSuccess}</div>}
      {orders.map((o) => {
        const items = itemsByOrder[o.order_id] || [];
        const latestStatus = statusByOrder[o.order_id] || "Pending";
        const isPending = latestStatus.toLowerCase() === "pending";
        const isDelivered = ["delivered", "completed"].includes(latestStatus.toLowerCase());
        const shipment = shipments.find((s) => s.order_id === o.order_id);
        const events = shipmentEvents
          .filter((e) => e.shipment_id === shipment?.shipment_id)
          .sort((a, b) => new Date(b.event_timestamp || b.created_at || 0) - new Date(a.event_timestamp || a.created_at || 0));
        const courier = couriers.find((c) => c.courier_partner_id === shipment?.courier_partner_id);
        const totalItems = o.total_items || items.length;
        const totalPrice = o.total_price ?? o.total ?? 0;
        return (
          <div key={o.order_id} className="mb-4 border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-start justify-between bg-white px-4 py-3">
              <div>
                <span className="text-xs text-neutral-500">Order</span>
                <h5 className="font-semibold">{o.order_number || o.order_id}</h5>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-500">Placed on</span>
                <p className="text-sm">{formatDate(o.order_date || o.created_at)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
              <span className="bg-neutral-950 px-2 py-0.5 text-xs font-semibold text-white">{latestStatus}</span>
              <span className="border border-neutral-300 px-2 py-0.5 text-xs">{o.payment_status}</span>
              {isPending && (
                <button
                  onClick={() => handleCancel(o)}
                  disabled={cancellingId === o.order_id}
                  className="border border-red-600 px-2 py-0.5 text-xs font-semibold text-red-600 disabled:opacity-50"
                >
                  {cancellingId === o.order_id ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
            <div className="border-t border-neutral-100 px-4 py-3">
              {items.length > 0 ? (
                items.map((item) => {
                  const itemReturn = returns.find((r) => r.order_item_id === item.order_item_id);
                  return (
                    <div key={item.order_item_id} className="flex items-start justify-between gap-3 border-b border-neutral-100 py-2 last:border-0">
                      <div>
                        <h6 className="font-medium">{item.product_name}</h6>
                        <p className="text-xs text-neutral-500">SKU: {item.sku} | Qty: {item.qty}</p>
                        {itemReturn && (
                          <span className="mt-1 inline-block bg-yellow-200 px-2 py-0.5 text-xs font-semibold">
                            Return: {itemReturn.return_status}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="block font-bold">
                          ₹{((item.unit_price || 0) * (item.qty || 0)).toLocaleString("en-IN")}
                        </span>
                        {isDelivered && !itemReturn && (
                          <button onClick={() => openReturn(item)} className="mt-1 p-0 text-xs text-neutral-500 underline">
                            Request Return
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-neutral-500">No items found for this order.</p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm">
              <span>Total Items: {totalItems}</span>
              <span className="text-lg font-bold">Total: ₹{Number(totalPrice || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t border-neutral-100 px-4 py-3">
              {shipment ? (
                <div className="rounded bg-neutral-100 p-3">
                  <h6 className="font-semibold">Shipment Tracking</h6>
                  <span className="mt-1 inline-block bg-cyan-200 px-2 py-0.5 text-xs font-semibold">
                    {courier?.courier_name || "Courier"}
                  </span>
                  <p className="mt-2 text-sm"><strong>Tracking Number:</strong> {shipment.tracking_number || "N/A"}</p>
                  <p className="text-sm">
                    <strong>Status:</strong> {events[0]?.description || events[0]?.status || shipment.shipment_status || "In Transit"}
                  </p>
                  {events.length > 0 && (
                    <>
                      <strong className="mt-2 block text-xs">Tracking History:</strong>
                      <ul className="mt-1 list-disc pl-5 text-xs text-neutral-600">
                        {events.slice(0, 4).map((e, i) => (
                          <li key={i}>
                            {formatDate(e.event_timestamp || e.created_at)} — {e.description || e.status}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-xs text-neutral-500">
                  <i className="bi bi-box-seam me-1"></i>
                  Shipping details will appear once the order is dispatched.
                </div>
              )}
            </div>
          </div>
        );
      })}

      {returnModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onMouseDown={closeReturn}>
          <div className="w-full max-w-md bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <h5 className="font-semibold">Request Return</h5>
              <button aria-label="Close" onClick={closeReturn} className="text-xl text-neutral-500">×</button>
            </div>
            {returnModal.done ? (
              <p className="p-5 text-center text-sm text-green-700">Return request submitted successfully.</p>
            ) : (
              <form onSubmit={submitReturn}>
                <div className="p-4">
                  <label className="mb-1 block text-sm font-medium">Return Reason</label>
                  <textarea
                    rows="3"
                    required
                    value={returnModal.reason}
                    onChange={(e) => setReturnModal((m) => ({ ...m, reason: e.target.value }))}
                    placeholder="Why are you returning this item?"
                    className="w-full border border-neutral-300 px-3 py-2 text-sm"
                  />
                  {returnModal.error && <p className="mt-2 text-xs text-red-600">{returnModal.error}</p>}
                </div>
                <div className="flex justify-end gap-2 border-t border-neutral-200 p-4">
                  <button type="button" onClick={closeReturn} className="border border-neutral-300 px-4 py-2 text-sm">
                    Cancel
                  </button>
                  <button disabled={returnModal.busy} className="bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {returnModal.busy ? "Submitting..." : "Submit Return"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <SpinnerStyle />
    </div>
  );
}

function SpinnerStyle() {
  return (
    <style jsx>{`
      .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius: 50%; animation: sd-spin 0.75s linear infinite; display: inline-block; }
      @keyframes sd-spin { to { transform: rotate(360deg); } }
      .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    `}</style>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading orders...</p>}>
      <OrdersInner />
    </Suspense>
  );
}
