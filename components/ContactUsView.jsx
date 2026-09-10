"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import ShowcaseHeader from "./ShowcaseHeader";

// Contact Us page: hero, equal-height info cards, centered message form,
// atelier banner — aligned to the site grid.
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

  const inputCls = "w-full border border-neutral-300 px-3 py-2.5 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="pb-16">
      <div className="bg-neutral-950 py-14 text-white">
        <ShowcaseHeader
          dark
          title="Contact Us"
          sub="We would love to hear from you. Reach out for bespoke consultations, orders, or any questions."
        />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-10 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard title="Phone" value="+91 7094 094 194" href="tel:+917094094194" />
          <InfoCard title="Email" value="connect@harryclinton.com" href="mailto:connect@harryclinton.com" />
          <InfoCard title="Atelier" value="Chennai, Tamil Nadu, India" href="#" />
          <InfoCard title="Working Hours" value="Mon – Sat, 10am – 7pm IST" href="#" />
        </div>

        <div className="mx-auto mt-10 max-w-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-10">
          <h3 className="text-center font-display text-3xl font-bold">Send us a Message</h3>
          {status && (
            <p className={`mt-4 p-3 text-center text-sm ${isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {status}
            </p>
          )}
          <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
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

        <div className="mt-10 bg-neutral-950 p-8 text-white md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="font-display text-3xl font-bold md:text-4xl">Visit Our Atelier</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-300">
              Experience the world of Harry Clinton in person. Schedule a bespoke consultation with our master tailors and explore fabrics, fits, and finishes tailored to you.
            </p>
            <ul className="mx-auto mt-6 grid max-w-2xl gap-2 text-sm text-neutral-300 sm:grid-cols-2">
              <li className="border border-neutral-800 px-4 py-3">Harry Clinton Atelier, Chennai, Tamil Nadu, India</li>
              <li className="border border-neutral-800 px-4 py-3">connect@harryclinton.com</li>
              <li className="border border-neutral-800 px-4 py-3">+91 7094 094 194</li>
              <li className="border border-neutral-800 px-4 py-3">Mon – Sat, 10am – 7pm IST</li>
            </ul>
            <p className="mt-6 text-sm text-neutral-300">Prefer a face-to-face consultation?</p>
            <Link href="/help-center" className="btn-primary mt-3 !bg-gold !text-neutral-950 hover:!bg-white">
              Visit Help Center
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="link-sweep text-sm font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value, href }) {
  return (
    <a
      href={href}
      className="flex min-h-32 flex-col items-center justify-center border border-neutral-200 bg-white p-6 text-center shadow-sm transition-colors hover:border-gold"
    >
      <p className="eyebrow text-neutral-500">{title}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </a>
  );
}
