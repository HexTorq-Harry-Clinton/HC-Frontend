"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, unwrap } from "@/lib/api";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";

const DEFAULT_TESTIMONIALS = [
  {
    reviewer_name: "Arjun M.",
    review_text: "The craftsmanship is unparalleled. My wedding suit from Harry Clinton was the finest I have ever worn.",
    rating: 5,
  },
  {
    reviewer_name: "Rahul S.",
    review_text: "From fabric selection to final fitting, the experience was truly bespoke. Worth every rupee.",
    rating: 5,
  },
  {
    reviewer_name: "Vikram P.",
    review_text: "I have worn suits from Savile Row, but Harry Clinton attention to detail rivals the best in the world.",
    rating: 5,
  },
];

export default function HomeTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  // Admin copy (tbl_settings home_reviews_*); reviews CRUD drives the quotes.
  const [copy, setCopy] = useState({ eyebrow: "WHAT OUR CLIENTS SAY", title: "Voices of Distinction", sub: "" });

  useEffect(() => {
    async function fetchReviews() {
      try {
        const [data, settingsData] = await Promise.all([
          apiFetch("/Reviews").then(unwrap),
          apiFetch("/Settings").then(unwrap).catch(() => []),
        ]);
        const row = (Array.isArray(settingsData) ? settingsData : [])[0] || {};
        setCopy({
          eyebrow: row.home_reviews_eyebrow || "WHAT OUR CLIENTS SAY",
          title: row.home_reviews_title || "Voices of Distinction",
          sub: row.home_reviews_subtitle || "",
        });
        let fetchedReviews = [];
        if (Array.isArray(data)) {
          fetchedReviews = data.filter(
            (r) =>
              r.is_approved !== false &&
              r.isdeleted !== true &&
              r.reviewer_name &&
              r.review_text
          );
        }
        
        if (fetchedReviews.length > 0) {
          setTestimonials(fetchedReviews);
        } else {
          setTestimonials(DEFAULT_TESTIMONIALS);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        setTestimonials(DEFAULT_TESTIMONIALS);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length, isHovered]);

  if (loading) {
    return <div className="py-20 bg-[#f7f4ec] min-h-[400px]"></div>;
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-[#f7f4ec]">
      <div className="max-w-4xl mx-auto px-4">
        <Reveal>
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            sub={copy.sub}
          />
        </Reveal>

        <Reveal delay={0.2}>
          <div 
            className="mt-16 relative h-[300px] flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center text-center justify-center"
              >
                <div className="text-6xl text-[#c6a15b] font-display mb-6 leading-none">
                  &ldquo;
                </div>
                <p className="text-xl md:text-2xl font-display italic text-[#101010] mb-8 max-w-2xl mx-auto px-4">
                  {currentTestimonial.review_text}
                </p>
                <div className="w-12 h-px bg-[#c6a15b] mx-auto mb-6"></div>
                
                <h4 className="uppercase tracking-widest text-sm text-[#101010] font-semibold mb-2">
                  {currentTestimonial.reviewer_name}
                </h4>
                
                <div className="flex gap-1 justify-center text-[#c6a15b]">
                  {Array.from({ length: currentTestimonial.rating || 5 }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-[#c6a15b] w-6" : "bg-[#c6a15b]/30"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
