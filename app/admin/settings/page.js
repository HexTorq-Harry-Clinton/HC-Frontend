"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, resolveUploadUrl, revalidateSite, uploadFile } from "@/lib/api";

// Site settings singleton: same fields as the previous UI —
// names, descriptions, 3 logo uploads, maintenance toggle.
const FIELDS = [
  { key: "site_name", label: "Site Name", type: "text" },
  { key: "brand_description", label: "Brand Description", type: "textarea" },
  { key: "newsletter_title", label: "Newsletter Title", type: "text" },
  { key: "newsletter_description", label: "Newsletter Description", type: "textarea" },
  { key: "header_logo_url", label: "Header Logo", type: "upload" },
  { key: "brand_logo_url", label: "Brand Logo", type: "upload" },
  { key: "footer_logo_url", label: "Footer Logo", type: "upload" },
  { key: "ismaintenance_mode", label: "Maintenance Mode", type: "checkbox" },
];

export default function AdminSettingsPage() {
  const [settingId, setSettingId] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  // Staged logos: { fieldKey: File } — picked, uploaded on Save (single-submit).
  const [staged, setStaged] = useState({});
  const [busy, setBusy] = useState(null); // null | "uploading" | "saving"

  useEffect(() => {
    let live = true;
    apiFetch("/Settings")
      .then(unwrap)
      .then((list) => {
        if (!live) return;
        const row = (Array.isArray(list) ? list : [])[0];
        if (row) {
          setSettingId(row.setting_id);
          const f = {};
          FIELDS.forEach((fld) => {
            const v = row[fld.key];
            f[fld.key] = fld.type === "checkbox" ? v === 1 || v === true : v || "";
          });
          setForm(f);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const set = (k, type) => (e) =>
    setForm((f) => ({ ...f, [k]: type === "checkbox" ? e.target.checked : e.target.value }));

  // Stage a logo — no upload yet. Staged file wins over the typed URL on Save.
  const stageFile = (key, file) => {
    if (!file) return;
    setStaged((m) => ({ ...m, [key]: file }));
    setMsg(`Staged: ${file.name} — click Save Settings to upload & save.`);
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
    const body = { ...form, ismaintenance_mode: form.ismaintenance_mode ? 1 : 0, luu: "ADMIN_PORTAL" };
    // Upload staged logos FIRST, then save settings with the returned paths.
    const keys = Object.keys(staged);
    if (keys.length > 0) {
      setBusy("uploading");
      setMsg(`Uploading ${keys.length} logo(s)...`);
      try {
        for (const key of keys) {
          body[key] = await uploadFile(staged[key], { path: "SITE_BRANDING" });
        }
      } catch (err) {
        setMsg(err.message || "Logo upload failed.");
        setBusy(null);
        return;
      }
    }
    setBusy("saving");
    try {
      if (settingId) {
        await apiFetch("/Settings", { method: "PUT", body: { setting_id: settingId, ...body } });
      } else {
        const created = unwrap(await apiFetch("/Settings", { method: "POST", body: { ...body, rcu: "ADMIN_PORTAL" } }));
        const row = Array.isArray(created) ? created[0] : created;
        if (row?.setting_id) setSettingId(row.setting_id);
      }
      setMsg("Settings saved.");
      setStaged({});
      revalidateSite();
    } catch (err) {
      setMsg(err.message || "Save failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      {msg && <p className="mt-3 bg-white p-3 text-sm shadow-sm">{msg}</p>}
      <form onSubmit={submit} className="mt-4 grid max-w-3xl gap-4 bg-white p-5 shadow-sm md:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block text-xs font-semibold uppercase tracking-wider text-neutral-500 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
            {f.label}
            {f.type === "textarea" ? (
              <textarea value={form[f.key] || ""} onChange={set(f.key)} rows={2} className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2 text-sm font-normal" />
            ) : f.type === "checkbox" ? (
              <input type="checkbox" checked={!!form[f.key]} onChange={set(f.key, "checkbox")} className="ml-2" />
            ) : f.type === "upload" ? (
              <span className="mt-1 block font-normal">
                <input value={form[f.key] || ""} onChange={set(f.key)} placeholder="Logo URL or pick a file below" className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm" />
                <input type="file" accept="image/*" onChange={(e) => stageFile(f.key, e.target.files?.[0])} className="mt-1 w-full text-xs" />
                {staged[f.key] ? (
                  <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-green-800">
                    Staged: {staged[f.key].name}
                    <button type="button" onClick={() => clearStaged(f.key)} className="font-normal text-red-600 underline">
                      remove
                    </button>
                  </span>
                ) : (
                  <span className="mt-1 block text-xs text-neutral-500">No file staged — typed URL (if any) will be used.</span>
                )}
                {form[f.key] && !staged[f.key] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveUploadUrl(form[f.key])} alt={f.label} style={{ height: 48, marginTop: 6 }} />
                )}
              </span>
            ) : (
              <input type="text" value={form[f.key] || ""} onChange={set(f.key)} className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2 text-sm font-normal" />
            )}
          </label>
        ))}
        <div className="md:col-span-2">
          <button disabled={busy !== null} className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy === "uploading" ? "Uploading..." : busy === "saving" ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
