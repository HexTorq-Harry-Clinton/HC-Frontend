import { useEffect, useState } from "react";
import productService from "../services/productService";
import { resolveUploadUrl } from "../admin/utils/resolveUploadUrl";
import { PLACEHOLDER_IMAGE } from "../shared/placeholder";

const unwrap = (res) => res?.data?.data || res?.data || [];

// API-first product feed for storefront category/collection pages.
// - Fetches products + media + variants + attributes + sizes + cloth types once.
// - Filters products by keywords matched against name/slug/descriptions.
// - Maps primary media (resolved to absolute URL) with local placeholder fallback.
// - NEVER injects hardcoded fake products: empty API = empty list + loading=false,
//   so pages render an honest empty state instead of lookalike mock items.
export const useCategoryProducts = (keywords = []) => {
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [attributeValues, setAttributeValues] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [clothTypes, setClothTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [
          productsRes,
          mediaRes,
          variantsRes,
          attrValuesRes,
          attrsRes,
          sizesRes,
          clothTypesRes,
        ] = await Promise.all([
          productService.getProducts(),
          productService.getProductMedia(),
          productService.getProductVariants(),
          productService.getProductAttributeValues(),
          productService.getProductAttributes(),
          productService.getProductSizes(),
          productService.getProductClothTypes(),
        ]);
        if (cancelled) return;
        const apiProducts = unwrap(productsRes);
        const apiMedia = unwrap(mediaRes);

        const lowered = keywords.map((k) => k.toLowerCase());
        const filtered = apiProducts.filter((p) => {
          if (lowered.length === 0) return true;
          const text =
            `${p.product_name || ""} ${p.product_slug || ""} ${p.short_description || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
          return lowered.some((k) => text.includes(k));
        });

        const mapped = filtered.map((p) => {
          const media = apiMedia.find(
            (m) => m.product_id === p.product_id && m.isprimary === true
          );
          return {
            id: p.product_id || p.product_slug,
            product_id: p.product_id,
            name: p.product_name,
            price: Number(p.base_price) || 0,
            currency: p.currency_code || "INR",
            image: resolveUploadUrl(media?.media_url) || PLACEHOLDER_IMAGE,
            description: p.short_description || p.description || "",
          };
        });

        setCategories(mapped);
        setVariants(unwrap(variantsRes));
        setAttributeValues(unwrap(attrValuesRes));
        setAttributes(unwrap(attrsRes));
        setSizes(unwrap(sizesRes));
        setClothTypes(unwrap(clothTypesRes));
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(keywords)]);

  return {
    categories,
    variants,
    attributeValues,
    attributes,
    sizes,
    clothTypes,
    loading,
  };
};

export default useCategoryProducts;
