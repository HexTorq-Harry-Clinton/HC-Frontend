"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, unwrap, revalidateSite, friendlyError } from "@/lib/api";
import ActiveToggle from "@/components/ActiveToggle";
import HtmlEditor from "../HtmlEditor";
import Pagination, { paginate } from "../Pagination";
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

// FAQs: popup create/edit (question + rich answer + order + active),
// toggle + delete icons, drag-and-drop order with batch save.
export default function AdminFaqsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  // null | { id?, question, answer, display_order, isactive }.
  const [modal, setModal] = useState(null);
  // Open popup owns the scroll — page behind is frozen.
  useLockBody(!!modal);
  // false | array of ids in manual order — reorder mode.
  const [orderMode, setOrderMode] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  const dragId = useRef(null);

  useEffect(() => {
    let live = true;
    apiFetch("/FAQs", { params: { includeInactive: 1 } })
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

  const live = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => r.isdeleted !== 1 && r.isdeleted !== true)
      .filter((r) => !q || `${r.question || ""} ${stripTags(r.answer)}`.toLowerCase().includes(q))
      .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
  }, [rows, search]);

  const fail = (err, fallback) => {
    const m = friendlyError(err, fallback);
    setMsg(m);
    toast?.error(m);
  };

  const openCreate = () => {
    setModal({ id: null, question: "", answer: "", display_order: "", isactive: true });
  };

  const openEdit = (r) => {
    setModal({
      id: r.faq_id,
      question: r.question || "",
      answer: r.answer || "",
      display_order: Number(r.display_order) || "",
      isactive: r.isactive === 1 || r.isactive === true,
    });
  };

  const save = async (e) => {
    e?.preventDefault();
    const question = (modal?.question || "").trim();
    if (!question) {
      setMsg("Please enter the question.");
      return;
    }
    if (!stripTags(modal?.answer)) {
      setMsg("Please enter the answer.");
      return;
    }
    setBusy(true);
    try {
      if (modal?.id) {
        const body = {
          faq_id: modal.id,
          question,
          answer: (modal.answer || "").trim(),
          isactive: modal.isactive ? 1 : 0,
          luu: "ADMIN_PORTAL",
        };
        const n = Number(modal?.display_order);
        if (Number.isFinite(n) && n > 0) body.display_order = Math.round(n);
        await apiFetch("/FAQs", { method: "PUT", body });
        setModal(null);
        setMsg("FAQ updated.");
        toast?.success("FAQ updated.");
      } else {
        const maxOrder = live.reduce((m, r) => Math.max(m, Number(r.display_order) || 0), 0);
        const n = Number(modal?.display_order);
        await apiFetch("/FAQs", {
          method: "POST",
          body: {
            question,
            answer: (modal.answer || "").trim(),
            display_order: Number.isFinite(n) && n > 0 ? Math.round(n) : maxOrder + 1,
            isactive: modal.isactive ? 1 : 0,
            rcu: "ADMIN_PORTAL",
          },
        });
        setModal(null);
        setMsg("FAQ created.");
        toast?.success("FAQ created.");
      }
      reload();
    } catch (err) {
      fail(err, modal?.id ? "Could not update FAQ." : "Could not create FAQ.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (r, next) => {
    await apiFetch("/FAQs", {
      method: "PUT",
      body: { faq_id: r.faq_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success(next ? "FAQ activated." : "FAQ deactivated.");
    reload();
  };

  const remove = async (r) => {
    const ok = await confirm({
      title: "Delete this FAQ?",
      message: `"${(r.question || "Untitled").slice(0, 60)}" will be hidden (soft delete).`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/FAQs", {
      method: "DELETE",
      body: { faq_id: r.faq_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success("FAQ deleted.");
    reload();
  };

  // ---- drag-and-drop order (display_order) ----
  const startOrder = () => {
    setOrderIds(live.map((r) => r.faq_id));
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
    const byId = Object.fromEntries(live.map((r) => [String(r.faq_id), r]));
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
      await Promise.all(
        changed.map((r) =>
          apiFetch("/FAQs", {
            method: "PUT",
            body: { faq_id: r.id, display_order: r.order, luu: "ADMIN_PORTAL" },
          })
        )
      );
      setOrderMode(false);
      setMsg(`Order saved (${changed.length} FAQ(s) updated).`);
      toast?.success("FAQ order saved.");
      reload();
    } catch (err) {
      fail(err, "Could not save order.");
    } finally {
      setBusy(false);
    }
  };

  const ordered = orderMode
    ? orderIds.map((id) => live.find((r) => String(r.faq_id) === String(id))).filter(Boolean)
    : live;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Pagination (reorder mode shows everything for dragging).
  const shown = orderMode ? ordered : paginate(ordered, page, pageSize);

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">FAQs</h1>
      <p className="mt-1 text-xs text-neutral-500">
        Homepage + FAQs page • {live.length} record(s) • rich answers
      </p>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search FAQs..."
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          style={{ minWidth: 200 }}
        />
        {!orderMode ? (
          <div className="flex gap-2">
            <button type="button" onClick={openCreate} className={btnPrimary}>
              <i className="bi bi-plus-lg" /> New FAQ
            </button>
            {live.length > 1 && (
              <button type="button" onClick={startOrder} className={btnOutline}>
                <i className="bi bi-grip-vertical" /> Edit order
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={saveOrder} disabled={busy} className={btnPrimary}>
              <i className="bi bi-check-lg" /> {busy ? "Saving..." : "Save order"}
            </button>
            <button type="button" onClick={() => setOrderMode(false)} className={btnOutline}>
              Cancel
            </button>
          </div>
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
              <th className={thCls}>Question / Answer</th>
              <th className={thCls}>Order</th>
              <th className="w-[150px] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={orderMode ? 5 : 4} className="p-5 text-center text-neutral-500">
                  No FAQs yet — add the first one.
                </td>
              </tr>
            ) : (
              shown.map((r, i) => (
                <tr
                  key={r.faq_id}
                  draggable={orderMode}
                  onDragStart={orderMode ? (e) => { dragId.current = r.faq_id; e.dataTransfer.effectAllowed = "move"; } : undefined}
                  onDragOver={orderMode ? (e) => e.preventDefault() : undefined}
                  onDrop={orderMode ? (e) => dropOn(e, r.faq_id) : undefined}
                  className={`border-b last:border-0 ${orderMode ? "cursor-grab active:cursor-grabbing hover:bg-[#faf8f4]" : ""}`}
                >
                  {orderMode && (
                    <td className="px-4 py-3 text-neutral-400">
                      <i className="bi bi-grip-vertical" />
                    </td>
                  )}
                  <td className={`${tdCls} font-bold text-neutral-500`}>{i + 1}</td>
                  <td className={`${tdCls} max-w-md`}>
                    <span className="block truncate font-semibold">{r.question || "—"}</span>
                    <span className="block truncate text-xs text-neutral-500">{stripTags(r.answer).slice(0, 90)}</span>
                    {(r.isactive !== 1 && r.isactive !== true) && (
                      <span className="mt-1 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                        Off
                      </span>
                    )}
                  </td>
                  <td className={tdCls}>{Number(r.display_order) || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {orderMode ? (
                      <span className="text-xs text-neutral-400">drag me</span>
                    ) : (
                      <>
                        <button type="button" onClick={() => openEdit(r)} title="Edit FAQ" className={iconBtn}>
                          <i className="bi bi-pencil" />
                        </button>
                        <span className="mr-1 inline-block align-middle">
                          <ActiveToggle active={r.isactive} onToggle={(next) => toggle(r, next)} />
                        </span>
                        <button type="button" onClick={() => remove(r)} title="Delete FAQ" className={iconBtn}>
                          <i className="bi bi-trash3" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!orderMode && (
        <Pagination page={page} setPage={setPage} total={ordered.length} pageSize={pageSize} setPageSize={setPageSize} />
      )}

      {/* ---- create/edit popup ---- */}
      {modal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setModal(null)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">
              {modal.id ? "Edit FAQ" : "New FAQ"}
            </h3>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Question
              <input
                autoFocus
                value={modal.question}
                onChange={(e) => setModal({ ...modal, question: e.target.value })}
                placeholder="e.g. How long does a bespoke suit take?"
                className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
              />
            </label>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Answer — format with the toolbar or flip to HTML source
              </p>
              <div className="mt-1">
                <HtmlEditor
                  value={modal.answer || ""}
                  onChange={(html) => setModal({ ...modal, answer: html })}
                  placeholder="Type the answer…"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Order (blank = append at end)
                <input
                  type="number"
                  min={1}
                  value={modal.display_order}
                  onChange={(e) => setModal({ ...modal, display_order: e.target.value })}
                  className={`${inputCls} mt-1 font-normal`}
                />
              </label>
              <label className="flex items-end justify-between pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Active
                <ActiveToggle
                  active={modal.isactive}
                  onToggle={async (next) => setModal({ ...modal, isactive: next })}
                />
              </label>
            </div>
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
