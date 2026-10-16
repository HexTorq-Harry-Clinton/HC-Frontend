"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inr, resolveUploadUrl } from "@/lib/api";
import { minVariantPrice, resolveVariantPrice } from "@/lib/pricing";
import { sanitizeHtml } from "@/lib/sanitize";
import { useCart } from "./CartProvider";
import WishlistHeart from "./WishlistHeart";
import { PLACEHOLDER_IMAGE } from "./ProductCard";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import ReviewsSection from "./ReviewsSection";

// Product detail: Lafaurie-style left gallery (vertical smooth-scroll stack,
// pure images) + Rare-style sticky right buy panel (title, MRP/final/% row,
// colorways, fused size pills, size chart, stacked Add to Cart + Buy Now,
// pincode delivery check). Specs live under the gallery; reviews + related
// follow below.
export default function ProductDetail({ product }) {
  const cart = useCart();
  const router = useRouter();

  // Color selection state
  const colorVariants = product.colorVariants || [];
  const initialColor = colorVariants[0]?.name || product.colors?.[0] || "";
  const [selectedColor, setSelectedColor] = useState(initialColor);

  const [qty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState("");
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [pin, setPin] = useState("");
  const [pinResult, setPinResult] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    if (!showSizeChart) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowSizeChart(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showSizeChart]);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 15);
  const deliveryDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(estimatedDate);

  // Determine current active color variant & its gallery
  const activeColorObj =
    colorVariants.find(
      (c) => c.name.toLowerCase() === (selectedColor || "").toLowerCase()
    ) || colorVariants[0] || {};

  // Full gallery for the chosen colorway — rendered as a smooth-scroll stack
  const currentGallery =
    activeColorObj?.images?.length > 0
      ? activeColorObj.images
      : product.gallery?.length > 0
      ? product.gallery
      : [product.image || PLACEHOLDER_IMAGE];

  const mediaMetaFor = (src) => {
    const item = (product.media || []).find((media) => resolveUploadUrl(media.media_url) === src);
    return item || null;
  };
  const isVideoSrc = (src) => {
    const meta = mediaMetaFor(src);
    return meta?.media_type === "video" || meta?.media_role === "video";
  };

  // Dynamic titles, prices, and sizes based on chosen colorway
  const displayTitle = activeColorObj?.title || product.name;

  // Sizes setup for the active colorway
  const activeVariants =
    activeColorObj?.variants?.length > 0
      ? activeColorObj.variants
      : (product.variants || []);

  const activeBest = minVariantPrice(activeVariants, activeColorObj?.price ?? product.price);
  const basePrice = activeBest ? activeBest.finalPrice : (activeColorObj?.price ?? product.price);
  const baseMrp = activeBest ? activeBest.mrp : basePrice;

  const baseSizes =
    activeVariants.length > 0
      ? activeVariants.map((v, idx) => {
          const priced = resolveVariantPrice(v, baseMrp || basePrice);
          return {
            key: v.product_variant_id || v.size_id || `${v.label || v.variant_name || "size"}-${idx}`,
            label: v.label || v.size_id || v.variant_name || "M",
            price: priced.finalPrice,
            mrp: priced.mrp,
            hasDiscount: priced.hasDiscount,
            discountPct: priced.discountPct,
            discountType: priced.discountType,
            discountValue: priced.discountValue,
            available: v.available !== false,
            variant: v,
          };
        })
      : [{ key: "default", label: "M", price: basePrice, mrp: baseMrp, hasDiscount: false, discountPct: 0, available: true, variant: null }];

  const [size, setSize] = useState(baseSizes.length === 1 ? baseSizes[0].key : "");
  const selected = baseSizes.find((s) => s.key === size) || (baseSizes.length === 1 ? baseSizes[0] : null);
  const displayPrice = selected?.price ?? basePrice;
  const displayMrp = selected?.mrp ?? baseMrp ?? displayPrice;
  // Always show a struck compare price like the reference: variant MRP
  // first, then the product compare-at price, whenever either sits above
  // the selling price.
  const compareAt = Number(product.originalPrice) || 0;
  const displayCompare = displayMrp > displayPrice ? displayMrp : compareAt > displayPrice ? compareAt : null;
  const displayHasDiscount = Boolean(displayCompare);
  const displayDiscountPct = selected?.discountPct || (displayCompare ? Math.round(((displayCompare - displayPrice) / displayCompare) * 100) : 0);
  const displaySku = selected?.variant?.sku || activeVariants[0]?.sku || product.sku || product.slug || activeId || "";
  // Displayed product prices are GST-inclusive. This is only an informational
  // split; the amount must not be added again in cart or checkout.
  const gstAmount = Math.round((displayPrice - displayPrice / 1.05) * 100) / 100;
  const cgstAmount = Math.round((displayPrice - displayPrice / 1.05) * 0.5 * 100) / 100;
  const sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;
  const preGstPrice = Math.round((displayPrice - gstAmount) * 100) / 100;

  // Active product identification
  const activeId = activeColorObj?.productId || product.id;
  const activeSlug = activeColorObj?.slug || product.slug;

  // Distinct bagKey includes product + size + color
  const bagKey = [
    activeId,
    selected?.variant?.product_variant_id || null,
    selected?.label || baseSizes[0]?.label || "M",
    selectedColor || null,
  ]
    .filter((v) => v !== undefined && v !== null && v !== "")
    .join("|");

  const bagLine = (cart?.items || []).find(
    (i) =>
      (i.key ||
        [i.id, i.product_variant_id, i.size, i.color]
          .filter((v) => v !== undefined && v !== null && v !== "")
          .join("|")) === bagKey
  );

  const handleColorChange = (colorName) => {
    if (colorName.toLowerCase() === (selectedColor || "").toLowerCase()) return;
    setSelectedColor(colorName);
    setSizeError("");

    const targetObj = colorVariants.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );

    // If new colorway has different sizes, reset size selection unless single
    const targetSizes = targetObj?.variants || [];
    if (targetSizes.length === 1) {
      setSize(targetSizes[0].product_variant_id || targetSizes[0].size_id || targetSizes[0].key || "default");
    } else {
      setSize("");
    }

    // Colorways are variants of this same product; selecting one must not
    // navigate to or identify a different product.
  };

  const buildBagItem = () => ({
    id: activeId,
    slug: activeSlug,
    name: displayTitle,
    price: displayPrice,
    image: currentGallery[0],
    size: selected?.label || baseSizes[0]?.label || "M",
    color: selectedColor || activeColorObj.name || null,
    product_id: activeId,
    product_variant_id: selected?.variant?.product_variant_id || null,
    unit_price: displayPrice,
    mrp: displayMrp,
  });

  const requireSize = () => {
    if (baseSizes.length > 1 && !size) {
      setSizeError("Please select a size");
      document.getElementById("pd-sizes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    setSizeError("");
    return true;
  };

  const addToBag = () => {
    if (!requireSize()) return;
    cart?.addToCart(buildBagItem(), qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const buyNow = () => {
    if (!requireSize()) return;
    cart?.addToCart(buildBagItem(), qty);
    router.push("/checkout");
  };

  const checkPin = () => {
    const value = pin.trim();
    if (!/^[1-9][0-9]{5}$/.test(value)) {
      setPinError("Enter a valid 6-digit pincode");
      setPinResult("");
      return;
    }
    setPinError("");
    setPinResult(`Delivery by ${deliveryDate} to ${value}`);
  };

  const specRows = product.details
    ? Object.entries({
        "Fabric details": product.details.fabric_details,
        "Trims used": product.details.trims_used,
        "Special detailing": product.details.special_detailing,
        Lining: product.details.lining_details,
        "Product fit": product.details.product_fit,
        "Model fit": product.details.model_fit,
        "Woven / Knitted": product.details.construction_type,
        "Sleeve type": product.details.sleeve_type,
        "Sleeve pattern": product.details.sleeve_pattern,
        "Sleeve length": product.details.sleeve_length,
        "Wash care": product.details.wash_care,
      }).filter(([, value]) => value)
    : [];

  return (
    <>
      <div className="mx-auto w-full px-0 py-0 md:py-8">
        <div className="grid items-start gap-0 md:grid-cols-2 md:gap-10">
          {/* LEFT: smooth-scroll gallery stack, pure images */}
          <div className="scroll-smooth">
            {currentGallery.map((src, i) => (
              <div key={`${selectedColor}-${src}-${i}`} className="relative w-full overflow-hidden bg-neutral-100">
                {isVideoSrc(src) ? (
                  <video
                    src={src}
                    aria-label={`${displayTitle} video ${i + 1}`}
                    className="h-auto max-h-[92vh] w-full bg-white object-contain"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`${displayTitle} in ${selectedColor || "atelier colorway"} — view ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="h-auto max-h-[92vh] w-full bg-white object-contain"
                  />
                )}
              </div>
            ))}

            {/* Description + specs under the gallery */}
            <div className="px-4 py-8">
              {product.fullDescription && product.fullDescription !== product.description && (
                <>
                  <h5 className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">Description</h5>
                  <div
                    className="mt-2 text-[15px] leading-relaxed text-neutral-600"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.fullDescription) }}
                  />
                </>
              )}
              {specRows.length > 0 && (
                <dl className="mt-6 border-y border-neutral-200">
                  {specRows.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[minmax(110px,0.42fr)_minmax(0,1fr)] items-start gap-4 border-b border-neutral-200 py-3 last:border-b-0">
                      <dt className="text-[12px] font-bold uppercase tracking-widest text-neutral-900">{label}</dt>
                      <dd className="m-0 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>

          {/* RIGHT: sticky buy panel */}
          <div className="px-4 pb-10 md:sticky md:top-24 md:self-start md:pb-0 md:pr-6">
            <Reveal>
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-display text-[28px] font-bold leading-tight text-neutral-950 md:text-[32px]">{displayTitle}</h1>
                <WishlistHeart
                  product={{ id: activeId, name: displayTitle, price: displayPrice, image: currentGallery[0] }}
                  className="mt-1 shrink-0 border border-neutral-300 px-3.5 py-2.5 text-lg transition hover:border-[#c6a15b]"
                />
              </div>
              <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-neutral-500">
                {product.description || product.subtitle || "Harry Clinton"}
                {displaySku && (
                  <span className="text-neutral-400"> · SKU: <span className="text-neutral-600">{displaySku}</span></span>
                )}
              </p>

              {/* Price row: MRP + final + % badge + tax note */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {displayHasDiscount && (
                  <span className="text-[16px] font-medium text-neutral-400 line-through">{inr(displayMrp)}</span>
                )}
                <h3 className="text-[24px] font-bold tracking-tight text-neutral-900">{inr(displayPrice)}</h3>
                {displayHasDiscount && (
                  <span className="bg-green-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                    {displayDiscountPct > 0 ? `${displayDiscountPct}% off` : "Sale"}
                  </span>
                )}
                <details className="relative">
                  <summary
                    aria-label="View GST price split"
                    className="flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border border-neutral-400 text-[11px] font-bold text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                  >
                    i
                  </summary>
                  <div className="absolute left-0 top-7 z-20 w-56 border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-neutral-600 shadow-lg">
                    <p className="mb-1 font-semibold text-neutral-900">GST included in price</p>
                    <div className="flex justify-between"><span>Price before GST</span><span>{inr(preGstPrice)}</span></div>
                    <div className="flex justify-between"><span>CGST (2.5%)</span><span>{inr(cgstAmount)}</span></div>
                    <div className="flex justify-between"><span>SGST (2.5%)</span><span>{inr(sgstAmount)}</span></div>
                    <div className="mt-1 flex justify-between border-t border-neutral-200 pt-1 font-semibold text-neutral-900"><span>Total</span><span>{inr(displayPrice)}</span></div>
                  </div>
                </details>
              </div>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-widest text-neutral-500">GST included in price</p>

              <div className="mt-4 flex flex-col gap-3 border border-[#c6a15b]/50 bg-[#c6a15b]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-[13px] leading-relaxed text-neutral-700">
                  <strong className="text-neutral-950">Custom Sizing Available:</strong>{" "}
                  For size customisation or a made-to-measure fit, please contact us.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/book-appointment")}
                  className="shrink-0 border border-neutral-950 bg-neutral-950 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition hover:border-[#c6a15b] hover:bg-[#c6a15b] hover:text-neutral-950"
                >
                  Book an Appointment
                </button>
              </div>

              {/* Colorways */}
              {colorVariants.length > 0 && (
                <div className="mt-6 border-t border-neutral-200 pt-5">
                  <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">
                    Color: <span className="ml-1 font-bold text-[#c6a15b]">{selectedColor || activeColorObj.name}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {colorVariants.map((c) => {
                      const isSelected =
                        (selectedColor || activeColorObj.name || "").toLowerCase() === c.name.toLowerCase();
                      const thumb = c.images?.[0];
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleColorChange(c.name)}
                          aria-label={`Select color ${c.name}`}
                          title={c.name}
                          className={`relative h-12 w-12 overflow-hidden border transition-all duration-200 ${
                            isSelected
                              ? "border-[#c6a15b] opacity-100 ring-2 ring-[#c6a15b]"
                              : "border-neutral-300 opacity-70 hover:border-neutral-950 hover:opacity-100"
                          }`}
                        >
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt={c.name} className="h-full w-full bg-white object-cover" />
                          ) : (
                            <span className="block h-full w-full" style={{ backgroundColor: c.hex || "#333" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {baseSizes.length > 0 && (
                <div id="pd-sizes" className="mt-6 border-t border-neutral-200 pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h5 className="m-0 text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">
                      Select Size{selected ? `: ${selected.label}` : ""}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="border-b border-neutral-900 text-[11px] font-bold uppercase tracking-wider text-neutral-900 transition hover:border-[#c6a15b] hover:text-[#9b783b]"
                    >
                      Size Chart
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {baseSizes.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          setSize(s.key);
                          setSizeError("");
                        }}
                        disabled={!s.available}
                        className={`min-w-[3.25rem] border px-4 py-2.5 text-[15px] font-bold transition-all disabled:opacity-40 ${
                          size === s.key
                            ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                            : "border-neutral-300 text-neutral-900 hover:border-neutral-950"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {sizeError && <p className="mt-2 text-[12px] font-bold text-red-600">{sizeError}</p>}
                </div>
              )}

              {/* Stacked actions */}
              <div className="mt-6 space-y-3">
                {bagLine ? (
                  <div className="flex items-stretch gap-3">
                    <div className="flex shrink-0 items-center border border-neutral-300" role="group" aria-label="Quantity">
                      <button
                        onClick={() => cart?.updateQty(bagLine.key || bagLine.id, Math.max(1, (bagLine.qty || 1) - 1))}
                        disabled={(bagLine.qty || 1) <= 1}
                        className="px-3 text-[15px] font-bold transition hover:bg-neutral-100 disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-[15px] font-bold" aria-live="polite">{bagLine.qty || 1}</span>
                      <button
                        onClick={() => cart?.updateQty(bagLine.key || bagLine.id, (bagLine.qty || 1) + 1)}
                        className="px-3 text-[15px] font-bold transition hover:bg-neutral-100"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => router.push("/cart")}
                      className="min-w-0 flex-1 bg-green-700 px-2 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-green-800"
                    >
                      Already Added — View Bag
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={addToBag}
                      className={`w-full cursor-pointer border border-neutral-950 py-3.5 text-[13px] font-bold uppercase tracking-wider shadow-sm transition ${
                        added ? "bg-green-700 text-white" : "bg-white text-neutral-950 hover:bg-neutral-100"
                      }`}
                    >
                      {added ? "Added to Cart" : "Add to Cart"}
                    </button>
                    <button
                      onClick={buyNow}
                      className="w-full cursor-pointer bg-neutral-950 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#c6a15b] hover:text-neutral-950"
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>

              {/* Delivery check */}
              <div className="mt-6 border border-neutral-200 bg-neutral-50 px-4 py-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">Check estimated delivery</p>
                <div className="mt-3 flex gap-2">
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="Enter pincode"
                    aria-label="Delivery pincode"
                    className="min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={checkPin}
                    className="shrink-0 bg-neutral-950 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white transition hover:bg-[#c6a15b] hover:text-neutral-950"
                  >
                    Check
                  </button>
                </div>
                {pinError && <p className="mt-2 text-[12px] font-bold text-red-600">{pinError}</p>}
                {pinResult && <p className="mt-2 text-[13px] font-semibold text-green-700">{pinResult}</p>}
              </div>

              <button onClick={() => router.back()} className="link-sweep mt-4 block text-[12px] font-bold uppercase tracking-wider">
                ← Continue Shopping
              </button>

              <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
                <details className="group py-4">
                  <summary className="cursor-pointer text-[12px] font-bold uppercase tracking-widest text-neutral-900 marker:text-[#c6a15b]">
                    Shipping & Returns
                  </summary>
                  <p className="mt-2 text-[15px] font-normal leading-relaxed text-neutral-600">
                    Dispatched in 5–7 working days. Complimentary bespoke fitting adjustments included. Easy 7-day returns on unworn pieces.
                  </p>
                </details>
                <details className="group py-4">
                  <summary className="cursor-pointer text-[12px] font-bold uppercase tracking-widest text-neutral-900 marker:text-[#c6a15b]">
                    Atelier Care
                  </summary>
                  <p className="mt-2 text-[15px] font-normal leading-relaxed text-neutral-600">
                    Dry clean only. Store on a broad contoured wooden hanger in the breathable garment sleeve provided.
                  </p>
                </details>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      {!bagLine && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => document.getElementById("pd-sizes")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="min-w-0 flex-1 truncate border border-neutral-300 px-3 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-neutral-900"
          >
            {selected ? `Size: ${selected.label}` : "Choose your size"}
          </button>
          <button
            type="button"
            onClick={addToBag}
            className="shrink-0 bg-neutral-950 px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-white"
          >
            {added ? "Added ✓" : "Add to Bag"}
          </button>
        </div>
      )}

      {showSizeChart && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-chart-title"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="relative max-h-[92dvh] w-full max-w-3xl touch-pan-y overflow-y-auto overscroll-contain bg-[#f8f6ef] p-3 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 mb-3 flex items-center justify-between border-b border-neutral-300 bg-[#f8f6ef]/95 pb-3 backdrop-blur-sm">
              <h2 id="size-chart-title" className="font-display text-xl font-bold text-neutral-950 sm:text-2xl">Size Chart</h2>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="flex h-10 w-10 items-center justify-center border border-neutral-400 text-2xl leading-none text-neutral-900 transition hover:bg-neutral-950 hover:text-white"
                aria-label="Close size chart"
              >
                ×
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/harry-clinton-size-chart.svg"
              alt="Harry Clinton menswear measurement guide and size conversion chart"
              className="h-auto w-full border border-neutral-300 bg-white"
            />
            {product.sizeChart?.length > 0 && (
              <div className="mt-6 bg-white p-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Product-specific measurements</h3>
                <p className="mt-1 text-xs text-neutral-500">All measurements in {product.sizeChart[0]?.unit === "cm" ? "centimetres" : "inches"}</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-xs text-neutral-600">
                    <thead><tr className="border-b border-neutral-300 uppercase tracking-wide">{["Size", "Chest", "Waist", "Hip", "Shoulder", "Sleeve"].map((label) => <th key={label} className="px-2 py-2">{label}</th>)}</tr></thead>
                    <tbody>{product.sizeChart.map((row) => <tr key={row.product_size_measurement_id || row.size_id} className="border-b border-neutral-100"><td className="px-2 py-2 font-semibold text-neutral-900">{row.size_name}</td>{["chest", "waist", "hip", "shoulder", "sleeve_length"].map((field) => <td key={field} className="px-2 py-2">{row[field] ?? "—"}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {product.related?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeading eyebrow="Pairs Well" title="Complete the Look" />
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {product.related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="bg-cream">
        <ReviewsSection
          productId={product.id}
          initialReviews={product.reviews || []}
          summary={product.ratingSummary}
        />
      </div>
    </>
  );
}
