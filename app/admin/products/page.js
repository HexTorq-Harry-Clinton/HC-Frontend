"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, inr, resolveUploadUrl, revalidateSite, friendlyError, detectMediaType } from "@/lib/api";
import AdminModulePage from "../AdminModule";
import AdminToast from "@/components/AdminToast";
import ActiveToggle from "@/components/ActiveToggle";
import FilePick from "../FilePick";
import Pagination, { paginate } from "../Pagination";
import UploadRing from "../UploadRing";
import useLockBody from "../useLockBody";
import useUploader from "../useUploader";
import { useConfirm } from "../ConfirmProvider";

const empty = {
  product_name: "", product_slug: "", style_collection_id: "", collection_display_order: "",
  short_description: "", description: "", base_price: "", original_price: "", currency_code: "INR", isactive: true,
};
const TABS = ["Products", "Sizes", "Cloth Types", "Care Instructions", "Attributes"];
const TAB_MODULES = {
  Sizes: "sizes",
  "Cloth Types": "cloth-types",
  "Care Instructions": "care",
  Attributes: "attributes",
};

const input =
  "w-full  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

// Product Management: grouped workspace like before —
// tabs (Products/Sizes/Cloth Types/Care/Attributes) + search,
// product table, and inside each product: variants, media,
// attributes and SEO stacked on one page with product auto-attached.
export default function AdminProductsPage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState(null);
  const [refresh, setRefresh] = useState(0);
  // false = list, object = open workspace. (Never null: the workspace
  // requires a saved product — create via the form first, then Open.)
  const [workspace, setWorkspace] = useState(false);
  // Create/update ALWAYS live in the popup — never inline.
  const [showForm, setShowForm] = useState(false);
  const [prodPage, setProdPage] = useState(1);
  const [prodPageSize, setProdPageSize] = useState(10);
  useLockBody(showForm);
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(empty);
  };

  // Mount + refresh fetch: state updates happen only in the async continuation.
  useEffect(() => {
    let live = true;
    apiFetch("/Products", { params: { includeInactive: 1, pageSize: 200 } })
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

  useEffect(() => {
    apiFetch("/Style-Collections")
      .then(unwrap)
      .then((list) => setCollections(Array.isArray(list) ? list : []))
      .catch(() => setCollections([]));
  }, []);

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
          body: {
            product_id: editing, ...form,
            base_price: Number(form.base_price) || 0,
            original_price: form.original_price === "" ? null : Number(form.original_price) || 0,
            collection_display_order: Number(form.collection_display_order) || 0,
            luu: "ADMIN_PORTAL",
          },
        });
        setMsg("Product updated.");
        setToast({ type: "ok", text: "Product updated." });
        setForm(empty);
        setEditing(null);
        setShowForm(false);
        reload();
      } else {
        const res = await apiFetch("/Products", {
          method: "POST",
          body: {
            ...form,
            base_price: Number(form.base_price) || 0,
            original_price: form.original_price === "" ? null : Number(form.original_price) || 0,
            collection_display_order: Number(form.collection_display_order) || 0,
            rcu: "ADMIN_PORTAL",
          },
        });
        const created = res?.data || res;
        const newProduct = created?.product_id ? created : (Array.isArray(created) ? created[0] : created?.data || created);
        // Try to get inserted row; fallback to first matching by slug
        let toOpen = newProduct && newProduct.product_id ? newProduct : null;
        if (!toOpen) {
          // fetch fresh list to find by slug we just created
          try {
            const list = unwrap(await apiFetch("/Products", { params: { includeInactive: 1 } }));
            toOpen = (Array.isArray(list) ? list : []).find((p) => p.product_slug === form.product_slug) || null;
          } catch {}
        }
        setMsg("Product added — opening workspace for variants, images & SEO.");
        setToast({ type: "ok", text: "Product added — opening workspace." });
        setForm(empty);
        setEditing(null);
        setShowForm(false);
        if (toOpen) {
          setWorkspace(toOpen);
        }
        reload();
      }
    } catch (err) {
      const friendly = friendlyError(err, "Save failed");
      setMsg(friendly);
      setToast({ type: "error", text: friendly });
    }
  };

  const edit = (p) => {
    setEditing(p.product_id);
    setForm({
      product_name: p.product_name || "", product_slug: p.product_slug || "",
      style_collection_id: p.style_collection_id || "", collection_display_order: p.collection_display_order || "",
      short_description: p.short_description || "", description: p.description || "",
      base_price: p.base_price || "", original_price: p.original_price || "", currency_code: p.currency_code || "INR",
      isactive: p.isactive !== false,
    });
    setShowForm(true);
  };

  const remove = async (p) => {
    const ok = await confirm({
      title: "Delete this product?",
      message: `${p.product_name} and its variants, media and SEO will be removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Products", { method: "DELETE", body: { product_id: p.product_id, luu: "ADMIN_PORTAL" } }).catch(() => null);
    reload();
  };

  const toggleProduct = async (p, next) => {
    await apiFetch("/Products", {
      method: "PUT",
      body: { product_id: p.product_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
  };

  // workspace: false = list, object = open existing (save-first gate:
  // only a saved product can be opened, so children always attach).
  if (workspace !== false) {
    return (
      <ProductWorkspace
        product={workspace}
        onBack={() => { setWorkspace(false); reload(); }}
      />
    );
  }

  const needle = search.trim().toLowerCase();
  const visible = products.filter((p) => {
    if (statusFilter === "active" && p.isactive === false) return false;
    if (statusFilter === "inactive" && p.isactive !== false) return false;
    if (!needle) return true;
    const hay = `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""} ${p.description || ""} ${p.base_price || ""}`.toLowerCase();
    return hay.includes(needle);
  });
  const shownProducts = paginate(visible, prodPage, prodPageSize);

  return (
    <div>
      <AdminToast toast={toast} onDone={() => setToast(null)} />
      <div>
        <p className="eyebrow text-gold-deep">Harry Clinton</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900">Product Management</h1>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {TABS.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setTab(t)}
            className={` border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && (
        <p className="mt-3  border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm text-neutral-700">
          {msg}
        </p>
      )}

      {tab !== "Products" ? (
        <div className="mt-4" key={tab}>
          <AdminModulePage module={TAB_MODULES[tab]} />
        </div>
      ) : (
        <>
          {showForm && (
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
              onClick={closeForm}
            >
              <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto  border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <h3 className="font-display text-lg font-bold text-neutral-900">
                  {editing ? "Edit Product" : "New Product"}
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input value={form.product_name} onChange={set("product_name")} required placeholder="Product name" className={input} />
                   <input value={form.product_slug} onChange={set("product_slug")} required placeholder="slug-like-this" className={input} />
                   <select value={form.style_collection_id} onChange={set("style_collection_id")} className={input}>
                     <option value="">No collection</option>
                     {collections.map((collection) => <option key={collection.style_collection_id} value={collection.style_collection_id}>{collection.collection_name}</option>)}
                   </select>
                   <input value={form.collection_display_order} onChange={set("collection_display_order")} inputMode="numeric" placeholder="Collection order" className={input} />
                   <input value={form.short_description} onChange={set("short_description")} placeholder="Short description" className={input} />
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">₹</span>
                     <input value={form.base_price} onChange={set("base_price")} inputMode="decimal" required placeholder="Price (INR)" className={`${input} pl-7`} />
                   </div>
                   <div className="relative">
                     <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">₹</span>
                     <input value={form.original_price} onChange={set("original_price")} inputMode="decimal" placeholder="Original price (INR)" className={`${input} pl-7`} />
                   </div>
                  <textarea value={form.description} onChange={set("description")} placeholder="Full description" rows={2} className={`${input} md:col-span-2`} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isactive} onChange={set("isactive")} className="h-4 w-4  border-neutral-300 text-neutral-950 focus:ring-gold/40" /> Active
                  </label>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center  bg-neutral-950 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
                  >
                    {editing ? "Update Product" : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setProdPage(1); }}
              placeholder="Search products..."
              className="w-full max-w-md  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setProdPage(1); }}
              className=" border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-sm font-medium text-neutral-500 underline underline-offset-2 transition-colors hover:text-gold-deep">
                Clear
              </button>
            )}
          </div>

          <p className="mb-2 mt-4 text-xs text-neutral-500">
            {visible.length} of {products.length} record{products.length === 1 ? "" : "s"} {search || statusFilter !== "all" ? "· filtered" : ""}
          </p>
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}
              className="inline-flex items-center justify-center gap-1.5  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <i className="bi bi-plus-lg" /> New Product
            </button>
          </div>
          <div className="overflow-x-auto  border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Active</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-5 text-center text-neutral-500">No records found.</td>
                  </tr>
                ) : (
                shownProducts.map((p) => (
                  <tr key={p.product_id} className="border-b transition-colors last:border-0 hover:bg-[#faf8f4]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.product_name}</p>
                      {p.short_description && <p className="text-xs text-neutral-500">{p.short_description}</p>}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{p.product_slug}</td>
                    <td className="px-4 py-3">{inr(p.base_price)}</td>
                    <td className="px-4 py-3">
                      <ActiveToggle active={p.isactive} onToggle={(next) => toggleProduct(p, next)} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => setWorkspace(p)} className="mr-3 font-semibold text-neutral-700 underline underline-offset-2 transition-colors hover:text-gold-deep">Open</button>
                      <button type="button" onClick={() => edit(p)} className="mr-3 text-neutral-700 underline underline-offset-2 transition-colors hover:text-gold-deep">Edit</button>
                      <button type="button" onClick={() => remove(p)} className="text-red-600 underline underline-offset-2 transition-colors hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
          <Pagination page={prodPage} setPage={setProdPage} total={visible.length} pageSize={prodPageSize} setPageSize={setProdPageSize} />
        </>
      )}
    </div>
  );
}

// Inside a product: variants, media, attributes and SEO stacked on one
// page — every record auto-attached to this product, no picking needed.
function ProductWorkspace({ product, onBack }) {
  const pid = product.product_id;
  const confirm = useConfirm();
  const [variants, setVariants] = useState([]);
  const [media, setMedia] = useState([]);
  const [attrValues, setAttrValues] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [clothTypes, setClothTypes] = useState([]);
  const [seo, setSeo] = useState(null);
  const [details, setDetails] = useState({
    fabric_details: "", trims_used: "", special_detailing: "", lining_details: "",
    product_fit: "", model_fit: "", construction_type: "", sleeve_type: "",
    sleeve_pattern: "", wash_care: "", sleeve_length: "",
  });
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [sizeChart, setSizeChart] = useState([]);
  const [sizeUnit, setSizeUnit] = useState("in");
  const [sizeChartSaving, setSizeChartSaving] = useState(false);
  const [seoForm, setSeoForm] = useState({ seo_title: "", seo_description: "", seo_keywords: "", og_image_url: "" });
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [vForm, setVForm] = useState({ sku: "", variant_name: "", size_id: "", cloth_type_id: "", color: "", price: "", discount_type: "none", discount_value: "", stock_qty: "" });
  const [editingVariant, setEditingVariant] = useState(null);
  // Workspace create/update ALWAYS live in popups — never inline.
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [showSeoForm, setShowSeoForm] = useState(false);
  useLockBody(showVariantForm || showMediaForm || showAttrForm || showSeoForm);
  // Search + pagination for workspace tables (top-right search, 5/10/15/25/50).
  const [vSearch, setVSearch] = useState("");
  const [vPage, setVPage] = useState(1);
  const [vPageSize, setVPageSize] = useState(10);
  const [aSearch, setASearch] = useState("");
  const [aPage, setAPage] = useState(1);
  const [aPageSize, setAPageSize] = useState(10);
  const vNeedle = vSearch.trim().toLowerCase();
  const filteredVariants = vNeedle
    ? variants.filter((v) => `${v.sku || ""} ${v.variant_name || ""}`.toLowerCase().includes(vNeedle))
    : variants;
  const shownVariants = paginate(filteredVariants, vPage, vPageSize);
  const aNeedle = aSearch.trim().toLowerCase();
  const filteredAttrs = aNeedle
    ? attrValues.filter((av) => {
        const an = attributes.find((a) => a.attribute_id === av.attribute_id)?.attribute_name || "";
        return `${an} ${av.attribute_value || ""}`.toLowerCase().includes(aNeedle);
      })
    : attrValues;
  const shownAttrs = paginate(filteredAttrs, aPage, aPageSize);
  const closeVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariant(null);
    setVForm({ sku: "", variant_name: "", size_id: "", cloth_type_id: "", color: "", price: "", discount_type: "none", discount_value: "", stock_qty: "" });
  };
  const [vMediaByVariant, setVMediaByVariant] = useState({}); // {variant_id: [media, ...]}
  const [mAlt, setMAlt] = useState("");
  const [mPrimary, setMPrimary] = useState(false);
  const [mRole, setMRole] = useState("front");
  const [vRole, setVRole] = useState("front");
  const [mPreview, setMPreview] = useState(null); // { url, name, type } for local preview
  const [uploading, setUploading] = useState(false);
  const [vUploadingId, setVUploadingId] = useState(null); // variant_id being uploaded
  const [vPreview, setVPreview] = useState(null);
  const [aAttr, setAAttr] = useState("");
  const [aValue, setAValue] = useState("");
  // Uploads with live ring progress (%, MB, speed, ETA).
  const { upProg, upload } = useUploader();

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
      apiFetch("/Product-Details", { params: { product_id: pid } }).then(unwrap).catch(() => null),
      apiFetch("/Products-Size-Charts", { params: { product_id: pid } }).then(unwrap).catch(() => []),
    ]).then(([v, m, av, a, s, c, seoList, detailRow, chartRows]) => {
      if (!live) return;
      const arr = (x) => (Array.isArray(x) ? x : []);
      const variantList = arr(v).filter((x) => x.product_id === pid);
      const allMedia = arr(m).filter((x) => x.product_id === pid);
      setVariants(variantList);
      setMedia(allMedia.filter((x) => !x.product_variant_id));
      setAttrValues(arr(av).filter((x) => x.product_id === pid));
      setAttributes(arr(a));
      setSizes(arr(s));
      const rows = arr(chartRows);
      if (rows[0]?.unit) setSizeUnit(rows[0].unit);
      setSizeChart(rows);
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
      if (detailRow) setDetails((current) => ({ ...current, ...detailRow }));
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
  const saveDetails = async (event) => {
    event.preventDefault();
    setDetailsSaving(true);
    try {
      await apiFetch("/Product-Details", { method: "PUT", body: { product_id: pid, ...details } });
      setMsg("Product details saved.");
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not save product details."));
    } finally {
      setDetailsSaving(false);
    }
  };
  const deleteDetails = async () => {
    const ok = await confirm({ title: "Remove product details?", message: "The structured product details will be removed from the storefront.", confirmLabel: "Remove", danger: true });
    if (!ok) return;
    try {
      await apiFetch("/Product-Details", { method: "DELETE", body: { product_id: pid } });
      setDetails({ fabric_details: "", trims_used: "", special_detailing: "", lining_details: "", product_fit: "", model_fit: "", construction_type: "", sleeve_type: "", sleeve_pattern: "", wash_care: "", sleeve_length: "" });
      setMsg("Product details removed.");
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not remove product details."));
    }
  };
  const setDetail = (key) => (event) => setDetails((current) => ({ ...current, [key]: event.target.value }));
  const updateMediaRole = async (mediaItem, role) => {
    try {
      await apiFetch("/Products-Media", { method: "PUT", body: { product_media_id: mediaItem.product_media_id, media_role: role, luu: "ADMIN_PORTAL" } });
      setMsg("Media role updated.");
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not update media role."));
    }
  };
  const updateSizeChart = (sizeId, field, value) => setSizeChart((rows) => {
    const existing = rows.find((row) => row.size_id === sizeId) || { size_id: sizeId };
    const next = { ...existing, [field]: value };
    return [...rows.filter((row) => row.size_id !== sizeId), next];
  });
  const saveSizeChart = async (event) => {
    event.preventDefault();
    setSizeChartSaving(true);
    try {
      for (const row of sizeChart.filter((r) => r.size_id)) {
        await apiFetch("/Products-Size-Charts", { method: "PUT", body: { product_id: pid, unit: sizeUnit, ...row } });
      }
      setMsg("Size chart saved.");
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not save size chart."));
    } finally {
      setSizeChartSaving(false);
    }
  };
  const deleteSizeMeasurement = async (row) => {
    const ok = await confirm({ title: "Remove this measurement?", message: `Remove the ${row.size_name || "selected size"} row from this product's size chart?`, confirmLabel: "Remove", danger: true });
    if (!ok) return;
    try {
      await apiFetch("/Products-Size-Charts", { method: "DELETE", body: { product_id: pid, size_id: row.size_id } });
      setMsg("Size measurement removed.");
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not remove size measurement."));
    }
  };
  const sizeName = (id) => sizes.find((s) => s.size_id === id)?.size_name || id || "—";
  const clothName = (id) => clothTypes.find((c) => c.cloth_type_id === id)?.cloth_type_name || id || "—";
  const attrName = (id) => attributes.find((a) => a.attribute_id === id)?.attribute_name || id;
  const colorAttribute = attributes.find((a) =>
    a.attribute_slug?.toLowerCase() === "color" || a.attribute_name?.toLowerCase() === "color"
  );
  const colorForVariant = (variantId) => {
    if (!colorAttribute) return "";
    return attrValues.find((av) =>
      av.product_variant_id === variantId && av.attribute_id === colorAttribute.attribute_id
    )?.attribute_value || "";
  };

  const syncVariantColor = async (variantId, color) => {
    if (!colorAttribute || !variantId) return;
    const current = attrValues.find((av) =>
      av.product_variant_id === variantId && av.attribute_id === colorAttribute.attribute_id
    );
    const value = String(color || "").trim();
    if (value) {
      if (current) {
        await apiFetch("/Products-Attributes-Values", {
          method: "PUT",
          body: {
            product_attribute_value_id: current.product_attribute_value_id,
            product_id: pid,
            product_variant_id: variantId,
            attribute_id: colorAttribute.attribute_id,
            attribute_value: value,
            luu: "ADMIN_PORTAL",
          },
        });
      } else {
        await apiFetch("/Products-Attributes-Values", {
          method: "POST",
          body: {
            product_id: pid,
            product_variant_id: variantId,
            attribute_id: colorAttribute.attribute_id,
            attribute_value: value,
            rcu: "ADMIN_PORTAL",
          },
        });
      }
    } else if (current) {
      await apiFetch("/Products-Attributes-Values", {
        method: "DELETE",
        body: { product_attribute_value_id: current.product_attribute_value_id, luu: "ADMIN_PORTAL" },
      });
    }
  };

  const saveVariant = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!vForm.sku) {
      setMsg("SKU is required.");
      return;
    }
    const payload = {
      product_id: pid,
      sku: vForm.sku,
      variant_name: vForm.variant_name || null,
      size_id: vForm.size_id || null,
      cloth_type_id: vForm.cloth_type_id || null,
      price: Number(vForm.price) || 0,
      discount_type: vForm.discount_type && vForm.discount_type !== "none" ? vForm.discount_type : null,
      discount_value: vForm.discount_type && vForm.discount_type !== "none" ? (Number(vForm.discount_value) || 0) : null,
      stock_qty: Number(vForm.stock_qty) || 0,
    };
    try {
      let variantId = editingVariant;
      if (editingVariant) {
        await apiFetch("/Products-Variants", {
          method: "PUT",
          body: { product_variant_id: editingVariant, ...payload, luu: "ADMIN_PORTAL" },
        });
        setMsg("Variant updated.");
      } else {
        const created = await apiFetch("/Products-Variants", {
          method: "POST",
          body: { ...payload, rcu: "ADMIN_PORTAL" },
        });
        variantId = unwrap(created)?.product_variant_id || created?.data?.product_variant_id;
        setMsg("Variant added.");
      }
      await syncVariantColor(variantId, vForm.color);
      setVForm({ sku: "", variant_name: "", size_id: "", cloth_type_id: "", color: "", price: "", discount_type: "none", discount_value: "", stock_qty: "" });
      setEditingVariant(null);
      setShowVariantForm(false);
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not save variant."));
    }
  };

  const editVariant = (v) => {
    setEditingVariant(v.product_variant_id);
    setVForm({
      sku: v.sku || "", variant_name: v.variant_name || "",
      size_id: v.size_id || "", cloth_type_id: v.cloth_type_id || "",
      color: colorForVariant(v.product_variant_id),
      price: v.price ?? "", stock_qty: v.stock_qty ?? "",
      discount_type: v.discount_type || "none", discount_value: v.discount_value ?? "",
    });
    setShowVariantForm(true);
  };

  const deleteVariant = async (v) => {
    const ok = await confirm({
      title: "Delete this variant?",
      message: `SKU ${v.sku} will be removed from ${product.product_name}.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Products-Variants", {
      method: "DELETE",
      body: { product_variant_id: v.product_variant_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    if (editingVariant === v.product_variant_id) {
      setEditingVariant(null);
      setVForm({ sku: "", variant_name: "", size_id: "", cloth_type_id: "", price: "", stock_qty: "" });
    }
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

  // Single-submit: pick file + alt + primary, one Save uploads first
  // (shared helper) then attaches the returned path to the product.
  const saveMedia = async () => {
    if (!mPreview?.file) return;
    const file = mPreview.file;
    setUploading(true);
    setMsg("");
    try {
      const url = await upload(file);
      await apiFetch("/Products-Media", {
        method: "POST",
        body: {
          product_id: pid,
          media_type: detectMediaType(file),
          media_url: url,
           alt_text: mAlt || product.product_name,
          media_role: mRole,
          isprimary: mPrimary ? 1 : 0,
          rcu: "ADMIN_PORTAL",
        },
      });
      setMAlt("");
      setMPrimary(false);
      setMRole("front");
      clearMediaPreview();
      setMsg("Image uploaded & attached.");
      setShowMediaForm(false);
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (m) => {
    const ok = await confirm({
      title: "Delete this image?",
      message: "The image will be removed from this product.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
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
      const url = await upload(file);
      await apiFetch("/Products-Media", {
        method: "POST",
        body: {
          product_id: pid,
          product_variant_id: variantId,
          media_type: detectMediaType(file),
          media_url: url,
          media_role: vRole,
          alt_text: `${product.product_name} - ${variantId}`,
          rcu: "ADMIN_PORTAL",
        },
      });
      clearVariantPreview();
      setVRole("front");
      setMsg("Variant image uploaded.");
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Variant upload failed."));
    } finally {
      setVUploadingId(null);
    }
  };

  const deleteVariantMedia = async (m) => {
    const ok = await confirm({
      title: "Delete this variant image?",
      message: "The image will be removed from the variant.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
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
      setShowAttrForm(false);
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not add attribute."));
    }
  };

  const deleteAttr = async (av) => {
    const ok = await confirm({
      title: "Delete this attribute value?",
      message: "The value will be removed from this product.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
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
      setShowSeoForm(false);
      reload();
    } catch (err) {
      setMsg(friendlyError(err, "Could not save SEO."));
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 transition-colors hover:text-gold-deep"
      >
        <i className="bi bi-arrow-left" /> Back to Products
      </button>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-neutral-900">{product.product_name}</h1>
      <p className="mt-1 text-xs text-neutral-500">{product.product_slug} · {inr(product.base_price)}</p>
      {msg && (
        <p className="mt-3  border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm text-neutral-700">
          {msg}
        </p>
      )}

      <form onSubmit={saveDetails} className="mt-6 border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900"><i className="bi bi-card-text text-gold-deep" /> Product Details</h2>
        <p className="mt-1 text-xs text-neutral-500">These fields control the structured information shown on the storefront product page.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            ["fabric_details", "Fabric details", "Describe the fabric and composition"],
            ["trims_used", "Trims used", "Buttons, zips, embroidery, hardware"],
            ["special_detailing", "Special detailing", "Craft, finish, or design details"],
            ["lining_details", "Lining", "Lining material or construction"],
            ["model_fit", "Model fit", "Example: Model is wearing size M"],
            ["sleeve_pattern", "Sleeve pattern", "Optional sleeve design details"],
            ["wash_care", "Wash care instructions", "Cleaning and care instructions"],
          ].map(([key, label, placeholder]) => (
            <label key={key} className="text-sm font-semibold text-neutral-700">
              {label}
              <textarea value={details[key] || ""} onChange={setDetail(key)} placeholder={placeholder} rows={2} className={`${input} mt-1`} />
            </label>
          ))}
          <label className="text-sm font-semibold text-neutral-700">Product fit
            <select value={details.product_fit || ""} onChange={setDetail("product_fit")} className={`${input} mt-1`}>
              <option value="">Select fit</option><option>Regular fit</option><option>Relaxed fit</option><option>Slim fit</option><option>Oversized fit</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-neutral-700">Woven / Knitted
            <select value={details.construction_type || ""} onChange={setDetail("construction_type")} className={`${input} mt-1`}>
              <option value="">Select construction</option><option>Woven</option><option>Knitted</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-neutral-700">Sleeve type
            <input value={details.sleeve_type || ""} onChange={setDetail("sleeve_type")} placeholder="Full sleeve / Half sleeve" className={`${input} mt-1`} />
          </label>
          <label className="text-sm font-semibold text-neutral-700">Sleeve length
            <input value={details.sleeve_length || ""} onChange={setDetail("sleeve_length")} placeholder="Example: 25 inches" className={`${input} mt-1`} />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2"><button type="submit" disabled={detailsSaving} className="bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gold hover:text-neutral-950 disabled:opacity-50">{detailsSaving ? "Saving..." : "Save Product Details"}</button><button type="button" onClick={deleteDetails} className="border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50">Remove Details</button></div>
      </form>

      <form onSubmit={saveSizeChart} className="mt-6 border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900"><i className="bi bi-rulers text-gold-deep" /> Size Chart</h2><p className="mt-1 text-xs text-neutral-500">Measurements are product-specific and can be entered for every available size.</p></div>
          <select value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)} className={`${input} w-auto`}><option value="in">Inches</option><option value="cm">Centimetres</option></select>
        </div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead><tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500"><th className="p-2">Size</th>{["chest", "waist", "hip", "shoulder", "sleeve_length"].map((field) => <th key={field} className="p-2">{field.replace("_", " ")}</th>)}<th className="p-2">Actions</th></tr></thead><tbody>
          {sizes.filter((s) => variants.some((v) => v.size_id === s.size_id)).map((s) => { const row = sizeChart.find((r) => r.size_id === s.size_id) || {}; return <tr key={s.size_id} className="border-b border-neutral-100"><td className="p-2 font-semibold">{s.size_name}</td>{["chest", "waist", "hip", "shoulder", "sleeve_length"].map((field) => <td key={field} className="p-2"><input type="number" step="0.01" min="0" value={row[field] ?? ""} onChange={(e) => updateSizeChart(s.size_id, field, e.target.value)} className={`${input} w-28`} /></td>)}<td className="p-2"><button type="button" disabled={!row.product_size_measurement_id} onClick={() => deleteSizeMeasurement(row)} className="text-xs font-semibold text-red-600 underline disabled:text-neutral-300">Remove</button></td></tr>; })}
        </tbody></table></div>
        {sizes.filter((s) => variants.some((v) => v.size_id === s.size_id)).length === 0 && <p className="mt-3 text-sm text-neutral-500">Add size variants first to build this chart.</p>}
        <button type="submit" disabled={sizeChartSaving} className="mt-5 bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{sizeChartSaving ? "Saving..." : "Save Size Chart"}</button>
      </form>

      <h2 className="mt-6 flex items-center gap-2 text-lg font-bold text-neutral-900">
        <i className="bi bi-layers text-gold-deep" /> Variants
      </h2>
      <div className="mt-2 flex justify-end">
        <input
          value={vSearch}
          onChange={(e) => { setVSearch(e.target.value); setVPage(1); }}
          placeholder="Search variants..."
          className="w-full max-w-md  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />
      </div>
      {variants.length === 0 ? (
        <p className="mt-2  border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">No variants yet.</p>
      ) : (
        <div className="mt-2 overflow-x-auto  border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
                <th className="px-4 py-3">SKU</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Size</th>
                 <th className="px-4 py-3">Cloth Type</th><th className="px-4 py-3">Color</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Image (per variant)</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shownVariants.map((v) => {
                const vMedia = vMediaByVariant[v.product_variant_id] || [];
                return (
                  <tr key={v.product_variant_id} className="border-b align-top transition-colors last:border-0 hover:bg-[#faf8f4]">
                    <td className="px-4 py-3 font-medium">{v.sku}</td>
                    <td className="px-4 py-3">{v.variant_name || "—"}</td>
                    <td className="px-4 py-3">{sizeName(v.size_id)}</td>
                    <td className="px-4 py-3">{clothName(v.cloth_type_id)}</td>
                    <td className="px-4 py-3">{colorForVariant(v.product_variant_id) || "—"}</td>
                    <td className="px-4 py-3">{inr(v.price)}</td>
                    <td className="px-4 py-3">{v.discount_type && v.discount_type !== "none" && v.discount_value ? `${v.discount_type === "percentage" ? `${v.discount_value}%` : `₹${v.discount_value}`}` : "—"}</td>
                    <td className="px-4 py-3">{v.stock_qty}</td>
                    <td className="px-4 py-3">
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
                                className=" border border-neutral-300 bg-white"
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                              {m.media_role && <span className="absolute bottom-0 left-0 bg-neutral-950/80 px-1 text-[9px] uppercase text-white">{m.media_role}</span>}
                              <button
                                type="button"
                                onClick={() => deleteVariantMedia(m)}
                                title="Delete variant image"
                                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center  bg-white text-xs text-red-600 shadow ring-1 ring-neutral-200 transition-colors hover:bg-red-50"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                        <FilePick
                          small
                          accept="image/*,video/*"
                          onPick={(f) => pickVariantMedia(v.product_variant_id)({ target: { files: [f] } })}
                          hint="+ Image — click or drop"
                        />
                      </div>
                      {vPreview?.variantId === v.product_variant_id && (
                            <div className="mt-2 flex flex-wrap items-start gap-2  border border-neutral-200 bg-neutral-50 p-2">
                              {vPreview.type === "image" ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={vPreview.url} alt="preview" style={{ height: 60, width: 60, objectFit: "cover" }} className=" border border-neutral-300" />
                              ) : (
                                <video src={vPreview.url} style={{ height: 60, width: 60, objectFit: "cover" }} controls className=" border border-neutral-300" />
                              )}
                           <div className="flex-1">
                             <p className="text-xs">{vPreview.name}</p>
                            <select value={vRole} onChange={(e) => setVRole(e.target.value)} className="mt-1 border border-neutral-300 bg-white px-1 py-1 text-xs">
                              <option value="front">Front</option><option value="side">Side</option><option value="back">Back</option><option value="close-up">Close-up</option><option value="detailing">Detailing</option><option value="video">Video</option>
                            </select>
                             <p className="text-xs text-neutral-500">Preview</p>
                          </div>
                          <button
                            type="button"
                            onClick={uploadVariantMedia}
                            disabled={vUploadingId === v.product_variant_id}
                            className="inline-flex items-center justify-center  bg-neutral-950 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-gold hover:text-neutral-950 disabled:opacity-50"
                          >
                            {vUploadingId === v.product_variant_id ? "..." : "Upload"}
                          </button>
                          <button
                            type="button"
                            onClick={clearVariantPreview}
                            className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-950 hover:bg-neutral-50"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => editVariant(v)} className="mr-3 text-neutral-700 underline underline-offset-2 transition-colors hover:text-gold-deep">Edit</button>
                      <button type="button" onClick={() => deleteVariant(v)} className="text-red-600 underline underline-offset-2 transition-colors hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {variants.length > 0 && (
        <Pagination page={vPage} setPage={setVPage} total={filteredVariants.length} pageSize={vPageSize} setPageSize={setVPageSize} />
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
             setVForm({ sku: "", variant_name: "", size_id: "", cloth_type_id: "", color: "", price: "", discount_type: "none", discount_value: "", stock_qty: "" });
            setEditingVariant(null);
            setShowVariantForm(true);
          }}
          className="inline-flex items-center justify-center gap-1.5  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <i className="bi bi-plus-lg" /> Add Variant
        </button>
      </div>
      {showVariantForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={closeVariantForm}
        >
          <form
            onSubmit={saveVariant}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto  border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">{editingVariant ? "Edit Variant" : "Add Variant"}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
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
               <input
                 value={vForm.color}
                 onChange={(e) => setVForm((f) => ({ ...f, color: e.target.value }))}
                 list="product-variant-color-options"
                 placeholder={colorAttribute ? "Color (e.g. Black)" : "Create a Color attribute first"}
                 disabled={!colorAttribute}
                 className={input}
               />
               <datalist id="product-variant-color-options">
                 {["Black", "White", "Burgundy", "Red", "Blue", "Green", "Cream", "Ivory", "Gold", "Silver", "Platinum", "Menthol Ice"].map((color) => (
                   <option key={color} value={color} />
                 ))}
               </datalist>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">₹</span>
                <input value={vForm.price} onChange={(e) => setVForm((f) => ({ ...f, price: e.target.value }))} inputMode="decimal" placeholder="Price (MRP)" className={`${input} pl-7`} />
              </div>
              <select value={vForm.discount_type} onChange={(e) => setVForm((f) => ({ ...f, discount_type: e.target.value }))} className={input}>
                <option value="none">No discount</option>
                <option value="amount">Discount — flat ₹</option>
                <option value="percentage">Discount — %</option>
              </select>
              <input value={vForm.discount_value} onChange={(e) => setVForm((f) => ({ ...f, discount_value: e.target.value }))} inputMode="decimal" placeholder={vForm.discount_type === "percentage" ? "Off %" : "Off ₹"} disabled={!vForm.discount_type || vForm.discount_type === "none"} className={input} />
              <input value={vForm.stock_qty} onChange={(e) => setVForm((f) => ({ ...f, stock_qty: e.target.value }))} inputMode="numeric" placeholder="Stock" className={input} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeVariantForm}
                className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center  bg-neutral-950 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                {editingVariant ? "Update Variant" : "Add Variant"}
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 className="mt-8 flex items-center gap-2 text-lg font-bold text-neutral-900">
        <i className="bi bi-images text-gold-deep" /> Images / Media
      </h2>
      {media.length === 0 ? (
        <p className="mt-2  border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">No images yet.</p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
          {media.map((m) => (
            <div key={m.product_media_id} className="relative overflow-hidden  border border-neutral-200 bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveUploadUrl(m.media_url)}
                alt={m.alt_text || product.product_name}
                style={{ height: 140, width: "100%", objectFit: "cover" }}
                className=" bg-neutral-100"
                onError={(e) => {
                  e.currentTarget.src = "/brand/logo-black.png";
                  e.currentTarget.style.objectFit = "contain";
                  e.currentTarget.style.padding = "12px";
                }}
              />
               <div className="mt-1 flex items-center gap-1"><select value={m.media_role || "front"} onChange={(e) => updateMediaRole(m, e.target.value)} className="max-w-[120px] border border-neutral-200 bg-white px-1 py-0.5 text-[10px] uppercase"><option value="front">Front</option><option value="side">Side</option><option value="back">Back</option><option value="close-up">Close-up</option><option value="detailing">Detailing</option><option value="video">Video</option></select>{m.isprimary ? <span className="text-[10px]">• Primary</span> : null}</div>
              <button type="button" onClick={() => deleteMedia(m)} className="mt-1 text-xs text-red-600 underline underline-offset-2 transition-colors hover:text-red-700">Delete</button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowMediaForm(true)}
          className="inline-flex items-center justify-center gap-1.5  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <i className="bi bi-plus-lg" /> Add Media
        </button>
      </div>
      {showMediaForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => { clearMediaPreview(); setShowMediaForm(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto  border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">Add Media</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
         <input value={mAlt} onChange={(e) => setMAlt(e.target.value)} placeholder="Alt Text" className={input} />
         <select value={mRole} onChange={(e) => setMRole(e.target.value)} className={input} aria-label="Media role">
           <option value="front">Front</option><option value="side">Side</option><option value="back">Back</option><option value="close-up">Close-up</option><option value="detailing">Detailing</option><option value="video">Video</option>
         </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={mPrimary} onChange={(e) => setMPrimary(e.target.checked)} className="h-4 w-4  border-neutral-300 text-neutral-950 focus:ring-gold/40" /> Set as primary
        </label>
        <div className="md:col-span-3">
          <FilePick
            small
            accept="image/*,video/*"
            onPick={(f) => pickMedia({ target: { files: [f] } })}
            fileName={mPreview?.name}
            hint="Product media — click or drop"
          />
        </div>
        {upProg && (
          <div className="md:col-span-3">
            <UploadRing prog={upProg} />
          </div>
        )}
        {mPreview ? (
          <div className="md:col-span-3 flex flex-wrap items-start gap-3  border border-neutral-200 bg-neutral-50 p-3">
            {mPreview.type === "image" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={mPreview.url} alt="preview" style={{ height: 100, width: 140, objectFit: "cover" }} className=" border border-neutral-300" />
            ) : (
              <video src={mPreview.url} style={{ height: 100, width: 140, objectFit: "cover" }} controls className=" border border-neutral-300" />
            )}
            <div className="flex-1">
              <p className="text-xs font-medium">{mPreview.name}</p>
              <p className="text-xs text-neutral-500">Preview — click Save to upload & attach to this product.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveMedia}
                disabled={uploading}
                className="inline-flex items-center justify-center  bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gold hover:text-neutral-950 disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={clearMediaPreview}
                className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-950 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500 md:col-span-3">JPG, PNG, WEBP, GIF images or MP4, WEBM, MOV videos. Pick a file to preview before upload.</p>
        )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { clearMediaPreview(); setShowMediaForm(false); }}
                className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="mt-8 flex items-center gap-2 text-lg font-bold text-neutral-900">
        <i className="bi bi-tags text-gold-deep" /> Attributes
      </h2>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAttrForm(true)}
          className="inline-flex items-center justify-center gap-1.5  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <i className="bi bi-plus-lg" /> Add Attribute
        </button>
      </div>
      {showAttrForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setShowAttrForm(false)}
        >
          <form
            onSubmit={addAttr}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg  border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">Add Attribute</h3>
            <div className="mt-4 grid gap-3">
              <select value={aAttr} onChange={(e) => setAAttr(e.target.value)} className={input}>
                <option value="">-- select attribute --</option>
                {attributes.map((a) => (
                  <option key={a.attribute_id} value={a.attribute_id}>{a.attribute_name}</option>
                ))}
              </select>
              <input value={aValue} onChange={(e) => setAValue(e.target.value)} placeholder="Value" className={input} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAttrForm(false)}
                className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center  bg-neutral-950 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
      {attrValues.length === 0 ? (
        <p className="mt-2  border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">No attribute values yet.</p>
      ) : (
        <>
          <div className="mt-2 flex justify-end">
            <input
              value={aSearch}
              onChange={(e) => { setASearch(e.target.value); setAPage(1); }}
              placeholder="Search attributes..."
              className="w-full max-w-md  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            />
          </div>
          <div className="mt-2 overflow-x-auto  border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
                <th className="px-4 py-3">Attribute</th><th className="px-4 py-3">Value</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shownAttrs.map((av) => (
                <tr key={av.product_attribute_value_id} className="border-b transition-colors last:border-0 hover:bg-[#faf8f4]">
                  <td className="px-4 py-3">{attrName(av.attribute_id)}</td>
                  <td className="px-4 py-3">{av.attribute_value}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button type="button" onClick={() => deleteAttr(av)} className="text-red-600 underline underline-offset-2 transition-colors hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={aPage} setPage={setAPage} total={filteredAttrs.length} pageSize={aPageSize} setPageSize={setAPageSize} />
        </>
      )}

      <h2 className="mt-8 flex items-center gap-2 text-lg font-bold text-neutral-900">
        <i className="bi bi-search text-gold-deep" /> SEO
      </h2>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setShowSeoForm(true)}
          className="inline-flex items-center justify-center gap-1.5  border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
        >
          <i className="bi bi-pencil" /> Edit SEO
        </button>
      </div>
      {showSeoForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setShowSeoForm(false)}
        >
          <form
            onSubmit={saveSeo}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto  border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">Edit SEO</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={seoForm.seo_title} onChange={(e) => setSeoForm((f) => ({ ...f, seo_title: e.target.value }))} placeholder="SEO Title" className={input} />
              <input value={seoForm.seo_keywords} onChange={(e) => setSeoForm((f) => ({ ...f, seo_keywords: e.target.value }))} placeholder="Keywords" className={input} />
              <textarea value={seoForm.seo_description} onChange={(e) => setSeoForm((f) => ({ ...f, seo_description: e.target.value }))} placeholder="SEO Description" rows={2} className={`${input} md:col-span-2`} />
              <input value={seoForm.og_image_url} onChange={(e) => setSeoForm((f) => ({ ...f, og_image_url: e.target.value }))} placeholder="OG Image URL" className={`${input} md:col-span-2`} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSeoForm(false)}
                className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center  bg-neutral-950 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                Save SEO
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
