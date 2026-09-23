"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap, resolveUploadUrl, revalidateSite, upsertHomeKV, homeKV } from "@/lib/api";
import FilePick from "../FilePick";
import UploadRing from "../UploadRing";
import useLockBody from "../useLockBody";
import useUploader from "../useUploader";

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
  // Homepage section titles (same row — edited here, live on the homepage).
  { key: "home_spotlight_title", label: "Spotlight Title", type: "text" },
  { key: "home_style_by_hc_title", label: "Style By HC Title", type: "text" },
  { key: "home_reviews_eyebrow", label: "Reviews Eyebrow", type: "text" },
  { key: "home_reviews_title", label: "Reviews Title", type: "text" },
  { key: "home_reviews_subtitle", label: "Reviews Subtitle", type: "textarea" },
  { key: "home_faqs_title", label: "FAQs Title", type: "text" },
  { key: "home_faqs_subtitle", label: "FAQs Subtitle", type: "textarea" },
];

export default function AdminSettingsPage() {
  const [settingId, setSettingId] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  // Staged logos: { fieldKey: File } — picked, uploaded on Save (single-submit).
  const [staged, setStaged] = useState({});
  const [busy, setBusy] = useState(null); // null | "uploading" | "saving"
  // Uploads with live ring progress (%, MB, speed, ETA).
  const { upProg, upload } = useUploader();
  // Settings edit ALWAYS lives in the popup — never inline.
  const [showForm, setShowForm] = useState(false);
  useLockBody(showForm);

  useEffect(() => {
    let live = true;
    Promise.all([
      apiFetch("/Settings").then(unwrap).catch(() => []),
      homeKV().catch(() => ({})),
    ])
      .then(([list, kv]) => {
        if (!live) return;
        const row = (Array.isArray(list) ? list : [])[0];
        if (row) {
          setSettingId(row.setting_id);
          const f = {};
          FIELDS.forEach((fld) => {
            // home_* titles come from the key-value store, rest from the row.
            const v = fld.key.startsWith("home_") ? kv[fld.key] : row[fld.key];
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
          body[key] = await upload(staged[key], { path: "SITE_BRANDING" });
        }
      } catch (err) {
        setMsg(err.message || "Logo upload failed.");
        setBusy(null);
        return;
      }
    }
    setBusy("saving");
    try {
      // Section titles (home_*) live in the key-value store; the rest stays
      // on the singleton Settings row.
      const kv = {};
      for (const k of Object.keys(body)) {
        if (k.startsWith("home_")) {
          kv[k] = body[k];
          delete body[k];
        }
      }
      if (Object.keys(kv).length > 0) await upsertHomeKV(kv, "titles");
      if (settingId) {
        await apiFetch("/Settings", { method: "PUT", body: { setting_id: settingId, ...body } });
      } else {
        const created = unwrap(await apiFetch("/Settings", { method: "POST", body: { ...body, rcu: "ADMIN_PORTAL" } }));
        const row = Array.isArray(created) ? created[0] : created;
        if (row?.setting_id) setSettingId(row.setting_id);
      }
      setMsg("Settings saved.");
      setStaged({});
      setShowForm(false);
      revalidateSite();
    } catch (err) {
      setMsg(err.message || "Save failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div>
        <p className="eyebrow text-gold-deep">Harry Clinton</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900">Settings</h1>
      </div>
      {msg && (
        <p className="mt-3  border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm text-neutral-700">
          {msg}
        </p>
      )}
      <div className="mt-4 max-w-3xl  border border-neutral-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          {FIELDS.filter((f) => f.type !== "checkbox").map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{f.label}</dt>
              <dd className="mt-0.5 truncate font-medium text-neutral-900">
                {f.type === "upload"
                  ? staged[f.key]?.name || form[f.key] || "—"
                  : f.type === "checkbox"
                    ? ""
                    : String(form[f.key] || "—").slice(0, 80)}
              </dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 inline-flex items-center justify-center gap-1.5  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <i className="bi bi-pencil" /> Edit Settings
        </button>
      </div>
      {showForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setShowForm(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto  border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">Edit Settings</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block text-xs font-semibold uppercase tracking-wider text-neutral-500 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
            {f.label}
            {f.type === "textarea" ? (
              <textarea value={form[f.key] || ""} onChange={set(f.key)} rows={2} className="mt-1 w-full  border border-neutral-300 bg-white px-3 py-2 text-sm font-normal text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25" />
            ) : f.type === "checkbox" ? (
              <input type="checkbox" checked={!!form[f.key]} onChange={set(f.key, "checkbox")} className="ml-2 h-4 w-4  border-neutral-300 text-neutral-950 focus:ring-gold/40" />
            ) : f.type === "upload" ? (
              <span className="mt-1 block font-normal">
                <input value={form[f.key] || ""} onChange={set(f.key)} placeholder="Logo URL or pick a file below" className="w-full  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25" />
                <div className="mt-1">
                  <FilePick
                    small
                    accept="image/*"
                    onPick={(file) => stageFile(f.key, file)}
                    fileName={staged[f.key]?.name}
                    hint="Logo image — click or drop"
                  />
                </div>
                {staged[f.key] ? (
                  <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-green-800">
                    Staged: {staged[f.key].name}
                    <button type="button" onClick={() => clearStaged(f.key)} className="font-normal text-red-600 underline underline-offset-2 transition-colors hover:text-red-700">
                      remove
                    </button>
                  </span>
                ) : (
                  <span className="mt-1 block text-xs text-neutral-500">No file staged — typed URL (if any) will be used.</span>
                )}
                {form[f.key] && !staged[f.key] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveUploadUrl(form[f.key])} alt={f.label} style={{ height: 48, marginTop: 6 }} className=" border border-neutral-200" />
                )}
              </span>
            ) : (
              <input type="text" value={form[f.key] || ""} onChange={set(f.key)} className="mt-1 w-full  border border-neutral-300 bg-white px-3 py-2 text-sm font-normal text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25" />
            )}
          </label>
        ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy !== null}
                className="inline-flex items-center justify-center  bg-neutral-950 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "uploading" ? "Uploading..." : busy === "saving" ? "Saving..." : "Save Settings"}
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
    </div>
  );
}
