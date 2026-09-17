"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, unwrap, revalidateSite, friendlyError } from "@/lib/api";
import ActiveToggle from "@/components/ActiveToggle";
import { useToast } from "../ToastProvider";
import { useConfirm } from "../ConfirmProvider";

const panelCls = "rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm";
const tableWrapCls = "overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm";
const thCls = "px-4 py-3 whitespace-nowrap";
const tdCls = "px-4 py-3";
const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

const stripTags = (s) => String(s || "").replace(/<[^>]*>/g, "").trim();
const isHtml = (s) => /<[a-z][\s\S]*>/i.test(String(s || ""));

// Running Bar & Items: group list (name, item count, total seconds,
// toggle + delete icons) -> click a group to drill into its children on
// the same page -> create items via popup -> drag-and-drop order + save.
export default function AdminRunningBarsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [bars, setBars] = useState([]);
  const [items, setItems] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // null = group list, string = drilled-in group id.
  const [openBarId, setOpenBarId] = useState(null);
  // null | { name, isactive } — create-group popup.
  const [barModal, setBarModal] = useState(null);
  // null | { itemsdata, duration_seconds, isactive } — create-item popup.
  const [itemModal, setItemModal] = useState(null);
  // false | array of item ids in manual order — reorder mode.
  const [orderMode, setOrderMode] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  const dragId = useRef(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      apiFetch("/Running-Bar", { params: { includeInactive: 1 } }).then(unwrap).catch(() => []),
      apiFetch("/Running-Bar-Items", { params: { includeInactive: 1 } }).then(unwrap).catch(() => []),
    ]).then(([b, it]) => {
      if (!live) return;
      setBars(Array.isArray(b) ? b : []);
      setItems(Array.isArray(it) ? it : []);
    });
    return () => {
      live = false;
    };
  }, [refresh]);

  const reload = () => {
    setRefresh((n) => n + 1);
    revalidateSite();
  };

  const liveBars = useMemo(
    () => bars.filter((b) => b.isdeleted !== 1 && b.isdeleted !== true),
    [bars]
  );
  const liveItems = useMemo(
    () => items.filter((it) => it.isdeleted !== 1 && it.isdeleted !== true),
    [items]
  );

  // Per-group stats from ACTIVE items only (what the ticker actually shows).
  const stats = useMemo(() => {
    const map = {};
    for (const it of liveItems) {
      if (it.isactive !== 1 && it.isactive !== true) continue;
      const id = String(it.running_bar_id);
      map[id] = map[id] || { count: 0, seconds: 0 };
      map[id].count += 1;
      map[id].seconds += Number(it.duration_seconds) || 0;
    }
    return map;
  }, [liveItems]);

  const openBar = liveBars.find((b) => String(b.running_bar_id) === String(openBarId)) || null;
  const openItems = useMemo(() => {
    if (!openBar) return [];
    return liveItems
      .filter((it) => String(it.running_bar_id) === String(openBar.running_bar_id))
      .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
  }, [liveItems, openBar]);

  const fail = (err, fallback) => {
    const m = friendlyError(err, fallback);
    setMsg(m);
    toast?.error(m);
  };

  // ---- groups ----
  const createBar = async (e) => {
    e?.preventDefault();
    const name = (barModal?.name || "").trim();
    if (!name) {
      setMsg("Please enter a group name.");
      return;
    }
    setBusy(true);
    try {
      // NOTE: POST only accepts name+rcu (always created active) — a
      // switched-off create is followed by a PUT toggle.
      const res = await apiFetch("/Running-Bar", {
        method: "POST",
        body: { running_bar_name: name, rcu: "ADMIN_PORTAL" },
      });
      const created = unwrap(res);
      const row = Array.isArray(created) ? created[0] : created;
      const id = row?.running_bar_id;
      if (id && barModal?.isactive === false) {
        await apiFetch("/Running-Bar", {
          method: "PUT",
          body: { running_bar_id: id, isactive: 0, luu: "ADMIN_PORTAL" },
        });
      }
      setBarModal(null);
      setMsg("Group created.");
      toast?.success("Running bar group created.");
      reload();
    } catch (err) {
      fail(err, "Could not create group.");
    } finally {
      setBusy(false);
    }
  };

  const toggleBar = async (bar, next) => {
    await apiFetch("/Running-Bar", {
      method: "PUT",
      body: { running_bar_id: bar.running_bar_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success(next ? "Group activated." : "Group deactivated.");
    reload();
  };

  const deleteBar = async (bar) => {
    const ok = await confirm({
      title: "Delete this group?",
      message: `"${bar.running_bar_name}" and its ${stats[String(bar.running_bar_id)]?.count || 0} item(s) will stay in the database but hidden (soft delete).`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Running-Bar", {
      method: "DELETE",
      body: { running_bar_id: bar.running_bar_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success("Group deleted.");
    reload();
  };

  // ---- items ----
  const createItem = async (e) => {
    e?.preventDefault();
    const text = (itemModal?.itemsdata || "").trim();
    const secs = Number(itemModal?.duration_seconds);
    if (!text) {
      setMsg("Please enter the item text or HTML.");
      return;
    }
    if (!Number.isFinite(secs) || secs <= 0) {
      setMsg("Please enter duration in seconds (greater than 0).");
      return;
    }
    setBusy(true);
    try {
      const maxOrder = openItems.reduce((m, it) => Math.max(m, Number(it.display_order) || 0), 0);
      const res = await apiFetch("/Running-Bar-Items", {
        method: "POST",
        body: {
          running_bar_id: openBar.running_bar_id,
          itemsdata: text,
          duration_seconds: Math.round(secs),
          display_order: maxOrder + 1,
          rcu: "ADMIN_PORTAL",
        },
      });
      const created = unwrap(res);
      const row = Array.isArray(created) ? created[0] : created;
      if (row?.running_bar_item_id && itemModal?.isactive === false) {
        await apiFetch("/Running-Bar-Items", {
          method: "PUT",
          body: { running_bar_item_id: row.running_bar_item_id, isactive: 0, luu: "ADMIN_PORTAL" },
        });
      }
      setItemModal(null);
      setMsg("Item created.");
      toast?.success("Running bar item created.");
      reload();
    } catch (err) {
      fail(err, "Could not create item.");
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = async (it, next) => {
    await apiFetch("/Running-Bar-Items", {
      method: "PUT",
      body: { running_bar_item_id: it.running_bar_item_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
  };

  const deleteItem = async (it) => {
    const ok = await confirm({
      title: "Delete this item?",
      message: "The item will be hidden (soft delete). Order of the rest stays.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Running-Bar-Items", {
      method: "DELETE",
      body: { running_bar_item_id: it.running_bar_item_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success("Item deleted.");
    reload();
  };

  // ---- drag-and-drop order ----
  const startOrder = () => {
    setOrderIds(openItems.map((it) => it.running_bar_item_id));
    setOrderMode(true);
  };

  const dropOn = (e, targetId) => {
    e.preventDefault();
    const from = dragId.current;
    if (!from || from === targetId) return;
    setOrderIds((ids) => {
      const next = ids.filter((id) => String(id) !== String(from));
      const at = next.findIndex((id) => String(id) === String(targetId));
      next.splice(at < 0 ? next.length : at, 0, from);
      return next;
    });
  };

  const saveOrder = async () => {
    const byId = Object.fromEntries(openItems.map((it) => [String(it.running_bar_item_id), it]));
    const changed = orderIds
      .map((id, i) => ({ id, order: i + 1, prev: Number(byId[String(id)]?.display_order) || 0 }))
      .filter((r) => r.order !== r.prev);
    if (changed.length === 0) {
      setOrderMode(false);
      setMsg("Order already up to date.");
      return;
    }
    setBusy(true);
    try {
      // One batch: every touched row gets its new display_order.
      await Promise.all(
        changed.map((r) =>
          apiFetch("/Running-Bar-Items", {
            method: "PUT",
            body: { running_bar_item_id: r.id, display_order: r.order, luu: "ADMIN_PORTAL" },
          })
        )
      );
      setOrderMode(false);
      setMsg(`Order saved (${changed.length} item(s) updated).`);
      toast?.success("Item order saved.");
      reload();
    } catch (err) {
      fail(err, "Could not save order.");
    } finally {
      setBusy(false);
    }
  };

  const orderedItems = orderMode
    ? orderIds.map((id) => openItems.find((it) => String(it.running_bar_item_id) === String(id))).filter(Boolean)
    : openItems;

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">
        Running Bar &amp; Items
      </h1>
      <p className="mt-1 text-xs text-neutral-500">
        {liveBars.length} group(s) • /Running-Bar + /Running-Bar-Items
      </p>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      {!openBar ? (
        <>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setBarModal({ name: "", isactive: true })} className={btnPrimary}>
              <i className="bi bi-plus-lg" /> New group
            </button>
          </div>
          <div className={`mt-3 ${tableWrapCls}`}>
            <table className="w-full bg-white text-left text-sm">
              <thead>
                <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
                  <th className={thCls}>Group</th>
                  <th className={thCls}>Items</th>
                  <th className={thCls}>Total duration</th>
                  <th className="w-[110px] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {liveBars.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-5 text-center text-neutral-500">
                      No groups yet — create the first one.
                    </td>
                  </tr>
                ) : (
                  liveBars.map((b) => {
                    const st = stats[String(b.running_bar_id)] || { count: 0, seconds: 0 };
                    const on = b.isactive === 1 || b.isactive === true;
                    return (
                      <tr
                        key={b.running_bar_id}
                        onClick={() => setOpenBarId(b.running_bar_id)}
                        className="cursor-pointer border-b transition-colors last:border-0 hover:bg-[#faf8f4]"
                      >
                        <td className={`${tdCls} font-semibold text-neutral-900`}>
                          {b.running_bar_name}
                          {!on && (
                            <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                              Off
                            </span>
                          )}
                        </td>
                        <td className={tdCls}>{st.count} item(s)</td>
                        <td className={tdCls}>{st.seconds}s total</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <span className="mr-2 inline-block align-middle">
                            <ActiveToggle active={b.isactive} onToggle={(next) => toggleBar(b, next)} />
                          </span>
                          <button type="button" onClick={() => deleteBar(b)} title="Delete group" className={iconBtn}>
                            <i className="bi bi-trash3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Click a group to manage its items.</p>
        </>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setOpenBarId(null); setOrderMode(false); reload(); }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 transition-colors hover:text-gold-deep"
            >
              <i className="bi bi-arrow-left" /> Back to groups
            </button>
            <div className="flex gap-2">
              {!orderMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setItemModal({ itemsdata: "", duration_seconds: 5, isactive: true })}
                    className={btnPrimary}
                  >
                    <i className="bi bi-plus-lg" /> New item
                  </button>
                  {openItems.length > 1 && (
                    <button type="button" onClick={startOrder} className={btnOutline}>
                      <i className="bi bi-grip-vertical" /> Edit order
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button type="button" onClick={saveOrder} disabled={busy} className={btnPrimary}>
                    <i className="bi bi-check-lg" /> {busy ? "Saving..." : "Save order"}
                  </button>
                  <button type="button" onClick={() => setOrderMode(false)} className={btnOutline}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <h2 className="mt-2 font-display text-xl font-bold text-neutral-900">{openBar.running_bar_name}</h2>
          <p className="mt-1 text-xs text-neutral-500">
            {openItems.length} item(s) • {openItems.reduce((s, it) => s + (Number(it.duration_seconds) || 0), 0)}s total
            {orderMode ? " • drag rows by the grip to reorder, then Save order" : ""}
          </p>

          <div className={`mt-3 ${tableWrapCls}`}>
            <table className="w-full bg-white text-left text-sm">
              <thead>
                <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
                  {orderMode && <th className="w-[44px] px-4 py-3" />}
                  <th className={thCls}>#</th>
                  <th className={thCls}>Text</th>
                  <th className={thCls}>Secs</th>
                  <th className="w-[110px] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedItems.length === 0 ? (
                  <tr>
                    <td colSpan={orderMode ? 5 : 4} className="p-5 text-center text-neutral-500">
                      No items yet — add the first one.
                    </td>
                  </tr>
                ) : (
                  orderedItems.map((it, i) => {
                    const preview = stripTags(it.itemsdata);
                    return (
                      <tr
                        key={it.running_bar_item_id}
                        draggable={orderMode}
                        onDragStart={orderMode ? (e) => { dragId.current = it.running_bar_item_id; e.dataTransfer.effectAllowed = "move"; } : undefined}
                        onDragOver={orderMode ? (e) => e.preventDefault() : undefined}
                        onDrop={orderMode ? (e) => dropOn(e, it.running_bar_item_id) : undefined}
                        className={`border-b last:border-0 ${orderMode ? "cursor-grab active:cursor-grabbing hover:bg-[#faf8f4]" : ""}`}
                      >
                        {orderMode && (
                          <td className="px-4 py-3 text-neutral-400">
                            <i className="bi bi-grip-vertical" />
                          </td>
                        )}
                        <td className={`${tdCls} font-bold text-neutral-500`}>{i + 1}</td>
                        <td className={`${tdCls} max-w-md`}>
                          <span className="block truncate">{preview.slice(0, 90)}</span>
                          {isHtml(it.itemsdata) && (
                            <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-deep">
                              HTML
                            </span>
                          )}
                        </td>
                        <td className={tdCls}>{Number(it.duration_seconds) || 0}s</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {orderMode ? (
                            <span className="text-xs text-neutral-400">drag me</span>
                          ) : (
                            <>
                              <span className="mr-2 inline-block align-middle">
                                <ActiveToggle active={it.isactive} onToggle={(next) => toggleItem(it, next)} />
                              </span>
                              <button type="button" onClick={() => deleteItem(it)} title="Delete item" className={iconBtn}>
                                <i className="bi bi-trash3" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---- create-group popup ---- */}
      {barModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setBarModal(null)}
        >
          <form
            onSubmit={createBar}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md ${panelCls}`}
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">New running bar group</h3>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Group name
              <input
                autoFocus
                value={barModal.name}
                onChange={(e) => setBarModal({ ...barModal, name: e.target.value })}
                placeholder="e.g. Homepage announcements"
                className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
              />
            </label>
            <label className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active
              <ActiveToggle
                active={barModal.isactive}
                onToggle={async (next) => setBarModal({ ...barModal, isactive: next })}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setBarModal(null)} className={btnOutline}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---- create-item popup ---- */}
      {itemModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setItemModal(null)}
        >
          <form
            onSubmit={createItem}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md ${panelCls}`}
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">New item</h3>
            <p className="mt-1 text-xs text-neutral-500">
              In: {openBar?.running_bar_name} — order auto-attached at the end, reorder via Edit order.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Text / HTML
              <textarea
                autoFocus
                value={itemModal.itemsdata}
                onChange={(e) => setItemModal({ ...itemModal, itemsdata: e.target.value })}
                rows={4}
                placeholder="e.g. Festive edit is live — or <strong>HTML</strong>"
                className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Duration (seconds)
              <input
                type="number"
                min={1}
                value={itemModal.duration_seconds}
                onChange={(e) => setItemModal({ ...itemModal, duration_seconds: e.target.value })}
                className={`${inputCls} mt-1 font-normal`}
              />
            </label>
            <label className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active
              <ActiveToggle
                active={itemModal.isactive}
                onToggle={async (next) => setItemModal({ ...itemModal, isactive: next })}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setItemModal(null)} className={btnOutline}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
