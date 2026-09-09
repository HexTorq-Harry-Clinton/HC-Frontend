import { apiGet, unwrap } from "@/lib/api";

// Content pages (about, policies, services, FAQs...) rendered from backend
// Legal_Page + FAQs + Settings APIs. No hardcoded copy.
const TITLES = {
  aboutUs: "About Us", "about-designer": "About the Designer",
  "contact-us": "Contact Us", "privacy-policy": "Privacy Policy",
  "terms-and-conditions": "Terms & Conditions", FAQs: "FAQs",
  Policies: "Policies", "help-center": "Help Center",
  services: "Our Services", embroidery: "Embroidery",
  alterations: "Alterations", "personal-styling": "Personal Styling",
  "custom-tailoring": "Custom Tailoring", "coming-soon": "Coming Soon",
  "the-vision": "The Vision",
};

export default async function StaticPage({ slug }) {
  const [headers, sections, faqs] = await Promise.all([
    apiGet("/Legal-Page-Headers").then(unwrap).catch(() => []),
    apiGet("/Legal-Page-Sections").then(unwrap).catch(() => []),
    apiGet("/FAQs").then(unwrap).catch(() => []),
  ]);

  const slugLower = slug.toLowerCase();
  const matchedSections = sections.filter((s) =>
    [s.page_type, s.page_slug, s.header_id].some(
      (v) => v && String(v).toLowerCase().includes(slugLower.replace(/-/g, " ").slice(0, 12))
    )
  );
  const pageSections = matchedSections.length > 0 ? matchedSections : sections.slice(0, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-center font-display text-4xl font-bold">{TITLES[slug] || slug}</h1>

      {pageSections.map((s) => (
        <section key={s.legal_page_section_id} className="mt-8">
          {s.section_title && <h2 className="text-xl font-semibold">{s.section_title}</h2>}
          {s.content && <p className="mt-2 text-sm leading-6 text-neutral-600">{s.content}</p>}
        </section>
      ))}

      {(slug === "FAQs" || slug === "help-center") && (
        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <details key={f.faq_id} className="border border-neutral-200 p-4">
              <summary className="cursor-pointer font-medium">{f.question}</summary>
              <p className="mt-2 text-sm text-neutral-600">{f.answer}</p>
            </details>
          ))}
        </div>
      )}

      {slug === "contact-us" && (
        <div className="mt-8 text-center text-sm text-neutral-600">
          <p>Write to us — our concierge replies within 24 hours.</p>
          <a href="mailto:care@harryclinton.in" className="mt-2 inline-block font-semibold underline">
            care@harryclinton.in
          </a>
        </div>
      )}

      {headers.length === 0 && pageSections.length === 0 && slug !== "FAQs" && slug !== "help-center" && slug !== "contact-us" && (
        <p className="mt-8 text-center text-sm text-neutral-500">
          This page is being tailored. Please check back soon.
        </p>
      )}
    </div>
  );
}
