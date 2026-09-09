// https://intl.fursac.com/en/c-new-collection.html-------for the reference
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategoryProducts } from "../../../../hooks/useCategoryProducts";
import { PLACEHOLDER_IMAGE } from "../../../../shared/placeholder";
import ProductFilters from "../../ProductFilters";
import ProductGrid from "../../ProductGrid";
import { safeParse, useSubcategorySettings } from "../../../../utils/contentHelpers";
// import logo from ""; // "../../../../shared/assets/images/HC Black.png"
import weddingVideo from "../../../../shared/assets/video/WeddingPage/WeddingPageVideo.mp4"; // "../../../../shared/assets/video/WeddingPage/WeddingPageVideo.mp4"

import leftImg from "../../../../shared/assets/images/ProductDetail/SangeetBlack.jpg"; // "../../../../shared/assets/images/WeddingPage/WeddingLeftImage.jpeg"
import centerVideo from "../../../../shared/assets/video/WeddingPage/WeddingPageVideo.mp4"; // "../../../../shared/assets/video/WeddingPage/WeddingCenterVideo.mp4"
import rightImg from "../../../../shared/assets/images/ProductDetail/SangeetBlack.jpg"; // "../../../../shared/assets/images/WeddingPage/WeddingRightImage.jpeg"

import sliderImg1 from "../../../../shared/assets/images/ProductDetail/SangeetBlack.jpg"; // "../../../../shared/assets/images/WeddingPage/Slider/SliderImage1.jpeg"
import sliderImg2 from "../../../../shared/assets/images/ProductDetail/SangeetBlack.jpg"; // "../../../../shared/assets/images/WeddingPage/Slider/SliderImage2.jpeg"
import sliderImg3 from "../../../../shared/assets/images/ProductDetail/SangeetBlack.jpg"; // "../../../../shared/assets/images/WeddingPage/Slider/SliderImage3.jpeg"

import LabelVideo from "../../../../shared/assets/video/WeddingPage/WeddingPageVideo.mp4"; // "../../../../shared/assets/video/WeddingPage/WeddingLabelVideo.mp4"
import LabelImage from "../../../../shared/assets/images/ProductDetail/SangeetBlack.jpg"; // "../../../../shared/assets/images/WeddingPage/LabelImage.jpeg"

const WEDDING_KEYWORDS = ["wedding", "sangeet", "reception", "engagement", "mehendi", "haldi", "church", "destination"];

const WeddingPage = () => {
  const navigate = useNavigate();
  const { s } = useSubcategorySettings("wedding");

  const dynamicHeroVideo = s("hero_video") || weddingVideo;
  const dynamicHeroTitle = s("hero_title") || "Wedding";
  const dynamicHeroSubtitle =
    s("hero_subtitle") || "For the Men Who Wear Royalty, Not Just Suits.";
  const dynamicMarquee =
    safeParse(s("marquee_words")) || [
      "Wedding",
    ];
  const dynamicLeftImage = s("left_image") || leftImg;
  const dynamicCenterVideo = s("center_video") || centerVideo;
  const dynamicRightImage = s("right_image") || rightImg;
  const dynamicSliderImages =
    safeParse(s("slider_images")) || [sliderImg1, sliderImg2, sliderImg3];
  const dynamicLabelVideo = s("label_video") || LabelVideo;
  const dynamicLabelImage = s("label_image") || LabelImage;
  const dynamicDescriptionTitle =
    s("description_title") || "The Wedding Edit";
  const dynamicDescriptionText =
    s("description_text") ||
    "Command attention with this masterpiece of craftsmanship: a luxurious black velvet tuxedo intricately hand-embroidered with golden threadwork and shimmering sequins. The blazer features an ornate front design, extending seamlessly to an equally detailed back, showcasing royal patterns inspired by heritage artistry. Paired with a sleek black shirt, bow tie, and trousers, the look is finished with a golden pocket square for the perfect touch of elegance.\n\nThis outfit blends modern tailoring with timeless hand embroidery, making it the ideal choice for weddings, receptions, red carpet events, and any occasion where sophistication meets grandeur.";
  const dynamicFooterText =
    s("footer_text") || "The Wedding Collection";

  // API-first product feed (shared hook). No hardcoded fallback products:
  // when the API has no wedding items the grid renders an empty state.
  const {
    categories,
    variants,
    attributeValues,
    attributes,
    sizes,
    clothTypes,
    loading,
  } = useCategoryProducts(WEDDING_KEYWORDS);

  const [filters, setFilters] = useState({
    size: "",
    clothType: "",
    color: "",
    minPrice: "",
    maxPrice: "",
  });
  const colorAttributeId = useMemo(() => {
    return attributes.find((a) => a.attribute_slug?.toLowerCase() === "color" || a.attribute_name?.toLowerCase() === "color")?.attribute_id;
  }, [attributes]);

  const availableColors = useMemo(() => {
    if (!colorAttributeId) return [];
    const values = attributeValues
      .filter((av) => av.attribute_id === colorAttributeId)
      .map((av) => av.attribute_value);
    return [...new Set(values)].filter(Boolean);
  }, [attributeValues, colorAttributeId]);

  const priceRange = useMemo(() => {
    if (categories.length === 0) return { min: 0, max: 0 };
    const prices = categories.map((c) => c.price || 0);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const productVariants = variants.filter((v) => v.product_id === cat.product_id);

      if (filters.size) {
        const hasSize = productVariants.some((v) => v.size_id === filters.size || v.size_id === sizes.find((s) => s.size_name === filters.size)?.size_id);
        if (!hasSize) return false;
      }

      if (filters.clothType) {
        const hasCloth = productVariants.some((v) => v.cloth_type_id === filters.clothType || v.cloth_type_id === clothTypes.find((ct) => ct.cloth_type_name === filters.clothType)?.cloth_type_id);
        if (!hasCloth) return false;
      }

      if (filters.color) {
        const hasColor = attributeValues.some(
          (av) =>
            av.product_id === cat.product_id &&
            av.attribute_value?.toLowerCase() === filters.color.toLowerCase() &&
            (!colorAttributeId || av.attribute_id === colorAttributeId)
        );
        if (!hasColor) return false;
      }

      const price = cat.price || 0;
      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;

      return true;
    });
  }, [categories, variants, attributeValues, sizes, clothTypes, colorAttributeId, filters]);

  const CategoryCard = ({ cat }) => (
    <div
      className="card border-0 rounded-0 overflow-hidden shadow-sm w-100"
      style={{ cursor: "pointer", transition: "transform 0.4s ease" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
// onClick={() => navigate(`/product/${cat.id}`)}
onClick={() => navigate(`/product/${cat.id}`)}

    >
      <div className="position-relative">
        {cat.video ? (
          <video
            src={cat.video}
            className="w-100"
            style={{ aspectRatio: "421.66 / 527.06", objectFit: "cover" }}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={cat.image}
            alt={cat.name}
            className="w-100"
            style={{ aspectRatio: "421.66 / 527.06", objectFit: "cover" }}
          />
        )}
        <div className="category-overlay">{cat.name}</div>
      </div>
    </div>
    
  );
  return (
    <>

      {/* ===== HERO VIDEO ===== */}
      <section className="position-relative w-100">
        <video
          src={dynamicHeroVideo}
          className="w-100"
          style={{ objectFit: "cover", height: "600px" }}
          autoPlay
          loop
          muted
          playsInline
        />
     
         <div className="position-absolute text-white hero-overlay">
          <h1 className="fw-bold display-4 mb-1">{dynamicHeroTitle}</h1>
          <h5 className="fw-normal mb-0">{dynamicHeroSubtitle}</h5>
          <button
            className="btn btn-light btn-lg fw-semibold mt-3"
            style={{ borderRadius: "20px", padding: "0.5rem 1.5rem" }}
            onClick={() => {
              const section = document.getElementById("category-grid");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Shop Now
          </button>
        </div>
      </section>
      {/* RUNNING TEXT BAR */}
      <div className="bg-light overflow-hidden">
        <div className="d-flex marquee-track py-4">
          {Array(4)
            .fill(dynamicMarquee)
            .flat()
            .map((word, idx) => (
              <span key={idx} className="mx-4 fw-bold text-uppercase">
                {word}
              </span>
            ))}
        </div>
      </div>
  {/* ===== NEW ROW: image â€“ video â€“ image ===== */}
    <section className="container-fluid my-0 px-0">
  <div className="row g-0">
    {/* Left Image */}
    <div className="col-md-4">
      <img
        src={dynamicLeftImage}
        alt="Left"
        className="img-fluid shadow-sm"
        style={{
          width: "100%",
          height: "520.39px",
          objectFit: "cover",
          borderRadius: "0px",
        }}
      />
    </div>
    {/* Center Video */}
    <div className="col-md-4">
      <video
        src={dynamicCenterVideo}
        className="w-100 shadow-sm"
        style={{
          height: "520.39px",
          objectFit: "cover",
          borderRadius: "0px",
        }}
        autoPlay
        loop
        muted
        playsInline
        controls 
      />
    </div>

    {/* Right Image */}
    <div className="col-md-4">
      <img
        src={dynamicRightImage}
        alt="Right"
        className="img-fluid shadow-sm"
        style={{
          width: "100%",
          height: "520.39px",
          objectFit: "cover",
          borderRadius: "0px",
        }}
      />
    </div>
  </div>
</section>

<div className="row g-0 mt-0 mx-0">
  {/* Left Side: Image Slider */}
  <div className="col-md-6 p-0"> {/* make it 50% width */}
    <div id="sliderCarousel" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner">
        <div className="carousel-item active">
          <img
            src={dynamicSliderImages[0]}
            className="d-block w-100"
            alt="Slide 1"
            style={{ height: "500px", objectFit: "cover" }}
          />
        </div>
        <div className="carousel-item">
          <img
            src={dynamicSliderImages[1]}
            className="d-block w-100"
            alt="Slide 2"
            style={{ height: "500px", objectFit: "cover" }}
          />
        </div>
        <div className="carousel-item">
          <img
            src={dynamicSliderImages[2]}
            className="d-block w-100"
            alt="Slide 3"
            style={{ height: "500px", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Controls */}
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#sliderCarousel"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#sliderCarousel"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  </div>

  {/* Right Side: Description */}
  <div className="col-md-6 d-flex align-items-center p-4">
    <div>
      <h3>{dynamicDescriptionTitle}</h3>
      {dynamicDescriptionText.split("\n").map((para, idx) => (
        <p key={idx}>{para}</p>
      ))}
    </div>
  </div>
</div>
{/* ===== NEW ROW: 75% Video â€“ 25% Image ===== */}
<div className="row g-0 mt-1 mx-0">
  {/* Left Side: Video (75%) */}
  <div className="col-md-9 p-0">
    <video
      src={dynamicLabelVideo}
      className="w-100"
      style={{ height: "500px", objectFit: "cover" }}
      autoPlay
      loop
      muted
      playsInline  
    />
  </div>

  {/* Right Side: Image (25%) */}
  <div className="col-md-3 p-0">
    <img
      src={dynamicLabelImage}
      alt="Right Side"
      className="img-fluid"
      style={{ height: "500px", width: "100%", objectFit: "cover" }}
    />
  </div>
</div>
{/* TEXT BAR WITH CONTINUOUS FADE-IN FADE-OUT */}
<div className="bg-light text-center py-4">
  <span className="fw-bold text-uppercase fs-4 fade-in-out-text">
    {dynamicFooterText}
  </span>
</div>

{/* Add this CSS to your WeddingPage.css or SuitsCategoryPage.css */}
<style>
{`
  .fade-in-out-text {
    display: inline-block;
    animation: fadeInOut 7s ease-in-out infinite;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; }
    25% { opacity: 1; }
    75% { opacity: 1; }
    100% { opacity: 0; }
  }
`}
</style>

{/* ===== PRODUCT GRID ===== */}
{loading && (
  <div className="text-center py-5">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading wedding collection...</span>
    </div>
  </div>
)}

{!loading && filteredCategories.length === 0 && (
  <div className="container-fluid px-0 my-0">
    <div className="text-center py-5">
      <img
        src={PLACEHOLDER_IMAGE}
        alt="No wedding pieces yet"
        style={{ width: "120px", opacity: 0.7 }}
      />
      <h4 className="mt-3">No wedding pieces yet</h4>
      <p className="text-muted">
        Our stylists are curating this collection. Please check back soon.
      </p>
    </div>
  </div>
)}

{!loading && filteredCategories.length > 0 && (
  <div className="container-fluid px-0 my-0">
    <div className="row">
      <div className="col-lg-3 mb-4">
        <ProductFilters
          filters={filters}
          setFilters={setFilters}
          sizes={sizes}
          clothTypes={clothTypes}
          colors={availableColors}
          priceRange={priceRange}
        />
      </div>
      <div className="col-lg-9">
        {/* CATEGORIES GRID */}
        <div id="category-grid" className="container-fluid px-0 my-0">

  {/* Row 1: Image â€“ Video â€“ Image */}
  <div className="row g-2">
    {filteredCategories.slice(0, 3).map((cat, i) => (
      <div key={i} className="col-12 col-md-4 d-flex">
        <CategoryCard cat={cat} />
      </div>
    ))}
  </div>

  {/* Row 2: Image â€“ Video â€“ Image */}
  <div className="row g-2 mt-2">
    {filteredCategories.slice(3, 6).map((cat, i) => (
      <div key={i + 3} className="col-12 col-md-4 d-flex">
        <CategoryCard cat={cat} />
      </div>
    ))}
  </div>

  {/* Row 3: Image â€“ Video â€“ Image */}
  <div className="row g-2 mt-2">
    {filteredCategories.slice(6, 9).map((cat, i) => (
      <div key={i + 6} className="col-12 col-md-4 d-flex">
        <CategoryCard cat={cat} />
      </div>
    ))}
  </div>

</div>
      </div>
    </div>
  </div>
)}

<ProductGrid keyword="wedding" />

    </>
  );
};

export default WeddingPage;
