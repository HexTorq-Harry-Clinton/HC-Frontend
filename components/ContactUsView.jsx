"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

// Contact Us page: same structure/texts as the previous UI —
// hero, info cards, message form, atelier visit card.
export default function ContactUsView() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("");
    setIsError(false);
    setSending(true);
    try {
      await apiFetch("/Mail/Send-Mail", {
        method: "POST",
        body: {
          to: "connect@harryclinton.com",
          subject: `Contact Form: ${form.subject}`,
          html: `<p><strong>Name:</strong> ${form.name}</p><p><strong>Email:</strong> ${form.email}</p><p><strong>Phone:</strong> ${form.phone || "Not provided"}</p><p><strong>Subject:</strong> ${form.subject}</p><p><strong>Message:</strong></p><p>${form.message.replace(/\n/g, "<br/>")}</p>`,
          text: `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nSubject: ${form.subject}\nMessage: ${form.message}`,
        },
      });
      setStatus("Thank you for reaching out. Our team will get back to you within 24 hours.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setStatus(err.message || "Failed to send message. Please try again.");
      setIsError(true);
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full border border-neutral-300 px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold">Contact Us</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-500">
          We would love to hear from you. Reach out for bespoke consultations, orders, or any questions.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard title="Phone" value="+91 7094 094 194" href="tel:+917094094194" />
        <InfoCard title="Email" value="connect@harryclinton.com" href="mailto:connect@harryclinton.com" />
        <InfoCard title="Atelier" value="Chennai, Tamil Nadu, India" href="#" />
        <InfoCard title="Working Hours" value="Mon – Sat, 10am – 7pm IST" href="#" />
      </div>

      <div className="mt-10 border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <h3 className="font-display text-2xl font-bold">Send us a Message</h3>
        {status && (
          <p className={`mt-3 p-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {status}
          </p>
        )}
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Full Name</span>
            <input value={form.name} onChange={set("name")} placeholder="Your name" required className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email Address</span>
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Phone Number</span>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Subject</span>
            <select value={form.subject} onChange={set("subject")} required className={inputCls}>
              <option value="">Select a subject</option>
              <option value="Bespoke Consultation">Bespoke Consultation</option>
              <option value="Order Enquiry">Order Enquiry</option>
              <option value="Returns & Exchanges">Returns & Exchanges</option>
              <option value="Feedback">Feedback</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Message</span>
            <textarea value={form.message} onChange={set("message")} placeholder="Tell us how we can help..." rows="5" required className={inputCls} />
          </label>
          <div className="md:col-span-2">
            <button disabled={sending} className="btn-primary w-full disabled:opacity-50">
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10 border border-neutral-200 bg-neutral-950 p-8 text-white md:p-12">
        <h3 className="font-display text-3xl font-bold">Visit Our Atelier</h3>
        <p className="mt-2 max-w-2xl text-neutral-300">
          Experience the world of Harry Clinton in person. Schedule a bespoke consultation with our master tailors and explore fabrics, fits, and finishes tailored to you.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-neutral-300">
          <li>Harry Clinton Atelier, Chennai, Tamil Nadu, India</li>
          <li>connect@harryclinton.com</li>
          <li>+91 7094 094 194</li>
          <li>Mon – Sat, 10am – 7pm IST</li>
        </ul>
        <p className="mt-4 text-sm">Prefer a face-to-face consultation?</p>
        <Link href="/help-center" className="btn-primary mt-3 !bg-gold !text-neutral-950 hover:!bg-white">
          Visit Help Center
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="link-sweep text-sm font-semibold">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function InfoCard({ title, value, href }) {
  return (
    <a href={href} className="block border border-neutral-200 p-6 text-center transition-colors hover:border-gold">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{title}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </a>
  );
}
