"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch, unwrap, inr, revalidateSite } from "@/lib/api";
import { useToast } from "../ToastProvider";
import { useConfirm } from "../ConfirmProvider";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const SHIP_STATUSES = ["created", "in_transit", "out_for_delivery", "delivered", "returned"];
const RETURN_STATUSES = ["requested", "approved", "rejected", "completed"];

// Order Management: per-order accordion with inner tabs, same as before.
export default function AdminOrdersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState({});
  const [statusDraft, setStatusDraft] = useState({});
  const [shipForm, setShipForm] = useState({});
  const [returnStatus, setReturnStatus] = useState({});

  const load = async () => {
    try {
      const [o, it, h, s, c, r, u] = await Promise.all([
        apiFetch("/Orders").then(unwrap),
        apiFetch("/Order-Items").then(unwrap).catch(() => []),
        apiFetch("/Order-Status-History").then(unwrap).catch(() => []),
        apiFetch("/Shipments").then(unwrap).catch(() => []),
        apiFetch("/Courier-Partners").then(unwrap).catch(() => []),
        apiFetch("/Returns").then(unwrap).catch(() => []),
        apiFetch("/Users").then(unwrap).catch(() => []),
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
    setActiveTab((m) => (m[id] ? m : { ...m, [id]: "status" }));
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
  const orderReturns = (id) => {
    const ids = new Set(orderItems(id).map((i) => i.order_item_id));
    return returns.filter((r) => ids.has(r.order_item_id) || r.order_id === id);
  };

  const saveStatus = async (o) => {
    const next = statusDraft[o.order_id] || latestStatus(o);
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
    if (isNew && (!f.courier_partner_id || !f.tracking_number)) return;
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

  // Return moderation happens inline in the Returns tab select below.
  if (loading) {
    return (
      <div className="py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
        <SpinnerStyle />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-[22px] font-bold">Order Management</h3>
      {orders.length === 0 ? (
        <p className="text-neutral-500">No orders found.</p>
      ) : (
        <div className="accordion" id="adminOrdersAccordion">
          {orders.map((o) => {
            const isExpanded = !!expanded[o.order_id];
            const tab = activeTab[o.order_id] || "status";
            const status = latestStatus(o);
            const list = orderItems(o.order_id);
            const subtotal = list.reduce((n, i) => n + Number(i.unit_price || 0) * Number(i.qty || 0), 0);
            const tax = Math.round((o.discount_amount ? subtotal - Number(o.discount_amount) : subtotal) * 0.05 * 100) / 100;
            const ship = orderShipment(o.order_id);
            const rets = orderReturns(o.order_id);
            return (
              <div key={o.order_id} className="mb-2 border border-neutral-200 bg-white">
                <button
                  onClick={() => toggleExpand(o.order_id)}
                  aria-expanded={isExpanded}
                  className={`flex w-full items-center justify-between p-3 text-left ${isExpanded ? "" : "collapsed"}`}
                >
                  <span className="flex items-center gap-3">
                    <strong>{o.order_number || "Order"}</strong>
                    {userName(o.user_id) && <span className="text-sm text-neutral-500">{userName(o.user_id)}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="bg-neutral-950 px-2 py-0.5 text-xs font-semibold text-white">{status}</span>
                    <span className="border border-neutral-300 px-2 py-0.5 text-xs">{o.payment_status}</span>
                    <span className="font-bold">₹{Number(o.total_amount ?? o.total ?? subtotal).toLocaleString("en-IN")}</span>
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-neutral-200 p-4">
                    <ul className="mb-3 flex gap-1 border-b border-neutral-200">
                      {[
                        ["status", "Status"],
                        [`items`, `Items (${list.length})`],
                        ["shipment", ship ? "Shipment" : "Create Shipment"],
                        [`returns`, `Returns (${rets.length})`],
                      ].map(([key, label]) => (
                        <li key={key}>
                          <button
                            onClick={() => setActiveTab((m) => ({ ...m, [o.order_id]: key }))}
                            className={`px-4 py-2 text-[13.5px] font-semibold ${
                              tab === key
                                ? "border-b-2 border-[#b08d57] bg-white text-neutral-900"
                                : "text-neutral-500 hover:text-neutral-900"
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>

                    {tab === "status" && (
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Update Order Status</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={statusDraft[o.order_id] || status}
                            onChange={(e) => setStatusDraft((m) => ({ ...m, [o.order_id]: e.target.value }))}
                            className="w-auto border border-neutral-300 bg-white px-3 py-2 text-sm"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button onClick={() => saveStatus(o)} className="bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">
                            Save
                          </button>
                        </div>
                        <strong className="mt-4 block text-sm">Status History:</strong>
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
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="bg-[#17161a] text-[11px] font-bold uppercase text-white">
                                <th className="p-2">Product</th><th className="p-2">SKU</th><th className="p-2">Qty</th>
                                <th className="p-2 text-right">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map((item) => (
                                <tr key={item.order_item_id} className="border-b last:border-0">
                                  <td className="p-2">{item.product_name}</td>
                                  <td className="p-2">{item.sku}</td>
                                  <td className="p-2">{item.qty}</td>
                                  <td className="p-2 text-right">₹{(Number(item.unit_price || 0) * Number(item.qty || 0)).toLocaleString("en-IN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <div className="mt-2 flex justify-between text-sm">
                          <span>Subtotal: ₹{subtotal.toLocaleString("en-IN")}</span>
                          <span>Tax: ₹{tax.toLocaleString("en-IN")}</span>
                          <span>Shipping: ₹{Number(o.shipping_amount || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}

                    {tab === "shipment" && (
                      <div>
                        {ship ? (
                          <div className="space-y-1 text-sm">
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
                                className="w-auto border border-neutral-300 bg-white px-3 py-2 text-sm"
                              >
                                {SHIP_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <button onClick={() => saveShipment(o, false)} className="bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-4">
                            <select
                              value={(shipForm[o.order_id] || {}).courier_partner_id || ""}
                              onChange={(e) =>
                                setShipForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), courier_partner_id: e.target.value } }))
                              }
                              className="border border-neutral-300 bg-white px-3 py-2 text-sm"
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
                              className="border border-neutral-300 bg-white px-3 py-2 text-sm"
                            />
                            <select
                              value={(shipForm[o.order_id] || {}).shipment_status || "created"}
                              onChange={(e) =>
                                setShipForm((m) => ({ ...m, [o.order_id]: { ...(m[o.order_id] || {}), shipment_status: e.target.value } }))
                              }
                              className="border border-neutral-300 bg-white px-3 py-2 text-sm"
                            >
                              {SHIP_STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <button onClick={() => saveShipment(o, true)} className="bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {tab === "returns" && (
                      <div>
                        {rets.length === 0 ? (
                          <p className="text-sm text-neutral-500">No return requests for this order.</p>
                        ) : (
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="bg-[#17161a] text-[11px] font-bold uppercase text-white">
                                <th className="p-2">Item</th><th className="p-2">Reason</th><th className="p-2">Status</th><th className="p-2">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rets.map((r) => {
                                const item = list.find((i) => i.order_item_id === r.order_item_id);
                                return (
                                  <tr key={r.return_id} className="border-b last:border-0">
                                    <td className="p-2">{item?.product_name || "Unknown"}</td>
                                    <td className="p-2">{r.return_reason}</td>
                                    <td className="p-2">{r.return_status}</td>
                                    <td className="p-2">
                                      <select
                                        value={returnStatus[r.return_id] || r.return_status}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setReturnStatus((m) => ({ ...m, [r.return_id]: v }));
                                          apiFetch("/Returns", {
                                            method: "PUT",
                                            body: { return_id: r.return_id, return_status: v, luu: "ADMIN_PORTAL" },
                                          }).then(() => {
                                            toast?.success("Return updated.");
                                            load();
                                          }).catch(() => toast?.error("Failed to update return."));
                                        }}
                                        className="w-auto border border-neutral-300 bg-white px-2 py-1 text-sm"
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
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
