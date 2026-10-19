"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, unwrap, inr, currentUserId } from "@/lib/api";
import "../account-pages.css";

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

function formatDateTime(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); } catch { return "—"; }
}

function labelize(value) {
  return String(value || "—").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function addressText(address) {
  return [...new Set([address?.house_no_floor, address?.building_block, address?.house_street, address?.area_name].filter(Boolean))].join(", ");
}

function orderSortNumber(order) {
  const digits = String(order?.order_number || order?.order_id || "").replace(/\D/g, "");
  return Number(digits) || 0;
}

function compareOrdersNewestFirst(a, b) {
  const aDate = Date.parse(a.placed_at || a.order_date || a.created_at || "");
  const bDate = Date.parse(b.placed_at || b.order_date || b.created_at || "");
  if (Number.isFinite(aDate) && Number.isFinite(bDate) && aDate !== bDate) return bDate - aDate;
  return orderSortNumber(b) - orderSortNumber(a);
}

// Orders: same structure/texts/flows as the previous UI —
// cards with header, status, cancel, items, totals, shipment, return modal.
function OrdersInner() {
  const params = useSearchParams();
  const placed = params.get("placed");
  const [orders, setOrders] = useState([]);
  const [detailByOrder, setDetailByOrder] = useState({});
  const [detailErrors, setDetailErrors] = useState({});
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
      const sessionUserId = currentUserId();
      if (!sessionUserId) throw new Error("Please sign in to view your orders.");
      const ordersRes = await apiFetch(`/Orders/user/${encodeURIComponent(sessionUserId)}`);
      const mine = (Array.isArray(unwrap(ordersRes)) ? unwrap(ordersRes) : []).sort(compareOrdersNewestFirst);
      setOrders(mine);
      const detailResults = await Promise.all(mine.map(async (order) => {
        try {
          const result = unwrap(await apiFetch(`/Orders/detail/${encodeURIComponent(order.order_id)}?user_id=${encodeURIComponent(sessionUserId)}`));
          return [order.order_id, result];
        } catch (detailError) {
          return [order.order_id, { error: detailError?.message || "Order details could not be loaded." }];
        }
      }));
      const details = Object.fromEntries(detailResults);
      const errors = Object.fromEntries(detailResults.filter(([, detail]) => detail?.error).map(([id, detail]) => [id, detail.error]));
      setDetailErrors(errors);
      setDetailByOrder(details);
      setItemsByOrder(Object.fromEntries(mine.map((order) => [order.order_id, details[order.order_id]?.items || []])));
      setStatusByOrder(Object.fromEntries(mine.map((order) => {
        const history = details[order.order_id]?.history || [];
        const latest = [...history].sort((a, b) => new Date(b.orderstatustime || b.rcm || 0) - new Date(a.orderstatustime || a.rcm || 0))[0];
        return [order.order_id, latest?.orderstatus || order.orderstatus || order.order_status || "Pending"];
      })));
      setShipments(mine.flatMap((order) => details[order.order_id]?.shipments || []));
      setShipmentEvents(mine.flatMap((order) => details[order.order_id]?.events || []));
      setCouriers(mine.flatMap((order) => details[order.order_id]?.couriers || []));
      setReturns(mine.flatMap((order) => details[order.order_id]?.returns || []));
    } catch {
      setError("We could not load your orders. Please sign in again or try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount fetch (also reused by cancel/return flows) — intentional.
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCancel = async (o) => {
    setCancellingId(o.order_id);
    setCancelError("");
    setCancelSuccess("");
    try {
      await apiFetch(`/Orders/cancel/${encodeURIComponent(o.order_id)}`, { method: "POST", body: { user_id: currentUserId(), cancelled_by: "user", reason: "Cancelled by customer" } });
      setCancelSuccess("Order cancelled successfully.");
      fetchAll();
    } catch {
      setCancelError("Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const openReturn = (item, orderId) => setReturnModal({ open: true, item, orderId, reason: "", busy: false, done: false, error: "" });
  const closeReturn = () => setReturnModal({ open: false, item: null, orderId: null, reason: "", busy: false, done: false, error: "" });

  const submitReturn = async (e) => {
    e.preventDefault();
    setReturnModal((m) => ({ ...m, busy: true, error: "" }));
    try {
      // Returns API requires order_id + user_id + return_type ("full"/"partial").
      const item = returnModal.item || {};
      await apiFetch("/Returns", {
        method: "POST",
        body: {
          order_id: returnModal.orderId || item.order_id,
          user_id: currentUserId(),
          order_item_id: item.order_item_id,
          return_type: "partial",
          return_reason: returnModal.reason,
          return_amount: (Number(item.unit_price) || 0) * (Number(item.qty) || 1),
          return_status: "requested",
          rcu: "website",
        },
      });
      const list = unwrap(await apiFetch("/Returns").catch(() => []));
      setReturns(Array.isArray(list) ? list : []);
      setReturnModal((m) => ({ ...m, busy: false, done: true }));
      setTimeout(closeReturn, 1500);
    } catch (err) {
      setReturnModal((m) => ({ ...m, busy: false, error: err.message || "Failed to submit return request." }));
    }
  };

  if (loading) {
    return (
      <div className="account-page orders-empty">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
        <SpinnerStyle />
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page orders-error">
        <div className="bg-red-50 p-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="account-page orders-empty">
        <h2>No orders yet</h2>
        <p className="muted">Your order history will appear here.</p>
        <Link href="/" className="account-button mt-6 inline-block">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="account-page orders-page">
      <h2>My Orders</h2>
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
         const detail = detailByOrder[o.order_id] || {};
         const isPending = ["pending", "processing"].includes(latestStatus.toLowerCase());
        const isDelivered = ["delivered", "completed"].includes(latestStatus.toLowerCase());
        const shipment = shipments.find((s) => s.order_id === o.order_id);
        const events = shipmentEvents
          .filter((e) => e.shipment_id === shipment?.shipment_id)
          .sort((a, b) => new Date(b.event_timestamp || b.created_at || 0) - new Date(a.event_timestamp || a.created_at || 0));
         const courier = couriers.find((c) => c.courier_partner_id === shipment?.courier_partner_id);
        const totalItems = o.total_items || items.length;
         const totalPrice = o.total_amount ?? o.total_price ?? o.total ?? 0;
         const payment = detail.payments?.[0];
         const shippingAddress = detail.addresses?.find((address) => String(address.address_type || "").toLowerCase().includes("ship")) || detail.addresses?.[0];
         const billingAddress = detail.addresses?.find((address) => String(address.address_type || "").toLowerCase().includes("bill"));
         const activity = [...(detail.history || []).map((event) => ({ ...event, label: event.orderstatus, at: event.orderstatustime || event.rcm, description: event.remarks })), ...(detail.events || []).map((event) => ({ ...event, label: event.event_status, at: event.event_timestamp || event.rcm, description: event.event_description }))]
           .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
        return (
          <div key={o.order_id} className="order-card">
            <div className="order-header">
              <div>
                <span className="muted text-xs">Order</span>
                <h5 className="font-semibold">{o.order_number || o.order_id}</h5>
              </div>
              <div className="text-right">
                <span className="muted text-xs">Placed on</span>
                <p className="text-sm">{formatDate(o.placed_at || o.order_date || o.created_at)}</p>
              </div>
            </div>
             <div className="order-body">
               {detailErrors[o.order_id] && <div className="mb-3 bg-orange-50 p-3 text-sm text-orange-800">Some order details could not be loaded. Please refresh to try again.</div>}
               <div className="order-status-row">
                 <span className="order-status-badge">Order: {latestStatus}</span>
                <div className="order-status-actions">
                   <span className="order-payment-badge">Payment: {o.payment_status || "Unknown"}</span>
                  {isPending && (
                    <button
                      onClick={() => handleCancel(o)}
                      disabled={cancellingId === o.order_id}
                      className="order-cancel-button"
                    >
                      {cancellingId === o.order_id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
               </div>
               <div className="mb-5 grid gap-3 sm:grid-cols-2">
                 <div className="rounded bg-neutral-50 p-3 text-sm"><p className="text-xs uppercase tracking-wider text-neutral-500">Payment</p><p className="mt-1 font-semibold">{labelize(payment?.payment_status || o.payment_status || "Pending")}</p><p className="text-xs text-neutral-500">{labelize(payment?.payment_method_type || "Payment method unavailable")}</p></div>
                 <div className="rounded bg-neutral-50 p-3 text-sm"><p className="text-xs uppercase tracking-wider text-neutral-500">Delivery</p><p className="mt-1 font-semibold">{shipment ? labelize(shipment.shipment_status) : "Preparing your order"}</p><p className="text-xs text-neutral-500">{shipment?.tracking_number || "Tracking will appear after dispatch"}</p></div>
               </div>
               <div className="mb-5 rounded border border-neutral-200 p-4"><h6 className="font-semibold">Order timeline</h6>{activity.length ? <ol className="mt-3 space-y-3 border-l border-neutral-200 pl-4">{activity.slice(0, 6).map((event, index) => <li key={`${event.order_status_history_id || event.shipment_event_id || event.label}-${index}`} className="relative"><span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-neutral-950 ring-1 ring-neutral-300" /><p className="text-sm font-semibold">{labelize(event.label)}</p><p className="text-xs text-neutral-500">{formatDateTime(event.at)}</p>{event.description && <p className="mt-1 text-xs text-neutral-600">{event.description}</p>}</li>)}</ol> : <p className="mt-2 text-sm text-neutral-500">Your timeline will update as the order progresses.</p>}</div>
              </div>
              {items.length > 0 ? (
                items.map((item) => {
                  const itemReturn = returns.find((r) => r.order_item_id === item.order_item_id);
                  return (
                    <div key={item.order_item_id} className="order-item-row flex items-start justify-between gap-3 border-b border-neutral-100 py-2 last:border-0">
                      <div className="order-item-info">
                        <h6 className="font-medium">{item.product_name}</h6>
                        <p className="text-xs text-neutral-500">SKU: {item.sku} | Qty: {item.qty}</p>
                        {itemReturn && (
                          <span className="mt-1 inline-block bg-yellow-200 px-2 py-0.5 text-xs font-semibold">
                            Return: {itemReturn.return_status}
                          </span>
                        )}
                      </div>
                      <div className="order-item-price">
                        <span className="block font-bold">
                          ₹{((item.unit_price || 0) * (item.qty || 0)).toLocaleString("en-IN")}
                        </span>
                        {isDelivered && !itemReturn && (
                          <button onClick={() => openReturn(item, o.order_id)} className="mt-1 p-0 text-xs text-neutral-500 underline">
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
            <hr className="order-divider" />
             <div className="order-total-row">
              <span>Total Items: {totalItems}</span>
              <span className="text-lg font-bold">Total: ₹{Number(totalPrice || 0).toLocaleString("en-IN")}</span>
             </div>
             <div className="grid gap-3 px-4 pb-4 md:grid-cols-3">
               <div className="rounded bg-neutral-50 p-4 text-sm"><h6 className="font-semibold">Payment summary</h6><p className="mt-2">Subtotal: ₹{Number(o.subtotal || 0).toLocaleString("en-IN")}</p><p>Shipping: ₹{Number(o.shipping_amount || 0).toLocaleString("en-IN")}</p><p>Tax: ₹{Number(o.tax_amount || 0).toLocaleString("en-IN")}</p><p className="mt-1 font-bold">Total: ₹{Number(totalPrice || 0).toLocaleString("en-IN")}</p></div>
               <div className="rounded bg-neutral-50 p-4 text-sm"><h6 className="font-semibold">Delivery address</h6>{shippingAddress ? <p className="mt-2 leading-relaxed">{shippingAddress.full_name}<br />{addressText(shippingAddress)}<br />{[shippingAddress.city, shippingAddress.state].filter(Boolean).join(", ")} {shippingAddress.pincode || ""}</p> : <p className="mt-2 text-neutral-500">Address details unavailable.</p>}</div>
               <div className="rounded bg-neutral-50 p-4 text-sm"><h6 className="font-semibold">Billing address</h6>{billingAddress ? <p className="mt-2 leading-relaxed">{billingAddress.full_name}<br />{addressText(billingAddress)}<br />{[billingAddress.city, billingAddress.state].filter(Boolean).join(", ")} {billingAddress.pincode || ""}</p> : <p className="mt-2 text-neutral-500">Same as delivery address.</p>}</div>
             </div>
            <div className="order-shipment-wrap">
              {shipment ? (
                <div className="order-shipment">
                  <h6 className="font-semibold">Shipment Tracking</h6>
                  <span className="mt-1 inline-block bg-cyan-200 px-2 py-0.5 text-xs font-semibold">
                    {courier?.courier_name || "Courier"}
                  </span>
                  <p className="mt-2 text-sm"><strong>Tracking Number:</strong> {shipment.tracking_number || "N/A"}</p>
                  <p className="text-sm">
                    <strong>Status:</strong> {events[0]?.event_description || events[0]?.event_status || shipment.shipment_status || "In Transit"}
                  </p>
                  {events.length > 0 && (
                    <>
                      <strong className="mt-2 block text-xs">Tracking History:</strong>
                      <ul className="mt-1 list-disc pl-5 text-xs text-neutral-600">
                        {events.slice(0, 4).map((e, i) => (
                          <li key={i}>
                            {formatDate(e.event_timestamp || e.created_at)} — {e.event_description || e.event_status}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <div className="order-shipment-empty">
                  <i className="bi bi-box-seam me-1"></i>
                  Shipping details will appear once the order is dispatched.
                </div>
              )}
            </div>
          </div>
        );
      })}

      {returnModal.open && (
        <div className="orders-modal-backdrop" onMouseDown={closeReturn}>
          <div className="orders-modal-dialog" onMouseDown={(e) => e.stopPropagation()}>
            <div className="orders-modal-header">
              <h5>Request Return</h5>
              <button type="button" aria-label="Close" onClick={closeReturn} className="orders-modal-close">×</button>
            </div>
            {returnModal.done ? (
              <p className="p-5 text-center text-sm text-green-700">Return request submitted successfully.</p>
            ) : (
              <form onSubmit={submitReturn}>
                <div className="orders-modal-body">
                  <label>Return Reason</label>
                  <textarea
                    rows="3"
                    required
                    value={returnModal.reason}
                    onChange={(e) => setReturnModal((m) => ({ ...m, reason: e.target.value }))}
                    placeholder="Why are you returning this item?"
                    className="orders-modal-textarea"
                  />
                  {returnModal.error && <p className="mt-2 text-xs text-red-600">{returnModal.error}</p>}
                </div>
                <div className="orders-modal-footer">
                  <button type="button" onClick={closeReturn} className="orders-modal-light-button">
                    Cancel
                  </button>
                  <button disabled={returnModal.busy} className="orders-modal-dark-button">
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
      .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius:0; animation: sd-spin 0.75s linear infinite; display: inline-block; }
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
