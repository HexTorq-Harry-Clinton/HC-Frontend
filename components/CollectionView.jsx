"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { generatedColor } from "@/lib/colors";
import WishlistHeart from "./WishlistHeart";
import { useCart } from "./CartProvider";
import "./collection-view.css";

// Collection catalog markup mirrors the reference CollectionPage template.
export default function CollectionView({ meta, products, sizes = [], clothTypes = [], colors = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ size: "", clothType: "", color: "", minPrice: "", maxPrice: "" });

  const priceRange = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 };
    const prices = products.map((p) => Number(p.price) || 0);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  const collectionProducts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (filters.size && !(product.sizes || []).includes(filters.size)) return false;
      if (filters.clothType && !(product.clothTypes || []).includes(filters.clothType)) return false;
      if (filters.color) {
        const productColors = [...(product.colors || []), ...(product.color ? [product.color] : [])]
          .map((color) => String(color).toLowerCase());
        if (!productColors.includes(filters.color.toLowerCase())) return false;
      }
      if (filters.minPrice && Number(product.price) < Number(filters.minPrice)) return false;
      if (filters.maxPrice && Number(product.price) > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [filters, products, searchTerm]);

  const reset = () => setFilters({ size: "", clothType: "", color: "", minPrice: "", maxPrice: "" });
  const setFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  return (
    <main className="collection-page">
      <section className="collection-hero">
        {meta.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.bannerImage} alt="" className="collection-hero__image" />
        ) : (
          <div className="collection-hero__image collection-hero__image--empty" />
        )}
        <div className="collection-hero__overlay" />
        <div className="collection-hero__content">
          <span>{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
          <a href={meta.ctaLink || "#collection-products"} className="collection-hero__action">
            {meta.ctaText || "Explore collection"} <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      <section className="collection-catalog" id="collection-products">
        <div className="collection-catalog__heading">
          <div>
            <span className="collection-kicker">Curated by House of Cavani</span>
            <h2>{meta.title}</h2>
          </div>
          <label className="collection-search">
            <i className="bi bi-search" aria-hidden="true" />
            <span className="collection-visually-hidden">Search this collection</span>
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search collection" />
          </label>
        </div>

        <div className="collection-result-count">
          {collectionProducts.length} {collectionProducts.length === 1 ? "piece" : "pieces"}
        </div>

        <div className="collection-results">
          <aside className="collection-filters">
            <div className="collection-filters__heading">
              <h5>Filters</h5>
              <button type="button" onClick={reset}>Reset</button>
            </div>
            {sizes.length > 0 && (
              <label>
                <strong>Size</strong>
                <select value={filters.size} onChange={setFilter("size")}>
                  <option value="">All sizes</option>
                  {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            )}
            {clothTypes.length > 0 && (
              <label>
                <strong>Fabric</strong>
                <select value={filters.clothType} onChange={setFilter("clothType")}>
                  <option value="">All fabrics</option>
                  {clothTypes.map((cloth) => <option key={cloth} value={cloth}>{cloth}</option>)}
                </select>
              </label>
            )}
            {colors.length > 0 && (
              <label>
                <strong>Color</strong>
                <select value={filters.color} onChange={setFilter("color")}>
                  <option value="">All colors</option>
                  {colors.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
              </label>
            )}
            <label>
              <strong>Price Range</strong>
              <span className="collection-price-inputs">
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={setFilter("minPrice")} />
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={setFilter("maxPrice")} />
              </span>
            </label>
            <p className="collection-price-range">Range: ₹{priceRange.min.toLocaleString("en-IN")} - ₹{priceRange.max.toLocaleString("en-IN")}</p>
          </aside>

          <div className="collection-products">
            {collectionProducts.length > 0 ? (
              <div className="collection-grid">
                {collectionProducts.map((product) => <CollectionCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="collection-empty">No pieces match your filters or search.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export function CollectionCard({ product, showView = true }) {
  const cart = useCart();
  const wished = cart?.wishlist.some((item) => item.id === product.id);
  const subtitle = product.subtitle || product.slug?.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "";
  return (
    <div className="collection-card-shell">
      <Link href={`/product/${product.slug || product.id}`} className="collection-card">
        <div className="collection-card__image-wrap">
          {product.video ? (
            <video
              src={product.video}
              className="collection-card__image"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label={product.name}
            />
          ) : product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="collection-card__image" loading="lazy" />
          ) : <div className="collection-card__image collection-card__image--empty" />}
          <div className="collection-card__overlay">
            <span className="collection-card__subtitle">{subtitle}</span>
          </div>
          {showView && <span className="collection-card__view">View Product <span aria-hidden>→</span></span>}
        </div>
      </Link>
      <WishlistHeart
        product={product}
        className={`collection-card__heart${wished ? " collection-card__heart--saved" : ""}`}
      />
    </div>
  );
}

const COLOR_DOTS = {
  "obsidian black": { name: "Obsidian Black", hex: "#0a0a0a", border: "#222222" },
  "platinum silver": { name: "Platinum Silver", hex: "#c0c0c0", border: "#9e9e9e" },
  "royal black": { name: "Royal Black", hex: "#000000", border: "#333333" },
  "luxury gold": { name: "Luxury Gold", hex: "#d4af37", border: "#b7950b" },
  "velvet maroon": { name: "Velvet Maroon", hex: "#800000", border: "#5c0000" },
  "royal cream": { name: "Royal Cream", hex: "#f5f5dc", border: "#d8d0b0" },
  "emerald green": { name: "Emerald Green", hex: "#0b6623", border: "#145a32" },
  "classic black": { name: "Classic Black", hex: "#000000", border: "#333333" },
  "midnight blue": { name: "Midnight Blue", hex: "#191970", border: "#0f1a4a" },
  "silver mist": { name: "Silver Mist", hex: "#c0c0c0", border: "#a9a9a9" },
  "pearl white": { name: "Pearl White", hex: "#f8f8ff", border: "#dcdcdc" },
  "champagne gold": { name: "Champagne Gold", hex: "#f7e7ce", border: "#d6c29c" },
  "ruby red": { name: "Ruby Red", hex: "#9b111e", border: "#7b0d18" },
  black: { name: "Black", hex: "#111111" },
  burgundy: { name: "Burgundy", hex: "#4f111e" },
  red: { name: "Red", hex: "#8a1c1c" },
  gold: { name: "Gold", hex: "#ffd700", border: "#c9a000" },
  brown: { name: "Brown", hex: "#9b5c30", border: "#7a4726" },
  silver: { name: "Silver", hex: "#c0c0c0", border: "#a9a9a9" },
  platinum: { name: "Platinum", hex: "#e5e4e2", border: "#bebebe" },
  white: { name: "White", hex: "#fcfcfc", border: "#b8b8b8" },
  cream: { name: "Cream", hex: "#f5f0e6", border: "#b8b8b8" },
  ivory: { name: "Ivory", hex: "#f7f4ec", border: "#b8b8b8" },
  blue: { name: "Blue", hex: "#2563eb" },
  green: { name: "Green", hex: "#234a36" },
  violet: { name: "Violet", hex: "#3e1c4a" },
  ice: { name: "Menthol Ice", hex: "#00ffff", border: "#00ced1" },
};

function colorDots(product) {
  const keys = Object.keys(COLOR_DOTS).sort((a, b) => b.length - a.length);
  const sources = [...(product.colors || []), product.name || ""];
  const found = [];
  for (const source of sources) {
    const key = keys.find((name) => new RegExp(`\\b${name}\\b`, "i").test(String(source)));
    const color = key ? COLOR_DOTS[key] : (source.trim() ? generatedColor(source) : null);
    if (color && !found.some((item) => item.name === color.name)) found.push(color);
  }
  return found.length > 0 ? found.slice(0, 4) : [{ name: "Original", hex: "#777777" }];
}
