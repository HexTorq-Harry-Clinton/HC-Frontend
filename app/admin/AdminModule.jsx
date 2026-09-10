"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, unwrap, revalidateSite, uploadFile, detectMediaType } from "@/lib/api";
import { adminModule, REFS } from "@/lib/admin";
import ActiveToggle from "@/components/ActiveToggle";
import { useToast } from "./ToastProvider";
import { useConfirm } from "./ConfirmProvider";

// Full CRUD engine for every admin lookup/content table (registry in lib/admin.js).
// Search across text columns, Active toggles, file uploads, FK dropdowns.
// lock={{field, value, label}} nests creation inside a parent entry:
// rows auto-filter to the parent and new records inherit its id.
const inputCls = "w-full border border-neutral-300 bg-white px-3 py-2 text-sm";

function cellText(r, c, refOptions = {}) {
  if (c.type === "checkbox") {
    const v = r[c.key];
    return v === 1 || v === true ? "Yes" : "No";
  }  if (c.ref) {
    const hit = (refOptions[c.ref] || []).find((o) => String(o.value) === String(r[c.key]));
    if (hit) return hit.label;
  }
  const v = r[c.key];
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function AdminModulePage({ module: slug, lock }) {
  const mod = adminModule(slug);
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  // Staged files: { columnKey: File } — picked in the form, uploaded on
  // Submit (single-submit flow). Nothing hits the server until Submit.
  const [staged, setStaged] = useState({});
  const [busy, setBusy] = useState(null); // null | "uploading" | "saving"
  const [refOptions, setRefOptions] = useState({});
  const [workspace, setWorkspace] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState(0);

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

  // Nested workspace: open a parent row to manage its children inline.
  // Child records auto-inherit the parent id — no picking IDs.
  if (workspace && mod.children?.length > 0) {
    const child = mod.children[workspaceTab] || mod.children[0];
    const parentLabel =
      mod.columns
        .slice(0, 2)
        .map((c) => workspace[c.key])
        .filter(Boolean)
        .join(" • ") || workspace[mod.id];
    return (
      <div>
        <button onClick={() => { setWorkspace(null); reload(); }} className="text-sm underline">
          ← Back to {mod.title}
        </button>
        <h1 className="mt-2 text-2xl font-bold">{parentLabel}</h1>
        <p className="mt-1 text-xs text-neutral-500">
          Everything created below automatically belongs to this {mod.title.slice(0, -1).toLowerCase() || "record"} — no need to pick it again.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {mod.children.map((c, i) => (
            <button
              key={c.slug}
              onClick={() => setWorkspaceTab(i)}
              className={`border px-4 py-2 text-sm font-semibold ${
                (workspaceTab || 0) === i ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
        <div className="mt-4" key={child.slug}>
          <AdminModulePage
            module={child.slug}
            lock={{ field: child.fk, value: workspace[mod.id], label: parentLabel }}
          />
        </div>
      </div>
    );
  }

  const set = (k, type) => (e) =>
    setForm((f) => ({ ...f, [k]: type === "checkbox" ? e.target.checked : e.target.value }));

  // Stage a file for single-submit: no upload yet. Staged file wins over
  // the typed URL on Submit. Auto-fills media_type when the module has one.
  const stageFile = (key, file) => {
    if (!file) return;
    setStaged((m) => ({ ...m, [key]: file }));
    if (mod?.columns.some((c) => c.key === "media_type")) {
      const t = detectMediaType(file);
      setForm((f) => ({ ...f, media_type: t }));
    }
    setMsg(`Staged: ${file.name} — click ${editing ? "Update" : "Add"} to upload & save.`);
  };

  const clearStaged = (key) => {
    setStaged((m) => {
      const next = { ...m };
      delete next[key];
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const body = { ...form };
    if (lock) body[lock.field] = lock.value;
    // Guard: FK dropdowns must hold a value from the loaded options.
    // This makes an FK-conflict insert impossible from this UI.
    for (const c of mod.columns) {
      if (lock && c.key === lock.field) continue;
      if (c.type === "select" && c.ref) {
        const opts = refOptions[c.ref] || [];
        const v = body[c.key];
        if (!v || (opts.length > 0 && !opts.some((o) => String(o.value) === String(v)))) {
          setMsg(`Please select a valid ${c.label} from the dropdown.`);
          return;
        }
      }
    }
    mod.columns.forEach((c) => {
      if (c.type === "checkbox") {
        const v = body[c.key];
        body[c.key] = v === true || v === 1 || v === "1" ? 1 : 0;
      }
    });
    // Single-submit media flow: upload staged files FIRST, then save the
    // row with the returned paths. Any upload failure aborts the save and
    // keeps the form intact — the row is never written without its file.
    const uploadCols = mod.columns.filter((c) => c.type === "upload" && staged[c.key]);
    if (uploadCols.length > 0) {
      setBusy("uploading");
      setMsg(`Uploading ${uploadCols.length} file(s)...`);
      try {
        for (const c of uploadCols) {
          body[c.key] = await uploadFile(staged[c.key]);
        }
      } catch (err) {
        const friendly = err.message || "Upload failed.";
        setMsg(friendly);
        toast?.error(friendly);
        setBusy(null);
        return;
      }
    }
    setBusy("saving");
    try {
      if (editing) {
        await apiFetch(mod.endpoint, { method: "PUT", body: { [mod.id]: editing, ...body, luu: "ADMIN_PORTAL" } });
        setMsg("Updated.");
        toast?.success(`${mod.title} updated.`);
      } else {
        await apiFetch(mod.endpoint, { method: "POST", body: { ...body, rcu: "ADMIN_PORTAL" } });
        setMsg("Added.");
        toast?.success(`${mod.title} created.`);
      }
      setForm({});
      setStaged({});
      setEditing(null);
      reload();
      revalidateSite();
    } catch (err) {
      const raw = err.message || "Save failed";
      const fk = raw.match(/table "dbo\.(\w+)"/);
      const friendly = /FOREIGN KEY/i.test(raw)
        ? `That related record does not exist${fk ? ` (missing in ${fk[1]})` : ""}. Please pick it from the dropdown instead of typing an ID.`
        : raw;
      setMsg(friendly);
      toast?.error(friendly);
    } finally {
      setBusy(null);
    }
  };

  const edit = (r) => {
    const f = {};
    mod.columns.forEach((c) => {
      const v = r[c.key];
      f[c.key] = c.type === "checkbox" ? v === 1 || v === true : v ?? "";
    });
    setForm(f);
    setStaged({});
    setEditing(r[mod.id]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (r) => {
    const singular = mod.title.replace(/s$/, "");
    const ok = await confirm({
      title: `Delete this ${singular}?`,
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch(mod.endpoint, { method: "DELETE", body: { [mod.id]: r[mod.id], luu: "ADMIN_PORTAL" } }).catch(() => null);
    toast?.success(`${mod.title} deleted.`);
    reload();
    revalidateSite();
  };

  const toggle = async (r, next) => {
    if (!mod.toggle) return;
    const value = typeof next === "boolean" ? (next ? 1 : 0) : next;
    await apiFetch(mod.endpoint, {
      method: "PUT",
      body: { [mod.id]: r[mod.id], [mod.toggle]: value, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    reload();
    revalidateSite();
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
        <span className="mt-1 block font-normal">
          <select value={form[c.key] || ""} onChange={set(c.key)} required={!!c.required} className={inputCls}>
            <option value="">Select {c.label}</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{typeof o === "string" ? o : o.label}</option>
            ))}
          </select>
          {c.ref && opts.length === 0 && (
            <span className="mt-1 block text-xs text-amber-700">
              Options could not be loaded — check the API, then refresh. Saving is blocked until you pick from the list.
            </span>
          )}
        </span>
      );
    }
    // media_type is auto-detected from the staged file — display only.
    if (c.key === "media_type" && mod.columns.some((x) => x.type === "upload")) {
      return (
        <span className="mt-1 block font-normal">
          <input value={form[c.key] || ""} readOnly placeholder="Auto (stage a file)" className={`${inputCls} bg-neutral-100`} />
          <span className="mt-1 block text-xs text-neutral-500">Auto-detected from the staged file.</span>
        </span>
      );
    }
    if (c.type === "upload") {
      const file = staged[c.key];
      return (
        <span className="mt-1 block font-normal">
          <input
            value={form[c.key] || ""}
            onChange={set(c.key)}
            placeholder="URL or pick a file below"
            className={inputCls}
          />
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => stageFile(c.key, e.target.files?.[0])}
            className="mt-1 w-full text-xs"
          />
          {file ? (
            <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-green-800">
              Staged: {file.name}
              <button type="button" onClick={() => clearStaged(c.key)} className="font-normal text-red-600 underline">
                remove
              </button>
            </span>
          ) : (
            <span className="mt-1 block text-xs text-neutral-500">No file staged — typed URL (if any) will be used.</span>
          )}
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
          placeholder={`Search ${mod.title}...`}
          className="border border-neutral-300 bg-white px-3 py-2 text-sm"
          style={{ minWidth: 200 }}
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
            <button
              disabled={busy !== null}
              className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy === "uploading" ? "Uploading..." : busy === "saving" ? "Saving..." : editing ? "Update" : "Add"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm({}); setStaged({}); }} className="border px-4 py-2 text-sm">Cancel</button>
            )}
          </div>
        </form>
      )}

      <p className="mb-2 mt-1 text-xs text-neutral-500">
        {visible.length} record{visible.length === 1 ? "" : "s"}
      </p>
      <div className="overflow-x-auto bg-white shadow-sm">
        <table className="w-full bg-white text-left text-sm">
          <thead>
            <tr className="bg-[#17161a] text-[11px] font-bold uppercase text-white">
              {mod.columns.map((c) => (
                <th key={c.key} className="p-3">{c.label}</th>
              ))}
              <th className="w-[140px] p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={mod.columns.length + 1} className="p-5 text-center text-neutral-500">
                  No records found.
                </td>
              </tr>
            ) : (
            visible.map((r, i) => (
              <tr key={r[mod.id] || i} className="border-b transition last:border-0 hover:bg-[#faf8f4]">
                {mod.columns.map((c) => (
                  <td key={c.key} className="max-w-xs truncate p-3">
                    {mod.toggle && c.key === mod.toggle ? (
                      <ActiveToggle active={r[c.key]} onToggle={(next) => toggle(r, next)} />
                    ) : (
                      cellText(r, c, refOptions)
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap p-3 text-right">
                  {mod.children?.length > 0 && (
                    <button
                      onClick={() => { setWorkspace(r); setWorkspaceTab(0); }}
                      className="mr-3 font-semibold underline"
                    >
                      Open
                    </button>
                  )}
                  {!mod.readOnly && (
                    <>
                      <button onClick={() => edit(r)} className="mr-3 underline">Edit</button>
                      {!mod.noDelete && (
                        <button onClick={() => remove(r)} className="text-red-600 underline">Delete</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
