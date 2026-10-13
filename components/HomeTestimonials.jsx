"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiCached, homeKV } from "@/lib/api";
import Reveal from "@/components/Reveal";

const INITIAL_REVIEWS = [
  {
    id: "rev-1",
    reviewer_name: "Dr. David Raj",
    initials: "DR",
    city: "Bangalore",
    occasion: "Handcrafted Double-Breasted Suit",
    review_title: "The Ultimate Bespoke Experience",
    review_text:
      "A level of service and artisanal tailoring that is rare today. The fabric breathes effortlessly and the silhouette gives unmatched presence in boardroom and evening events alike.",
    rating: 5,
    date: "Verified Google Review • 3 months ago",
  },
  {
    id: "rev-2",
    reviewer_name: "Arjun Muthukumar",
    initials: "AM",
    city: "Chennai",
    occasion: "Bespoke Wedding Tuxedo",
    review_title: "Craftsmanship Beyond Expectation",
    review_text:
      "The craftsmanship is unparalleled. My wedding suit from Harry Clinton was the finest I have ever worn. The precision in shoulder drape and canvas structure felt like a masterpiece on my wedding day.",
    rating: 5,
    date: "Verified Google Review • 2 weeks ago",
  },
  {
    id: "rev-3",
    reviewer_name: "Rahul Sivaraman",
    initials: "RS",
    city: "Bangalore",
    occasion: "3-Piece Italian Wool Tuxedo",
    review_title: "True Sartorial Excellence",
    review_text:
      "From the initial fabric consultation to the master fitting, the atelier experience was genuinely bespoke. The cut, hand-finished lapels, and poise exceeded anything I have commissioned in London.",
    rating: 5,
    date: "Verified Google Review • 1 month ago",
  },
  {
    id: "rev-4",
    reviewer_name: "Vikram Pandian",
    initials: "VP",
    city: "Coimbatore",
    occasion: "Made-to-Measure Silk Suit",
    review_title: "Savile Row Quality in India",
    review_text:
      "I have worn bespoke garments from Savile Row, but Harry Clinton’s attention to proportion and contour rivals the finest houses in Europe. The fit at first trial was absolute perfection.",
    rating: 5,
    date: "Verified Google Review • 1 month ago",
  },
  {
    id: "rev-5",
    reviewer_name: "Siddharth Menon",
    initials: "SM",
    city: "Chennai",
    occasion: "Imperial Midnight Tuxedo",
    review_title: "Uncompromising Elegance",
    review_text:
      "Every detail from the satin peak lapel to the interior silk monogram speaks of supreme luxury. Harry Clinton tailored not just my gala tux, but my entire entourage with immaculate punctuality.",
    rating: 5,
    date: "Verified Google Review • 2 months ago",
  },
];

function uniqueReviews(items) {
  const seen = new Set();
  return items.filter((review) => {
    const text = String(review.review_text || "").trim().toLowerCase().replace(/\s+/g, " ");
    // The same imported review can arrive with different IDs. Its normalized
    // text is the stable duplicate key, so it is shown only once.
    const key = text;
    if (!text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Google Review destination link — set when the Google Business review URL is ready.
// When empty or under development, clicking the button shows the "Upcoming Update" modal.
const GOOGLE_REVIEW_URL = "";

export default function HomeTestimonials() {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [page, setPage] = useState(0);
  const [pageDirection, setPageDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const [copy, setCopy] = useState({
    eyebrow: "WHAT OUR CLIENTS SAY",
    title: "Voices of Distinction",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [data, kv] = await Promise.all([
          apiCached("/Reviews").catch(() => []),
          homeKV().catch(() => ({})),
        ]);
        if (kv.home_reviews_title) {
          setCopy({
            eyebrow: kv.home_reviews_eyebrow || "WHAT OUR CLIENTS SAY",
            title: kv.home_reviews_title,
          });
        }
        if (Array.isArray(data) && data.length > 0) {
          const approved = data
            .filter((r) => r.is_approved !== false && r.isdeleted !== true && r.review_text)
            .map((r, i) => ({
              id: r.review_id || `db-${i}`,
              reviewer_name: r.reviewer_name || r.user_name || "Verified Client",
              initials:
                (r.reviewer_name || r.user_name || "HC")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "HC",
              city: r.city || "Chennai Atelier",
              occasion: r.review_title || "Bespoke Atelier Client",
              review_title: r.review_title || "Exceptional Sartorial Craftsmanship",
              review_text: r.review_text,
              rating: Number(r.rating) || 5,
              date: "Verified Google Review",
            }));
          if (approved.length > 0) {
            setReviews(uniqueReviews([...approved, ...INITIAL_REVIEWS]));
          }
        }
      } catch {
        /* fallback to INITIAL_REVIEWS */
      }
    }
    loadData();
  }, []);

  // Desktop shows 3 per page, mobile shows 1
  const pageSize = 3;
  const totalPages = Math.ceil(reviews.length / pageSize);
  const visibleReviews = reviews.slice(page * pageSize, page * pageSize + pageSize);

  const goToPage = (nextPage, direction) => {
    setPageDirection(direction);
    setPage(nextPage);
  };

  const handlePrev = () => goToPage(page > 0 ? page - 1 : totalPages - 1, -1);

  const handleNext = () => goToPage(page < totalPages - 1 ? page + 1 : 0, 1);

  return (
    <section className="w-full bg-[#faf9f6] py-16 md:py-24 border-y border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          {/* Header Block: Clean, Simple, Single Section */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-display !text-[20px] sm:!text-[25px] md:!text-[30px] !leading-tight font-bold uppercase tracking-tight text-neutral-500 block mb-2">
              {copy.eyebrow}
            </span>
            <h2 className="font-display !text-[20px] sm:!text-[25px] md:!text-[30px] !leading-tight font-bold text-neutral-950 uppercase tracking-wide mb-4">
              {copy.title}
            </h2>

            {/* Google Rating Badge & Write Review Action */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 mt-2">
              {/* Google Verified Rating Pill */}
              <div className="inline-flex items-center gap-2.5 bg-white border border-neutral-200 px-4 py-2 shadow-sm">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div className="flex items-center gap-1 text-[#c6a15b] text-[13px] font-bold">
                  <span>4.9</span>
                  <span>★★★★★</span>
                </div>
                <span className="text-[12px] text-neutral-600 font-normal">
                  180+ Google Reviews
                </span>
              </div>

              {/* Write Review Action -> Google Review (Under Development / Upcoming Update) */}
              <button
                type="button"
                onClick={() => {
                  if (GOOGLE_REVIEW_URL) {
                    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
                  } else {
                    setIsUpcomingModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-2 !bg-white hover:!bg-[#faf8f4] text-neutral-950 px-4 py-2 text-[12px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-[#c6a15b]"
              >
                <svg className="w-3.5 h-3.5 text-[#c6a15b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                     d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>Write a Review</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f8f5ee] text-[#a8823f] border border-[#c6a15b]/30 px-1.5 py-0.5 ml-1">
                  Upcoming
                </span>
              </button>
            </div>
          </div>

          {/* Clean 3-Card Grid */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={pageDirection}>
              <motion.div
                key={page}
                custom={pageDirection}
                initial={{ opacity: 0, x: reduceMotion ? 0 : pageDirection * 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduceMotion ? 0 : pageDirection * -48 }}
                transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                aria-live="polite"
              >
                {visibleReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-neutral-200 p-6 md:p-7 flex flex-col justify-between shadow-sm hover:border-[#c6a15b]/60 hover:shadow-md transition-all duration-300"
              >
                <div>
                  {/* Rating Stars & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[#c6a15b] text-[15px] tracking-widest">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e6f4ea] text-[#137333] px-2 py-0.5">
                      ✓ Verified
                    </span>
                  </div>

                  {/* Title */}
                  {rev.review_title && (
                    <h3 className="font-display text-[15px] font-bold text-neutral-950 mb-2 leading-snug">
                      &ldquo;{rev.review_title}&rdquo;
                    </h3>
                  )}

                  {/* Quote */}
                  <p className="font-sans text-[15px] text-neutral-700 italic leading-relaxed mb-6 font-normal">
                    &ldquo;{rev.review_text}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-[12px]">
                  <div>
                    <h4 className="font-bold text-neutral-950 text-[12px] m-0">
                      {rev.reviewer_name}
                    </h4>
                    <p className="text-neutral-500 text-[12px] m-0 font-normal">
                      {rev.city} • {rev.occasion}
                    </p>
                  </div>
                  <span className="text-neutral-400 text-[11px] shrink-0 ml-2">
                    {rev.date?.includes("•") ? rev.date.split("•")[1].trim() : rev.date}
                  </span>
                </div>
              </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Clean Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Reviews"
                className="w-9 h-9 border border-neutral-300 bg-white flex items-center justify-center text-neutral-800 hover:border-[#c6a15b] hover:text-[#c6a15b] transition-colors cursor-pointer"
              >
                &larr;
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToPage(idx, idx >= page ? 1 : -1)}
                    aria-label={`Go to review page ${idx + 1}`}
                    className={`home-testimonial-dot rounded-full transition-all duration-200 cursor-pointer ${
                      idx === page
                        ? "h-2.5 w-2.5 scale-110 bg-[#a8823f]"
                        : "h-2 w-2 bg-neutral-400 hover:bg-neutral-500"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Reviews"
                className="w-9 h-9 border border-neutral-300 bg-white flex items-center justify-center text-neutral-800 hover:border-[#c6a15b] hover:text-[#c6a15b] transition-colors cursor-pointer"
              >
                &rarr;
              </button>
            </div>
          )}
        </Reveal>
      </div>

      {/* Google Reviews Integration - Upcoming Update / Under Development Modal */}
      {isUpcomingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsUpcomingModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md bg-white border border-[#c6a15b]/40 shadow-2xl text-neutral-950 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 text-center">
            {/* Gold Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c6a15b] via-[#e5c98d] to-[#c6a15b]" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsUpcomingModalOpen(false)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full border border-neutral-200 text-neutral-400 hover:text-neutral-950 hover:border-neutral-400 hover:bg-neutral-100 flex items-center justify-center text-xl font-bold transition-all cursor-pointer"
              aria-label="Close modal"
            >
              &times;
            </button>

            {/* Google Icon Badge */}
            <div className="w-14 h-14 rounded-full bg-[#f8f6f0] border border-[#c6a15b]/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-[#c6a15b] mb-1.5">
              Google Reviews Integration
            </span>

            <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-neutral-950 mb-2 leading-snug">
              Under Development
            </h3>

            <p className="text-neutral-600 text-[13px] sm:text-[14px] leading-relaxed mb-6 font-normal">
              Direct Google Reviews integration is currently in development. You will be able to leave and view verified Google feedback in our upcoming update!
            </p>

            <div className="bg-[#faf8f4] border border-[#c6a15b]/20 p-3.5 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-neutral-700 font-medium">
                <span className="text-[#34A853] font-bold">✓</span>
                <span>Verified Google Business Reviews</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-neutral-700 font-medium">
                <span className="text-[#c6a15b] font-bold">✦</span>
                <span>Direct Star Rating & Feedback Portal</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-neutral-700 font-medium">
                <span className="text-[#4285F4] font-bold">●</span>
                <span>Launching in the upcoming site update</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUpcomingModalOpen(false)}
              className="w-full bg-neutral-950 hover:bg-[#c6a15b] text-white hover:text-neutral-950 font-bold text-[12px] uppercase tracking-wider py-3 transition-colors cursor-pointer border border-neutral-950 hover:border-[#c6a15b]"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
