"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";

const categories = [
  {
    name: "Suits",
    href: "/suits",
    tagline: "For the Men Who Wear Royalty, Not Just Suits.",
    bgClass: "bg-gradient-to-br from-gray-900 via-neutral-900 to-black",
    spanClass: "md:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[400px] lg:min-h-[600px]",
  },
  {
    name: "Shirts",
    href: "/shirts",
    tagline: "Sharp shirts for every hour of the day.",
    bgClass: "bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950",
    spanClass: "col-span-1 min-h-[300px]",
  },
  {
    name: "Trousers",
    href: "/trousers",
    tagline: "Tailored trousers, cut to move with you.",
    bgClass: "bg-gradient-to-br from-stone-800 via-stone-900 to-black",
    spanClass: "col-span-1 min-h-[300px]",
  },
  {
    name: "Indo-Western",
    href: "/indowestern",
    tagline: "Heritage craft meets modern tailoring.",
    bgClass: "bg-gradient-to-br from-red-950 via-rose-950 to-black",
    spanClass: "col-span-1 min-h-[300px]",
  },
  {
    name: "Baby Suits",
    href: "/babysuits",
    tagline: "Little gentlemen, dressed to the nines.",
    bgClass: "bg-gradient-to-br from-emerald-950 via-teal-950 to-black",
    spanClass: "col-span-1 min-h-[300px]",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-24 bg-[#f7f4ec] text-[#101010]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Reveal>
          <SectionHeading 
            eyebrow="THE COLLECTION"
            title="Explore Our World"
          />
        </Reveal>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <Reveal 
              key={category.name} 
              delay={index * 0.1} 
              className={category.spanClass}
            >
              <Link 
                href={category.href}
                className="group relative block w-full h-full overflow-hidden bg-[#101010]"
              >
                {/* Background Layer with Scale Effect */}
                <div 
                  className={`absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105 ${category.bgClass}`}
                />
                
                {/* Overlay gradient to darken on hover */}
                <div className="absolute inset-0 bg-black/30 transition-colors duration-700 group-hover:bg-black/60" />

                {/* Animated Gold Border Layer */}
                <div className="absolute inset-4 border border-transparent transition-colors duration-700 group-hover:border-[#c6a15b]/60 z-10 pointer-events-none" />

                {/* Content */}
                <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end text-[#f7f4ec] z-20">
                  <div className="transform transition-transform duration-700 translate-y-6 group-hover:translate-y-0">
                    <h3 className="font-display text-3xl md:text-4xl lg:text-5xl mb-3 text-[#f7f4ec] font-medium tracking-wide">
                      {category.name}
                    </h3>
                    <p className="text-sm md:text-base text-[#f7f4ec]/80 mb-8 opacity-0 transition-opacity duration-700 group-hover:opacity-100 max-w-xs font-sans font-light">
                      {category.tagline}
                    </p>
                    <div className="inline-flex items-center space-x-3 text-[#c6a15b] uppercase tracking-[0.2em] text-xs font-semibold group-hover:text-[#f7f4ec] transition-colors duration-500">
                      <span>Discover</span>
                      <motion.span 
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="inline-block"
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
