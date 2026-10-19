"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch, unwrap, inr, revalidateSite } from "@/lib/api";
import Pagination, { paginate } from "../Pagination";
import { useToast } from "../ToastProvider";
import { useConfirm } from "../ConfirmProvider";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const SHIP_STATUSES = ["created", "shipped", "in_transit", "out_for_delivery", "delivered", "returned", "cancelled"];
const RETURN_STATUSES = ["requested", "approved", "rejected", "received", "processed"];

const labelize = (value) => String(value || "—").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const badgeClass = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (["paid", "delivered", "processed", "approved"].includes(normalized)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (["failed", "cancelled", "rejected", "returned", "exception"].includes(normalized)) return "bg-red-50 text-red-700 ring-red-200";
  if (["pending", "processing", "requested", "in_transit", "out_for_delivery", "shipped"].includes(normalized)) return "bg-orange-50 text-orange-700 ring-orange-200";
  return "bg-neutral-100 text-neutral-600 ring-neutral-200";
};

// Order Management: per-order accordion with inner tabs, same as before.
export default function AdminOrdersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [shipmentEvents, setShipmentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState({});
  const [statusDraft, setStatusDraft] = useState({});
  const [shipForm, setShipForm] = useState({});
  const [eventForm, setEventForm] = useState({});
  const [returnStatus, setReturnStatus] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    try {
      const [o, it, h, s, c, r, u, a, p, e] = await Promise.all([
        apiFetch("/Orders").then(unwrap),
        apiFetch("/Order-Items").then(unwrap).catch(() => []),
        apiFetch("/Order-Status-History").then(unwrap).catch(() => []),
        apiFetch("/Shipments").then(unwrap).catch(() => []),
        apiFetch("/Courier-Partners").then(unwrap).catch(() => []),
        apiFetch("/Returns").then(unwrap).catch(() => []),
        apiFetch("/Users").then(unwrap).catch(() => []),
        apiFetch("/Order-Addresses").then(unwrap).catch(() => []),
        apiFetch("/Payments").then(unwrap).catch(() => []),
        apiFetch("/Shipment-Events").then(unwrap).catch(() => []),
      ]);
      const list = (Array.isArray(o) ? o : []).sort(
        (a, b) => new Date(b.placed_at || b.rcm || 0) - new Date(a.placed_at || a.rcm || 0)
      );
      setOrders(list);
      setItems(Array.isArray(it) ? it : []);
      setHistory(Array.isArray(h) ? h : []);
      setShipments(Array.isArray(s) ? s : []);
      setCouriers(Array.isArray(c) ? c : []);
      setReturns(Array.isArray(r) ? r : []);
      setUsers(Array.isArray(u) ? u : []);
      setAddresses(Array.isArray(a) ? a : []);
      setPayments(Array.isArray(p) ? p : []);
      setShipmentEvents(Array.isArray(e) ? e : []);
    } catch {
      toast?.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  // Mount fetch — intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleExpand = (id) => {
    setExpanded((m) => ({ ...m, [id]: !m[id] }));
    setActiveTab((m) => (m[id] ? m : { ...m, [id]: "overview" }));
  };

  const userName = (id) => {
    const u = users.find((x) => x.user_id === id);
    return u ? u.full_name || u.email || id : "";
  };
  const latestStatus = (o) => {
    const h = history
      .filter((x) => x.order_id === o.order_id)
      .sort((a, b) => new Date(b.orderstatustime || b.rcm || 0) - new Date(a.orderstatustime || a.rcm || 0));
    return h[0]?.orderstatus || o.orderstatus || "Pending";
  };
  const orderItems = (id) => items.filter((i) => i.order_id === id);
  const orderHistory = (id) =>
    history
      .filter((x) => x.order_id === id)
      .sort((a, b) => new Date(b.orderstatustime || b.rcm || 0) - new Date(a.orderstatustime || a.rcm || 0));
  const orderShipment = (id) => shipments.find((s) => s.order_id === id);
  const orderAddresses = (id) => addresses.filter((a) => a.order_id === id);
  const orderPayment = (id) => payments.find((p) => p.order_id === id);
  const orderEvents = (id) => {
    const shipment = orderShipment(id);
    return shipmentEvents
      .filter((event) => event.shipment_id === shipment?.shipment_id)
      .sort((a, b) => new Date(b.event_timestamp || b.rcm || 0) - new Date(a.event_timestamp || a.rcm || 0));
  };
  const orderReturns = (id) => {
    const ids = new Set(orderItems(id).map((i) => i.order_item_id));
    return returns.filter((r) => ids.has(r.order_item_id) || r.order_id === id);
  };

  const saveStatus = async (o) => {
    const next = statusDraft[o.order_id] || latestStatus(o);
    if (next === latestStatus(o)) {
      toast?.warning("Choose a different order status first.");
      return;
    }
    if (next === "Cancelled" && !(await confirm?.({
      title: "Cancel this order?",
      message: "Check payment and fulfillment before cancelling this order.",
      confirmLabel: "Cancel order",
      danger: true,
    }))) return;
    try {
      let statuses = [];
      try {
        statuses = unwrap(await apiFetch("/Order-Status-Master"));
        if (!Array.isArray(statuses)) statuses = [];
      } catch {
        statuses = [];
      }
      const match = statuses.find(
        (s) => s.status_name?.toLowerCase() === next.toLowerCase() || s.status_code?.toLowerCase() === next.toLowerCase()
      );
      await apiFetch("/Order-Status-History", {
        method: "POST",
        body: { order_id: o.order_id, order_status_id: match?.order_status_id || null, orderstatus: next, rcu: "ADMIN_PORTAL" },
      });
      await apiFetch("/Orders", {
        method: "PUT",
        body: { order_id: o.order_id, orderstatus: next, luu: "ADMIN_PORTAL" },
      }).catch(() => null);
      toast?.success("Order status updated.");
      revalidateSite();
      load();
    } catch {
      toast?.error("Failed to update status.");
    }
  };

  const saveShipment = async (o, isNew) => {
    const f = shipForm[o.order_id] || {};
    if (isNew && (!f.courier_partner_id || !f.tracking_number)) {
      toast?.warning("Select a courier and enter a tracking number.");
      return;
    }
    try {
      if (isNew) {
        await apiFetch("/Shipments", {
          method: "POST",
          body: {
            order_id: o.order_id,
            courier_partner_id: f.courier_partner_id,
            tracking_number: f.tracking_number,
            shipment_status: f.shipment_status || "created",
            rcu: "ADMIN_PORTAL",
          },
        });
      } else {
        const s = orderShipment(o.order_id);
        await apiFetch("/Shipments", {
          method: "PUT",
          body: { shipment_id: s.shipment_id, shipment_status: f.shipment_status || s.shipment_status, luu: "ADMIN_PORTAL" },
        });
      }
      toast?.success("Shipment saved.");
      revalidateSite();
      load();
    } catch {
      toast?.error("Failed to save shipment.");
    }
  };

  const updateReturn = async (returnRecord, value) => {
    if (value === returnRecord.return_status) return;
    if (!(await confirm?.({
      title: "Update return status?",
      message: `This will mark the return as ${labelize(value)}.`,
      confirmLabel: "Update return",
    }))) return;
    try {
      await apiFetch("/Returns", { method: "PUT", body: { return_id: returnRecord.return_id, return_status: value, luu: "ADMIN_PORTAL" } });
      toast?.success("Return updated.");
      load();
    } catch {
      toast?.error("Failed to update return.");
    }
  };

  const addShipmentEvent = async (o) => {
    const shipment = orderShipment(o.order_id);
    const event = eventForm[o.order_id] || {};
    if (!shipment) {
      toast?.warning("Create the shipment before adding a tracking event.");
      return;
    }
    if (!event.event_status || !event.event_description) {
      toast?.warning("Choose an event status and add a short description.");
      return;
    }
    try {
      await apiFetch("/Shipment-Events", {
        method: "POST",
        body: {
          shipment_id: shipment.shipment_id,
          event_status: event.event_status,
          event_location: event.event_location,
          event_description: event.event_description,
          event_source: "ADMIN_PORTAL",
          rcu: "ADMIN_PORTAL",
        },
      });
      toast?.success("Shipment event added.");
      setEventForm((m) => ({ ...m, [o.order_id]: {} }));
      load();
    } catch {
      toast?.error("Failed to add shipment event.");
    }
  };

  // Return moderation happens inline in the Returns tab select below.
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="h-8 w-8 animate-spin  border-2 border-neutral-300 border-t-neutral-950" />
        <p className="text-sm text-neutral-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <p className="eyebrow text-gold-deep">Harry Clinton</p>
        <h3 className="font-display text-3xl font-bold tracking-tight text-neutral-900">Order Management</h3>
      </div>
      <div className="mt-4 flex justify-end">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search order, customer, status..."
          className="w-full max-w-md  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />
      </div>
      {(() => {
        const needle = search.trim().toLowerCase();
        const filtered = needle
          ? orders.filter((o) =>
              `${o.order_id || ""} ${userName(o.user_id)} ${latestStatus(o)}`.toLowerCase().includes(needle)
            )
          : orders;
        const shown = paginate(filtered, page, pageSize);
        if (shown.length === 0) {
          return (
            <p className="mt-4  border border-neutral-200 bg-white p-5 text-sm text-neutral-500 shadow-sm">No orders found.</p>
          );
        }
        return (
          <>
            <div className="mt-4 space-y-2">
              {shown.map((o) => {
            const isExpanded = !!expanded[o.order_id];
             const tab = activeTab[o.order_id] || "overview";
            const status = latestStatus(o);
            const list = orderItems(o.order_id);
            const subtotal = list.reduce((n, i) => n + Number(i.unit_price || 0) * Number(i.qty || 0), 0);
            const tax = Math.round((o.discount_amount ? subtotal - Number(o.discount_amount) : subtotal) * 0.05 * 100) / 100;
             const ship = orderShipment(o.order_id);
             const payment = orderPayment(o.order_id);
             const events = orderEvents(o.order_id);
            const orderAddressList = orderAddresses(o.order_id);
            const rets = orderReturns(o.order_id);
            return (
              <div key={o.order_id} className="overflow-hidden  border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <button
                  type="button"
                  onClick={() => toggleExpand(o.order_id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[#faf8f4]"
                >
                  <span className="flex items-center gap-3">
                    <i className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"} text-sm text-gold-deep`} />
                    <strong className="text-neutral-900">{o.order_number || "Order"}</strong>
                    {userName(o.user_id) && <span className="text-sm text-neutral-500">{userName(o.user_id)}</span>}
                  </span>
                   <span className="flex flex-wrap items-center justify-end gap-2">
                     <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass(status)}`}>{labelize(status)}</span>
                     <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass(payment?.payment_status || o.payment_status)}`}>{labelize(payment?.payment_status || o.payment_status || "Payment unknown")}</span>
                     <span className="font-bold text-neutral-900">{money(o.total_amount ?? o.total ?? subtotal)}</span>
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-neutral-200 p-4">
                    <ul className="mb-3 flex gap-1 border-b border-neutral-200">
                      {[
                         ["overview", "Overview"],
                        [`items`, `Items (${list.length})`],
                        ["shipment", ship ? "Shipment" : "Create Shipment"],
                        ["address", `Address${orderAddressList.length > 1 ? "es" : ""}`],
                        ["payment", "Payment"],
                        [`returns`, `Returns (${rets.length})`],
                      ].map(([key, label]) => (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => setActiveTab((m) => ({ ...m, [o.order_id]: key }))}
                            className={`-mb-px border-b-2 px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                              tab === key
                                ? "border-gold bg-white text-neutral-900"
                                : "border-transparent text-neutral-500 hover:text-neutral-900"
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>

                     {tab === "overview" && (
                       <div>
                         <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                           <div className="rounded border border-neutral-200 bg-neutral-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Customer</p><p className="mt-1 font-semibold text-neutral-900">{userName(o.user_id) || "Guest customer"}</p><p className="text-xs text-neutral-500">{o.user_id || "No customer ID"}</p></div>
                           <div className="rounded border border-neutral-200 bg-neutral-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Payment</p><p className="mt-1 font-semibold text-neutral-900">{labelize(payment?.payment_status || o.payment_status || "Unknown")}</p><p className="text-xs text-neutral-500">{payment?.payment_method_type ? labelize(payment.payment_method_type) : "Payment record unavailable"}</p></div>
                           <div className="rounded border border-neutral-200 bg-neutral-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Fulfillment</p><p className="mt-1 font-semibold text-neutral-900">{labelize(ship?.shipment_status || "Not created")}</p><p className="text-xs text-neutral-500">{ship?.tracking_number || "Create shipment next"}</p></div>
                           <div className="rounded border border-neutral-200 bg-neutral-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Order total</p><p className="mt-1 font-semibold text-neutral-900">{money(o.total_amount ?? o.total ?? subtotal)}</p><p className="text-xs text-neutral-500">Placed {dateTime(o.placed_at || o.rcm)}</p></div>
                         </div>
                         <div className="mb-5 rounded border border-neutral-200 p-4">
                           <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-bold text-neutral-900">Order activity</h4><span className="text-xs text-neutral-500">{orderHistory(o.order_id).length + events.length} events</span></div>
                           <ol className="mt-3 space-y-3 border-l border-neutral-200 pl-4">
                             {[...orderHistory(o.order_id).map((h) => ({ ...h, activityLabel: h.orderstatus, activityTime: h.orderstatustime || h.rcm, activityBy: h.orderstatusby })), ...events.map((e) => ({ ...e, activityLabel: e.event_status, activityTime: e.event_timestamp || e.rcm, activityBy: e.event_source }))]
                               .sort((a, b) => new Date(b.activityTime || 0) - new Date(a.activityTime || 0))
                               .slice(0, 8)
                               .map((event, index) => (
                                 <li key={`${event.order_status_history_id || event.shipment_event_id || event.activityLabel}-${index}`} className="relative">
                                   <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-gold-deep ring-1 ring-gold-deep/30" />
                                   <p className="text-sm font-semibold text-neutral-900">{labelize(event.activityLabel)}</p>
                                   <p className="text-xs text-neutral-500">{dateTime(event.activityTime)}{event.activityBy ? ` · ${event.activityBy}` : ""}</p>
                                   {event.remarks && <p className="mt-1 text-xs text-neutral-600">{event.remarks}</p>}
                                 </li>
                               ))}
                           </ol>
                           {orderHistory(o.order_id).length === 0 && events.length === 0 && <p className="mt-3 text-sm text-neutral-500">No activity has been recorded yet.</p>}
                         </div>
                         <label className="mb-1 block text-sm font-semibold text-neutral-700">Update Order Status</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={statusDraft[o.order_id] || status}
                            onChange={(e) => setStatusDraft((m) => ({ ...m, [o.order_id]: e.target.value }))}
                            className="w-auto  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => saveStatus(o)}
                            className="inline-flex items-center justify-center  bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
                          >
                            Save
                          </button>
                        </div>
                        <strong className="mt-4 block text-sm text-neutral-900">Status History:</strong>
                        <ul className="mt-1 space-y-1 text-sm text-neutral-600">
                          {orderHistory(o.order_id).map((h) => (
                            <li key={h.order_status_history_id}>
                              {h.orderstatustime ? new Date(h.orderstatustime).toLocaleDateString("en-IN") : ""} — {h.orderstatus}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tab === "items" && (
                      <div>
                        {list.length === 0 ? (
                          <p className="text-sm text-neutral-500">No items.</p>
                        ) : (
                          <div className="overflow-x-auto  border border-neutral-200">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
                                <th className="px-3 py-2">Product</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Qty</th>
                                <th className="px-3 py-2 text-right">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map((item) => (
                                <tr key={item.order_item_id} className="border-b transition-colors last:border-0 hover:bg-[#faf8f4]">
                                  <td className="px-3 py-2">{item.product_name}</td>
                                  <td className="px-3 py-2">{item.sku}</td>
                                  <td className="px-3 py-2">{item.qty}</td>
                                  <td className="px-3 py-2 text-right">₹{(Number(item.unit_price || 0) * Number(item.qty || 0)).toLocaleString("en-IN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        )}
                         <div className="mt-3 grid gap-1 border-t border-neutral-200 pt-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                           <span>Subtotal: {money(o.subtotal ?? subtotal)}</span>
                           <span>Discount: -{money(o.discount_amount)}</span>
                           <span>Tax: {money(o.tax_amount ?? tax)}</span>
                           <span>Shipping: {money(o.shipping_amount)}</span>
                           <strong className="text-neutral-900">Total: {money(o.total_amount ?? o.total ?? subtotal)}</strong>
                         </div>
                       </div>
                     )}

                     {tab === "payment" && (
                       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                         {[
                           ["Status", labelize(payment?.payment_status || o.payment_status || "Unknown")],
                           ["Provider", labelize(payment?.payment_provider || "—")],
                           ["Method", labelize(payment?.payment_method_type || "—")],
                           ["Amount", money(payment?.amount ?? o.total_amount ?? o.total)],
                           ["Paid at", dateTime(payment?.paid_at)],
                           ["Refunded", money(payment?.refund_amount)],
                           ["Transaction", payment?.razorpay_payment_id || "—"],
                           ["Payment ID", payment?.payment_id || "—"],
                         ].map(([label, value]) => <div key={label} className="rounded border border-neutral-200 bg-neutral-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-neutral-900">{value}</p></div>)}
                         {!payment && <p className="sm:col-span-2 lg:col-span-4 text-sm text-orange-700">No payment record was returned for this order. Verify the payment before dispatching.</p>}
                       </div>
                     )}

                     {tab === "shipment" && (
                      <div>
                        {ship ? (
                           <div className="space-y-4 text-sm">
                            <p className="mb-1"><strong>Tracking Number:</strong> {ship.tracking_number}</p>
                            <p className="mb-1">
                              <strong>Courier:</strong>{" "}
                              {couriers.find((c) => c.courier_partner_id === ship.courier_partner_id)?.courier_name || "N/A"}
                            </p>
                            <label className="mb-1 block text-sm font-medium">Shipment Status</label>
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={(shipForm[o.order_id] || {}).shipment_status || ship.shipment_status || "created"}
                                onChange={(e) =>
                                  setShipForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), shipment_status: e.target.value } }))
                                }
                                className="w-auto  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                              >
                                {SHIP_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => saveShipment(o, false)}
                                className="inline-flex items-center justify-center  bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
                              >
                                Save
                              </button>
                            </div>
                            <div className="border-t border-neutral-200 pt-4">
                              <p className="mb-2 text-sm font-semibold text-neutral-900">Add tracking event</p>
                              <div className="grid gap-2 md:grid-cols-4">
                                <select
                                  value={(eventForm[o.order_id] || {}).event_status || ""}
                                  onChange={(e) => setEventForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), event_status: e.target.value } }))}
                                  className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                                >
                                  <option value="">Event status</option>
                                  {["pickup_scheduled", "dispatched", "in_transit", "out_for_delivery", "delivered", "failed", "returned", "exception"].map((eventStatus) => <option key={eventStatus} value={eventStatus}>{labelize(eventStatus)}</option>)}
                                </select>
                                <input
                                  value={(eventForm[o.order_id] || {}).event_location || ""}
                                  onChange={(e) => setEventForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), event_location: e.target.value } }))}
                                  placeholder="Location (optional)"
                                  className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                                />
                                <input
                                  value={(eventForm[o.order_id] || {}).event_description || ""}
                                  onChange={(e) => setEventForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), event_description: e.target.value } }))}
                                  placeholder="What happened?"
                                  className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 md:col-span-2"
                                />
                                <button type="button" onClick={() => addShipmentEvent(o)} className="bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold hover:text-neutral-950 md:col-span-4 md:justify-self-start">Add event</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-4">
                            <select
                              value={(shipForm[o.order_id] || {}).courier_partner_id || ""}
                              onChange={(e) =>
                                setShipForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), courier_partner_id: e.target.value } }))
                              }
                              className=" border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                            >
                              <option value="">Select Courier</option>
                              {couriers.map((c) => (
                                <option key={c.courier_partner_id} value={c.courier_partner_id}>
                                  {c.courier_name}
                                </option>
                              ))}
                            </select>
                            <input
                              value={(shipForm[o.order_id] || {}).tracking_number || ""}
                              onChange={(e) =>
                                setShipForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), tracking_number: e.target.value } }))
                              }
                              placeholder="Tracking number"
                              className=" border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                            />
                            <select
                              value={(shipForm[o.order_id] || {}).shipment_status || "created"}
                              onChange={(e) =>
                                setShipForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), shipment_status: e.target.value } }))
                              }
                              className=" border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                            >
                              {SHIP_STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => saveShipment(o, true)}
                              className="inline-flex items-center justify-center  bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {tab === "address" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {orderAddressList.length === 0 ? (
                          <p className="rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">No saved address for this order. Do not dispatch until the customer address is verified.</p>
                        ) : orderAddressList.map((address) => (
                          <div key={address.order_address_id} className="border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                            <p className="mb-2 font-bold uppercase tracking-wider text-neutral-900">{address.address_type || "Shipping"} address</p>
                            <p className="font-semibold text-neutral-900">{address.full_name || "—"}</p>
                            {address.mobile_number && <p>Phone: {address.mobile_number}</p>}
                            {address.address_label && <p>Label: {address.address_label}</p>}
                            {address.house_no_floor && <p>{address.house_no_floor}</p>}
                            {address.building_block && <p>{address.building_block}</p>}
                            {address.house_street && <p>{address.house_street}</p>}
                            {address.area_name && <p>{address.area_name}</p>}
                            <p>
                              {[address.city, address.state].filter(Boolean).join(", ")}{address.pincode ? ` — ${address.pincode}` : ""}
                            </p>
                            {address.landmark && <p>Landmark: {address.landmark}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {tab === "returns" && (
                      <div>
                        {rets.length === 0 ? (
                          <p className="text-sm text-neutral-500">No return requests for this order.</p>
                        ) : (
                          <div className="overflow-x-auto  border border-neutral-200">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
                                <th className="px-3 py-2">Item</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rets.map((r) => {
                                const item = list.find((i) => i.order_item_id === r.order_item_id);
                                return (
                                  <tr key={r.return_id} className="border-b transition-colors last:border-0 hover:bg-[#faf8f4]">
                                    <td className="px-3 py-2">{item?.product_name || "Unknown"}</td>
                                    <td className="px-3 py-2">{r.return_reason}</td>
                                    <td className="px-3 py-2">{r.return_status}</td>
                                    <td className="px-3 py-2">
                                      <select
                                        value={returnStatus[r.return_id] || r.return_status}
                                         onChange={(e) => {
                                           const v = e.target.value;
                                           setReturnStatus((m) => ({ ...m, [r.return_id]: v }));
                                           updateReturn(r, v);
                                         }}
                                        className="w-auto  border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                                      >
                                        {RETURN_STATUSES.map((s) => (
                                          <option key={s} value={s}>{s}</option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
            </div>
            <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={pageSize} setPageSize={setPageSize} />
          </>
        );
      })()}
    </div>
  );
}
