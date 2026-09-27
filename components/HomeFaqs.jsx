"use client";

import { useEffect, useState } from "react";
import { apiCached, homeKV } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";

// The homepage shows a curated subset of the FAQ table — the full list lives on
// the /FAQs page. Questions here are the canonical (un-numbered) question text
// stored in the DB; the visible "1) 2) 3)" prefix is added when rendering.
const HOME_FAQ_QUESTIONS = [
  "What's the minimum duration required to stitch a bespoke suit?",
  "What are the steps to place a custom order online?",
  "What should I do if I received a wrong or defective product?",
  "How to cancel my order?",
  "I think I got the sizing wrong on my order. Can I exchange it for a different size?",
];

const DEFAULT_FAQS = [
  {
    question: HOME_FAQ_QUESTIONS[0],
    answer: "We usually take 2 weeks for customizing a bespoke suit.",
  },
  {
    question: HOME_FAQ_QUESTIONS[1],
    answer:
      "To place a custom order online, contact us via WhatsApp or email. We'll guide you through fabric selection, sizing, and payment.",
  },
  {
    question: HOME_FAQ_QUESTIONS[2],
    answer: "Please contact our support team within 5 days of order delivery.",
  },
  {
    question: HOME_FAQ_QUESTIONS[3],
    answer:
      "Cancellation requests are accepted before the product is shipped. Please go to your order page or contact customer support to cancel your order.",
  },
  {
    question: HOME_FAQ_QUESTIONS[4],
    answer:
      "Yes, we offer size exchanges. Please initiate the exchange within 5 days of receiving your order. Ensure the item is unused, unwashed, and not damaged. Products should be in resalable condition with all original tags intact.",
  },
];

// Loose key so matching survives a re-worded question in the admin panel:
// drop any "12)" prefix, casefold, strip punctuation, collapse whitespace.
const faqKey = (q) =>
  (q || "")
    .replace(/^\s*\d+\s*[).:-]\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Pick the curated homepage set out of the full DB list, in the order above.
// Falls back to the first rows if a question was re-worded or removed, so the
// homepage never renders empty.
function pickHomeFaqs(list) {
  const byKey = new Map();
  list.forEach((f) => {
    const k = faqKey(f.question);
    if (k && !byKey.has(k)) byKey.set(k, f);
  });

  const picked = [];
  const used = new Set();
  HOME_FAQ_QUESTIONS.forEach((q) => {
    const hit = byKey.get(faqKey(q));
    if (hit && !used.has(hit.faq_id)) {
      picked.push(hit);
      used.add(hit.faq_id);
    }
  });

  for (const f of list) {
    if (picked.length >= HOME_FAQ_QUESTIONS.length) break;
    if (!used.has(f.faq_id)) {
      picked.push(f);
      used.add(f.faq_id);
    }
  }
  return picked;
}

// Home FAQs: first item open, single-open accordion, admin title + subtitle
// override. Renders the curated subset only — /FAQs shows everything.
export default function HomeFaqs() {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [title, setTitle] = useState("FAQs");
  const [subtitle, setSubtitle] = useState("");
  const [openId, setOpenId] = useState(1);

  useEffect(() => {
    let live = true;
    const fetchData = async () => {
      try {
        const [faqsRes, kv] = await Promise.all([
          apiCached("/FAQs").catch(() => []),
          homeKV().catch(() => ({})),
        ]);
        if (!live) return;
        const list = Array.isArray(faqsRes) ? faqsRes : [];
        if (list.length > 0) {
          // Deduplicate by question to handle cases where backend returns duplicates
          const seen = new Set();
          const uniqueFaqs = list.filter((item) => {
            const question = (item.question || item.title || "").trim().toLowerCase();
            if (!question || seen.has(question)) return false;
            seen.add(question);
            return true;
          });

          setFaqs(
            pickHomeFaqs(uniqueFaqs).map((item) => ({
              faq_id: item.faq_id,
              question: item.question || item.title || "",
              answer: item.answer || item.description || "",
            }))
          );
        }
        // Admin key-value first (home_faqs_*), else keep defaults.
        if (kv.home_faqs_title) setTitle(kv.home_faqs_title);
        if (kv.home_faqs_subtitle) setSubtitle(kv.home_faqs_subtitle);
      } catch {
        /* keep defaults */
      }
    };
    fetchData();
    return () => {
      live = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h2 className="text-center font-display text-4xl font-bold">{title}</h2>
      {subtitle ? (
        <p className="mt-2 text-center text-sm text-neutral-500">{subtitle}</p>
      ) : null}
      <div className="mt-8 space-y-3">
        {faqs.map((faq, i) => {
          const id = i + 1;
          const isOpen = openId === id;
          return (
            <div key={id} className="border border-neutral-200">
              <button
                onClick={() => setOpenId(isOpen ? null : id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between p-4 text-left font-medium"
              >
                {`${i + 1}) ${faq.question}`}
                <span className="ml-3 text-gold">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm text-neutral-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer) }} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
