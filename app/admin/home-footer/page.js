"use client";

import HtmlEditor from "../HtmlEditor";
import useHomeSettings from "../useHomeSettings";
import { useToast } from "../ToastProvider";

const panelCls = "rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm";
const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

function parseLinks(json, fallback) {
  try {
    const arr = JSON.parse(json || "[]");
    if (Array.isArray(arr) && arr.length > 0) return arr;
  } catch {
    /* fall through */
  }
  return fallback;
}

const DEFAULT_QUICK = [
  { label: "About Us", link: "/aboutUs" },
  { label: "Contact Us", link: "/contact" },
  { label: "Privacy Policy", link: "/privacy-policy" },
  { label: "Terms & Conditions", link: "/terms-and-conditions" },
];

const DEFAULT_SUPPORT = [
  { label: "Help Center", link: "/help-center" },
  { label: "FAQs", link: "/FAQs" },
  { label: "Shipping, Returns & Cancellation", link: "/Policies" },
  { label: "Track Order", link: "/orders" },
];

function LinkEditor({ title, links, onChange }) {
  const set = (i, fields) => onChange(links.map((l, idx) => (idx === i ? { ...l, ...fields } : l)));
  return (
    <div className={`mt-4 ${panelCls}`}>
      <p className="text-sm font-bold text-neutral-900">{title}</p>
      <div className="mt-3 grid gap-2">
        {links.map((l, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={l.label || ""}
              onChange={(e) => set(i, { label: e.target.value })}
              placeholder="Label — e.g. About Us"
              className={inputCls}
            />
            <input
              value={l.link || ""}
              onChange={(e) => set(i, { link: e.target.value })}
              placeholder="Link — e.g. /aboutUs"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onChange(links.filter((_, idx) => idx !== i))}
              title="Remove link"
              className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
            >
              <i className="bi bi-trash3" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...links, { label: "", link: "" }])} className={`${btnOutline} mt-3`}>
        <i className="bi bi-plus-lg" /> Add link
      </button>
    </div>
  );
}

// Home Screen Content → Footer: brand blurb, socials, quick/support link
// lists, copyright. Contact email/phone stay on Support Contacts.
// Stored on tbl_settings (brand_description + footer_*).
export default function AdminHomeFooterPage() {
  const toast = useToast();
  const { settings, loading, saving, msg, patch, save } = useHomeSettings();

  if (loading) return <p className="p-10 text-sm text-neutral-500">Loading footer…</p>;

  const quick = parseLinks(settings.footer_quick_links_json, DEFAULT_QUICK);
  const support = parseLinks(settings.footer_support_links_json, DEFAULT_SUPPORT);

  const saveAll = async () => {
    const clean = (arr) =>
      arr
        .map((l) => ({ label: (l.label || "").trim(), link: (l.link || "").trim() }))
        .filter((l) => l.label && l.link);
    const ok = await save(
      {
        brand_description: settings.brand_description || "",
        footer_facebook_url: settings.footer_facebook_url || "",
        footer_instagram_url: settings.footer_instagram_url || "",
        footer_youtube_url: settings.footer_youtube_url || "",
        footer_quick_links_json: JSON.stringify(clean(quick)),
        footer_support_links_json: JSON.stringify(clean(support)),
        footer_copyright_text: settings.footer_copyright_text || "",
      },
      "Footer saved — site updated."
    );
    if (ok) toast?.success("Footer saved.");
  };

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">Footer</h1>
      <p className="mt-1 text-xs text-neutral-500">
        Bottom-of-site content • contact email/phone live on Support Contacts • newsletter text on Settings
      </p>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      <div className={`mt-4 ${panelCls}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Brand blurb (under HC logo)
          </p>
          <div className="mt-1">
            <HtmlEditor
              value={settings.brand_description || ""}
              onChange={(html) => patch({ brand_description: html })}
              placeholder="Empowering innovation with quality and trust…"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Facebook URL
            <input
              value={settings.footer_facebook_url || ""}
              onChange={(e) => patch({ footer_facebook_url: e.target.value })}
              placeholder="https://facebook.com/…"
              className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Instagram URL
            <input
              value={settings.footer_instagram_url || ""}
              onChange={(e) => patch({ footer_instagram_url: e.target.value })}
              placeholder="https://instagram.com/…"
              className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            YouTube URL
            <input
              value={settings.footer_youtube_url || ""}
              onChange={(e) => patch({ footer_youtube_url: e.target.value })}
              placeholder="https://youtube.com/…"
              className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Copyright line
          <input
            value={settings.footer_copyright_text || ""}
            onChange={(e) => patch({ footer_copyright_text: e.target.value })}
            placeholder="© 2026 Harry Clinton"
            className={`${inputCls} mt-1 font-normal normal-case tracking-normal`}
          />
        </label>
      </div>

      <LinkEditor
        title="Quick Links"
        links={quick}
        onChange={(next) => patch({ footer_quick_links_json: JSON.stringify(next) })}
      />
      <LinkEditor
        title="Support Links"
        links={support}
        onChange={(next) => patch({ footer_support_links_json: JSON.stringify(next) })}
      />

      <div className="mt-4">
        <button type="button" onClick={saveAll} disabled={saving} className={btnPrimary}>
          {saving ? "Saving..." : "Save footer"}
        </button>
      </div>
    </div>
  );
}
