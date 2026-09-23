import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import { getCategoryData } from "@/lib/shop";
import Breadcrumb from "./Breadcrumb";
import CategoryView from "./CategoryView";
import OccasionSlider from "./OccasionSlider";
import ProductGrid from "./ProductGrid";

// Occasion storytelling page: exact section order of the previous UI —
// hero video + Shop Now, marquee, image/video trio, slider + description split,
// wide video row, fade bar, filter grid, tail product grid.
// Hero copy/marquee/description/footer/keywords are verbatim per-page config.
export default async function OccasionPage({ page }) {
  const [data, sliders, videos] = await Promise.all([
    getCategoryData({ type: "occasion", page }),
    apiGet("/Image-Sliders").then(unwrap).catch(() => []),
    apiGet("/Menu-Video").then(unwrap).catch(() => []),
  ]);

  const isUnrelated = (u) => {
    if (!u) return true;
    const s = String(u).toLowerCase();
    return s.includes("example.com") || s.includes("w3schools") || s.includes("mov_bbb") || s.includes("bunny") || s.includes("sample");
  };

  const sliderImgs = sliders
    .filter((s) => s.isactive !== false)
    .map((s) => resolveUploadUrl(s.image_url || s.media_url || s.src))
    .filter(Boolean)
    .slice(0, 3);
  const activeVideo = videos.find((v) => v.isactive !== false && !isUnrelated(v.video_url));
  const apiVideoUrl = activeVideo?.video_url ? resolveUploadUrl(activeVideo.video_url) : null;
  const isBusiness = String(page.category || "").toLowerCase().includes("business") || String(page.slug || "").toLowerCase().includes("business");

  // Client bespoke video suite per section
  const heroVideoUrl = (apiVideoUrl && !isUnrelated(apiVideoUrl))
    ? apiVideoUrl
    : (isBusiness ? "/brand/business-category.mp4" : "/brand/wedding-page.mp4");
  const trioVideoUrl = "/brand/wedding-center.mp4";
  const wideVideoUrl = "/brand/wedding-label.mp4";

  const gridMedia = data.products.map((p) => p.image).filter(Boolean);
  const trioLeft = gridMedia[0] || sliderImgs[0];
  const trioRight = gridMedia[1] || sliderImgs[1];
  const wideImg = gridMedia[2] || sliderImgs[2];

  const scrollToGrid = "#category-grid";

  return (
    <>
      <Breadcrumb />
      {/* ===== HERO VIDEO ===== */}
      <section className="relative w-full bg-neutral-950">
        {heroVideoUrl ? (
          <video src={heroVideoUrl} className="h-[600px] w-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <div className="h-[420px] w-full bg-[radial-gradient(ellipse_at_top,#3a3a3a,#0a0a0a_70%)]" />
        )}
        <div className="absolute inset-0 flex flex-col items-start justify-center px-6 text-white md:px-16">
          <h1 className="font-display text-5xl font-bold md:text-6xl">{page.heroTitle}</h1>
          <h5 className="mt-2 text-lg font-normal">{page.heroSubtitle}</h5>
          <a
            href={scrollToGrid}
            className="btn-primary mt-4 "
          >
            Shop Now
          </a>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden bg-[#141414] text-[#f7f4ec]">
        <div className="animate-marquee py-4">
          {Array(4).fill(page.marquee).flat().map((word, idx) => (
            <span key={idx} className="mx-4 font-bold uppercase">
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
              {trioLeft && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trioLeft} alt="Left" className="oc-img" style={{ height: "520px" }} />
              )}
            </div>
            <div className="oc-4">
              {trioVideoUrl && (
                <video src={trioVideoUrl} className="oc-img" style={{ height: "520px" }} autoPlay loop muted playsInline controls />
              )}
            </div>
            <div className="oc-4">
              {trioRight && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trioRight} alt="Right" className="oc-img" style={{ height: "520px" }} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== SPLIT: slider + description ===== */}
      <div className="oc-row mx-0 mt-0">
        <div className="oc-6 p-0">
          <OccasionSlider images={sliderImgs} />
        </div>
        <div className="oc-6 oc-flex p-4">
          <div>
            <h3 className="font-display text-3xl font-bold text-[#f7f4ec]">{page.descTitle}</h3>
            {page.descText.split("\n").map((para, idx) => (
              <p key={idx} className="mt-3 text-neutral-300">{para}</p>
            ))}
          </div>
        </div>
      </div>

      {/* ===== WIDE: video + image ===== */}
      {(wideVideoUrl || wideImg) && (
        <div className="oc-row mx-0 mt-1">
          <div className="oc-9 p-0">
            {wideVideoUrl && (
              <video src={wideVideoUrl} className="w-full" style={{ height: "500px", objectFit: "cover" }} autoPlay loop muted playsInline />
            )}
          </div>
          <div className="oc-3 p-0">
            {wideImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wideImg} alt="Right Side" style={{ height: "500px", width: "100%", objectFit: "cover" }} />
            )}
          </div>
        </div>
      )}

      {/* FADE BAR */}
      <div className="bg-[#141414] py-4 text-center text-[#f7f4ec]">
        <span className="fade-in-out-text text-xl font-bold uppercase">{page.footer}</span>
      </div>
      <style>{`
        .fade-in-out-text { display: inline-block; animation: fadeInOut 7s ease-in-out infinite; }
        @keyframes fadeInOut { 0% { opacity: 0; } 25% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; } }
        .oc-row { display: flex; flex-wrap: wrap; }
        .oc-4 { flex: 0 0 auto; width: 33.3333%; }
        .oc-6 { flex: 0 0 auto; width: 50%; }
        .oc-9 { flex: 0 0 auto; width: 75%; }
        .oc-3 { flex: 0 0 auto; width: 25%; }
        @media (max-width: 768px) { .oc-4, .oc-6, .oc-9, .oc-3 { width: 100%; } }
        .oc-img { width: 100%; object-fit: cover; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .oc-flex { display: flex; align-items: center; }
        .mx-0 { margin-left: 0; margin-right: 0; } .my-0 { margin-top: 0; margin-bottom: 0; }
        .mt-0 { margin-top: 0; } .mt-1 { margin-top: 0.25rem; }
        .p-0 { padding: 0; } .p-4 { padding: 1rem; } .px-0 { padding-left: 0; padding-right: 0; }
        .w-full { width: 100%; }
      `}</style>

      {/* ===== PRODUCT GRID ===== */}
      <div className="mx-auto max-w-7xl px-4 py-10" id="category-grid">
        <CategoryView
          products={data.products}
          sizes={data.sizes}
          clothTypes={data.clothTypes}
          colors={data.colors}
          showToolbar={false}
          emptyTitle={`No ${page.heroTitle} pieces yet`}
        />
      </div>

      <ProductGrid keyword="" />
    </>
  );
}
