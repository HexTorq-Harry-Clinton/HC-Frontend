"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, inr } from "@/lib/api";
import AdminModulePage from "../AdminModule";

const empty = { product_name: "", product_slug: "", short_description: "", description: "", base_price: "", currency_code: "INR", isactive: true };

// Admin product manager: live CRUD on /Products (the start of the
// admin-adds-product → client-sees-it flow).
export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState("product-variants");

  const WORKSPACE_TABS = [
    ["product-variants", "Variants"],
    ["product-media", "Media"],
    ["attribute-values", "Attributes"],
    ["product-seo", "SEO"],
  ];

  // Mount + refresh fetch: state updates happen only in the async continuation.
  useEffect(() => {
    let live = true;
    apiFetch("/Products", { params: { includeInactive: 1 } })
      .then(unwrap)
      .then((list) => {
        if (live) setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (live) setProducts([]);
      });
    return () => {
      live = false;
    };
  }, [refresh]);

  const reload = () => setRefresh((n) => n + 1);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      if (editing) {
        await apiFetch("/Products", {
          method: "PUT",
          body: { product_id: editing, ...form, base_price: Number(form.base_price) || 0, luu: "ADMIN_PORTAL" },
        });
        setMsg("Product updated.");
      } else {
        await apiFetch("/Products", {
          method: "POST",
          body: { ...form, base_price: Number(form.base_price) || 0, rcu: "ADMIN_PORTAL" },
        });
        setMsg("Product added — it is now live on the storefront.");
      }
      setForm(empty);
      setEditing(null);
      reload();
    } catch (err) {
      setMsg(err.message || "Save failed");
    }
  };

  const edit = (p) => {
    setEditing(p.product_id);
    setForm({
      product_name: p.product_name || "", product_slug: p.product_slug || "",
      short_description: p.short_description || "", description: p.description || "",
      base_price: p.base_price || "", currency_code: p.currency_code || "INR",
      isactive: p.isactive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (p) => {
    if (!confirm(`Delete ${p.product_name}?`)) return;
    await apiFetch("/Products", { method: "DELETE", body: { product_id: p.product_id, luu: "ADMIN_PORTAL" } }).catch(() => null);
    reload();
  };

  const input = "w-full border border-neutral-300 bg-white px-3 py-2 text-sm";

  if (workspace) {
    const lock = {
      field: "product_id",
      value: workspace.product_id,
      label: `${workspace.product_name} (${workspace.product_slug || workspace.product_id})`,
    };
    return (
      <div>
        <button onClick={() => setWorkspace(null)} className="text-sm underline">
          ← Back to Products
        </button>
        <h1 className="mt-2 text-2xl font-bold">{workspace.product_name}</h1>
        <p className="mt-1 text-xs text-neutral-500">
          Variants, media, attributes and SEO created here automatically belong to this product — no need to pick it again.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {WORKSPACE_TABS.map(([slug, label]) => (
            <button
              key={slug}
              onClick={() => setWorkspaceTab(slug)}
              className={`border px-4 py-2 text-sm font-semibold ${
                workspaceTab === slug ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4" key={workspaceTab}>
          <AdminModulePage module={workspaceTab} lock={lock} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Products</h1>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {[
          ["/admin/product-variants", "Variants"],
          ["/admin/product-media", "Media"],
          ["/admin/product-seo", "SEO"],
          ["/admin/sizes", "Sizes"],
          ["/admin/cloth-types", "Cloth Types"],
          ["/admin/care", "Care"],
          ["/admin/attributes", "Attributes"],
          ["/admin/attribute-values", "Attr Values"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="border border-neutral-300 bg-white px-3 py-1 font-semibold hover:border-neutral-950">
            {label}
          </a>
        ))}
      </div>
      {msg && <p className="mt-3 bg-white p-3 text-sm shadow-sm">{msg}</p>}

      <form onSubmit={submit} className="mt-4 grid gap-3 bg-white p-5 shadow-sm md:grid-cols-2">
        <input value={form.product_name} onChange={set("product_name")} required placeholder="Product name" className={input} />
        <input value={form.product_slug} onChange={set("product_slug")} required placeholder="slug-like-this" className={input} />
        <input value={form.short_description} onChange={set("short_description")} placeholder="Short description" className={input} />
        <input value={form.base_price} onChange={set("base_price")} inputMode="decimal" required placeholder="Price (INR)" className={input} />
        <textarea value={form.description} onChange={set("description")} placeholder="Full description" rows={2} className={`${input} md:col-span-2`} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isactive} onChange={set("isactive")} /> Active
        </label>
        <div className="flex gap-2">
          <button className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white">
            {editing ? "Update Product" : "Add Product"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="border px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-neutral-500">
              <th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Price</th><th className="p-3">Active</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_id} className="border-b last:border-0">
                <td className="p-3 font-medium">{p.product_name}</td>
                <td className="p-3 text-neutral-500">{p.product_slug}</td>
                <td className="p-3">{inr(p.base_price)}</td>
                <td className="p-3">{p.isactive === false ? "No" : "Yes"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setWorkspace(p); setWorkspaceTab("product-variants"); }} className="mr-3 font-semibold underline">
                    Open
                  </button>
                  <button onClick={() => edit(p)} className="mr-3 underline">Edit</button>
                  <button onClick={() => remove(p)} className="text-red-600 underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
