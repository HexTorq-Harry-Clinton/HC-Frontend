import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import { getCategoryData } from "@/lib/shop";
import CategoryView from "./CategoryView";
import OccasionSlider from "./OccasionSlider";
import "./category-main.css";

// Occasion storytelling page: exact section order of the previous UI —
// hero video + Shop Now, marquee, image/video trio, slider + description split,
// wide video row, fade bar, filter grid, tail product grid.
// Hero copy/marquee/description/footer/keywords are verbatim per-page config.
export default async function OccasionPage({ page }) {
  const [data, settings, pageContentResponse] = await Promise.all([
    getCategoryData({ type: "occasion", page }),
    apiGet("/Settings").then(unwrap).catch(() => []),
    apiGet(`/Subcategory-Content/${page.slug}`).then(unwrap).catch(() => null),
  ]);

  const pageContent = pageContentResponse && !Array.isArray(pageContentResponse)
    ? pageContentResponse
    : Array.isArray(pageContentResponse) ? pageContentResponse[0] : null;
  const settingRows = Array.isArray(settings) ? settings : [];
  const settingKey = (suffix) =>
    `subcategory_${String(page.slug || page.heroTitle || "")
      .toLowerCase()
      .replace(/\s+/g, "_")}_${suffix}`;
  const getSetting = (suffix) => {
    const key = settingKey(suffix);
    const row = settingRows.find(
      (item) => item.setting_key?.toLowerCase() === key || item.key?.toLowerCase() === key
    );
    return row?.setting_value ?? row?.value ?? "";
  };
  const getContent = (field, suffix, fallback = "") => pageContent?.[field] || getSetting(suffix) || fallback;
  const parseSetting = (suffix) => {
    const value = getSetting(suffix);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };
  const mediaUrl = (value) => {
    if (!value) return null;
    return String(value).startsWith("/") ? value : resolveUploadUrl(value);
  };

  // The source Suit subcategory files use the WeddingPage media imports as
  // their shared fallback; saved subcategory settings override these values.
  const configuredSliderImgs = pageContent
    ? [pageContent.slider_image_1_url, pageContent.slider_image_2_url, pageContent.slider_image_3_url].filter(Boolean)
    : parseSetting("slider_images");
  const defaultImage = "/brand/Wedding.jpeg";
  const defaultSliderImgs = [defaultImage, defaultImage, defaultImage];
  const heroVideoUrl = mediaUrl(getContent("hero_video_url", "hero_video")) ||
    "/brand/wedding-page.mp4";
  const trioLeft = mediaUrl(getContent("left_image_url", "left_image"));
  const trioVideoUrl = mediaUrl(getContent("center_video_url", "center_video")) || "/brand/wedding-center.mp4";
  const trioRight = mediaUrl(getContent("right_image_url", "right_image"));
  const wideVideoUrl = mediaUrl(getContent("label_video_url", "label_video")) || "/brand/wedding-label.mp4";
  const configuredImages = Array.isArray(configuredSliderImgs)
    ? configuredSliderImgs.map(mediaUrl).filter(Boolean)
    : [];
  const effectiveSliderImgs = configuredImages.length > 0 ? configuredImages : defaultSliderImgs;

  const effectiveTrioLeft = trioLeft || defaultImage;
  const effectiveTrioRight = trioRight || defaultImage;
  const labelImage = mediaUrl(getContent("label_image_url", "label_image")) || defaultImage;
  const heroTitle = getContent("hero_title", "hero_title", page.heroTitle);
  const heroSubtitle = getContent("hero_subtitle", "hero_subtitle", page.heroSubtitle);
  const marquee = pageContent?.marquee_words_json
    ? (() => { try { return JSON.parse(pageContent.marquee_words_json); } catch { return null; } })()
    : parseSetting("marquee_words");
  const descTitle = getContent("description_title", "description_title", page.descTitle);
  const descText = getContent("description_text", "description_text", page.descText);
  const footer = getContent("footer_text", "footer_text", page.footer);

  const scrollToGrid = "#category-grid";

  return (
    <>
      {/* ===== HERO VIDEO ===== */}
      <section className="relative w-full bg-neutral-950">
        {heroVideoUrl ? (
          <video src={heroVideoUrl} className="h-[600px] w-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <div className="h-[420px] w-full bg-[radial-gradient(ellipse_at_top,#3a3a3a,#0a0a0a_70%)]" />
        )}
        {/* same bottom-left overlay, type and pill button as the category hero */}
        <div className="category-hero__content">
          <h1 className="category-hero__title">{heroTitle}</h1>
          <h5 className="category-hero__subtitle">{heroSubtitle}</h5>
          <a href={scrollToGrid} className="category-hero__button oc-hero-btn">
            Shop Now
          </a>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="category-marquee" aria-label={(Array.isArray(marquee) ? marquee : page.marquee).join(" ")}>
        <div className="category-marquee__track" aria-hidden="true">
          {Array(20).fill(Array.isArray(marquee) ? marquee : page.marquee).flat().map((word, idx) => (
            <span key={idx} className="category-marquee__word">
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* ===== TRIO: image – video – image ===== */}
      {(trioLeft || trioVideoUrl || trioRight) && (
        <section className="my-0 w-full px-0">
          <div className="oc-row">
            <div className="oc-4">
              {effectiveTrioLeft && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={effectiveTrioLeft} alt="Left" className="oc-img" style={{ height: "520px" }} />
              )}
            </div>
            <div className="oc-4">
              {trioVideoUrl && (
                <video src={trioVideoUrl} className="oc-img" style={{ height: "520px" }} autoPlay loop muted playsInline controls />
              )}
            </div>
            <div className="oc-4">
              {effectiveTrioRight && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={effectiveTrioRight} alt="Right" className="oc-img" style={{ height: "520px" }} />
              )}
            </div>
          </div>
        </section>
      )}
      <div className="h-1">

      </div>
      {/* ===== SPLIT: slider + description ===== */}
      <div className="oc-row oc-description-row mx-0 mt-0">
        <div className="oc-6 p-0">
          <OccasionSlider images={effectiveSliderImgs} />
        </div>
        <div className="oc-6 oc-flex oc-desc">
          <div>
            <h3 className="oc-desc-title">{descTitle}</h3>
            {descText.split("\n").map((para, idx) => (
              <p key={idx} className="oc-desc-text">{para}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="h-1"></div>
      {/* ===== WIDE: video + image ===== */}
      {(wideVideoUrl || wideImg) && (
        <div className="oc-row mx-0 mt-0">
          <div className="oc-9 p-0">
            {wideVideoUrl && (
              <video src={wideVideoUrl} className="w-full" style={{ height: "500px", objectFit: "cover" }} autoPlay loop muted playsInline />
            )}
          </div>
          <div className="oc-3 p-0">
            {labelImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={labelImage} alt="Right Side" style={{ height: "500px", width: "100%", objectFit: "cover" }} />
            )}
          </div>
        </div>
      )}

      {/* FADE BAR */}
      <div className="oc-fade-bar">
        <span className="fade-in-out-text">{footer}</span>
      </div>
      <style>{`
        .fade-in-out-text { display: inline-block; animation: fadeInOut 7s ease-in-out infinite; }
        @keyframes fadeInOut { 0% { opacity: 0; } 25% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; } }
         .oc-hero-btn { display: inline-block; text-decoration: none; }
         .oc-desc { padding: 1.5rem; }
         .oc-desc { min-height: 500px; }
         .oc-desc > div { width: 100%; margin-block: auto; }
        /* reference: Bootstrap h3 / p in the description column */
        .oc-desc-title { margin: 0 0 0.5rem; font-size: calc(1.3rem + 0.6vw); font-weight: 500; line-height: 1.2; color: #212529; }
         .oc-desc-text { margin: 0 0 1rem; font-size: 1rem; line-height: 1.5; color: #212529; }
         .oc-desc-text:last-child { margin-bottom: 0; }
        /* reference: bg-light bar, fw-bold text-uppercase fs-4 */
        .oc-fade-bar { padding: 1.5rem 0; background: #f8f9fa; text-align: center; }
        .oc-fade-bar .fade-in-out-text { font-size: calc(1.275rem + 0.3vw); font-weight: 700; text-transform: uppercase; }
        @media (min-width: 1200px) {
          .oc-desc-title { font-size: 1.75rem; }
          .oc-fade-bar .fade-in-out-text { font-size: 1.5rem; }
        }
         .oc-row { display: flex; flex-wrap: wrap; }
         .oc-description-row { margin-top: 0.5rem; }
        .oc-4 { flex: 0 0 auto; width: 33.3333%; }
        .oc-6 { flex: 0 0 auto; width: 50%; }
        .oc-9 { flex: 0 0 auto; width: 75%; }
        .oc-3 { flex: 0 0 auto; width: 25%; }
        /* reference col-md-*: columns from 768px up, stacked below */
         @media (max-width: 767.98px) { .oc-4, .oc-6, .oc-9, .oc-3 { width: 100%; } }
         @media (max-width: 767.98px) { .oc-desc { min-height: 0; } }
        .oc-img { width: 100%; object-fit: cover; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075); }
        .oc-flex { display: flex; align-items: center; }
        .mx-0 { margin-left: 0; margin-right: 0; } .my-0 { margin-top: 0; margin-bottom: 0; }
        .mt-0 { margin-top: 0; } .mt-1 { margin-top: 0.25rem; }
        .p-0 { padding: 0; } .p-4 { padding: 1rem; } .px-0 { padding-left: 0; padding-right: 0; }
        .w-full { width: 100%; }
      `}</style>

      {/* ===== PRODUCT GRID ===== */}
      <div className="mx-auto max-w-7xl px-2 py-4" id="category-grid">
        <CategoryView
          products={data.products}
           sizes={data.sizes}
           clothTypes={data.clothTypes}
           colors={data.colors}
           showFilters={false}
           columns={3}
           showToolbar={false}
           compact
          emptyTitle={`No ${heroTitle} pieces yet`}
        />
      </div>
    </>
  );
}
