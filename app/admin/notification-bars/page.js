"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, unwrap, revalidateSite, friendlyError } from "@/lib/api";
import ActiveToggle from "@/components/ActiveToggle";
import useLockBody from "../useLockBody";
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

// Notification Bar (top black strip): single table, no parent.
// Same UX as Running Bars — popup create, toggle + delete icons,
// drag-and-drop orderpriority with batch save.
export default function AdminNotificationBarsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // null | { notification_text, duration_seconds, orderpriority, isactive }.
  const [modal, setModal] = useState(null);
  // Open popup owns the scroll — page behind is frozen.
  useLockBody(!!modal);
  // false | array of ids in manual order — reorder mode.
  const [orderMode, setOrderMode] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  const dragId = useRef(null);

  useEffect(() => {
    let live = true;
    apiFetch("/Notification-Bar", { params: { includeInactive: 1 } })
      .then(unwrap)
      .then((list) => {
        if (live) setRows(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (live) setRows([]);
      });
    return () => {
      live = false;
    };
  }, [refresh]);

  const reload = () => {
    setRefresh((n) => n + 1);
    revalidateSite();
  };

  const live = useMemo(
    () =>
      rows
        .filter((r) => r.isdeleted !== 1 && r.isdeleted !== true)
        .sort((a, b) => (Number(a.orderpriority) || 0) - (Number(b.orderpriority) || 0)),
    [rows]
  );

  const fail = (err, fallback) => {
    const m = friendlyError(err, fallback);
    setMsg(m);
    toast?.error(m);
  };

  const create = async (e) => {
    e?.preventDefault();
    const text = (modal?.notification_text || "").trim();
    const secs = Number(modal?.duration_seconds);
    if (!text) {
      setMsg("Please enter the notification text or HTML.");
      return;
    }
    if (!Number.isFinite(secs) || secs <= 0) {
      setMsg("Please enter hold seconds (greater than 0).");
      return;
    }
    setBusy(true);
    try {
      if (modal?.id) {
        // Edit existing row.
        const body = {
          notification_bar_id: modal.id,
          notification_text: text,
          duration_seconds: Math.round(secs),
          isactive: modal.isactive ? 1 : 0,
          luu: "ADMIN_PORTAL",
        };
        const n = Number(modal?.orderpriority);
        if (Number.isFinite(n) && n > 0) body.orderpriority = Math.round(n);
        await apiFetch("/Notification-Bar", { method: "PUT", body });
        setModal(null);
        setMsg("Notification updated.");
        toast?.success("Notification updated.");
        reload();
        return;
      }
      const body = {
        notification_text: text,
        duration_seconds: Math.round(secs),
        rcu: "ADMIN_PORTAL",
      };
      const n = Number(modal?.orderpriority);
      if (Number.isFinite(n) && n > 0) body.orderpriority = Math.round(n);
      const res = await apiFetch("/Notification-Bar", { method: "POST", body });
      const created = unwrap(res);
      const row = Array.isArray(created) ? created[0] : created;
      if (row?.notification_bar_id && modal?.isactive === false) {
        await apiFetch("/Notification-Bar", {
          method: "PUT",
          body: { notification_bar_id: row.notification_bar_id, isactive: 0, luu: "ADMIN_PORTAL" },
        });
      }
      setModal(null);
      setMsg("Notification created.");
      toast?.success("Notification created.");
      reload();
    } catch (err) {
      fail(err, modal?.id ? "Could not update notification." : "Could not create notification.");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (r) => {
    setModal({
      id: r.notification_bar_id,
      notification_text: r.notification_text || "",
      duration_seconds: Number(r.duration_seconds) || 4,
      orderpriority: Number(r.orderpriority) || "",
      isactive: r.isactive === 1 || r.isactive === true,
    });
  };

  const toggle = async (r, next) => {
    await apiFetch("/Notification-Bar", {
      method: "PUT",
      body: { notification_bar_id: r.notification_bar_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success(next ? "Notification activated." : "Notification deactivated.");
    reload();
  };

  const remove = async (r) => {
    const ok = await confirm({
      title: "Delete this notification?",
      message: "It will be hidden (soft delete). Order of the rest stays.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Notification-Bar", {
      method: "DELETE",
      body: { notification_bar_id: r.notification_bar_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success("Notification deleted.");
    reload();
  };

  // ---- drag-and-drop order (orderpriority) ----
  const startOrder = () => {
    setOrderIds(live.map((r) => r.notification_bar_id));
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
    const byId = Object.fromEntries(live.map((r) => [String(r.notification_bar_id), r]));
    const changed = orderIds
      .map((id, i) => ({ id, order: i + 1, prev: Number(byId[String(id)]?.orderpriority) || 0 }))
      .filter((r) => r.order !== r.prev);
    if (changed.length === 0) {
      setOrderMode(false);
      setMsg("Order already up to date.");
      return;
    }
    setBusy(true);
    try {
      // One batch: every touched row gets its new orderpriority.
      await Promise.all(
        changed.map((r) =>
          apiFetch("/Notification-Bar", {
            method: "PUT",
            body: { notification_bar_id: r.id, orderpriority: r.order, luu: "ADMIN_PORTAL" },
          })
        )
      );
      setOrderMode(false);
      setMsg(`Order saved (${changed.length} item(s) updated).`);
      toast?.success("Notification order saved.");
      reload();
    } catch (err) {
      fail(err, "Could not save order.");
    } finally {
      setBusy(false);
    }
  };

  const ordered = orderMode
    ? orderIds.map((id) => live.find((r) => String(r.notification_bar_id) === String(id))).filter(Boolean)
    : live;

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">
        Notification Bar
      </h1>
      <p className="mt-1 text-xs text-neutral-500">
        Top black strip • {live.length} item(s) • /Notification-Bar
      </p>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {!orderMode ? (
          <>
            <button
              type="button"
              onClick={() => setModal({ notification_text: "", duration_seconds: 4, orderpriority: "", isactive: true })}
              className={btnPrimary}
            >
              <i className="bi bi-plus-lg" /> New notification
            </button>
            {live.length > 1 && (
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
      {orderMode && (
        <p className="mt-2 text-xs text-neutral-500">Drag rows by the grip to reorder, then Save order.</p>
      )}

      <div className={`mt-3 ${tableWrapCls}`}>
        <table className="w-full bg-white text-left text-sm">
          <thead>
            <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
              {orderMode && <th className="w-[44px] px-4 py-3" />}
              <th className={thCls}>#</th>
              <th className={thCls}>Text</th>
              <th className="w-[110px] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordered.length === 0 ? (
              <tr>
                <td colSpan={orderMode ? 4 : 3} className="p-5 text-center text-neutral-500">
                  No notifications yet — add the first one.
                </td>
              </tr>
            ) : (
              ordered.map((r, i) => {
                const preview = stripTags(r.notification_text);
                return (
                  <tr
                    key={r.notification_bar_id}
                    draggable={orderMode}
                    onDragStart={orderMode ? (e) => { dragId.current = r.notification_bar_id; e.dataTransfer.effectAllowed = "move"; } : undefined}
                    onDragOver={orderMode ? (e) => e.preventDefault() : undefined}
                    onDrop={orderMode ? (e) => dropOn(e, r.notification_bar_id) : undefined}
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
                      <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                        {Number(r.duration_seconds) || 4}s hold
                      </span>
                      {isHtml(r.notification_text) && (
                        <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-deep">
                          HTML
                        </span>
                      )}
                      {(r.isactive !== 1 && r.isactive !== true) && (
                        <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                          Off
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {orderMode ? (
                        <span className="text-xs text-neutral-400">drag me</span>
                      ) : (
                        <>
                          <button type="button" onClick={() => openEdit(r)} title="Edit notification" className={iconBtn}>
                            <i className="bi bi-pencil" />
                          </button>
                          <span className="mr-2 inline-block align-middle">
                            <ActiveToggle active={r.isactive} onToggle={(next) => toggle(r, next)} />
                          </span>
                          <button type="button" onClick={() => remove(r)} title="Delete notification" className={iconBtn}>
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

      {/* ---- create/edit popup ---- */}
      {modal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setModal(null)}
        >
          <form
            onSubmit={create}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md ${panelCls}`}
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">
              {modal.id ? "Edit notification" : "New notification"}
            </h3>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Text / HTML
              <textarea
                autoFocus
                value={modal.notification_text}
                onChange={(e) => setModal({ ...modal, notification_text: e.target.value })}
                rows={4}
                placeholder="e.g. Festive edit is live — or <strong>HTML</strong>"
                className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Hold seconds (center-screen stay)
              <input
                type="number"
                min={1}
                value={modal.duration_seconds}
                onChange={(e) => setModal({ ...modal, duration_seconds: e.target.value })}
                className={`${inputCls} mt-1 font-normal`}
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Order (blank = append at end)
              <input
                type="number"
                min={1}
                value={modal.orderpriority}
                onChange={(e) => setModal({ ...modal, orderpriority: e.target.value })}
                className={`${inputCls} mt-1 font-normal`}
              />
            </label>
            <label className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active
              <ActiveToggle
                active={modal.isactive}
                onToggle={async (next) => setModal({ ...modal, isactive: next })}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className={btnOutline}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving..." : modal.id ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
