import { apiGet, unwrap } from "@/lib/api";

// Fallback content verbatim from the previous UI.
const FALLBACKS = {
  privacy: {
    match: "privacy",
    error: "Unable to load the latest privacy policy.",
    title: "Privacy Policy",
    effectiveDate: "[Insert Date]",
    intro:
      "Welcome to Harry Clinton, a bespoke fashion brand dedicated to providing you with premium, personalized style experiences. This Privacy Policy outlines how we collect, use, and protect your personal information when you interact with our website and services.",
    sections: [
      {
        section_title: "1. Information We Collect",
        content:
          "<p>We collect the following types of information to provide and improve our services:</p><p><strong>a. Personal Information</strong></p><ul><li>• Full Name</li><li>• Email Address</li><li>• Phone Number</li><li>• Billing and Shipping Address</li><li>• Payment Details (processed via secure third-party gateways)</li></ul><p><strong>b. Non-Personal Information</strong></p><ul><li>• Browser type, IP address, device type</li><li>• Website usage data (via cookies and analytics tools)</li></ul>",
      },
      {
        section_title: "2. How We Use Your Information",
        content:
          "<ul><li>• Processing and fulfilling orders</li><li>• Personalizing your shopping experience</li><li>• Sending updates, order confirmations, and promotional content</li><li>• Improving our website, services, and customer experience</li><li>• Legal and security compliance</li></ul>",
      },
      {
        section_title: "3. Cookies and Tracking Technologies",
        content:
          "<p>We use cookies to:</p><ul><li>• Remember user preferences</li><li>• Understand site usage</li><li>• Provide relevant ads through retargeting platforms</li></ul><p>You can manage cookie preferences through your browser settings.</p>",
      },
      {
        section_title: "4. Sharing Your Information",
        content:
          "<p>We do not sell your personal data. However, we may share data with:</p><ul><li>• Trusted third-party service providers (e.g., payment gateways, courier services)</li><li>• Legal authorities if required by law</li><li>• Analytics and marketing tools (e.g., Google Analytics, Meta Pixel)</li></ul>",
      },
      {
        section_title: "5. Data Security",
        content:
          "<p>We implement industry-standard security measures including SSL encryption, secure servers, and limited access protocols to protect your information.</p>",
      },
      {
        section_title: "6. Your Rights",
        content:
          "<p>Depending on your location, you may have the right to:</p><ul><li>• Access, update, or delete your data</li><li>• Opt-out of marketing communications</li><li>• Request a copy of your personal data</li></ul><p>To make a request, contact us at <a href='mailto:support@harryclinton.com'>support@harryclinton.com</a>.</p>",
      },
      {
        section_title: "7. Third-Party Links",
        content:
          "<p>Our website may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies independently.</p>",
      },
      {
        section_title: "8. Children’s Privacy",
        content:
          "<p>Our services are not intended for users under the age of 13. We do not knowingly collect data from children.</p>",
      },
      {
        section_title: "9. Changes to This Policy",
        content:
          "<p>We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised “Effective Date.”</p>",
      },
      {
        section_title: "10. Contact Us",
        content:
          "<p><strong>Harry Clinton – Bespoke Fashion</strong></p><p>Email: <a href='mailto:support@harryclinton.com'>support@harryclinton.com</a></p><p>Phone: +91-XXXXXXXXXX</p><p>Website: <a href='https://www.harryclinton.com' target='_blank' rel='noreferrer'>www.harryclinton.com</a></p>",
      },
    ],
  },
  terms: {
    match: "terms",
    error: "Unable to load the latest terms and conditions.",
    title: "Terms and Conditions",
    effectiveDate: "[Insert Date]",
    intro:
      "Welcome to Harry Clinton, a bespoke fashion brand committed to premium craftsmanship and personalized style. These Terms and Conditions govern your use of our website and services. By accessing or purchasing from our site, you agree to these Terms in full.",
    sections: [
      {
        section_title: "1. Acceptance of Terms",
        content:
          "<p>By using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy.</p>",
      },
      {
        section_title: "2. Eligibility",
        content:
          "<p>You must be at least 18 years of age to make a purchase. By using our services, you confirm that you are legally able to enter into a binding contract.</p>",
      },
      {
        section_title: "3. Account Registration",
        content:
          "<ul><li>Provide accurate, current, and complete information</li><li>Maintain the security of your password and account</li><li>Notify us immediately of any unauthorized use</li></ul>",
      },
      {
        section_title: "4. Orders and Payments",
        content:
          "<ul><li>All orders are subject to acceptance and availability.</li><li>Prices are listed in INR and may be subject to taxes and shipping charges.</li><li>Payments are processed securely via third-party payment gateways.</li></ul>",
      },
      {
        section_title: "5. Shipping & Delivery",
        content:
          "<ul><li>Estimated delivery timelines will be shared during checkout.</li><li>Delays caused by shipping providers or unforeseen events are not our liability.</li><li>Please ensure that shipping addresses are correct; we are not responsible for lost shipments due to incorrect details.</li></ul>",
      },
      {
        section_title: "6. Custom & Bespoke Orders",
        content:
          "<ul><li>Due to the personalized nature of bespoke products, such items are non-returnable and non-refundable unless defective or damaged upon arrival.</li><li>Minor variations in fabric color or stitching are part of bespoke craftsmanship and not considered defects.</li></ul>",
      },
      {
        section_title: "7. Returns & Refunds",
        content:
          "<p>Please refer to our <a href='/Policies'>Returns & Refunds Policy</a> for more details.</p>",
      },
      {
        section_title: "8. Intellectual Property",
        content:
          "<p>All content on this site, including logos, images, designs, and text, are the intellectual property of Harry Clinton and protected by copyright and trademark laws.</p>",
      },
      {
        section_title: "9. Promotions & Discounts",
        content:
          "<ul><li>Promotional offers may be subject to specific terms.</li><li>We reserve the right to cancel or modify promotions at any time.</li></ul>",
      },
      {
        section_title: "10. Limitation of Liability",
        content:
          "<p>We are not liable for indirect, incidental, or consequential damages, or any loss due to misuse of the website or products.</p>",
      },
      {
        section_title: "11. Termination",
        content:
          "<p>We may suspend or terminate access to our services for any user who violates these Terms.</p>",
      },
      {
        section_title: "12. Governing Law",
        content:
          "<p>These Terms are governed by the laws of India, with disputes subject to the courts in Chennai, Tamil Nadu.</p>",
      },
      {
        section_title: "13. Changes to Terms",
        content:
          "<p>We may revise these Terms from time to time. Updated versions will be posted with a new effective date.</p>",
      },
      {
        section_title: "14. Contact Us",
        content:
          "<p><strong>Harry Clinton – Bespoke Fashion</strong></p><p>Email: <a href='mailto:support@harryclinton.com'>support@harryclinton.com</a></p><p>Phone: +91-XXXXXXXXXX</p><p>Website: <a href='https://www.harryclinton.com' target='_blank' rel='noreferrer'>www.harryclinton.com</a></p>",
      },
    ],
  },
};

// Legal document page (Privacy / Terms): same structure as the previous UI —
// fallback content first, backend header/sections override, HTML bodies,
// Effective Date line. Server-rendered for SEO.
export default async function LegalView({ doc }) {
  const fallback = FALLBACKS[doc];
  let content = fallback;
  let error = "";

  try {
    const [headersRes, sectionsRes] = await Promise.all([
      apiGet("/Legal-Page-Headers").then(unwrap),
      apiGet("/Legal-Page-Sections").then(unwrap),
    ]);
    const headers = Array.isArray(headersRes) ? headersRes : [];
    const sections = Array.isArray(sectionsRes) ? sectionsRes : [];
    const header =
      headers.find(
        (h) =>
          h.page_type?.toLowerCase().includes(fallback.match) ||
          h.page_title?.toLowerCase().includes(fallback.match)
      ) || {};
    const pageSections = sections
      .filter(
        (s) =>
          s.page_type?.toLowerCase().includes(fallback.match) ||
          (header.page_type && header.page_type?.toLowerCase() === s.page_type?.toLowerCase())
      )
      .sort((a, b) => (a.section_order || 0) - (b.section_order || 0));
    if (header.page_title || pageSections.length > 0) {
      content = {
        title: header.page_title || fallback.title,
        effectiveDate: header.effective_date || fallback.effectiveDate,
        intro: header.intro_text || fallback.intro,
        sections:
          pageSections.length > 0
            ? pageSections.map((s) => ({ section_title: s.section_title, content: s.content }))
            : fallback.sections,
      };
    }
  } catch {
    error = fallback.error;
  }

  return (
    <div className="bg-neutral-100 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="border-0 bg-white p-6 shadow-sm">
          <h1 className="mb-4 font-display text-4xl font-bold">{content.title}</h1>
          <p>
            <strong>Effective Date:</strong> <span className="text-neutral-500">{content.effectiveDate}</span>
          </p>
          <p className="mt-2 text-neutral-600">{content.intro}</p>
          {error && <div className="mt-3 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {content.sections.map((section, index) => (
            <div key={index}>
              <h5 className="mt-6 font-semibold">{section.section_title}</h5>
              <div className="legal-body mt-1 text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .legal-body ul { list-style: disc; padding-left: 1.25rem; margin-top: 0.5rem; }
        .legal-body p { margin-top: 0.5rem; }
        .legal-body a { color: #a8823f; text-decoration: underline; }
      `}</style>
    </div>
  );
}
