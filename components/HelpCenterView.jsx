import Link from "next/link";
import { apiGet, unwrap } from "@/lib/api";

const TOPICS = [
  { title: "Shipping", desc: "Learn about dispatch timelines, delivery options, tracking your order, and express delivery within Chennai.", href: "/Policies" },
  { title: "Returns & Exchanges", desc: "Find out how to return or exchange an item, our 5-day window policy, and refund timelines.", href: "/Policies" },
  { title: "Cancellation", desc: "Understand how to cancel an order before shipping, cancellation for bespoke orders, and our right to cancel orders.", href: "/Policies" },
  { title: "Sizing & Custom Orders", desc: "How to choose the right size, book a bespoke consultation, and what to expect from a custom garment.", href: "/FAQs" },
  { title: "Privacy & Security", desc: "How we collect, use, and protect your personal information and payment details.", href: "/privacy-policy" },
  { title: "Terms & Conditions", desc: "Everything about using our website, eligibility, payments, bespoke orders, and intellectual property.", href: "/terms-and-conditions" },
];

const DEFAULT_GUIDES = [
  { question: "How do I place an order?", answer: "Browse collections, add products to cart, and proceed to checkout. For bespoke orders, contact us via WhatsApp or email." },
  { question: "How long does a bespoke suit take?", answer: "A bespoke suit is typically ready within 2 weeks after measurements and design confirmation." },
  { question: "Can I track my order?", answer: "Yes. Once dispatched, we send tracking details to your registered email and phone number." },
  { question: "What payment methods do you accept?", answer: "We accept cards, UPI, net banking, and select wallets via secure payment gateways." },
  { question: "Do you offer international shipping?", answer: "We currently ship across India. International shipping is available on request for select countries." },
  { question: "How do I contact customer support?", answer: "Email us at connect@harryclinton.com or call +91 7094 094 194, Monday to Saturday, 10am–7pm IST." },
];

// Help Center: hero, topics, guides, help card — verbatim from before.
export default async function HelpCenterView() {
  const faqs = await apiGet("/FAQs").then(unwrap).catch(() => []);
  const guides = (Array.isArray(faqs) && faqs.length > 0
    ? faqs.slice(0, 6).map((f) => ({ question: f.question, answer: f.answer }))
    : DEFAULT_GUIDES);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold">Help Center</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-500">
          Find answers, manage orders, and learn more about Harry Clinton.
        </p>
      </div>

      <h2 className="mt-12 font-display text-3xl font-bold">Browse by Topic</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => (
          <Link key={t.title} href={t.href} className="border border-neutral-200 p-6 transition-colors hover:border-gold">
            <p className="font-display text-xl font-bold">{t.title}</p>
            <p className="mt-2 text-sm text-neutral-600">{t.desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 font-display text-3xl font-bold">Quick Guides</h2>
      <div className="mt-6 space-y-3">
        {guides.map((g, i) => (
          <details key={i} className="border border-neutral-200">
            <summary className="cursor-pointer p-4 font-medium">{g.question}</summary>
            <p className="px-4 pb-4 text-sm text-neutral-600">{g.answer}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 bg-neutral-950 p-8 text-center text-white md:p-12">
        <h2 className="font-display text-3xl font-bold">Still need help?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-300">
          Our support team is available Monday to Saturday, 10am–7pm IST.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="mailto:connect@harryclinton.com" className="border border-white px-6 py-2 text-sm font-semibold transition hover:bg-white hover:text-black">
            Email Us
          </a>
          <a href="tel:+917094094194" className="border border-white px-6 py-2 text-sm font-semibold transition hover:bg-white hover:text-black">
            Call Us
          </a>
          <Link href="/contact-us" className="bg-gold px-6 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white">
            Contact Page
          </Link>
        </div>
      </div>
    </div>
  );
}
