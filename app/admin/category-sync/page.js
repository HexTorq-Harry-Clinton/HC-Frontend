"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import { CATEGORIES } from "@/lib/catalog";

// Category Sync: compares backend Menu-Category/Sub-Category rows against the
// storefront route registry so slugs and redirect links never drift.
export default function CategorySyncPage() {
  const [cats, setCats] = useState([]);
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    apiFetch("/Menu-Category").then(unwrap).then((l) => setCats(Array.isArray(l) ? l : [])).catch(() => {});
    apiFetch("/Menu-Sub-Category").then(unwrap).then((l) => setSubs(Array.isArray(l) ? l : [])).catch(() => {});
  }, []);

  const storefrontSlugs = Object.keys(CATEGORIES);

  return (
    <div>
      <h1 className="text-2xl font-bold">Category Sync</h1>
      <p className="mt-1 text-xs text-neutral-500">
        Backend menu rows vs storefront routes — fix slugs in Categories / Sub-Categories.
      </p>

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
