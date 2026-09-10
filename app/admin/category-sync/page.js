"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, unwrap, revalidateSite } from "@/lib/api";
import { CATEGORIES } from "@/lib/catalog";

// Category Sync: compares backend Menu-Category/Sub-Category rows against the
// storefront route registry so slugs and redirect links never drift.
// Category Sync: drift checker PLUS the destructive master rebuild
// (confirm → delete all → recreate), same as the previous UI.
const MASTER_CATEGORIES = [
  { name: "Suits", slug: "suits",
    subs: [
      { name: "Wedding", slug: "wedding", redirect: "/wedding" },
      { name: "Business", slug: "business", redirect: "/business" },
      { name: "Designer", slug: "designer", redirect: "/designer" },
      { name: "Travel", slug: "travel", redirect: "/travel" },
      { name: "Smart casual", slug: "smart-casual", redirect: "/smart-casual" },
    ] },
  { name: "Indo Western", slug: "indowestern",
    subs: [
      { name: "Wedding Indo Western", slug: "indo-wedding", redirect: "/indo-wedding" },
      { name: "Designer IW", slug: "indo-designer", redirect: "/indo-designer" },
      { name: "Wedding Guest IW", slug: "wedding-guest-iw", redirect: "/coming-soon" },
      { name: "Haldi IW", slug: "haldi-iw", redirect: "/coming-soon" },
      { name: "Sangeet IW", slug: "sangeet-iw", redirect: "/coming-soon" },
    ] },
  { name: "Shirts", slug: "shirts",
    subs: [
      { name: "Formal", slug: "formal-shirts", redirect: "/coming-soon" },
      { name: "Casual", slug: "casual-shirts", redirect: "/casual-shirts" },
      { name: "Designer", slug: "designer-shirts", redirect: "/designer-shirts" },
      { name: "Ceremonial", slug: "ceremonial-shirts", redirect: "/coming-soon" },
      { name: "Business", slug: "business-shirts", redirect: "/business-shirts" },
    ] },
  { name: "Trousers", slug: "trousers",
    subs: [
      { name: "Formal", slug: "formal-trousers", redirect: "/coming-soon" },
      { name: "Casual", slug: "casual-trousers", redirect: "/smart-casual-trouser" },
      { name: "Designer", slug: "designer-trousers", redirect: "/designer-trouser" },
    ] },
  { name: "Baby Suits", slug: "babysuits",
    subs: [
      { name: "Baby First Birthday Suits", slug: "baby-first-birthday", redirect: "/coming-soon" },
      { name: "Baptism & Christening Suits", slug: "baptism-christening", redirect: "/coming-soon" },
      { name: "Wedding & Ring Bearer Suits", slug: "wedding-ring-bearer", redirect: "/wedding-baby" },
      { name: "Family Photoshoot Suits", slug: "family-photoshoot", redirect: "/coming-soon" },
      { name: "Formal & Party Wear Suits", slug: "formal-party-wear", redirect: "/coming-soon" },
    ] },
];

export default function CategorySyncPage() {
  const [cats, setCats] = useState([]);
  const [subs, setSubs] = useState([]);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const reload = async () => {
    const [c, s] = await Promise.all([
      apiFetch("/Menu-Category").then(unwrap).catch(() => []),
      apiFetch("/Menu-Sub-Category").then(unwrap).catch(() => []),
    ]);
    setCats(Array.isArray(c) ? c : []);
    setSubs(Array.isArray(s) ? s : []);
  };

  // Mount fetch (also reused after rebuild) — intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    reload();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const storefrontSlugs = Object.keys(CATEGORIES);

  const rebuild = async () => {
    if (!window.confirm("Delete & Rebuild? This will DELETE every category and subcategory in the database, then recreate them from the master list below. This cannot be undone.")) return;
    setBusy(true);
    setDone(false);
    setLog([]);
    const say = (line) => setLog((l) => [...l, line]);
    try {
      say(`Deleting ${subs.length} sub-categories...`);
      for (const s of subs) {
        await apiFetch("/Menu-Sub-Category", {
          method: "DELETE",
          body: { menu_subcategory_id: s.menu_subcategory_id, luu: "ADMIN_PORTAL" },
        }).catch(() => null);
      }
      say(`Deleting ${cats.length} categories...`);
      for (const c of cats) {
        await apiFetch("/Menu-Category", {
          method: "DELETE",
          body: { menu_category_id: c.menu_category_id, luu: "ADMIN_PORTAL" },
        }).catch(() => null);
      }
      const idBySlug = {};
      for (const [i, c] of MASTER_CATEGORIES.entries()) {
        const created = unwrap(
          await apiFetch("/Menu-Category", {
            method: "POST",
            body: {
              menu_category_name: c.name,
              menu_category_slug: c.slug,
              menu_category_image_url: "",
              display_order: i + 1,
              isactive: 1,
              rcu: "ADMIN_PORTAL",
            },
          })
        );
        const row = Array.isArray(created) ? created[0] : created;
        if (row?.menu_category_id) idBySlug[c.slug] = row.menu_category_id;
        say(`Created category ${c.name}`);
      }
      for (const c of MASTER_CATEGORIES) {
        const parentId = idBySlug[c.slug];
        for (const [j, s] of c.subs.entries()) {
          await apiFetch("/Menu-Sub-Category", {
            method: "POST",
            body: {
              menu_subcategory_name: s.name,
              menu_subcategory_slug: s.slug,
              menu_category_id: parentId || null,
              menu_category_image_url: "",
              redirect_link: s.redirect,
              display_order: j + 1,
              isactive: 1,
              rcu: "ADMIN_PORTAL",
            },
          }).catch(() => null);
        }
        say(`Created ${c.subs.length} sub-categories under ${c.name}`);
      }
      say("Done.");
      setDone(true);
      revalidateSite();
      reload();
    } catch (err) {
      say(`FAILED: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Category Sync</h1>
      <p className="mt-1 text-xs text-neutral-500">
        Removes all existing Menu-Category and Menu-Sub-Category records and recreates them from the master list below.
      </p>
      <button
        onClick={rebuild}
        disabled={busy}
        className="mt-4 bg-red-700 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Rebuilding..." : "Delete & Rebuild"}
      </button>
      {done && <p className="mt-2 bg-green-50 p-2 text-sm text-green-700">Rebuild complete.</p>}
      {log.length > 0 && (
        <pre className="mt-3 max-h-48 overflow-y-auto bg-neutral-950 p-3 font-mono text-xs text-green-400">
          {log.join("\n")}
        </pre>
      )}

      <h2 className="mt-6 font-semibold">Categories ({cats.length})</h2>
      <div className="mt-2 overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-neutral-500">
              <th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Storefront route</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => {
              const slug = c.menu_category_slug;
              const ok = storefrontSlugs.includes(slug);
              return (
                <tr key={c.menu_category_id} className="border-b last:border-0">
                  <td className="p-3">{c.menu_category_name}</td>
                  <td className="p-3 text-neutral-500">{slug}</td>
                  <td className="p-3">
                    {ok ? (
                      <Link href={`/${slug}`} className="text-green-700 underline">/{slug} ✓</Link>
                    ) : (
                      <span className="text-red-600">no route — add slug to lib/catalog.js</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 font-semibold">Sub-Categories ({subs.length})</h2>
      <div className="mt-2 overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-neutral-500">
              <th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Redirect link</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.menu_subcategory_id} className="border-b last:border-0">
                <td className="p-3">{s.menu_subcategory_name}</td>
                <td className="p-3 text-neutral-500">{s.menu_subcategory_slug}</td>
                <td className="p-3">
                  {s.redirect_link ? (
                    <Link href={s.redirect_link} className="underline">{s.redirect_link}</Link>
                  ) : (
                    <span className="text-neutral-400">—</span>
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
