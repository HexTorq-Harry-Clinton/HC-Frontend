// Admin module registry — server-safe (no "use client").
// Column names verified against the LIVE database schema.
// toggle: boolean column flipped by the Active toggle.
// upload: file input uploaded via POST /FileUpload, URL stored in the field.
const T = (key, label, extra = {}) => ({ key, label, ...extra });

const MODULES = {
  // ---- access (users/appointments/settings have dedicated pages) ----
  roles: { endpoint: "/Roles", id: "role_id", title: "Roles", toggle: "isactive", columns: [
    T("role_name", "Name"), T("role_code", "Code"), T("description", "Description"), T("isactive", "Active")] },
  "user-roles": { endpoint: "/User-Roles", id: "user_role_id", title: "User Roles", columns: [
    T("user_id", "User ID"), T("role_id", "Role ID")] },
  profiles: { endpoint: "/Profiles", id: "profile_id", title: "Profiles", readOnly: true, toggle: "isactive", columns: [
    T("fullname", "Name"), T("emailid", "Email"), T("mobile_number", "Mobile"), T("gender", "Gender"), T("isactive", "Active")] },

  // ---- catalog ----
  categories: { endpoint: "/Menu-Category", id: "menu_category_id", title: "Menu Categories", toggle: "isactive", columns: [
    T("menu_category_name", "Name"), T("menu_category_slug", "Slug"),
    T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  "sub-categories": { endpoint: "/Menu-Sub-Category", id: "menu_subcategory_id", title: "Menu Sub-Categories", toggle: "isactive", columns: [
    T("menu_category_id", "Category ID"), T("menu_subcategory_name", "Name"), T("menu_subcategory_slug", "Slug"),
    T("redirect_link", "Redirect"), T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  sizes: { endpoint: "/Products-Sizes", id: "size_id", title: "Sizes", toggle: "isactive", columns: [
    T("size_name", "Name"), T("size_type", "Type"), T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  "cloth-types": { endpoint: "/Products-Cloth-Types", id: "cloth_type_id", title: "Cloth Types", toggle: "isactive", columns: [
    T("cloth_type_name", "Name"), T("cloth_type_slug", "Slug"), T("description", "Description"),
    T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  care: { endpoint: "/Products-Care-Instructions", id: "care_instruction_id", title: "Care Instructions", toggle: "isactive", columns: [
    T("instruction_text", "Instruction", { type: "textarea" }),
    T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  attributes: { endpoint: "/Products-Attributes", id: "attribute_id", title: "Attributes", toggle: "isactive", columns: [
    T("attribute_name", "Name"), T("attribute_slug", "Slug"), T("attribute_type", "Type"),
    T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  "attribute-values": { endpoint: "/Products-Attributes-Values", id: "product_attribute_value_id", title: "Attribute Values", columns: [
    T("product_id", "Product ID"), T("attribute_id", "Attribute ID"), T("attribute_value", "Value")] },
  "product-media": { endpoint: "/Products-Media", id: "product_media_id", title: "Product Media", toggle: "isactive", columns: [
    T("product_id", "Product ID"), T("media_type", "Type"), T("media_url", "URL", { type: "upload" }),
    T("alt_text", "Alt"), T("display_order", "Order", { type: "number" }),
    T("isprimary", "Primary", { type: "checkbox" }), T("isactive", "Active")] },
  "product-variants": { endpoint: "/Products-Variants", id: "product_variant_id", title: "Product Variants", toggle: "isactive", columns: [
    T("product_id", "Product ID"), T("sku", "SKU"), T("variant_name", "Name"),
    T("price", "Price", { type: "number" }), T("stock_qty", "Stock", { type: "number" }),
    T("size_id", "Size ID"), T("cloth_type_id", "Cloth ID"),
    T("isdefault", "Default", { type: "checkbox" }), T("isactive", "Active")] },
  "product-seo": { endpoint: "/Products-Seo", id: "product_seo_id", title: "Product SEO", columns: [
    T("product_id", "Product ID"), T("seo_title", "Title"), T("seo_description", "Description", { type: "textarea" }),
    T("seo_keywords", "Keywords"), T("og_image_url", "OG Image", { type: "upload" })] },

  // ---- orders / fulfilment ----
  "order-status-master": { endpoint: "/Order-Status-Master", id: "order_status_id", title: "Order Statuses", toggle: "isactive", columns: [
    T("status_name", "Name"), T("status_code", "Code"), T("display_order", "Order", { type: "number" }),
    T("iscancelled_status", "Cancelled?", { type: "checkbox" }), T("isactive", "Active")] },
  invoices: { endpoint: "/Invoices", id: "invoice_id", title: "Invoices", readOnly: true, columns: [
    T("order_id", "Order"), T("invoice_number", "Number"), T("invoice_date", "Date"), T("invoice_url", "URL")] },
  "order-promotions": { endpoint: "/Order-Promotions", id: "order_promotion_id", title: "Order Promotions", readOnly: true, columns: [
    T("order_id", "Order"), T("promotion_name", "Promotion"), T("discount_amount", "Amount", { type: "number" })] },
  payments: { endpoint: "/Payments", id: "payment_id", title: "Payments", readOnly: true, columns: [
    T("order_id", "Order"), T("user_id", "User"), T("payment_provider", "Provider"),
    T("payment_method_type", "Method"), T("payment_status", "Status"), T("amount", "Amount", { type: "number" })] },
  shipments: { endpoint: "/Shipments", id: "shipment_id", title: "Shipments", readOnly: true, columns: [
    T("order_id", "Order"), T("courier_partner_id", "Courier"), T("tracking_number", "Tracking"),
    T("awb_number", "AWB"), T("shipment_status", "Status")] },
  "shipment-events": { endpoint: "/Shipment-Events", id: "shipment_event_id", title: "Shipment Events", readOnly: true, columns: [
    T("shipment_id", "Shipment"), T("event_status", "Status"), T("event_location", "Location"), T("event_description", "Description")] },
  "courier-partners": { endpoint: "/Courier-Partners", id: "courier_partner_id", title: "Courier Partners", toggle: "isactive", columns: [
    T("courier_name", "Name"), T("courier_code", "Code"), T("contact_email", "Email"),
    T("contact_phone", "Phone"), T("integration_status", "Integrated"), T("isactive", "Active")] },
  returns: { endpoint: "/Returns", id: "return_id", title: "Returns", readOnly: true, columns: [
    T("order_id", "Order"), T("user_id", "User"), T("return_type", "Type"), T("return_status", "Status"),
    T("return_reason", "Reason"), T("return_amount", "Amount", { type: "number" })] },
  refunds: { endpoint: "/Refunds", id: "refund_id", title: "Refunds", readOnly: true, columns: [
    T("return_id", "Return"), T("payment_id", "Payment"), T("order_id", "Order"),
    T("refund_type", "Type"), T("refund_status", "Status"),
    T("refund_amount", "Amount", { type: "number" }), T("refund_method", "Method")] },
  "coupon-usage": { endpoint: "/Coupon-Usage", id: "coupon_usage_id", title: "Coupon Usage", readOnly: true, columns: [
    T("coupon_id", "Coupon"), T("user_id", "User"), T("order_id", "Order"), T("discount_amount", "Amount", { type: "number" })] },

  // ---- marketing ----
  coupons: { endpoint: "/Coupons", id: "coupon_id", title: "Coupons", toggle: "isactive", columns: [
    T("coupon_code", "Code"), T("coupon_name", "Name"), T("description", "Description"),
    T("discount_type", "Type"), T("discount_value", "Value", { type: "number" }),
    T("min_purchase_amount", "Min", { type: "number" }), T("max_discount_amount", "Max", { type: "number" }),
    T("usage_limit", "Limit", { type: "number" }), T("start_date", "Start"), T("end_date", "End"),
    T("isactive", "Active")] },
  discounts: { endpoint: "/Discounts", id: "discount_id", title: "Discounts", toggle: "isactive", columns: [
    T("discount_name", "Name"), T("description", "Description"), T("discount_type", "Type"),
    T("discount_value", "Value", { type: "number" }), T("max_discount_amount", "Max", { type: "number" }),
    T("usage_limit", "Limit", { type: "number" }), T("start_date", "Start"), T("end_date", "End"),
    T("discount_priority", "Priority", { type: "number" }), T("isactive", "Active")] },
  "discount-targets": { endpoint: "/Discount-Targets", id: "discount_target_id", title: "Discount Targets", columns: [
    T("discount_id", "Discount ID"),
    T("target_type", "Target Type", { type: "select", options: ["all", "product", "product_variant", "menu_category", "menu_subcategory"] }),
    T("target_id", "Target ID")] },

  // ---- appointments ----
  "date-slots": { endpoint: "/Appointment-Date-Slots", id: "appointment_date_slot_id", title: "Date Slots", toggle: "isactive", columns: [
    T("slot_date", "Date"), T("slot_duration_minutes", "Mins", { type: "number" }),
    T("isavailable", "Available", { type: "checkbox" }), T("notes", "Notes"), T("isactive", "Active")] },
  "slot-blocks": { endpoint: "/Appointment-Slot-Blocks", id: "appointment_slot_block_id", title: "Slot Blocks", columns: [
    T("appointment_date_slot_id", "Date Slot"), T("block_start_time", "Start"), T("block_end_time", "End"),
    T("block_reason", "Reason"), T("blocked_by", "By")] },
  "time-slots": { endpoint: "/Appointment-Time-Slots", id: "appointment_time_slot_id", title: "Time Slots", toggle: "isactive", columns: [
    T("appointment_date_slot_id", "Date Slot"), T("slot_start_time", "Start"), T("slot_end_time", "End"),
    T("isavailable", "Available", { type: "checkbox" }), T("isbooked", "Booked", { type: "checkbox" }),
    T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },

  // ---- content ----
  faqs: { endpoint: "/FAQs", id: "faq_id", title: "FAQs", toggle: "isactive", columns: [
    T("question", "Question"), T("answer", "Answer", { type: "textarea" }),
    T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  "support-contacts": { endpoint: "/Support-Contacts", id: "support_contact_id", title: "Support Contacts", toggle: "isactive", columns: [
    T("contact_title", "Title"), T("contact_name", "Name"), T("contact_email", "Email"),
    T("contact_number", "Phone"), T("whatsapp_number", "WhatsApp"), T("address_text", "Address"),
    T("working_hours", "Hours"), T("isactive", "Active")] },
  "legal-headers": { endpoint: "/Legal-Page-Headers", id: "id", title: "Legal Page Headers", columns: [
    T("page_type", "Type"), T("page_title", "Title"), T("intro_text", "Intro", { type: "textarea" }),
    T("effective_date", "Effective"), T("version_number", "Version", { type: "number" }),
    T("is_active", "Active", { type: "checkbox" })] },
  "legal-sections": { endpoint: "/Legal-Page-Sections", id: "id", title: "Legal Page Sections", columns: [
    T("page_type", "Type"), T("section_title", "Section"), T("section_order", "Order", { type: "number" }),
    T("content", "Content", { type: "textarea" }), T("is_active", "Active", { type: "checkbox" })] },
  "running-bars": { endpoint: "/Running-Bar", id: "running_bar_id", title: "Running Bars", toggle: "isactive", columns: [
    T("running_bar_name", "Name"), T("isactive", "Active")] },
  "running-bar-items": { endpoint: "/Running-Bar-Items", id: "running_bar_item_id", title: "Running Bar Items", toggle: "isactive", columns: [
    T("running_bar_id", "Bar ID"), T("itemsdata", "Text", { type: "textarea" }),
    T("duration_seconds", "Secs", { type: "number" }), T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  "image-sliders": { endpoint: "/Image-Sliders", id: "image_slider_id", title: "Image Sliders", toggle: "isactive", columns: [
    T("title", "Title"), T("subtitle", "Subtitle"), T("image_url", "Image", { type: "upload" }),
    T("button_text", "Button"), T("redirect_link", "Link"), T("display_order", "Order", { type: "number" }),
    T("auto_slide_interval_seconds", "Secs", { type: "number" }), T("isactive", "Active")] },
  "menu-video": { endpoint: "/Menu-Video", id: "menu_video_id", title: "Menu Videos", toggle: "isactive", columns: [
    T("video_type", "Type"), T("video_url", "Video", { type: "upload" }), T("poster_image_url", "Poster", { type: "upload" }),
    T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  spotlight: { endpoint: "/Spotlight-Entries", id: "spotlight_entry_id", title: "Spotlight Entries", toggle: "isactive", columns: [
    T("title", "Title"), T("subtitle", "Subtitle"), T("description", "Description", { type: "textarea" }),
    T("redirect_link", "Link"), T("cta_text", "CTA"), T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  "spotlight-media": { endpoint: "/Spotlight-Media", id: "spotlight_media_id", title: "Spotlight Media", toggle: "isactive", columns: [
    T("spotlight_entry_id", "Entry"), T("media_type", "Type"), T("media_url", "URL", { type: "upload" }),
    T("alt_text", "Alt"), T("display_order", "Order", { type: "number" }),
    T("isprimary", "Primary", { type: "checkbox" }), T("isactive", "Active")] },
  "style-collections": { endpoint: "/Style-Collections", id: "style_collection_id", title: "Style Collections", toggle: "isactive", columns: [
    T("collection_name", "Name"), T("collection_slug", "Slug"), T("description", "Description", { type: "textarea" }),
    T("redirect_link", "Link"), T("cta_text", "CTA"), T("display_order", "Order", { type: "number" }), T("isactive", "Active")] },
  "style-collection-media": { endpoint: "/Style-Collection-Media", id: "style_collection_media_id", title: "Style Collection Media", toggle: "isactive", columns: [
    T("style_collection_id", "Collection"), T("media_type", "Type"), T("media_url", "URL", { type: "upload" }),
    T("alt_text", "Alt"), T("display_order", "Order", { type: "number" }),
    T("isprimary", "Primary", { type: "checkbox" }), T("isactive", "Active")] },
  reviews: { endpoint: "/Reviews", id: "review_id", title: "Reviews", toggle: "isactive", columns: [
    T("product_id", "Product"), T("user_id", "User"), T("rating", "Rating", { type: "number" }),
    T("review_title", "Title"), T("review_text", "Text", { type: "textarea" }),
    T("is_verified", "Verified", { type: "checkbox" }), T("is_approved", "Approved", { type: "checkbox" }),
    T("isactive", "Active")] },
  newsletter: { endpoint: "/Newsletter-Subscriptions", id: "newsletter_subscription_id", title: "Newsletter", readOnly: true, columns: [
    T("emailid", "Email"), T("subscription_status", "Status")] },
};

export function adminModule(slug) {
  return MODULES[slug];
}

export function adminModuleSlugs() {
  return Object.keys(MODULES);
}
