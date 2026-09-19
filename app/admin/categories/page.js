"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, unwrap, revalidateSite } from "@/lib/api";
import AdminModulePage from "../AdminModule";
import ActiveToggle from "@/components/ActiveToggle";
import { useConfirm } from "../ConfirmProvider";

const empty = { menu_subcategory_name: "", menu_subcategory_slug: "", redirect_link: "", display_order: "", isactive: true };
const input =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

// Categories & Subcategories: category tabs on top, subcategories of the
// selected category below — new subs auto-attach to the open category.
export default function AdminCategoriesPage() {
  const confirm = useConfirm();
  const [cats, setCats] = useState([]);
  const [subs, setSubs] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [c, s] = await Promise.all([
        apiFetch("/Menu-Category").then(unwrap),
        apiFetch("/Menu-Sub-Category").then(unwrap),
      ]);
      const catList = Array.isArray(c) ? c : [];
      const subList = Array.isArray(s) ? s : [];
      setCats(catList);
      setSubs(subList);
      if (!activeCat && catList.length > 0) {
        setActiveCat(catList.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0].menu_category_id);
      }
    } catch {
      setCats([]);
      setSubs([]);
    }
  };

  // Mount fetch (also reused after mutations) — intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sortedCats = [...cats].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const current = sortedCats.find((c) => c.menu_category_id === activeCat);
  const visible = subs
    .filter((s) => s.menu_category_id === activeCat)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!activeCat) {
      setMsg("Pick a category tab first.");
      return;
    }
    // Guard: subcategory slugs must be unique within the table — a duplicate
    // would shadow another row in the storefront slug resolver.
    const slugVal = String(form.menu_subcategory_slug || "").trim().toLowerCase();
    if (slugVal) {
      const clash = (subs || []).find(
        (s) =>
          String(s.menu_subcategory_slug || "").trim().toLowerCase() === slugVal &&
          String(s.menu_subcategory_id) !== String(editing) &&
          s.isdeleted !== 1 &&
          s.isdeleted !== true
      );
      if (clash) {
        setMsg(`That slug (“${form.menu_subcategory_slug}”) already exists on “${clash.menu_subcategory_name}” — pick a unique one.`);
        return;
      }
    }
    try {
      if (editing) {
        await apiFetch("/Menu-Sub-Category", {
          method: "PUT",
          body: {
            menu_subcategory_id: editing,
            menu_category_id: activeCat,
            ...form,
            display_order: Number(form.display_order) || 0,
            isactive: form.isactive ? 1 : 0,
            luu: "ADMIN_PORTAL",
          },
        });
        setMsg("Subcategory updated.");
      } else {
        await apiFetch("/Menu-Sub-Category", {
          method: "POST",
          body: {
            menu_category_id: activeCat,
            ...form,
            display_order: Number(form.display_order) || 0,
            isactive: form.isactive ? 1 : 0,
            rcu: "ADMIN_PORTAL",
          },
        });
        setMsg("Subcategory added.");
      }
      setForm(empty);
      setEditing(null);
      load();
      revalidateSite();
    } catch (err) {
      setMsg(err.message || "Save failed");
    }
  };

  const edit = (s) => {
    setEditing(s.menu_subcategory_id);
    setForm({
      menu_subcategory_name: s.menu_subcategory_name || "",
      menu_subcategory_slug: s.menu_subcategory_slug || "",
      redirect_link: s.redirect_link || "",
      display_order: s.display_order || "",
      isactive: s.isactive !== false && s.isactive !== 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (s) => {
    const ok = await confirm({
      title: "Delete this subcategory?",
      message: `${s.menu_subcategory_name} will be removed from ${current?.menu_category_name || "its category"}.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Menu-Sub-Category", {
      method: "DELETE",
      body: { menu_subcategory_id: s.menu_subcategory_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    load();
    revalidateSite();
  };

  const toggle = async (s, next) => {
    await apiFetch("/Menu-Sub-Category", {
      method: "PUT",
      body: { menu_subcategory_id: s.menu_subcategory_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    load();
    revalidateSite();
  };

  return (
    <div>
      <div>
        <p className="eyebrow text-gold-deep">Harry Clinton</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900">Categories & Subcategories</h1>
      </div>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm text-neutral-700">
          {msg}
        </p>
      )}

      <details className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-semibold text-neutral-800 transition-colors hover:bg-[#faf8f4]">
          <i className="bi bi-gear-wide-connected text-gold-deep" />
          Manage categories (add / rename / reorder)
        </summary>
        <div className="border-t border-neutral-200 p-4">
          <AdminModulePage module="categories" />
        </div>
      </details>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {sortedCats.map((c) => (
            <button
              type="button"
              key={c.menu_category_id}
              onClick={() => { setActiveCat(c.menu_category_id); setEditing(null); setForm(empty); }}
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                activeCat === c.menu_category_id
                  ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                  : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
              }`}
            >
              {c.menu_category_name}
            </button>
          ))}
      </div>
      {current && (
        <p className="mt-2 text-xs text-neutral-500">
          Adding to: {current.menu_category_name} ({current.menu_category_slug}) — new subcategories attach here automatically.
        </p>
      )}

      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <input value={form.menu_subcategory_name} onChange={set("menu_subcategory_name")} required placeholder="Subcategory name" className={input} />
        <input value={form.menu_subcategory_slug} onChange={set("menu_subcategory_slug")} placeholder="slug-like-this" className={input} />
        <input value={form.redirect_link} onChange={set("redirect_link")} placeholder="Redirect link (e.g. /wedding)" className={input} />
        <input value={form.display_order} onChange={set("display_order")} inputMode="numeric" placeholder="Order" className={input} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isactive} onChange={set("isactive")} className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-gold/40" /> Active
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-neutral-950 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            {editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setForm(empty); }}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="mt-6 font-semibold text-neutral-900">
        Subcategories {current ? `of ${current.menu_category_name}` : ""} ({visible.length})
      </h2>
      <p className="mb-2 mt-1 text-xs text-neutral-500">
        {visible.length} record{visible.length === 1 ? "" : "s"}
      </p>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Active</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-5 text-center text-sm text-neutral-500">No records found.</td>
              </tr>
            ) : (
              visible.map((s) => (
                <tr key={s.menu_subcategory_id} className="border-b transition-colors last:border-0 hover:bg-[#faf8f4]">
                  <td className="px-4 py-3 font-medium">{s.menu_subcategory_name}</td>
                  <td className="px-4 py-3 text-neutral-500">{s.menu_subcategory_slug}</td>
                  <td className="px-4 py-3">{s.display_order}</td>
                  <td className="px-4 py-3">
                    <ActiveToggle active={s.isactive} onToggle={(next) => toggle(s, next)} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button type="button" onClick={() => edit(s)} className="mr-3 text-neutral-700 underline underline-offset-2 transition-colors hover:text-gold-deep">Edit</button>
                    <button type="button" onClick={() => remove(s)} className="text-red-600 underline underline-offset-2 transition-colors hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Flat list across all categories: <Link href="/admin/sub-categories" className="font-medium text-gold-deep underline underline-offset-2 transition-colors hover:text-neutral-950">Sub-Categories</Link>
      </p>
    </div>
  );
}
