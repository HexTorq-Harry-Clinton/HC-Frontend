"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";

const DEBOUNCE_MS = 300;

const STATIC_SERVICES = [
  { name: "Embroidery", path: "/services" },
  { name: "Alterations", path: "/services" },
  { name: "Personal Styling", path: "/services" },
  { name: "Custom Tailoring", path: "/services" },
];

const EMPTY = { categories: [], subcategories: [], products: [], services: [] };

// Search overlay: same structure/texts/flow as the previous UI.
export default function SearchDropdown({ onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const cacheRef = useRef({});
  const dataRef = useRef(null);
  const fetchedAtRef = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose]);

  const loadBaseData = async () => {
    // Cache the catalog briefly: fresh on every overlay open, and revalidates
    // after 60s so a long-lived overlay never searches stale data.
    if (dataRef.current && Date.now() - fetchedAtRef.current < 60000) {
      return dataRef.current;
    }
    const [cats, subs, prods, media] = await Promise.all([
      apiFetch("/Menu-Category").then(unwrap).catch(() => []),
      apiFetch("/Menu-Sub-Category").then(unwrap).catch(() => []),
      apiFetch("/Products").then(unwrap).catch(() => []),
      apiFetch("/Products-Media").then(unwrap).catch(() => []),
    ]);
    dataRef.current = { cats, subs, prods, media };
    fetchedAtRef.current = Date.now();
    cacheRef.current = {};
    return dataRef.current;
  };

  // Empty query resets synchronously in the event handler (not in an effect).
  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timerRef.current);
    if (!v.trim()) {
      setResults(EMPTY);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (!q) return undefined;
    // Debounced fetch: state updates happen only in the async continuation.
    timerRef.current = setTimeout(() => {
      const key = q.toLowerCase();
      if (cacheRef.current[key]) {
        setResults(cacheRef.current[key]);
        setLoading(false);
        return;
      }
      loadBaseData().then(({ cats, subs, prods, media }) => {
        const match = (str) => (str || "").toLowerCase().includes(key);
        const filtered = {
          categories: cats.filter((c) => match(c.menu_category_name)).slice(0, 4),
          subcategories: subs.filter((s) => match(s.menu_subcategory_name)).slice(0, 4),
          services: STATIC_SERVICES.filter((s) => match(s.name)),
          products: prods
            .filter((p) => match(p.product_name) || match(p.short_description))
            .slice(0, 6)
            .map((p) => {
              const m =
                media.find((x) => x.product_id === p.product_id && x.isprimary) ||
                media.find((x) => x.product_id === p.product_id);
              return { ...p, _img: resolveUploadUrl(m?.media_url) || null };
            }),
        };
        cacheRef.current[key] = filtered;
        setResults(filtered);
        setLoading(false);
      }).catch(() => {
        setResults(EMPTY);
        setLoading(false);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const go = (path) => {
    onClose?.();
    router.push(path);
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onClose?.();
    if (e.key === "Enter" && query.trim()) {
      go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasResults =
    results.categories.length > 0 ||
    results.subcategories.length > 0 ||
    results.services.length > 0 ||
    results.products.length > 0;

  const showDropdown = query.trim().length > 0;

  return (
    <div className="sd-wrap" ref={wrapRef}>
      <div className="sd-input-row">
        <i className="bi bi-search sd-icon" />
        <input
          ref={inputRef}
          className="sd-input"
          type="text"
          placeholder="Search products, categories…"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKey}
          autoComplete="off"
        />
        {query && (
          <button className="sd-clear" onClick={() => setQuery("")} aria-label="Clear">
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="sd-dropdown">
          {loading && (
            <div className="sd-state">
              <span className="sd-spinner" />
              <span>Searching…</span>
            </div>
          )}

          {!loading && !hasResults && (
            <div className="sd-state sd-state--empty">
              No results for <strong>&quot;{query}&quot;</strong>
            </div>
          )}

          {!loading && hasResults && (
            <>
              {results.categories.length > 0 && (
                <div className="sd-section">
                  <p className="sd-section__label">Categories</p>
                  {results.categories.map((c) => {
                    const slug =
                      c.menu_category_slug ||
                      c.menu_category_name?.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <button
                        key={c.menu_category_id}
                        className="sd-item"
                        onClick={() => go(`/${slug}`)}
                      >
                        <i className="bi bi-grid sd-item__icon" />
                        <span className="sd-item__text">{c.menu_category_name}</span>
                        <span className="sd-item__tag">Category</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {results.subcategories.length > 0 && (
                <div className="sd-section">
                  <p className="sd-section__label">Collections</p>
                  {results.subcategories.map((s) => {
                    const path =
                      (s.redirect_link || "").replace(/^\/collection\//, "/") ||
                      `/${s.menu_subcategory_slug || s.menu_subcategory_name?.toLowerCase().replace(/\s+/g, "-")}`;
                    return (
                      <button
                        key={s.menu_subcategory_id}
                        className="sd-item"
                        onClick={() => go(path)}
                      >
                        <i className="bi bi-collection sd-item__icon" />
                        <span className="sd-item__text">{s.menu_subcategory_name}</span>
                        <span className="sd-item__tag">Collection</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {results.services.length > 0 && (
                <div className="sd-section">
                  <p className="sd-section__label">Services</p>
                  {results.services.map((s) => (
                    <button
                      key={s.name}
                      className="sd-item"
                      onClick={() => go(s.path)}
                    >
                      <i className="bi bi-scissors sd-item__icon" />
                      <span className="sd-item__text">{s.name}</span>
                      <span className="sd-item__tag">Service</span>
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 && (
                <div className="sd-section">
                  <p className="sd-section__label">Products</p>
                  {results.products.map((p) => {
                    const slug =
                      p.product_slug ||
                      p.product_name?.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <button
                        key={p.product_id}
                        className="sd-item sd-item--product"
                        onClick={() => go(`/product/${slug}`)}
                      >
                        {p._img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p._img}
                            alt={p.product_name}
                            className="sd-item__thumb"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span className="sd-item__thumb-placeholder">
                            <i className="bi bi-image" />
                          </span>
                        )}
                        <span className="sd-item__info">
                          <span className="sd-item__text">{p.product_name}</span>
                          {p.base_price ? (
                            <span className="sd-item__price">
                              ₹{Number(p.base_price).toLocaleString("en-IN")}
                            </span>
                          ) : null}
                        </span>
                        <span className="sd-item__tag">Product</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="sd-footer">
                <button
                  className="sd-footer__btn"
                  onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
                >
                  View all results for &quot;<strong>{query}</strong>&quot;
                  <i className="bi bi-arrow-right ms-2" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <style jsx>{`
        .sd-wrap { position: fixed; top: 0; left: 0; right: 0; z-index: 120; background: rgba(255,255,255,0.98); border-bottom: 1px solid #e5e5e5; padding: 14px 16px; }
        .sd-input-row { display: flex; align-items: center; gap: 10px; max-width: 720px; margin: 0 auto; }
        .sd-icon { font-size: 1.2rem; }
        .sd-input { flex: 1; border: none; border-bottom: 1px solid #111; padding: 8px 4px; font-size: 1rem; outline: none; background: transparent; }
        .sd-clear { border: none; background: none; cursor: pointer; }
        .sd-dropdown { max-width: 720px; margin: 10px auto 0; max-height: 60vh; overflow-y: auto; }
        .sd-state { display: flex; align-items: center; gap: 10px; padding: 14px 4px; font-size: 0.9rem; color: #555; }
        .sd-spinner { width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #111; border-radius: 50%; animation: sd-spin 0.7s linear infinite; }
        @keyframes sd-spin { to { transform: rotate(360deg); } }
        .sd-section { margin-top: 10px; }
        .sd-section__label { font-size: 0.7rem; letter-spacing: 0.25em; text-transform: uppercase; color: #888; margin-bottom: 4px; }
        .sd-item { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 8px 4px; border: none; background: none; cursor: pointer; }
        .sd-item:hover { background: #f6f4ee; }
        .sd-item__icon { color: #888; }
        .sd-item__text { flex: 1; font-size: 0.92rem; }
        .sd-item__tag { font-size: 0.68rem; letter-spacing: 0.15em; text-transform: uppercase; color: #a8823f; }
        .sd-item__thumb { width: 44px; height: 54px; object-fit: cover; }
        .sd-item__thumb-placeholder { width: 44px; height: 54px; display: flex; align-items: center; justify-content: center; background: #f1efe9; color: #999; }
        .sd-item__info { flex: 1; display: flex; flex-direction: column; }
        .sd-item__price { font-size: 0.8rem; font-weight: 700; }
        .sd-footer { border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px; }
        .sd-footer__btn { border: none; background: none; cursor: pointer; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
