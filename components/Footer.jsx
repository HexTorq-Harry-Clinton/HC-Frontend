"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

// Footer: exact structure/order/texts of the previous UI (Tailwind styling).
export default function Footer() {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState({ message: "", isError: false });
  const [supportContacts, setSupportContacts] = useState([]);

  useEffect(() => {
    let live = true;
    apiFetch("/Support-Contacts")
      .then(unwrap)
      .then((data) => {
        if (live) setSupportContacts(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const primaryEmail =
    supportContacts.find((c) => c.contact_type === "email" || c.contact_type === "Email")?.contact_value ||
    "connect@harryclinton.com";
  const primaryPhone =
    supportContacts.find((c) => c.contact_type === "phone" || c.contact_type === "Phone")?.contact_value || "";

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

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setNewsletterStatus({ message: "Please enter a valid email.", isError: true });
      return;
    }
    try {
      await apiFetch("/Newsletter-Subscriptions", {
        method: "POST",
        body: { emailid: newsletterEmail, subscription_status: "subscribed", rcu: "website" },
      });
      setNewsletterStatus({ message: "Thank you for subscribing!", isError: false });
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterStatus({ message: err.message || "Subscription failed. Please try again.", isError: true });
    }
  };

  const inputCls = "w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-gold focus:outline-none";

  return (
    <>
      <footer id="site-footer" className="mt-16 bg-black py-12 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <h4 className="font-bold">
                <Image src="/brand/logo-white.png" alt="HC" width={120} height={40} />
              </h4>
              <p className="mt-3 text-sm">
                Empowering innovation with quality and trust. Join us in our journey towards excellence.
              </p>
              {primaryEmail && (
                <p className="mb-1 mt-2 text-sm">
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${primaryEmail}`} className="text-white no-underline">
                    {primaryEmail}
                  </a>
                </p>
              )}
              {primaryPhone && (
                <p className="mb-1 text-sm">
                  <strong>Phone:</strong>{" "}
                  <a href={`tel:${primaryPhone}`} className="text-white no-underline">
                    {primaryPhone}
                  </a>
                </p>
              )}
              <p className="mb-1 mt-3 text-sm">Follow us on:</p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/harry.clinton.829484" className="text-white" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a href="https://www.instagram.com/harryclinton_official/" className="text-white" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <i className="bi bi-instagram fs-5"></i>
                </a>
                <a href="https://www.youtube.com/@HarryClintonHC" className="text-white" target="_blank" rel="noreferrer" aria-label="YouTube">
                  <i className="bi bi-youtube fs-5"></i>
                </a>
              </div>
            </div>

            <div className="md:col-span-2">
              <h6 className="text-sm font-bold uppercase">Quick Links</h6>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/aboutUs" className="text-white no-underline">About Us</Link>
                </li>
                <li>
                  <button className="m-0 bg-transparent p-0 text-white" onClick={() => setShowModal(true)}>
                    Contact Us
                  </button>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-white no-underline">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="text-white no-underline">Terms & Conditions</Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h6 className="text-sm font-bold uppercase">Support</h6>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/help-center" className="text-white no-underline">Help Center</Link>
                </li>
                <li>
                  <Link href="/FAQs" className="text-white no-underline">FAQs</Link>
                </li>
                <li>
                  <Link href="/Policies" className="text-white no-underline">Shipping, Returns &amp; Cancellation</Link>
                </li>
                <li>
                  <Link href="/FAQs" className="text-white no-underline">Track Order</Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h6 className="text-sm font-bold uppercase">Stay Updated</h6>
              <p className="mt-3 text-sm">
                Subscribe to our newsletter for the latest updates and promotions.
              </p>
              <div className="mt-3 flex">
                <input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNewsletterSubscribe()}
                  className="flex-1 border border-white bg-transparent px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus:outline-none"
                />
                <button onClick={handleNewsletterSubscribe} className="border border-white px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black">
                  Subscribe
                </button>
              </div>
              {newsletterStatus.message && (
                <div className={`mt-2 text-sm ${newsletterStatus.isError ? "text-red-400" : "text-green-400"}`}>
                  {newsletterStatus.message}
                </div>
              )}
            </div>
          </div>

          <hr className="my-6 border-neutral-800" />
        </div>

        <div className="mb-4 text-center">
          <Image src="/brand/logo-white.png" alt="Logo-footer" width={220} height={60} className="mx-auto" />
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4" onMouseDown={closeModal}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-0 p-5 pb-0">
              <div>
                <h5 className="font-bold">Contact Us</h5>
                <p className="mb-0 text-sm text-neutral-500">We will get back to you within 24 hours.</p>
              </div>
              <button type="button" aria-label="Close" onClick={closeModal} className="text-2xl leading-none text-neutral-500 hover:text-black">×</button>
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
        .fs-5 { font-size: 1.25rem; }
      `}</style>
    </>
  );
}
