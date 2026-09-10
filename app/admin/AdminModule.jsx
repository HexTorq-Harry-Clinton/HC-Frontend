"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, unwrap, API_BASE_URL } from "@/lib/api";
import { adminModule, REFS } from "@/lib/admin";

// Full CRUD engine for every admin lookup/content table (registry in lib/admin.js).
// Search across text columns, Active toggles, file uploads, FK dropdowns.
// lock={{field, value, label}} nests creation inside a parent entry:
// rows auto-filter to the parent and new records inherit its id.
const inputCls = "w-full border border-neutral-300 bg-white px-3 py-2 text-sm";

function cellText(r, c, refOptions = {}) {
  if (c.type === "checkbox") {
    const v = r[c.key];
    return v === 1 || v === true ? "Yes" : "No";
  }
  if (c.ref) {
    const hit = (refOptions[c.ref] || []).find((o) => String(o.value) === String(r[c.key]));
    if (hit) return hit.label;
  }
  const v = r[c.key];
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function AdminModulePage({ module: slug, lock }) {
  const mod = adminModule(slug);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(null);
  const [refOptions, setRefOptions] = useState({});

  // FK dropdown options (v1 optionsLoader pattern): loaded once per ref.
  useEffect(() => {
    if (!mod) return undefined;
    const refs = [...new Set(mod.columns.filter((c) => c.ref).map((c) => c.ref))];
    let live = true;
    Promise.all(
      refs.map((r) =>
        apiFetch(REFS[r].endpoint)
          .then(unwrap)
          .then((list) => [r, Array.isArray(list) ? list : []])
          .catch(() => [r, []])
      )
    ).then((pairs) => {
      if (!live) return;
      const map = {};
      pairs.forEach(([r, list]) => {
        const def = REFS[r];
        map[r] = list.map((row) => ({
          value: row[def.id],
          label: def.labels.map((k) => row[k]).find((v) => v) || row[def.id],
        }));
      });
      setRefOptions(map);
    });
    return () => {
      live = false;
    };
  }, [mod]);

  // Mount + refresh fetch: state updates happen only in the async continuation.
  // (The parent renders <AdminModulePage key={module}> so switching modules
  // always mounts fresh state — no reset effect needed.)
  useEffect(() => {
    if (!mod) return undefined;
    let live = true;
    apiFetch(mod.endpoint)
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
  }, [mod, refresh]);

  const reload = () => setRefresh((n) => n + 1);

  const visible = useMemo(() => {
    const base = lock ? rows.filter((r) => String(r[lock.field]) === String(lock.value)) : rows;
    const needle = search.trim().toLowerCase();
    if (!needle || !mod) return base;
    return base.filter((r) =>
      mod.columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(needle))
    );
  }, [rows, search, mod, lock]);

  if (!mod) return <p className="text-sm text-neutral-500">Unknown module.</p>;

  const set = (k, type) => (e) =>
    setForm((f) => ({ ...f, [k]: type === "checkbox" ? e.target.checked : e.target.value }));

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = typeof window !== "undefined" ? localStorage.getItem("hc_token") : null;
      const res = await fetch(`${API_BASE_URL}/FileUpload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      const url = data?.data?.virtualPath || data?.virtualPath || data?.data?.url || data?.url;
      if (url) {
        setForm((f) => ({ ...f, [key]: url }));
        setMsg("File uploaded — save the record to keep it.");
      } else {
        setMsg("Upload did not return a URL.");
      }
    } catch {
      setMsg("Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const body = { ...form };
    if (lock) body[lock.field] = lock.value;
    mod.columns.forEach((c) => {
      if (c.type === "checkbox") {
        const v = body[c.key];
        body[c.key] = v === true || v === 1 || v === "1" ? 1 : 0;
      }
    });
    try {
      if (editing) {
        await apiFetch(mod.endpoint, { method: "PUT", body: { [mod.id]: editing, ...body, luu: "ADMIN_PORTAL" } });
        setMsg("Updated.");
      } else {
        await apiFetch(mod.endpoint, { method: "POST", body: { ...body, rcu: "ADMIN_PORTAL" } });
        setMsg("Added.");
      }
      setForm({});
      setEditing(null);
      reload();
    } catch (err) {
      setMsg(err.message || "Save failed");
    }
  };

  const edit = (r) => {
    const f = {};
    mod.columns.forEach((c) => {
      const v = r[c.key];
      f[c.key] = c.type === "checkbox" ? v === 1 || v === true : v ?? "";
    });
    setForm(f);
    setEditing(r[mod.id]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (r) => {
    if (!window.confirm("Delete this record?")) return;
    await apiFetch(mod.endpoint, { method: "DELETE", body: { [mod.id]: r[mod.id], luu: "ADMIN_PORTAL" } }).catch(() => null);
    reload();
  };

  const toggle = async (r) => {
    if (!mod.toggle) return;
    const cur = r[mod.toggle];
    const next = cur === 1 || cur === true ? 0 : 1;
    await apiFetch(mod.endpoint, {
      method: "PUT",
      body: { [mod.id]: r[mod.id], [mod.toggle]: next, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
  };

  const renderField = (c) => {
    if (c.type === "textarea") {
      return <textarea value={form[c.key] || ""} onChange={set(c.key)} rows={2} className={`${inputCls} mt-1 font-normal`} />;
    }
    if (c.type === "checkbox") {
      return <input type="checkbox" checked={!!form[c.key]} onChange={set(c.key, "checkbox")} className="ml-2" />;
    }
    if (c.type === "select") {
      const opts = c.ref ? refOptions[c.ref] || [] : c.options || [];
      return (
        <select value={form[c.key] || ""} onChange={set(c.key)} required={!!c.required} className={`${inputCls} mt-1 font-normal`}>
          <option value="">Select {c.label}</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{typeof o === "string" ? o : o.label}</option>
          ))}
        </select>
      );
    }
    if (c.type === "upload") {
      return (
        <span className="mt-1 block font-normal">
          <input
            value={form[c.key] || ""}
            onChange={set(c.key)}
            placeholder="URL or upload below"
            className={inputCls}
          />
          <input
            type="file"
            onChange={(e) => handleUpload(c.key, e.target.files?.[0])}
            className="mt-1 w-full text-xs"
          />
          {uploading === c.key && <span className="text-xs text-neutral-500">Uploading...</span>}
        </span>
      );
    }
    return (
      <input
        type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}
        value={form[c.key] || ""}
        onChange={set(c.key, c.type)}
        className={`${inputCls} mt-1 font-normal`}
      />
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{mod.title}</h1>
          <p className="mt-1 text-xs text-neutral-500">{rows.length} record(s) • {mod.endpoint}</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      {msg && <p className="mt-3 bg-white p-3 text-sm shadow-sm">{msg}</p>}

      {!mod.readOnly && (
        <form onSubmit={submit} className="mt-4 grid gap-3 bg-white p-5 shadow-sm md:grid-cols-2">
          {lock && (
            <p className="bg-neutral-100 p-2 text-xs font-semibold md:col-span-2">
              Adding to: {lock.label}
            </p>
          )}
          {mod.columns.filter((c) => !lock || c.key !== lock.field).map((c) => (
            <label key={c.key} className={`block text-xs font-semibold uppercase tracking-wider text-neutral-500 ${c.type === "textarea" ? "md:col-span-2" : ""}`}>
              {c.label}
              {renderField(c)}
            </label>
          ))}
          <div className="flex gap-2 md:col-span-2">
            <button className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white">{editing ? "Update" : "Add"}</button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm({}); }} className="border px-4 py-2 text-sm">Cancel</button>
            )}
          </div>
        </form>
      )}

      <div className="mt-4 overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-neutral-500">
              {mod.columns.map((c) => (
                <th key={c.key} className="p-3">{c.label}</th>
              ))}
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={r[mod.id] || i} className="border-b last:border-0">
                {mod.columns.map((c) => (
                  <td key={c.key} className="max-w-xs truncate p-3">
                    {cellText(r, c, refOptions)}
                  </td>
                ))}
                <td className="whitespace-nowrap p-3 text-right">
                  {mod.toggle && (
                    <button onClick={() => toggle(r)} className="mr-3 underline">
                      {(r[mod.toggle] === 1 || r[mod.toggle] === true) ? "Deactivate" : "Activate"}
                    </button>
                  )}
                  {!mod.readOnly && (
                    <>
                      <button onClick={() => edit(r)} className="mr-3 underline">Edit</button>
                      <button onClick={() => remove(r)} className="text-red-600 underline">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
