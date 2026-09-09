// Admin module registry — server-safe (no "use client").
// Imported by both generateStaticParams/metadata (server) and AdminModule.jsx (client).

const MODULES = {
  users: { endpoint: "/Users", id: "user_id", title: "Users", readOnly: true, columns: [
    { key: "full_name", label: "Name" }, { key: "email_id", label: "Email" }, { key: "phone_number", label: "Phone" }] },
  profiles: { endpoint: "/Profiles", id: "profile_id", title: "Profiles", readOnly: true, columns: [
    { key: "full_name", label: "Name" }, { key: "email_id", label: "Email" }] },
  categories: { endpoint: "/Menu-Category", id: "menu_category_id", title: "Menu Categories", columns: [
    { key: "menu_category_name", label: "Name" }, { key: "menu_category_slug", label: "Slug" },
    { key: "display_order", label: "Order", type: "number" }] },
  "sub-categories": { endpoint: "/Menu-Sub-Category", id: "menu_subcategory_id", title: "Menu Sub-Categories", columns: [
    { key: "menu_subcategory_name", label: "Name" }, { key: "menu_subcategory_slug", label: "Slug" },
    { key: "redirect_link", label: "Redirect" }, { key: "display_order", label: "Order", type: "number" }] },
  appointments: { endpoint: "/Custom-Appointments", id: "custom_appointment_id", title: "Appointments", readOnly: true, columns: [
    { key: "name", label: "Name" }, { key: "city", label: "City" }, { key: "status", label: "Status" }] },
  "date-slots": { endpoint: "/Appointment-Date-Slots", id: "appointment_date_slot_id", title: "Appointment Date Slots", columns: [
    { key: "slot_date", label: "Date" }] },
  "time-slots": { endpoint: "/Appointment-Time-Slots", id: "appointment_time_slot_id", title: "Appointment Time Slots", columns: [
    { key: "slot_time", label: "Time" }] },
  coupons: { endpoint: "/Coupons", id: "coupon_id", title: "Coupons", columns: [
    { key: "coupon_code", label: "Code" }, { key: "coupon_name", label: "Name" },
    { key: "discount_type", label: "Type" }, { key: "discount_value", label: "Value", type: "number" }] },
  discounts: { endpoint: "/Discounts", id: "discount_id", title: "Discounts", columns: [
    { key: "discount_name", label: "Name" }, { key: "discount_type", label: "Type" },
    { key: "discount_value", label: "Value", type: "number" }] },
  faqs: { endpoint: "/FAQs", id: "faq_id", title: "FAQs", columns: [
    { key: "question", label: "Question" }, { key: "answer", label: "Answer", type: "textarea" }] },
  settings: { endpoint: "/Settings", id: "setting_id", title: "Settings", columns: [
    { key: "setting_key", label: "Key" }, { key: "setting_value", label: "Value", type: "textarea" }] },
  "support-contacts": { endpoint: "/Support-Contacts", id: "support_contact_id", title: "Support Contacts", columns: [
    { key: "contact_type", label: "Type" }, { key: "contact_value", label: "Value" }] },
  "legal-headers": { endpoint: "/Legal-Page-Headers", id: "legal_page_header_id", title: "Legal Page Headers", columns: [
    { key: "page_title", label: "Page" }] },
  "legal-sections": { endpoint: "/Legal-Page-Sections", id: "legal_page_section_id", title: "Legal Page Sections", columns: [
    { key: "section_title", label: "Section" }, { key: "content", label: "Content", type: "textarea" }] },
  "running-bar": { endpoint: "/Running-Bar-Items", id: "running_bar_item_id", title: "Running Bar Items", columns: [
    { key: "item_text", label: "Text" }, { key: "display_order", label: "Order", type: "number" }] },
  "image-sliders": { endpoint: "/Image-Sliders", id: "image_slider_id", title: "Image Sliders", columns: [
    { key: "title", label: "Title" }, { key: "subtitle", label: "Subtitle" }] },
  spotlight: { endpoint: "/Spotlight-Entries", id: "spotlight_entry_id", title: "Spotlight Entries", columns: [
    { key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" }] },
  "style-collections": { endpoint: "/Style-Collections", id: "style_collection_id", title: "Style Collections", columns: [
    { key: "style_collection_name", label: "Name" }, { key: "description", label: "Description", type: "textarea" }] },
  reviews: { endpoint: "/Reviews", id: "review_id", title: "Reviews (approve)", columns: [
    { key: "review_title", label: "Title" }, { key: "rating", label: "Rating", type: "number" },
    { key: "is_approved", label: "Approved", type: "checkbox" }] },
  payments: { endpoint: "/Payments", id: "payment_id", title: "Payments", readOnly: true, columns: [
    { key: "payment_provider", label: "Provider" }, { key: "payment_status", label: "Status" }, { key: "amount", label: "Amount", type: "number" }] },
  shipments: { endpoint: "/Shipments", id: "shipment_id", title: "Shipments", readOnly: true, columns: [
    { key: "tracking_number", label: "Tracking" }, { key: "shipment_status", label: "Status" }] },
  returns: { endpoint: "/Returns", id: "return_id", title: "Returns", readOnly: true, columns: [
    { key: "return_status", label: "Status" }] },
  refunds: { endpoint: "/Refunds", id: "refund_id", title: "Refunds", readOnly: true, columns: [
    { key: "refund_status", label: "Status" }, { key: "refund_amount", label: "Amount", type: "number" }] },
  newsletter: { endpoint: "/Newsletter-Subscriptions", id: "newsletter_subscription_id", title: "Newsletter", readOnly: true, columns: [
    { key: "email_id", label: "Email" }] },
};

export function adminModule(slug) {
  return MODULES[slug];
}

export function adminModuleSlugs() {
  return Object.keys(MODULES);
}
