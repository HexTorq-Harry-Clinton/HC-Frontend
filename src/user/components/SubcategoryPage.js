import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../../services/productService";
import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";
import { safeParse, useSubcategorySettings } from "../../utils/contentHelpers";
import { PLACEHOLDER_IMAGE as placeholderImage } from "../../shared/placeholder";

const SubcategoryPage = ({
  slug,
  heroVideo,
  heroTitle,
  heroSubtitle,
  marqueeWords,
  leftImage,
  centerVideo,
  rightImage,
  sliderImages,
  labelVideo,
  labelImage,
  descriptionTitle,
  descriptionText,
  footerText,
  fallbackCategories,
  productKeywords = [],
  productGridKeyword = "",
}) => {
  const navigate = useNavigate();
  const { s } = useSubcategorySettings(slug);

  const dynamicHeroVideo = s("hero_video") || heroVideo;
  const dynamicHeroTitle = s("hero_title") || heroTitle;
  const dynamicHeroSubtitle = s("hero_subtitle") || heroSubtitle;
  const dynamicMarquee = safeParse(s("marquee_words")) || marqueeWords;
  const dynamicLeftImage = s("left_image") || leftImage;
  const dynamicCenterVideo = s("center_video") || centerVideo;
  const dynamicRightImage = s("right_image") || rightImage;
  const dynamicSliderImages = safeParse(s("slider_images")) || sliderImages;
  const dynamicLabelVideo = s("label_video") || labelVideo;
  const dynamicLabelImage = s("label_image") || labelImage;
  const dynamicDescriptionTitle = s("description_title") || descriptionTitle;
  const dynamicDescriptionText = s("description_text") || descriptionText;
  const dynamicFooterText = s("footer_text") || footerText;

  const [categories, setCategories] = useState(fallbackCategories);
  const [variants, setVariants] = useState([]);
  const [attributeValues, setAttributeValues] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [clothTypes, setClothTypes] = useState([]);
  const [filters, setFilters] = useState({
    size: "",
    clothType: "",
    color: "",
    minPrice: "",
    maxPrice: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, mediaRes, variantsRes, attrValuesRes, attrsRes, sizesRes, clothTypesRes] = await Promise.all([
          productService.getProducts(),
          productService.getProductMedia(),
          productService.getProductVariants(),
          productService.getProductAttributeValues(),
          productService.getProductAttributes(),
          productService.getProductSizes(),
          productService.getProductClothTypes(),
        ]);
        const apiProducts = productsRes.data?.data || productsRes.data || [];
        const apiMedia = mediaRes.data?.data || mediaRes.data || [];

        const keywords = productKeywords.map((k) => k.toLowerCase());
        const filtered = apiProducts.filter((p) => {
          const text = `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
          return keywords.length === 0 || keywords.some((k) => text.includes(k));
        });

        if (filtered.length > 0) {
          const mapped = filtered.map((p) => {
            const media = apiMedia.find((m) => m.product_id === p.product_id && m.isprimary === true);
            return {
              id: p.product_id || p.product_slug,
              product_id: p.product_id,
              name: p.product_name,
              image: media?.media_url || placeholderImage,
              description: p.short_description || p.description || "",
            };
          });
          setCategories(mapped);
        }
        setVariants(variantsRes.data?.data || variantsRes.data || []);
        setAttributeValues(attrValuesRes.data?.data || attrValuesRes.data || []);
        setAttributes(attrsRes.data?.data || attrsRes.data || []);
        setSizes(sizesRes.data?.data || sizesRes.data || []);
        setClothTypes(clothTypesRes.data?.data || clothTypesRes.data || []);
      } catch {
        // keep fallback
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [productKeywords, fallbackCategories]);

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

      {/* ===== NEW ROW: image – video – image ===== */}
      <section className="container-fluid my-0 px-0">
        <div className="row g-0">
          <div className="col-md-4">
            <img
              src={dynamicLeftImage}
              alt="Left"
              className="img-fluid shadow-sm"
              style={{ width: "100%", height: "520.39px", objectFit: "cover", borderRadius: "0px" }}
            />
          </div>
          <div className="col-md-4">
            <video
              src={dynamicCenterVideo}
              className="w-100 shadow-sm"
              style={{ height: "520.39px", objectFit: "cover", borderRadius: "0px" }}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          </div>
          <div className="col-md-4">
            <img
              src={dynamicRightImage}
              alt="Right"
              className="img-fluid shadow-sm"
              style={{ width: "100%", height: "520.39px", objectFit: "cover", borderRadius: "0px" }}
            />
          </div>
        </div>
      </section>

      <div className="row g-0 mt-0 mx-0">
        <div className="col-md-6 p-0">
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
            <button className="carousel-control-prev" type="button" data-bs-target="#sliderCarousel" data-bs-slide="prev">
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#sliderCarousel" data-bs-slide="next">
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        </div>

        <div className="col-md-6 d-flex align-items-center p-4">
          <div>
            <h3>{dynamicDescriptionTitle}</h3>
            {dynamicDescriptionText.split("\n").map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </div>
      </div>

      {/* ===== NEW ROW: 75% Video – 25% Image ===== */}
      <div className="row g-0 mt-1 mx-0">
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
        <div className="col-md-3 p-0">
          <img
            src={dynamicLabelImage}
            alt="Right Side"
            className="img-fluid"
            style={{ height: "500px", width: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* TEXT BAR */}
      <div className="bg-light text-center py-4">
        <span className="fw-bold text-uppercase fs-4 fade-in-out-text">{dynamicFooterText}</span>
      </div>

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
            <span className="visually-hidden">Loading {slug} collection...</span>
          </div>
        </div>
      )}

      {!loading && (
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
              <div id="category-grid" className="container-fluid px-0 my-0">
                <div className="row g-2">
                  {filteredCategories.slice(0, 3).map((cat, i) => (
                    <div key={i} className="col-12 col-md-4 d-flex">
                      <CategoryCard cat={cat} />
                    </div>
                  ))}
                </div>
                <div className="row g-2 mt-2">
                  {filteredCategories.slice(3, 6).map((cat, i) => (
                    <div key={i + 3} className="col-12 col-md-4 d-flex">
                      <CategoryCard cat={cat} />
                    </div>
                  ))}
                </div>
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

      <ProductGrid keyword={productGridKeyword} />
    </>
  );
};

export default SubcategoryPage;
