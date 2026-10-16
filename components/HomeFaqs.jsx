"use client";

import { useEffect, useState } from "react";
import { apiCached, homeKV } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";

// The homepage shows only FAQs flagged show_on_home in the admin panel; the
// full list always lives on /FAQs. Questions are stored un-numbered — the
// visible "1) 2) 3)" prefix is added when rendering.
const DEFAULT_FAQS = [
  {
    question: "What's the minimum duration required to stitch a bespoke suit?",
    answer: "We usually take 2 weeks for customizing a bespoke suit.",
  },
  {
    question: "What are the steps to place a custom order online?",
    answer:
      "To place a custom order online, contact us via WhatsApp or email. We'll guide you through fabric selection, sizing, and payment.",
  },
  {
    question: "What should I do if I received a wrong or defective product?",
    answer: "Please contact our support team within 5 days of order delivery.",
  },
  {
    question: "How to cancel my order?",
    answer:
      "Cancellation requests are accepted before the product is shipped. Please go to your order page or contact customer support to cancel your order.",
  },
  {
    question: "I think I got the sizing wrong on my order. Can I exchange it for a different size?",
    answer:
      "Yes, we offer size exchanges. Please initiate the exchange within 5 days of receiving your order. Ensure the item is unused, unwashed, and not damaged. Products should be in resalable condition with all original tags intact.",
  },
];

// BIT columns arrive as true/false or 1/0 depending on the driver.
const isOn = (v) => v === true || v === 1 || v === "1";
// home_order is optional (NULL = not on the homepage). Rows without one fall
// back to display_order so a half-configured set still renders sensibly.
const homeRank = (f) => {
  const n = Number(f.home_order);
  return Number.isFinite(n) && n > 0 ? n : Number(f.display_order) || 0;
};

// Home FAQs: first item open, single-open accordion, admin title + subtitle
// override. Renders the show_on_home subset only — /FAQs shows everything.
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

          // show_on_home is the source of truth. If the backend is older and
          // does not return the column yet, fall back to showing everything so
          // the homepage is never blank mid-deploy.
          const knowsFlag = uniqueFaqs.some((f) => f.show_on_home !== undefined && f.show_on_home !== null);
          const chosen = (knowsFlag ? uniqueFaqs.filter((f) => isOn(f.show_on_home)) : uniqueFaqs)
            .slice()
            .sort((a, b) => homeRank(a) - homeRank(b));

          if (chosen.length > 0) {
            setFaqs(
              chosen.map((item) => ({
                faq_id: item.faq_id,
                question: item.question || item.title || "",
                answer: item.answer || item.description || "",
              }))
            );
          }
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
    <section className="hc-home-faqs w-full bg-white my-12">
      <div className="mx-auto w-full px-0">
        <h2 className="mb-6 text-center font-display !text-[24px] md:!text-[32px] !leading-tight font-bold text-neutral-950">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-center text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto">{subtitle}</p>
        ) : null}
        <div className="space-y-0">
          {faqs.map((faq, i) => {
            const id = i + 1;
            const isOpen = openId === id;
            return (
              <div
                key={id}
                className={`border-x border-b border-[#dee2e6] bg-white ${i === 0 ? "border-t" : "border-t-0"}`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : id)}
                  aria-expanded={isOpen}
                  className={`faq-question flex w-full items-center justify-between px-5 py-5 text-left !text-[16px] leading-normal font-normal text-[#212529] transition-colors ${isOpen ? "bg-[#e7f1ff] text-[#0c63e4]" : "bg-white"}`}
                >
                  <span className="!text-[16px] !leading-snug">{`${i + 1}) ${faq.question}`}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className={`ml-4 h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0c63e4]" : "text-[#212529]"}`}
                    fill="currentColor"
                  >
                    <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    className="border-t border-[#dee2e6] px-5 py-4 pl-10 !text-[18px] !leading-relaxed font-bold not-italic text-[#212529] max-md:!text-[14px]"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer) }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        :global(.hc-home-faqs),
        :global(.hc-home-faqs *) {
          font-family: "MAINLUX", Arial, sans-serif;
        }
        @media (max-width: 576px) {
          .faq-question {
            font-size: 0.9rem !important;
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </section>
  );
}
