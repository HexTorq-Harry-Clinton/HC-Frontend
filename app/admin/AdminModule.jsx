"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import { adminModule } from "@/lib/admin";

// Full CRUD engine for every admin lookup/content table (registry in lib/admin.js).
// No bespoke admin pages needed for simple tables.

const inputCls = "w-full border border-neutral-300 bg-white px-3 py-2 text-sm";

export default function AdminModulePage({ module: slug }) {
  const mod = adminModule(slug);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  // Mount + refresh fetch: state updates happen only in the async continuation.
  // (The parent renders <AdminModulePage key={module}> so switching modules
  // always mounts fresh state — no reset effect needed.)
  useEffect(() => {
    if (!mod) return;
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

  if (!mod) return <p className="text-sm text-neutral-500">Unknown module.</p>;

  const set = (k, type) => (e) =>
    setForm((f) => ({ ...f, [k]: type === "checkbox" ? e.target.checked : type === "number" ? e.target.value : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      if (editing) {
        await apiFetch(mod.endpoint, { method: "PUT", body: { [mod.id]: editing, ...form, luu: "ADMIN_PORTAL" } });
        setMsg("Updated.");
      } else {
        await apiFetch(mod.endpoint, { method: "POST", body: { ...form, rcu: "ADMIN_PORTAL" } });
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
    mod.columns.forEach((c) => { f[c.key] = r[c.key] ?? ""; });
    setForm(f);
    setEditing(r[mod.id]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (r) => {
    if (!confirm("Delete this record?")) return;
    await apiFetch(mod.endpoint, { method: "DELETE", body: { [mod.id]: r[mod.id], luu: "ADMIN_PORTAL" } }).catch(() => null);
    reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">{mod.title}</h1>
      <p className="mt-1 text-xs text-neutral-500">{rows.length} record(s) • {mod.endpoint}</p>
      {msg && <p className="mt-3 bg-white p-3 text-sm shadow-sm">{msg}</p>}

      {!mod.readOnly && (
        <form onSubmit={submit} className="mt-4 grid gap-3 bg-white p-5 shadow-sm md:grid-cols-2">
          {mod.columns.map((c) => (
            <label key={c.key} className={`block text-xs font-semibold uppercase tracking-wider text-neutral-500 ${c.type === "textarea" ? "md:col-span-2" : ""}`}>
              {c.label}
              {c.type === "textarea" ? (
                <textarea value={form[c.key] || ""} onChange={set(c.key)} rows={2} className={`${inputCls} mt-1 font-normal`} />
              ) : c.type === "checkbox" ? (
                <input type="checkbox" checked={!!form[c.key]} onChange={set(c.key, "checkbox")} className="ml-2" />
              ) : (
                <input type={c.type === "number" ? "number" : "text"} value={form[c.key] || ""} onChange={set(c.key, c.type)} className={`${inputCls} mt-1 font-normal`} />
              )}
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
              {!mod.readOnly && <th className="p-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r[mod.id] || i} className="border-b last:border-0">
                {mod.columns.map((c) => (
                  <td key={c.key} className="max-w-xs truncate p-3">
                    {c.type === "checkbox" ? (r[c.key] ? "Yes" : "No") : String(r[c.key] ?? "—")}
                  </td>
                ))}
                {!mod.readOnly && (
                  <td className="whitespace-nowrap p-3 text-right">
                    <button onClick={() => edit(r)} className="mr-3 underline">Edit</button>
                    <button onClick={() => remove(r)} className="text-red-600 underline">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
