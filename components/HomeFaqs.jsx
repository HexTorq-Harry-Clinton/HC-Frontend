"use client";

import { useEffect, useState } from "react";
import { apiCached, homeKV } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";

const DEFAULT_FAQS = [
  {
    question: "1) What's the minimum duration required to stitch a bespoke suit?",
    answer: "We usually take 2 weeks for customizing a bespoke suit.",
  },
  {
    question: "2) What are the steps to place a custom order online?",
    answer: "You can contact us via WhatsApp or email. We'll guide you through fabric selection, sizing, and payment.",
  },
  {
    question: "3) What should I do if I received the wrong or defect products?",
    answer: "Please contact our support team within 5 days of order delivery.",
  },
  {
    question: "4) How to cancel my order?",
    answer: "Cancellation requests are accepted before the product is shipped. Please go to your order page or contact customer support to cancel your order.",
  },
  {
    question: "5) I got the sizing wrong, can I exchange it?",
    answer: "Yes, we offer size exchanges. Please initiate the process within 5 days of receiving your order. Ensure the item is unused, unwashed, not damaged, and in resalable condition with all original tags intact.",
  },
];

// Home FAQs: exact questions/answers/flow of the previous UI —
// first item open, single-open accordion, admin title + subtitle override.
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
            uniqueFaqs.map((item) => ({
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
                {faq.question}
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
