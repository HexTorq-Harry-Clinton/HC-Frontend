"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

function SearchInner() {
  const params = useSearchParams();
  // Initial query comes straight from the URL at render time — no effect sync needed.
  const [q, setQ] = useState(() => params.get("q") || "");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const run = async (e, query) => {
    e?.preventDefault();
    const needle = (query ?? q).trim().toLowerCase();
    if (!needle) return;
    const [products, media] = await Promise.all([
      apiFetch("/Products").then(unwrap),
      apiFetch("/Products-Media").then(unwrap).catch(() => []),
    ]);
    setResults(
      products
        .filter((p) => p.isdeleted !== true)
        .filter((p) =>
          `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""}`.toLowerCase().includes(needle)
        )
        .map((p) => {
          const m = media.find((x) => x.product_id === p.product_id && x.isprimary === true);
          return {
            id: p.product_id, slug: p.product_slug, name: p.product_name,
            price: Number(p.base_price) || 0, image: resolveUploadUrl(m?.media_url) || null,
          };
        })
    );
    setSearched(true);
  };

  // Auto-run once when landing with ?q= (state updates only in async continuation).
  useEffect(() => {
    const initial = params.get("q");
    if (!initial) return;
    let live = true;
    const needle = initial.trim().toLowerCase();
    Promise.all([
      apiFetch("/Products").then(unwrap),
      apiFetch("/Products-Media").then(unwrap).catch(() => []),
    ]).then(([products, media]) => {
      if (!live) return;
      setResults(
        products
          .filter((p) => p.isdeleted !== true)
          .filter((p) =>
            `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""}`.toLowerCase().includes(needle)
          )
          .map((p) => {
            const m = media.find((x) => x.product_id === p.product_id && x.isprimary === true);
            return {
              id: p.product_id, slug: p.product_slug, name: p.product_name,
              price: Number(p.base_price) || 0, image: resolveUploadUrl(m?.media_url) || null,
            };
          })
      );
      setSearched(true);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Search</h1>
      <form onSubmit={run} className="mt-6 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suits, shirts, wedding…" className="flex-1 border border-neutral-300 px-4 py-3 text-sm" />
        <button className="bg-neutral-950 px-6 text-sm font-semibold text-white">Search</button>
      </form>
      {searched && (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {results.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
      {searched && results.length === 0 && <p className="mt-8 text-center text-sm text-neutral-500">No matches. Try another word.</p>}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-7xl px-4 py-14">Loading search…</p>}>
      <SearchInner />
    </Suspense>
  );
}
