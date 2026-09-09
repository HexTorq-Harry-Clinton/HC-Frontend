"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

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
// first item open, single-open accordion, settings title override.
export default function HomeFaqs() {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [title, setTitle] = useState("FAQs");
  const [openId, setOpenId] = useState(1);

  useEffect(() => {
    let live = true;
    const fetchData = async () => {
      try {
        const [faqsRes, settingsRes] = await Promise.all([
          apiFetch("/FAQs").then(unwrap).catch(() => []),
          apiFetch("/Settings").then(unwrap).catch(() => []),
        ]);
        if (!live) return;
        const list = Array.isArray(faqsRes) ? faqsRes : [];
        if (list.length > 0) {
          setFaqs(
            list.slice(0, 5).map((item) => ({
              question: item.question || item.title || "",
              answer: item.answer || item.description || "",
            }))
          );
        }
        const settings = Array.isArray(settingsRes) ? settingsRes : [];
        const match = settings.find(
          (s) => s.setting_key?.toLowerCase() === "home_faqs_title" || s.key?.toLowerCase() === "home_faqs_title"
        );
        if (match?.setting_value || match?.value) setTitle(match.setting_value || match.value);
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
                <p className="px-4 pb-4 text-sm text-neutral-600" dangerouslySetInnerHTML={{ __html: faq.answer }} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
