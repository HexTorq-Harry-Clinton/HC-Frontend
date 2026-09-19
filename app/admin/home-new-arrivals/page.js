"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";
import useHomeSettings from "../useHomeSettings";
import { useToast } from "../ToastProvider";

const panelCls = "rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm";
const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50";

// Home Screen Content → New Arrivals: eyebrow + title + subtitle, how many
// products to show, grid columns — with a LIVE preview on real products.
// Stored on tbl_settings (home_new_arrivals_*).
export default function AdminHomeNewArrivalsPage() {
  const toast = useToast();
  const { settings, loading, saving, msg, setMsg, patch, save } = useHomeSettings();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let live = true;
    Promise.all([apiFetch("/Products").then(unwrap).catch(() => []), apiFetch("/Products-Media").then(unwrap).catch(() => [])])
      .then(([prods, media]) => {
        if (!live) return;
        const list = (Array.isArray(prods) ? prods : [])
          .filter((p) => p.isactive !== false && p.isdeleted !== true)
          .slice(0, 24)
          .map((p) => {
            const pid = p.product_id || p.id;
            const m = (Array.isArray(media) ? media : []).find(
              (x) => String(x.product_id) === String(pid) && x.media_url && !String(x.media_url).includes("example.com")
            );
            return {
              name: p.product_name || p.name || "Untitled",
              price: p.base_price ?? p.price ?? "",
              image: resolveUploadUrl(m?.media_url) || "/brand/logo-black.png",
            };
          });
        setProducts(list);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const count = Math.min(24, Math.max(1, Number(settings.home_new_arrivals_count) || 8));
  const cols = [2, 3, 4, 5].includes(Number(settings.home_new_arrivals_cols))
    ? Number(settings.home_new_arrivals_cols)
    : 4;
  const rows = Math.ceil(count / cols);
  const shown = products.slice(0, count);

  const saveAll = async () => {
    const ok = await save(
      {
        home_new_arrivals_eyebrow: settings.home_new_arrivals_eyebrow || "",
        home_new_arrivals_title: settings.home_new_arrivals_title || "",
        home_new_arrivals_subtitle: settings.home_new_arrivals_subtitle || "",
        home_new_arrivals_count: count,
        home_new_arrivals_cols: cols,
      },
      "New Arrivals saved — homepage updated."
    );
    if (ok) toast?.success("New Arrivals saved.");
    else setMsg("Could not save.");
  };

  if (loading) return <p className="p-10 text-sm text-neutral-500">Loading…</p>;

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">New Arrivals</h1>
      <p className="mt-1 text-xs text-neutral-500">
        CURATED FOR YOU block • count + columns + rows • stored on tbl_settings
      </p>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      <div className={`mt-4 ${panelCls}`}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Eyebrow
            <input
              value={settings.home_new_arrivals_eyebrow || ""}
              onChange={(e) => patch({ home_new_arrivals_eyebrow: e.target.value })}
              placeholder="CURATED FOR YOU"
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Title
            <input
              value={settings.home_new_arrivals_title || ""}
              onChange={(e) => patch({ home_new_arrivals_title: e.target.value })}
              placeholder="New Arrivals"
              className={`${inputCls} mt-1`}
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Subtitle
          <input
            value={settings.home_new_arrivals_subtitle || ""}
            onChange={(e) => patch({ home_new_arrivals_subtitle: e.target.value })}
            placeholder="The latest additions to our bespoke collection."
            className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
          />
        </label>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Products to show (1–24)
            <input
              type="number"
              min={1}
              max={24}
              value={count}
              onChange={(e) => patch({ home_new_arrivals_count: e.target.value })}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Columns
            <select
              value={cols}
              onChange={(e) => patch({ home_new_arrivals_cols: Number(e.target.value) })}
              className={`${inputCls} mt-1`}
            >
              {[2, 3, 4, 5].map((c) => (
                <option key={c} value={c}>
                  {c} columns
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end pb-2 text-xs text-neutral-500">
            = {rows} row(s) × {cols} col(s) → {count} product(s)
          </div>
        </div>
        <div className="mt-4">
          <button type="button" onClick={saveAll} disabled={saving} className={btnPrimary}>
            {saving ? "Saving..." : "Save New Arrivals"}
          </button>
        </div>
      </div>

      {/* ---- live preview on real products ---- */}
      <div className={`mt-6 ${panelCls}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Homepage preview — {count} product(s), {cols} col(s), {rows} row(s)
        </p>
        <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-gold-deep">
          {settings.home_new_arrivals_eyebrow || "CURATED FOR YOU"}
        </p>
        <p className="mt-1 text-center font-display text-2xl font-bold text-neutral-900">
          {settings.home_new_arrivals_title || "New Arrivals"}
        </p>
        <p className="mt-1 text-center text-xs text-neutral-500">
          {settings.home_new_arrivals_subtitle || "The latest additions to our bespoke collection."}
        </p>
        <div
          className="mt-4 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {shown.length === 0 ? (
            <p className="col-span-full py-6 text-center text-xs text-neutral-500">No live products to preview.</p>
          ) : (
            shown.map((p, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="aspect-[4/5] w-full object-cover" loading="lazy" />
                <div className="p-2">
                  <p className="truncate text-xs font-semibold text-neutral-900">{p.name}</p>
                  <p className="text-[11px] text-neutral-500">{p.price !== "" ? `₹${p.price}` : ""}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
