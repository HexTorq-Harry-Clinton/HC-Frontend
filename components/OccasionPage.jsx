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

  const sliderImgs = sliders
    .filter((s) => s.isactive !== false)
    .map((s) => resolveUploadUrl(s.image_url || s.media_url || s.src))
    .filter(Boolean)
    .slice(0, 3);
  const video = videos.find((v) => v.isactive !== false) || videos[0];
  const videoUrl = resolveUploadUrl(video?.video_url);
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
        {videoUrl ? (
          <video src={videoUrl} className="h-[600px] w-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <div className="h-[420px] w-full bg-[radial-gradient(ellipse_at_top,#3a3a3a,#0a0a0a_70%)]" />
        )}
        <div className="absolute inset-0 flex flex-col items-start justify-center px-6 text-white md:px-16">
          <h1 className="font-display text-5xl font-bold md:text-6xl">{page.heroTitle}</h1>
          <h5 className="mt-2 text-lg font-normal">{page.heroSubtitle}</h5>
          <a
            href={scrollToGrid}
            className="btn-primary mt-4 !rounded-full"
          >
            Shop Now
          </a>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden bg-neutral-100">
        <div className="animate-marquee py-4">
          {Array(4).fill(page.marquee).flat().map((word, idx) => (
            <span key={idx} className="mx-4 font-bold uppercase">
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* ===== TRIO: image – video – image ===== */}
      {(trioLeft || videoUrl || trioRight) && (
        <section className="my-0 w-full px-0">
          <div className="oc-row">
            <div className="oc-4">
              {trioLeft && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trioLeft} alt="Left" className="oc-img" style={{ height: "520px" }} />
              )}
            </div>
            <div className="oc-4">
              {videoUrl && (
                <video src={videoUrl} className="oc-img" style={{ height: "520px" }} autoPlay loop muted playsInline controls />
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
            <h3 className="font-display text-3xl font-bold">{page.descTitle}</h3>
            {page.descText.split("\n").map((para, idx) => (
              <p key={idx} className="mt-3 text-neutral-600">{para}</p>
            ))}
          </div>
        </div>
      </div>

      {/* ===== WIDE: video + image ===== */}
      {(videoUrl || wideImg) && (
        <div className="oc-row mx-0 mt-1">
          <div className="oc-9 p-0">
            {videoUrl && (
              <video src={videoUrl} className="w-full" style={{ height: "500px", objectFit: "cover" }} autoPlay loop muted playsInline />
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
      <div className="bg-neutral-100 py-4 text-center">
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
