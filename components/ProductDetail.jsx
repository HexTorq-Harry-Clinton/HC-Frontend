"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inr, resolveUploadUrl } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useCart } from "./CartProvider";
import WishlistHeart from "./WishlistHeart";
import { PLACEHOLDER_IMAGE } from "./ProductCard";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import ReviewsSection from "./ReviewsSection";

// Product detail: Professional luxury atelier presentation —
// dynamic color swatches, color-responsive gallery, size selector,
// price, description, Add to Cart with color & size attribution,
// plus related products and verified reviews.
export default function ProductDetail({ product }) {
  const cart = useCart();
  const router = useRouter();

  // Color selection state
  const colorVariants = product.colorVariants || [];
  const initialColor = colorVariants[0]?.name || product.colors?.[0] || "";
  const [selectedColor, setSelectedColor] = useState(initialColor);

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState("");
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

  // Active gallery strictly reflects the chosen color's photos
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
  const activeMediaMeta = mediaMetaFor(currentGallery[activeImg] || currentGallery[0]);
  const isVideoMedia = activeMediaMeta?.media_type === "video" || activeMediaMeta?.media_role === "video";

  // Dynamic titles, prices, and sizes based on chosen colorway
  const displayTitle = activeColorObj?.title || product.name;
  const basePrice = activeColorObj?.price ?? product.price;

  // Sizes setup for the active colorway
  const activeVariants =
    activeColorObj?.variants?.length > 0
      ? activeColorObj.variants
      : (product.variants || []);

  const baseSizes =
    activeVariants.length > 0
      ? activeVariants.map((v, idx) => ({
          key: v.product_variant_id || v.size_id || `${v.label || v.variant_name || "size"}-${idx}`,
          label: v.label || v.size_id || v.variant_name || "M",
          price: v.price || basePrice,
          available: v.available !== false,
          variant: v,
        }))
      : [{ key: "default", label: "M", price: basePrice, available: true, variant: null }];

  const [size, setSize] = useState(baseSizes.length === 1 ? baseSizes[0].key : "");
  const selected = baseSizes.find((s) => s.key === size) || (baseSizes.length === 1 ? baseSizes[0] : null);
  const displayPrice = selected?.price ?? basePrice;
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
    setActiveImg(0);
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

  const handlePrevImg = () => {
    setActiveImg((prev) => (prev > 0 ? prev - 1 : currentGallery.length - 1));
  };

  const handleNextImg = () => {
    setActiveImg((prev) => (prev < currentGallery.length - 1 ? prev + 1 : 0));
  };

  const addToBag = () => {
    if (baseSizes.length > 1 && !size) {
      setSizeError("Please select a size");
      return;
    }
    setSizeError("");
    const chosenSize = selected?.label || baseSizes[0]?.label || "M";
    cart?.addToCart(
      {
        id: activeId,
        slug: activeSlug,
        name: displayTitle,
        price: displayPrice,
        image: currentGallery[activeImg] || currentGallery[0],
        size: chosenSize,
        color: selectedColor || activeColorObj.name || null,
        product_id: activeId,
        product_variant_id: selected?.variant?.product_variant_id || null,
        unit_price: displayPrice,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const activeColorHex = activeColorObj?.hex || "#111111";
  const isLightColor = ["#fcfcfc", "#f7f4ec", "#f5f0e6", "#d8cebe"].includes(activeColorHex.toLowerCase());

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid items-start gap-10 md:grid-cols-2">
          {/* Left: Gallery (Image updates dynamically based on selected color) */}
          <div className="relative md:sticky md:top-24 md:self-start">
             <div className="group relative aspect-[4/5] overflow-hidden border border-neutral-200 bg-white shadow-sm md:aspect-auto md:h-[min(68vh,620px)]">
               {isVideoMedia ? (
                 <video
                   key={`${selectedColor}-${activeImg}-${currentGallery[activeImg] || currentGallery[0]}`}
                   src={currentGallery[activeImg] || currentGallery[0]}
                   aria-label={`${displayTitle} ${activeMediaMeta?.media_role || "video"}`}
                    className="absolute inset-0 h-full w-full bg-white object-contain"
                   controls
                   muted
                   playsInline
                 />
               ) : (
                  <img
                    key={`${selectedColor}-${activeImg}-${currentGallery[activeImg] || currentGallery[0]}`}
                    src={currentGallery[activeImg] || currentGallery[0]}
                    alt={`${displayTitle} in ${selectedColor || "atelier colorway"}`}
                    className="absolute inset-0 h-full w-full cursor-zoom-in bg-white object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                  />
               )}
               {activeMediaMeta?.media_role && (
                 <span className="absolute bottom-3 left-3 bg-neutral-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                   {activeMediaMeta.media_role}
                 </span>
               )}

              {/* Luxury Color Pill Overlay */}
              {selectedColor && (
                <div className="absolute top-3.5 left-3.5 bg-neutral-950/85 backdrop-blur-md text-white text-[12px] font-bold px-3 py-1.5 uppercase tracking-widest border border-white/20 flex items-center gap-2 shadow-lg">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-white/40 shrink-0"
                    style={{ backgroundColor: activeColorHex }}
                  />
                  <span>{selectedColor}</span>
                  {currentGallery.length > 1 && (
                    <span className="text-white/60 font-normal ml-1 text-[11px]">
                      {activeImg + 1} / {currentGallery.length}
                    </span>
                  )}
                </div>
              )}

              {/* Prev / Next Chevrons on Hero Image */}
              {currentGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImg}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-neutral-950/70 text-white backdrop-blur-sm flex items-center justify-center opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-neutral-950 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImg}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-neutral-950/70 text-white backdrop-blur-sm flex items-center justify-center opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-neutral-950 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip for Selected Color */}
            {currentGallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {currentGallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`relative aspect-square overflow-hidden bg-neutral-100 border transition-all duration-200 cursor-pointer ${
                      i === activeImg
                        ? "border-[#c6a15b] ring-2 ring-[#c6a15b] opacity-100"
                        : "border-neutral-200 opacity-65 hover:opacity-100 hover:border-neutral-400"
                    }`}
                  >
                       {mediaMetaFor(src)?.media_type === "video" || mediaMetaFor(src)?.media_role === "video" ? (
                          <video src={src} aria-label={`${displayTitle} video ${i + 1}`} className="absolute inset-0 h-full w-full bg-white object-contain" muted />
                       ) : (
                          <img src={src} alt={`${displayTitle} ${selectedColor} view ${i + 1}`} className="absolute inset-0 h-full w-full bg-white object-contain" />
                       )}
                       {mediaMetaFor(src)?.media_role && <span className="absolute bottom-0 left-0 right-0 bg-neutral-950/70 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">{mediaMetaFor(src).media_role}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info, Colorway Swatches, Sizes, Bag Action */}
           <Reveal>
            <h1 className="font-display text-[32px] font-bold leading-tight text-neutral-950">{displayTitle}</h1>
            {product.description && (
              <p className="mt-2 text-[15px] text-neutral-600 font-normal leading-relaxed">{product.description}</p>
            )}
             <div className="mt-3 flex items-center gap-2">
               <h3 className="text-[22px] font-bold tracking-tight text-neutral-900">{inr(displayPrice)}</h3>
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

            {product.fullDescription && product.fullDescription !== product.description && (
              <>
                <h5 className="mt-5 text-[15px] font-bold uppercase tracking-wider text-neutral-900">Description</h5>
                <div
                  className="mt-1 text-[15px] text-neutral-600 leading-relaxed font-normal"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.fullDescription) }}
                />
              </>
            )}

            {product.details && Object.entries({
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
            }).some(([, value]) => value) && (
              <div className="mt-6 border-y border-neutral-200">
                {Object.entries({
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
                }).filter(([, value]) => value).map(([label, value]) => (
                  <details key={label} className="border-b border-neutral-200 py-3 last:border-b-0">
                    <summary className="cursor-pointer text-[12px] font-bold uppercase tracking-widest text-neutral-900">{label}</summary>
                    <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600">{value}</p>
                  </details>
                ))}
              </div>
            )}

            {product.sizeChart?.length > 0 && (
              <details className="mt-6 border-y border-neutral-200 py-3">
                <summary className="cursor-pointer text-[12px] font-bold uppercase tracking-widest text-neutral-900">Measurements / Size Guide</summary>
                <div className="mt-3 overflow-x-auto">
                  <p className="mb-2 text-[11px] uppercase tracking-widest text-neutral-500">All measurements in {product.sizeChart[0]?.unit === "cm" ? "centimetres" : "inches"}</p>
                  <table className="w-full min-w-[620px] text-left text-xs text-neutral-600">
                    <thead><tr className="border-b border-neutral-200 uppercase tracking-wide">{["Size", "Chest", "Waist", "Hip", "Shoulder", "Sleeve"].map((label) => <th key={label} className="px-2 py-2">{label}</th>)}</tr></thead>
                    <tbody>{product.sizeChart.map((row) => <tr key={row.product_size_measurement_id || row.size_id} className="border-b border-neutral-100"><td className="px-2 py-2 font-semibold text-neutral-900">{row.size_name}</td>{["chest", "waist", "hip", "shoulder", "sleeve_length"].map((field) => <td key={field} className="px-2 py-2">{row[field] ?? "—"}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </details>
            )}

            {/* Luxury Color Swatch Selector — updates images on click */}
            {colorVariants.length > 0 && (
              <div className="mt-6 pt-5 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">
                    Color: <span className="text-[#c6a15b] font-bold ml-1">{selectedColor || activeColorObj.name}</span>
                  </span>
                  <span className="text-[12px] uppercase tracking-wider text-neutral-400 font-semibold">
                    {colorVariants.length} {colorVariants.length === 1 ? "Option" : "Options"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {colorVariants.map((c) => {
                    const isSelected =
                      (selectedColor || activeColorObj.name || "").toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleColorChange(c.name)}
                        aria-label={`Select color ${c.name}`}
                        title={c.name}
                        className={`product-color-swatch group relative h-10 w-10 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? "ring-2 ring-[#c6a15b] ring-offset-2 scale-110 shadow-md"
                            : "hover:scale-105 hover:ring-1 hover:ring-neutral-400 opacity-90 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: c.hex,
                          border: c.border ? `1.5px solid ${c.border}` : "1.5px solid rgba(0,0,0,0.18)",
                        }}
                      >
                        {/* Luxury floating tooltip on hover */}
                        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white text-[10px] px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-30 font-bold uppercase tracking-widest shadow-lg border border-white/10">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {baseSizes.length > 1 && (
              <div className="mt-6 pt-5 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900 m-0">
                    Select Size
                  </h5>
                  {selected && (
                    <span className="text-[12px] font-bold text-neutral-600">
                      Selected: <strong className="text-neutral-950">{selected.label}</strong>
                    </span>
                  )}
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
                      className={`border px-4 py-2.5 text-[15px] font-bold transition-all disabled:opacity-40 cursor-pointer ${
                        size === s.key
                          ? "border-[#c6a15b] bg-neutral-950 text-white shadow-sm"
                          : "border-neutral-300 text-neutral-900 hover:border-neutral-950"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sizeError && <p className="mt-2 text-[12px] text-red-600 font-bold">{sizeError}</p>}

            {/* Add to Bag / Bag Controls */}
            <div className="mt-6 border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-700">
              <span className="font-semibold text-neutral-950">Estimated delivery date:</span>{" "}
              <span suppressHydrationWarning>{deliveryDate}</span>
            </div>
            {bagLine ? (
              <>
                <div className="mt-6 flex items-stretch gap-3">
                  <div className="flex shrink-0 items-center border border-neutral-300" role="group" aria-label="Quantity">
                    <button
                      onClick={() =>
                        cart?.updateQty(bagLine.key || bagLine.id, Math.max(1, (bagLine.qty || 1) - 1))
                      }
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
                    className="min-w-0 flex-1 cursor-pointer bg-green-700 px-2 py-3.5 text-[12px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-green-800 sm:text-[15px]"
                  >
                    Already Added — View Bag
                  </button>
                  <WishlistHeart
                    product={{
                      id: activeId,
                      name: displayTitle,
                      price: displayPrice,
                      image: currentGallery[0],
                    }}
                    className="shrink-0 border border-neutral-300 px-4 py-3 text-lg transition hover:border-[#c6a15b] sm:px-5"
                  />
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-green-700">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-600" />
                  In your bag ({selectedColor || "Original"})
                </p>
              </>
            ) : (
              <div className="mt-6 flex items-stretch gap-3">
                <div className="flex shrink-0 items-center border border-neutral-300" role="group" aria-label="Quantity">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="px-3 text-[15px] font-bold transition hover:bg-neutral-100"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-[15px] font-bold" aria-live="polite">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="px-3 text-[15px] font-bold transition hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>
                  <button
                    onClick={addToBag}
                    className={`min-w-0 flex-1 cursor-pointer px-2 py-3.5 text-[12px] font-bold uppercase tracking-wider text-white shadow-md transition sm:text-[15px] ${
                      added ? "bg-green-700" : "bg-neutral-950 hover:bg-[#c6a15b] hover:text-neutral-950"
                    }`}
                  >
                    {added ? "Added to Cart" : `Add to Cart ${selectedColor ? `(${selectedColor})` : ""}`}
                  </button>
                  <WishlistHeart
                    product={{
                      id: activeId,
                      name: displayTitle,
                      price: displayPrice,
                      image: currentGallery[0],
                    }}
                    className="shrink-0 border border-neutral-300 px-4 py-3 text-lg transition hover:border-[#c6a15b] sm:px-5"
                  />
              </div>
            )}

            <button onClick={() => router.back()} className="link-sweep mt-4 text-[12px] font-bold uppercase tracking-wider block">
              ← Continue Shopping
            </button>

            <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
              <details className="group py-4">
                <summary className="cursor-pointer text-[12px] font-bold uppercase tracking-widest text-neutral-900 marker:text-[#c6a15b]">
                  Shipping & Returns
                </summary>
                <p className="mt-2 text-[15px] text-neutral-600 font-normal leading-relaxed">
                  Dispatched in 5–7 working days. Complimentary bespoke fitting adjustments included. Easy 7-day returns on unworn pieces.
                </p>
              </details>
              <details className="group py-4">
                <summary className="cursor-pointer text-[12px] font-bold uppercase tracking-widest text-neutral-900 marker:text-[#c6a15b]">
                  Atelier Care
                </summary>
                <p className="mt-2 text-[15px] text-neutral-600 font-normal leading-relaxed">
                  Dry clean only. Store on a broad contoured wooden hanger in the breathable garment sleeve provided.
                </p>
              </details>
            </div>
          </Reveal>
        </div>
      </div>

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
