"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, inr, resolveUploadUrl, API_BASE_URL, revalidateSite } from "@/lib/api";
import AdminModulePage from "../AdminModule";

const empty = { product_name: "", product_slug: "", short_description: "", description: "", base_price: "", currency_code: "INR", isactive: true };
const TABS = ["Products", "Sizes", "Cloth Types", "Care Instructions", "Attributes"];
const TAB_MODULES = {
  Sizes: "sizes",
  "Cloth Types": "cloth-types",
  "Care Instructions": "care",
  Attributes: "attributes",
};

const input = "w-full border border-neutral-300 bg-white px-3 py-2 text-sm";

// Product Management: grouped workspace like before —
// tabs (Products/Sizes/Cloth Types/Care/Attributes) + search,
// product table, and inside each product: variants, media,
// attributes and SEO stacked on one page with product auto-attached.
export default function AdminProductsPage() {
  const [tab, setTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [workspace, setWorkspace] = useState(null);

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

  const reload = () => {
    setRefresh((n) => n + 1);
    revalidateSite();
  };

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
    if (!window.confirm(`Delete ${p.product_name}?`)) return;
    await apiFetch("/Products", { method: "DELETE", body: { product_id: p.product_id, luu: "ADMIN_PORTAL" } }).catch(() => null);
    reload();
  };

  if (workspace) {
    return <ProductWorkspace product={workspace} onBack={() => { setWorkspace(null); reload(); }} />;
  }

  const needle = search.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      !needle ||
      (p.product_name || "").toLowerCase().includes(needle) ||
      (p.product_slug || "").toLowerCase().includes(needle)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Product Management</h1>
      <div className="mt-3 flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border px-4 py-2 text-sm font-semibold ${
              tab === t ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="mt-3 bg-white p-3 text-sm shadow-sm">{msg}</p>}

      {tab !== "Products" ? (
        <div className="mt-4" key={tab}>
          <AdminModulePage module={TAB_MODULES[tab]} />
        </div>
      ) : (
        <>
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

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="mt-4 w-full max-w-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          />

          <div className="mt-4 overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-neutral-500">
                  <th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Price</th><th className="p-3">Active</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.product_id} className="border-b last:border-0">
                    <td className="p-3">
                      <p className="font-medium">{p.product_name}</p>
                      {p.short_description && <p className="text-xs text-neutral-500">{p.short_description}</p>}
                    </td>
                    <td className="p-3 text-neutral-500">{p.product_slug}</td>
                    <td className="p-3">{inr(p.base_price)}</td>
                    <td className="p-3">{p.isactive === false ? "No" : "Yes"}</td>
                    <td className="whitespace-nowrap p-3 text-right">
                      <button onClick={() => setWorkspace(p)} className="mr-3 font-semibold underline">Open</button>
                      <button onClick={() => edit(p)} className="mr-3 underline">Edit</button>
                      <button onClick={() => remove(p)} className="text-red-600 underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// Inside a product: variants, media, attributes and SEO stacked on one
// page — every record auto-attached to this product, no picking needed.
function ProductWorkspace({ product, onBack }) {
  const pid = product.product_id;
  const [variants, setVariants] = useState([]);
  const [media, setMedia] = useState([]);
  const [attrValues, setAttrValues] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [clothTypes, setClothTypes] = useState([]);
  const [seo, setSeo] = useState(null);
  const [seoForm, setSeoForm] = useState({ seo_title: "", seo_description: "", seo_keywords: "", og_image_url: "" });
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [vForm, setVForm] = useState({ sku: "", variant_name: "", size_id: "", cloth_type_id: "", price: "", stock_qty: "" });
  const [vMediaByVariant, setVMediaByVariant] = useState({}); // {variant_id: [media, ...]}
  const [mAlt, setMAlt] = useState("");
  const [mPrimary, setMPrimary] = useState(false);
  const [mPreview, setMPreview] = useState(null); // { url, name, type } for local preview
  const [uploading, setUploading] = useState(false);
  const [vUploadingId, setVUploadingId] = useState(null); // variant_id being uploaded
  const [vPreview, setVPreview] = useState(null);
  const [aAttr, setAAttr] = useState("");
  const [aValue, setAValue] = useState("");

  // Revoke any object URLs we created when leaving the workspace.
  useEffect(() => {
    return () => {
      if (mPreview?.url) URL.revokeObjectURL(mPreview.url);
      if (vPreview?.url) URL.revokeObjectURL(vPreview.url);
    };
  }, [mPreview, vPreview]);

  useEffect(() => {
    let live = true;
    Promise.all([
      apiFetch("/Products-Variants").then(unwrap).catch(() => []),
      apiFetch("/Products-Media").then(unwrap).catch(() => []),
      apiFetch("/Products-Attributes-Values").then(unwrap).catch(() => []),
      apiFetch("/Products-Attributes").then(unwrap).catch(() => []),
      apiFetch("/Products-Sizes").then(unwrap).catch(() => []),
      apiFetch("/Products-Cloth-Types").then(unwrap).catch(() => []),
      apiFetch("/Products-Seo").then(unwrap).catch(() => []),
    ]).then(([v, m, av, a, s, c, seoList]) => {
      if (!live) return;
      const arr = (x) => (Array.isArray(x) ? x : []);
      const variantList = arr(v).filter((x) => x.product_id === pid);
      const allMedia = arr(m).filter((x) => x.product_id === pid);
      setVariants(variantList);
      setMedia(allMedia.filter((x) => !x.product_variant_id));
      setAttrValues(arr(av).filter((x) => x.product_id === pid));
      setAttributes(arr(a));
      setSizes(arr(s));
      setClothTypes(arr(c));
      // Bucket variant-specific media by variant_id.
      const bucketed = {};
      for (const item of allMedia) {
        if (item.product_variant_id) {
          (bucketed[item.product_variant_id] ||= []).push(item);
        }
      }
      setVMediaByVariant(bucketed);
      const mine = arr(seoList).find((x) => x.product_id === pid) || null;
      setSeo(mine);
      if (mine) {
        setSeoForm({
          seo_title: mine.seo_title || "", seo_description: mine.seo_description || "",
          seo_keywords: mine.seo_keywords || "", og_image_url: mine.og_image_url || "",
        });
      }
    }).catch(() => {});
    return () => {
      live = false;
    };
  }, [pid, refresh]);

  const reload = () => setRefresh((n) => n + 1);
  const sizeName = (id) => sizes.find((s) => s.size_id === id)?.size_name || id || "—";
  const clothName = (id) => clothTypes.find((c) => c.cloth_type_id === id)?.cloth_type_name || id || "—";
  const attrName = (id) => attributes.find((a) => a.attribute_id === id)?.attribute_name || id;

  const addVariant = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!vForm.sku) {
      setMsg("SKU is required.");
      return;
    }
    try {
      await apiFetch("/Products-Variants", {
        method: "POST",
        body: {
          product_id: pid,
          sku: vForm.sku,
          variant_name: vForm.variant_name || null,
          size_id: vForm.size_id || null,
          cloth_type_id: vForm.cloth_type_id || null,
          price: Number(vForm.price) || 0,
          stock_qty: Number(vForm.stock_qty) || 0,
          rcu: "ADMIN_PORTAL",
        },
      });
      setVForm({ sku: "", variant_name: "", size_id: "", cloth_type_id: "", price: "", stock_qty: "" });
      setMsg("Variant added.");
      reload();
    } catch (err) {
      setMsg(err.message || "Could not add variant.");
    }
  };

  const deleteVariant = async (v) => {
    if (!window.confirm(`Delete variant ${v.sku}?`)) return;
    await apiFetch("/Products-Variants", {
      method: "DELETE",
      body: { product_variant_id: v.product_variant_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
  };

  // Stage 1: pick a file → show local preview (no upload yet).
  const pickMedia = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mPreview?.url) URL.revokeObjectURL(mPreview.url);
    setMPreview({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type.startsWith("video") ? "video" : "image",
    });
  };

  const clearMediaPreview = () => {
    if (mPreview?.url) URL.revokeObjectURL(mPreview.url);
    setMPreview(null);
  };

  // Stage 2: click "Upload" → POST to /FileUpload then attach to product.
  const uploadMedia = async () => {
    if (!mPreview?.file) return;
    const file = mPreview.file;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("hc_token");
      const res = await fetch(`${API_BASE_URL}/FileUpload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      const url = data?.data?.virtualPath || data?.virtualPath || data?.data?.url || data?.url;
      if (!url) throw new Error("Upload did not return a URL.");
      await apiFetch("/Products-Media", {
        method: "POST",
        body: {
          product_id: pid,
          media_type: mPreview.type,
          media_url: url,
          alt_text: mAlt || product.product_name,
          isprimary: mPrimary ? 1 : 0,
          rcu: "ADMIN_PORTAL",
        },
      });
      setMAlt("");
      setMPrimary(false);
      clearMediaPreview();
      setMsg("Image uploaded & attached.");
      reload();
    } catch (err) {
      setMsg(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (m) => {
    if (!window.confirm("Delete this image?")) return;
    await apiFetch("/Products-Media", {
      method: "DELETE",
      body: { product_media_id: m.product_media_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
  };

  // ----- per-variant media upload -----
  const pickVariantMedia = (variantId) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (vPreview?.url) URL.revokeObjectURL(vPreview.url);
    setVPreview({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type.startsWith("video") ? "video" : "image",
      variantId,
    });
  };

  const clearVariantPreview = () => {
    if (vPreview?.url) URL.revokeObjectURL(vPreview.url);
    setVPreview(null);
  };

  const uploadVariantMedia = async () => {
    if (!vPreview?.file || !vPreview.variantId) return;
    const file = vPreview.file;
    const variantId = vPreview.variantId;
    setVUploadingId(variantId);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("hc_token");
      const res = await fetch(`${API_BASE_URL}/FileUpload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      const url = data?.data?.virtualPath || data?.virtualPath || data?.data?.url || data?.url;
      if (!url) throw new Error("Upload did not return a URL.");
      await apiFetch("/Products-Media", {
        method: "POST",
        body: {
          product_id: pid,
          product_variant_id: variantId,
          media_type: vPreview.type,
          media_url: url,
          alt_text: `${product.product_name} - ${variantId}`,
          rcu: "ADMIN_PORTAL",
        },
      });
      clearVariantPreview();
      setMsg("Variant image uploaded.");
      reload();
    } catch (err) {
      setMsg(err.message || "Variant upload failed.");
    } finally {
      setVUploadingId(null);
    }
  };

  const deleteVariantMedia = async (m) => {
    if (!window.confirm("Delete this variant image?")) return;
    await apiFetch("/Products-Media", {
      method: "DELETE",
      body: { product_media_id: m.product_media_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
  };

  const addAttr = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!aAttr || !aValue.trim()) {
      setMsg("Pick an attribute and enter a value.");
      return;
    }
    try {
      await apiFetch("/Products-Attributes-Values", {
        method: "POST",
        body: { product_id: pid, attribute_id: aAttr, attribute_value: aValue.trim(), rcu: "ADMIN_PORTAL" },
      });
      setAAttr("");
      setAValue("");
      setMsg("Attribute added.");
      reload();
    } catch (err) {
      setMsg(err.message || "Could not add attribute.");
    }
  };

  const deleteAttr = async (av) => {
    if (!window.confirm("Delete this attribute value?")) return;
    await apiFetch("/Products-Attributes-Values", {
      method: "DELETE",
      body: { product_attribute_value_id: av.product_attribute_value_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
  };

  const saveSeo = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      if (seo) {
        await apiFetch("/Products-Seo", {
          method: "PUT",
          body: { product_seo_id: seo.product_seo_id, ...seoForm, luu: "ADMIN_PORTAL" },
        });
      } else {
        await apiFetch("/Products-Seo", {
          method: "POST",
          body: { product_id: pid, ...seoForm, rcu: "ADMIN_PORTAL" },
        });
      }
      setMsg("SEO saved.");
      reload();
    } catch (err) {
      setMsg(err.message || "Could not save SEO.");
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-sm underline">← Back to Products</button>
      <h1 className="mt-2 text-2xl font-bold">{product.product_name}</h1>
      <p className="mt-1 text-xs text-neutral-500">{product.product_slug} · {inr(product.base_price)}</p>
      {msg && <p className="mt-3 bg-white p-3 text-sm shadow-sm">{msg}</p>}

      <h2 className="mt-6 text-lg font-bold">Variants</h2>
      {variants.length === 0 ? (
        <p className="mt-2 bg-white p-4 text-sm text-neutral-500 shadow-sm">No variants yet.</p>
      ) : (
        <div className="mt-2 overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-neutral-500">
                <th className="p-3">SKU</th><th className="p-3">Name</th><th className="p-3">Size</th>
                <th className="p-3">Cloth Type</th><th className="p-3">Price</th><th className="p-3">Stock</th>
                <th className="p-3">Image (per variant)</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const vMedia = vMediaByVariant[v.product_variant_id] || [];
                return (
                  <tr key={v.product_variant_id} className="border-b align-top last:border-0">
                    <td className="p-3 font-medium">{v.sku}</td>
                    <td className="p-3">{v.variant_name || "—"}</td>
                    <td className="p-3">{sizeName(v.size_id)}</td>
                    <td className="p-3">{clothName(v.cloth_type_id)}</td>
                    <td className="p-3">{inr(v.price)}</td>
                    <td className="p-3">{v.stock_qty}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {vMedia.length === 0 ? (
                          <span className="text-xs text-neutral-400">No image</span>
                        ) : (
                          vMedia.map((m) => (
                            <div key={m.product_media_id} className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resolveUploadUrl(m.media_url)}
                                alt={m.alt_text || v.sku}
                                style={{ height: 48, width: 48, objectFit: "cover" }}
                                className="border border-neutral-300"
                              />
                              <button
                                onClick={() => deleteVariantMedia(m)}
                                title="Delete variant image"
                                className="absolute -right-1 -top-1 rounded-full bg-white px-1 text-xs text-red-600 shadow"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                        <label className="flex cursor-pointer items-center justify-center border border-dashed border-neutral-400 px-2 py-1 text-xs font-semibold">
                          {vUploadingId === v.product_variant_id ? "..." : "+ Image"}
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={pickVariantMedia(v.product_variant_id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {vPreview?.variantId === v.product_variant_id && (
                        <div className="mt-2 flex flex-wrap items-start gap-2 rounded border border-neutral-200 bg-neutral-50 p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {vPreview.type === "image" ? (
                            <img src={vPreview.url} alt="preview" style={{ height: 60, width: 60, objectFit: "cover" }} className="border" />
                          ) : (
                            <video src={vPreview.url} style={{ height: 60, width: 60, objectFit: "cover" }} controls className="border" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs">{vPreview.name}</p>
                            <p className="text-xs text-neutral-500">Preview</p>
                          </div>
                          <button
                            onClick={uploadVariantMedia}
                            disabled={vUploadingId === v.product_variant_id}
                            className="bg-neutral-950 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {vUploadingId === v.product_variant_id ? "..." : "Upload"}
                          </button>
                          <button onClick={clearVariantPreview} className="border border-neutral-300 px-3 py-1 text-xs">
                            ×
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => deleteVariant(v)} className="text-red-600 underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={addVariant} className="mt-3 grid gap-3 bg-white p-5 shadow-sm md:grid-cols-3">
        <h3 className="font-semibold md:col-span-3">Add Variant</h3>
        <input value={vForm.sku} onChange={(e) => setVForm((f) => ({ ...f, sku: e.target.value }))} required placeholder="SKU" className={input} />
        <input value={vForm.variant_name} onChange={(e) => setVForm((f) => ({ ...f, variant_name: e.target.value }))} placeholder="Variant Name" className={input} />
        <select value={vForm.size_id} onChange={(e) => setVForm((f) => ({ ...f, size_id: e.target.value }))} className={input}>
          <option value="">Size — none —</option>
          {sizes.map((s) => (
            <option key={s.size_id} value={s.size_id}>{s.size_name}</option>
          ))}
        </select>
        <select value={vForm.cloth_type_id} onChange={(e) => setVForm((f) => ({ ...f, cloth_type_id: e.target.value }))} className={input}>
          <option value="">Cloth Type — none —</option>
          {clothTypes.map((c) => (
            <option key={c.cloth_type_id} value={c.cloth_type_id}>{c.cloth_type_name}</option>
          ))}
        </select>
        <input value={vForm.price} onChange={(e) => setVForm((f) => ({ ...f, price: e.target.value }))} inputMode="decimal" placeholder="Price" className={input} />
        <input value={vForm.stock_qty} onChange={(e) => setVForm((f) => ({ ...f, stock_qty: e.target.value }))} inputMode="numeric" placeholder="Stock" className={input} />
        <div className="md:col-span-3">
          <button className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white">Add Variant</button>
        </div>
      </form>

      <h2 className="mt-8 text-lg font-bold">Images / Media</h2>
      {media.length === 0 ? (
        <p className="mt-2 bg-white p-4 text-sm text-neutral-500 shadow-sm">No images yet.</p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
          {media.map((m) => (
            <div key={m.product_media_id} className="relative border border-neutral-200 bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveUploadUrl(m.media_url)} alt={m.alt_text || product.product_name} style={{ height: 140, width: "100%", objectFit: "cover" }} />
              <p className="mt-1 truncate text-xs">{m.alt_text || "—"}{m.isprimary ? " • Primary" : ""}</p>
              <button onClick={() => deleteMedia(m)} className="mt-1 text-xs text-red-600 underline">Delete</button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 grid gap-3 bg-white p-5 shadow-sm md:grid-cols-3">
        <input value={mAlt} onChange={(e) => setMAlt(e.target.value)} placeholder="Alt Text" className={input} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={mPrimary} onChange={(e) => setMPrimary(e.target.checked)} /> Set as primary
        </label>
        <label className="flex cursor-pointer items-center justify-center border border-dashed border-neutral-400 px-4 py-2 text-sm font-semibold">
          {mPreview ? `Selected: ${mPreview.name}` : "Choose file..."}
          <input type="file" accept="image/*,video/*" onChange={pickMedia} className="hidden" />
        </label>
        {mPreview ? (
          <div className="md:col-span-3 flex flex-wrap items-start gap-3 rounded border border-neutral-200 bg-neutral-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {mPreview.type === "image" ? (
              <img src={mPreview.url} alt="preview" style={{ height: 100, width: 140, objectFit: "cover" }} className="border border-neutral-300" />
            ) : (
              <video src={mPreview.url} style={{ height: 100, width: 140, objectFit: "cover" }} controls className="border border-neutral-300" />
            )}
            <div className="flex-1">
              <p className="text-xs font-medium">{mPreview.name}</p>
              <p className="text-xs text-neutral-500">Preview — click Upload to attach to this product.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={uploadMedia}
                disabled={uploading}
                className="bg-neutral-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button onClick={clearMediaPreview} className="border border-neutral-300 px-4 py-2 text-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500 md:col-span-3">JPG, PNG, WEBP, GIF images or MP4, WEBM, MOV videos. Pick a file to preview before upload.</p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-bold">Attributes</h2>
      <form onSubmit={addAttr} className="mt-2 grid gap-3 bg-white p-5 shadow-sm md:grid-cols-3">
        <select value={aAttr} onChange={(e) => setAAttr(e.target.value)} className={input}>
          <option value="">-- select attribute --</option>
          {attributes.map((a) => (
            <option key={a.attribute_id} value={a.attribute_id}>{a.attribute_name}</option>
          ))}
        </select>
        <input value={aValue} onChange={(e) => setAValue(e.target.value)} placeholder="Value" className={input} />
        <div>
          <button className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white">Add</button>
        </div>
      </form>
      {attrValues.length === 0 ? (
        <p className="mt-2 bg-white p-4 text-sm text-neutral-500 shadow-sm">No attribute values yet.</p>
      ) : (
        <div className="mt-2 overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-neutral-500">
                <th className="p-3">Attribute</th><th className="p-3">Value</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attrValues.map((av) => (
                <tr key={av.product_attribute_value_id} className="border-b last:border-0">
                  <td className="p-3">{attrName(av.attribute_id)}</td>
                  <td className="p-3">{av.attribute_value}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => deleteAttr(av)} className="text-red-600 underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold">SEO</h2>
      <form onSubmit={saveSeo} className="mt-2 grid gap-3 bg-white p-5 shadow-sm md:grid-cols-2">
        <input value={seoForm.seo_title} onChange={(e) => setSeoForm((f) => ({ ...f, seo_title: e.target.value }))} placeholder="SEO Title" className={input} />
        <input value={seoForm.seo_keywords} onChange={(e) => setSeoForm((f) => ({ ...f, seo_keywords: e.target.value }))} placeholder="Keywords" className={input} />
        <textarea value={seoForm.seo_description} onChange={(e) => setSeoForm((f) => ({ ...f, seo_description: e.target.value }))} placeholder="SEO Description" rows={2} className={`${input} md:col-span-2`} />
        <input value={seoForm.og_image_url} onChange={(e) => setSeoForm((f) => ({ ...f, og_image_url: e.target.value }))} placeholder="OG Image URL" className={`${input} md:col-span-2`} />
        <div className="md:col-span-2">
          <button className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white">Save SEO</button>
        </div>
      </form>
    </div>
  );
}
