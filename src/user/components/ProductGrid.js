import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productService from "../../services/productService";
import { resolveUploadUrl } from "../../admin/utils/resolveUploadUrl";
import { PLACEHOLDER_IMAGE as placeholderImage } from "../../shared/placeholder";

const ProductGrid = ({ keyword = "" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, mediaRes] = await Promise.all([
          productService.getProducts(),
          productService.getProductMedia(),
        ]);
        const apiProducts = productsRes.data?.data || productsRes.data || [];
        const apiMedia = mediaRes.data?.data || mediaRes.data || [];

        const keywordLower = keyword.toLowerCase();
        const mapped = apiProducts.map((p) => {
          const media = apiMedia.find((m) => m.product_id === p.product_id && m.isprimary === true);
          return {
            id: p.product_id,
            slug: p.product_slug,
            name: p.product_name,
            price: p.base_price || 0,
            currency: p.currency_code || "INR",
            image: resolveUploadUrl(media?.media_url) || placeholderImage,
          };
        });

        const filtered = keywordLower
          ? mapped.filter((p) => p.name.toLowerCase().includes(keywordLower))
          : mapped;

        setProducts(filtered);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [keyword]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-danger small py-3">{error}</div>;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="container-fluid px-4 py-5">
      <h3 className="mb-4 text-center">{keyword ? `Shop ${keyword}` : "Shop All Products"}</h3>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {products.map((product) => (
          <div className="col" key={product.id}>
            <Link to={`/product/${product.slug || product.id}`} className="text-decoration-none text-dark">
              <div className="card h-100 border-0 shadow-sm">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="card-img-top"
                  style={{ objectFit: "cover", height: "280px" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text fw-bold">
                    {product.currency === "INR" ? "₹" : product.currency}
                    {product.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
