"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiCached, homeKV, subscribeNewsletter } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";

// Footer copy, links, and brand marks mirror the reference. Contact details
// remain data-driven, and newsletter subscription keeps the existing API flow.
const DEFAULT_QUICK = [
  { label: "About Us", link: "/aboutUs" },
  { label: "Contact Us", action: "contact" },
  { label: "Privacy Policy", link: "/privacy-policy" },
  { label: "Terms & Conditions", link: "/terms-and-conditions" },
];

const DEFAULT_SUPPORT = [
  { label: "Help Center", link: "/help-center" },
  { label: "FAQs", link: "/FAQs" },
  { label: "Shipping, Returns & Cancellation", link: "/Policies?tab=Cancellation" },
  { label: "Track Order", link: "/track-order" },
];

function externalUrl(value, fallback) {
  const candidate = String(value || fallback || "").trim();
  if (!candidate) return fallback;
  return /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate.replace(/^\/\//, "")}`;
}

export default function Footer() {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState({ message: "", isError: false });
  const [supportContacts, setSupportContacts] = useState([]);
  const [cfg, setCfg] = useState({});

  useEffect(() => {
    let live = true;
    Promise.all([
      apiCached("/Support-Contacts").catch(() => []),
      apiCached("/Settings").catch(() => []),
      homeKV().catch(() => ({})),
    ]).then(([contacts, settings, kv]) => {
      if (!live) return;
      setSupportContacts(Array.isArray(contacts) ? contacts : []);
      // Singleton row keeps brand/newsletter copy; footer_* lives in KV.
      setCfg({ ...((Array.isArray(settings) ? settings : [])[0] || {}), ...kv });
    });
    return () => {
      live = false;
    };
  }, []);

  const primaryEmail =
    supportContacts.find((c) => c.contact_type === "email" || c.contact_type === "Email")?.contact_value ||
    "connect@harryclinton.com";
  const primaryPhone =
    supportContacts.find((c) => c.contact_type === "phone" || c.contact_type === "Phone")?.contact_value || "";

  const blurb = "Empowering innovation with quality and trust. Join us in our journey towards excellence.";
  const facebookUrl = externalUrl(cfg.footer_facebook_url, "https://www.facebook.com/harry.clinton.829484");
  const instagramUrl = externalUrl(cfg.footer_instagram_url, "https://www.instagram.com/harryclinton_official");
  const youtubeUrl = externalUrl(cfg.footer_youtube_url, "https://www.youtube.com/@HarryClintonHC");
  const quickLinks = DEFAULT_QUICK;
  const supportLinks = DEFAULT_SUPPORT;
  const newsletterTitle = "Stay Updated";
  const newsletterDesc = "Subscribe to our newsletter for the latest updates and promotions.";
  const copyrightLine = cfg.footer_copyright_text || `© ${new Date().getFullYear()} Harry Clinton`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await apiFetch("/Mail/Send-Mail", {
        method: "POST",
        body: {
          to: primaryEmail,
          subject: `Contact Form: ${form.subject}`,
          html: `
          <p><strong>Name:</strong> ${form.name}</p>
          <p><strong>Email:</strong> ${form.email}</p>
          <p><strong>Phone:</strong> ${form.phone || "Not provided"}</p>
          <p><strong>Subject:</strong> ${form.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${form.message.replace(/\n/g, "<br/>")}</p>
        `,
          text: `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nSubject: ${form.subject}\nMessage: ${form.message}`,
        },
      });
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setTimeout(() => {
        setSubmitted(false);
        setShowModal(false);
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  // Esc closes the contact modal (matches the appointment modal).
  useEffect(() => {
    if (!showModal) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal]);

  const handleNewsletterSubscribe = async () => {
    try {
      await subscribeNewsletter(newsletterEmail);
      setNewsletterStatus({ message: "Thank you for subscribing!", isError: false });
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterStatus({ message: err.message || "Subscription failed. Please try again.", isError: true });
    }
  };

  const inputCls = "footer-input w-full border border-neutral-300 px-3 py-[6px] text-base leading-6 text-neutral-900 focus:border-gold focus:outline-none";

  const footerLinkCls =
    "footer-link text-white hover:text-[#c6a15b] hover:bg-transparent focus:text-[#c6a15b] focus:bg-transparent transition-colors duration-200 no-underline cursor-pointer bg-transparent border-0 p-0 m-0 text-left inline-block";

  return (
    <>
      <footer id="site-footer" className="site-footer bg-black text-white">
        <div className="footer-container">
          <div className="footer-row">
            <div className="footer-col footer-col-brand">
              <h4 className="footer-brand-heading">
                <Image src="/brand/hc-white.png" alt="HC" width={40} height={40} />
              </h4>
              {/<[a-z][\s\S]*>/i.test(blurb) ? (
                <span className="footer-small footer-brand-copy" dangerouslySetInnerHTML={{ __html: sanitizeHtml(blurb) }} />
              ) : (
                <p className="footer-small footer-brand-copy">
                  {blurb}
                </p>
              )}
              {primaryEmail && (
                <p className="footer-small mb-1">
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${primaryEmail}`} className={footerLinkCls}>
                    {primaryEmail}
                  </a>
                </p>
              )}
              {primaryPhone && (
                <p className="footer-small mb-1">
                  <strong>Phone:</strong>{" "}
                  <a href={`tel:${primaryPhone}`} className={footerLinkCls}>
                    {primaryPhone}
                  </a>
                </p>
              )}
              <p className="footer-small mb-1">Follow us on:</p>
              <div className="flex gap-4">
                <a href={facebookUrl} className="text-white hover:text-[#c6a15b] transition-colors duration-200" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a href={instagramUrl} className="text-white hover:text-[#c6a15b] transition-colors duration-200" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <i className="bi bi-instagram fs-5"></i>
                </a>
                <a href={youtubeUrl} className="text-white hover:text-[#c6a15b] transition-colors duration-200" target="_blank" rel="noreferrer" aria-label="YouTube">
                  <i className="bi bi-youtube fs-5"></i>
                </a>
              </div>
            </div>

            <div className="footer-col footer-col-links">
              <h6 className="footer-section-title">Quick Links</h6>
              <ul className="footer-link-list">
                {quickLinks.map((l) => (
                  <li key={`${l.label}-${l.link || l.action}`}>
                    {l.action === "contact" ? (
                      <button type="button" className={footerLinkCls} onClick={() => setShowModal(true)}>
                        {l.label}
                      </button>
                    ) : (
                      <Link href={l.link} className={footerLinkCls}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col footer-col-support">
              <h6 className="footer-section-title">Support</h6>
              <ul className="footer-link-list">
                {supportLinks.map((l) => (
                  <li key={`${l.label}-${l.link}`}>
                    <Link href={l.link} className={footerLinkCls}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col footer-col-newsletter">
              <h6 className="footer-section-title">{newsletterTitle}</h6>
              <p className="footer-small footer-newsletter-copy">
                {newsletterDesc}
              </p>
              <div className="footer-newsletter-form">
                <input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNewsletterSubscribe()}
                  className="footer-input min-w-0 flex-1 border border-[#f8f9fa] bg-transparent px-3 py-[6px] text-base leading-6 text-white placeholder:text-[#6c757d] focus:outline-none"
                />
                <button onClick={handleNewsletterSubscribe} className="footer-subscribe border border-[#f8f9fa] px-3 py-[6px] text-base text-white transition hover:bg-white hover:text-black">
                  Subscribe
                </button>
              </div>
              {newsletterStatus.message && (
                <div className={`footer-small mt-2 ${newsletterStatus.isError ? "text-red-400" : "text-green-400"}`}>
                  {newsletterStatus.message}
                </div>
              )}
            </div>
          </div>

          <hr className="footer-divider" />
        </div>

        <div className="footer-container footer-bottom flex flex-col items-center text-center">
          <div className="flex w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-white.png"
              alt="Harry Clinton"
              className="footer-logo object-contain"
            />
          </div>
          <p className="mt-3 shrink-0 text-center text-xs uppercase tracking-[0.3em] text-neutral-400">
            {copyrightLine}
          </p>
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4" onMouseDown={closeModal}>
          <div className="contact-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-0 p-5 pb-0">
              <div>
                <h5 className="font-bold">Contact Us</h5>
                <p className="mb-0 text-sm text-neutral-500">We will get back to you within 24 hours.</p>
              </div>
              <button type="button" aria-label="Close" onClick={closeModal} className="contact-modal-close">✕</button>
            </div>
            <div className="p-5 pt-3">
              {submitted ? (
                <div className="bg-green-50 p-5 text-center text-sm text-green-700">
                  <i className="bi bi-check-circle block text-2xl"></i>
                  Thank you for reaching out. We will get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {submitError && (
                    <div className="mb-3 bg-red-50 p-3 text-center text-sm text-red-700">{submitError}</div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Name</label>
                      <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Email</label>
                      <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Phone</label>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Subject</label>
                      <select name="subject" value={form.subject} onChange={handleChange} required className={inputCls}>
                        <option value="">Select a subject</option>
                        <option value="Bespoke Consultation">Bespoke Consultation</option>
                        <option value="Order Enquiry">Order Enquiry</option>
                        <option value="Returns & Exchanges">Returns & Exchanges</option>
                        <option value="Feedback">Feedback</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold">Message</label>
                      <textarea name="message" rows="4" value={form.message} onChange={handleChange} placeholder="How can we help you?" required className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .contact-modal h5 { font-size: 20px; }
        .contact-modal-close {
          flex: 0 0 auto;
          margin: 0 0 0 1rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: transparent;
          border: 1px solid #171411;
          border-radius: 50%;
          opacity: 1;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          color: #171411;
          transition: color 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .contact-modal-close:hover {
          background-color: #171411;
          color: #f6f1e8;
          transform: rotate(90deg);
        }
        .contact-modal p,
        .contact-modal label,
        .contact-modal input,
        .contact-modal select,
        .contact-modal textarea,
        .contact-modal button,
        .contact-modal .contact-modal-message { font-size: 16px; }
        .site-footer {
          padding: 48px 0;
        }
        :global(.site-footer),
        :global(.site-footer *:not(.bi):not([class^="bi-"]):not([class*=" bi-"])) {
          font-family: "MAINLUX", Arial, sans-serif;
        }
        .footer-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 12px;
        }
        .footer-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          margin: 0 -12px;
        }
        .footer-col {
          min-width: 0;
          padding: 0 12px;
          margin-bottom: 24px;
        }
        .footer-brand-heading {
          margin: 0 0 8px;
          font-size: 24px !important;
          line-height: 1.2 !important;
          font-weight: 700 !important;
        }
        .footer-brand-copy {
          display: block;
          margin: 0 0 16px;
        }
        .footer-small {
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        .footer-section-title {
          margin: 0 0 8px;
          color: #fff;
          font-size: 16px !important;
          line-height: 1.2 !important;
          font-weight: 700 !important;
          text-transform: uppercase;
        }
        .footer-link-list {
          margin: 0;
          padding: 0;
          list-style: none;
          font-size: 16px;
          line-height: 1.5;
        }
        .footer-link-list li { margin: 0; padding: 0; }
        .footer-newsletter-copy {
          margin: 0 0 16px;
        }
        .footer-newsletter-form {
          display: flex;
          width: 100%;
        }
        :global(.site-footer .footer-input) {
          min-height: 38px;
          background: #000 !important;
          background-color: #000 !important;
          border-color: #f8f9fa !important;
          border-radius: 0.375rem 0 0 0.375rem !important;
          font-size: 16px !important;
          line-height: 24px !important;
        }
        :global(.site-footer .footer-subscribe) {
          flex: none;
          margin-left: -1px;
          border-color: #f8f9fa !important;
          border-radius: 0 0.375rem 0.375rem 0 !important;
          font-size: 16px !important;
          line-height: 24px !important;
        }
        .footer-divider {
          height: 1px;
          margin: 24px 0;
          border: 0;
          background: rgba(255, 255, 255, 0.25);
        }
        .footer-bottom { text-align: center; }
        .fs-5 { font-size: 1.25rem; }
        .footer-logo {
          width: 750px;
          max-width: 90%;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .footer-logo {
            width: 180px;
          }
        }
        @media (max-width: 480px) {
          .footer-logo {
            width: 150px;
          }
        }
        :global(.footer-link) {
          color: #ffffff !important;
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          text-decoration: none !important;
          box-shadow: none !important;
          display: inline-block;
          text-align: left;
          padding: 0;
          margin: 0;
          font-size: 16px;
          line-height: 1.5 !important;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        :global(.footer-link:hover),
        :global(.footer-link:focus),
        :global(.footer-link:active) {
          color: #ffffff !important;
          background: transparent !important;
          background-color: transparent !important;
          text-decoration: none !important;
          box-shadow: none !important;
        }
        @media (min-width: 576px) {
          .footer-container { max-width: 540px; }
        }
        @media (min-width: 768px) {
          .footer-container { max-width: 720px; }
          .footer-row { grid-template-columns: repeat(12, minmax(0, 1fr)); }
          .footer-col-brand, .footer-col-newsletter { grid-column: span 4; }
          .footer-col-links, .footer-col-support { grid-column: span 2; }
        }
        @media (min-width: 992px) {
          .footer-container { max-width: 960px; }
        }
        @media (min-width: 1200px) {
          .footer-container { max-width: 1140px; }
        }
        @media (min-width: 1400px) {
          .footer-container { max-width: 1320px; }
        }
        @media (max-width: 575px) {
          :global(.site-footer .footer-input) { border-radius: 0.375rem 0 0 0.375rem !important; }
          :global(.footer-subscribe) { padding-left: 10px; padding-right: 10px; }
        }
      `}</style>
    </>
  );
}
