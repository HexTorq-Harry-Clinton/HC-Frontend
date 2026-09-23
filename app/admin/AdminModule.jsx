"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, unwrap, revalidateSite, detectMediaType, friendlyError } from "@/lib/api";
import { adminModule, REFS } from "@/lib/admin";
import ActiveToggle from "@/components/ActiveToggle";
import FilePick from "./FilePick";
import HtmlEditor from "./HtmlEditor";
import Pagination, { paginate } from "./Pagination";
import UploadRing from "./UploadRing";
import useLockBody from "./useLockBody";
import useUploader from "./useUploader";
import { useToast } from "./ToastProvider";
import { useConfirm } from "./ConfirmProvider";

// Full CRUD engine for every admin lookup/content table (registry in lib/admin.js).
// Search across text columns, Active toggles, file uploads, FK dropdowns.
// lock={{field, value, label}} nests creation inside a parent entry:
// rows auto-filter to the parent and new records inherit its id.

// Shared admin design tokens (dark + gold, matches AdminShell).
const inputCls =
  "w-full  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const btnPrimary =
  "inline-flex items-center justify-center  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";
const rowAction =
  "font-semibold text-neutral-700 underline underline-offset-2 transition-colors hover:text-gold-deep";
const rowDanger =
  "text-red-600 underline underline-offset-2 transition-colors hover:text-red-700";
const panelCls = " border border-neutral-200 bg-white p-6 shadow-sm";
const tableWrapCls = "overflow-x-auto  border border-neutral-200 bg-white shadow-sm";
const thCls = "px-4 py-3 whitespace-nowrap";
const tdCls = "max-w-xs truncate px-4 py-3";

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
  // Uploads with live ring progress (%, MB, speed, ETA).
  const { upProg, upload } = useUploader();
  // Create/update ALWAYS live in the popup — never inline. closeForm resets.
  const [showForm, setShowForm] = useState(false);
  useLockBody(showForm);
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({});
    setStaged({});
  };
  const openCreate = () => {
    setForm({});
    setStaged({});
    setEditing(null);
    setShowForm(true);
  };
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
  // Pagination (page sizes 5/10/15/25/50) — resets on search/module change.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    setPage(1);
  }, [search, mod]);
  const shown = paginate(visible, page, pageSize);

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
        <button
          type="button"
          onClick={() => { setWorkspace(null); reload(); }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 transition-colors hover:text-gold-deep"
        >
          <i className="bi bi-arrow-left" /> Back to {mod.title}
        </button>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-neutral-900">{parentLabel}</h1>
        <p className="mt-1 text-xs text-neutral-500">
          Everything created below automatically belongs to this {mod.title.slice(0, -1).toLowerCase() || "record"} — no need to pick it again.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {mod.children.map((c, i) => (
            <button
              type="button"
              key={c.slug}
              onClick={() => setWorkspaceTab(i)}
              className={` border px-4 py-2 text-sm font-semibold transition-colors ${
                (workspaceTab || 0) === i
                  ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                  : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
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
    // Guard: slug columns must be unique within THIS table — a duplicate
    // slug would shadow another row in the storefront resolver. Checked
    // against loaded rows before anything hits the server (self excluded).
    for (const c of mod.columns) {
      if (!c.key.toLowerCase().includes("slug")) continue;
      const val = String(body[c.key] || "").trim().toLowerCase();
      if (!val) continue;
      const clash = (rows || []).find(
        (r) =>
          String(r[c.key] || "").trim().toLowerCase() === val &&
          String(r[mod.id]) !== String(editing) &&
          r.isdeleted !== 1 &&
          r.isdeleted !== true
      );
      if (clash) {
        const m = `That ${c.label} (“${body[c.key]}”) already exists in ${mod.title} — pick a unique one.`;
        setMsg(m);
        toast?.error(m);
        return;
      }
    }
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
          body[c.key] = await upload(staged[c.key]);
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
      setShowForm(false);
      reload();
      revalidateSite();
    } catch (err) {
      const m = friendlyError(err, "Save failed");
      setMsg(m);
      toast?.error(m);
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
    setShowForm(true);
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
    // Rich HTML field (TipTap editor) — stored as HTML, rendered sanitized.
    if (c.type === "rich") {
      return (
        <span className="mt-1 block font-normal">
          <HtmlEditor
            value={form[c.key] || ""}
            onChange={(html) => setForm((f) => ({ ...f, [c.key]: html }))}
            placeholder={`${c.label}…`}
          />
        </span>
      );
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
          <div className="mt-1">
            <FilePick
              small
              accept="image/*,video/*"
              onPick={(f) => stageFile(c.key, f)}
              fileName={file?.name}
              hint="Image / video — click or drop"
            />
          </div>
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
          <p className="eyebrow text-gold-deep">Harry Clinton</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">{mod.title}</h1>
          <p className="mt-1 text-xs text-neutral-500">{rows.length} record(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${mod.title}...`}
            className=" border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            style={{ minWidth: 200 }}
          />
          {!mod.readOnly && (
            <button type="button" onClick={openCreate} className={btnPrimary}>
              <i className="bi bi-plus-lg" /> New
            </button>
          )}
        </div>
      </div>
      {msg && (
        <p className="mt-3  border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm text-neutral-700">
          {msg}
        </p>
      )}

      {!mod.readOnly && showForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={closeForm}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto ${panelCls}`}
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">
              {editing ? `Edit ${mod.title.replace(/s$/, "")}` : `New ${mod.title.replace(/s$/, "")}`}
            </h3>
            {lock && (
              <p className="mt-2  bg-neutral-100 p-2 text-xs font-semibold">
                Adding to: {lock.label}
              </p>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {mod.columns.filter((c) => !lock || c.key !== lock.field).map((c) => (
                <label
                  key={c.key}
                  className={`block text-xs font-semibold uppercase tracking-wider text-neutral-500 ${c.type === "textarea" || c.type === "rich" ? "md:col-span-2" : ""}`}
                >
                  {c.label}
                  {renderField(c)}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={closeForm} className={btnOutline}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy !== null}
                className={btnPrimary}
              >
                {busy === "uploading" ? "Uploading..." : busy === "saving" ? "Saving..." : editing ? "Update" : "Add"}
              </button>
            </div>
            {upProg && (
              <div className="mt-3">
                <UploadRing prog={upProg} />
              </div>
            )}
          </form>
        </div>
      )}

      <p className="mb-2 mt-1 text-xs text-neutral-500">
        {visible.length} record{visible.length === 1 ? "" : "s"}
      </p>
      <div className={tableWrapCls}>
        <table className="w-full bg-white text-left text-sm">
          <thead>
            <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
              {mod.columns.map((c) => (
                <th key={c.key} className={thCls}>{c.label}</th>
              ))}
              <th className="w-[140px] px-4 py-3">Actions</th>
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
            shown.map((r, i) => (
              <tr key={r[mod.id] || i} className="border-b transition-colors last:border-0 hover:bg-[#faf8f4]">
                {mod.columns.map((c) => (
                  <td key={c.key} className={tdCls}>
                    {mod.toggle && c.key === mod.toggle ? (
                      <ActiveToggle active={r[c.key]} onToggle={(next) => toggle(r, next)} />
                    ) : (
                      cellText(r, c, refOptions)
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {mod.children?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setWorkspace(r); setWorkspaceTab(0); }}
                      className={`mr-3 ${rowAction}`}
                    >
                      Open
                    </button>
                  )}
                  {!mod.readOnly && (
                    <>
                      <button type="button" onClick={() => edit(r)} className={`mr-3 ${rowAction}`}>Edit</button>
                      {!mod.noDelete && (
                        <button type="button" onClick={() => remove(r)} className={rowDanger}>Delete</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} setPage={setPage} total={visible.length} pageSize={pageSize} setPageSize={setPageSize} />
    </div>
  );
}
