"use client";

import { motion } from "framer-motion";
import Reveal from "@/components/Reveal";

export default function CraftsmanshipStory() {
  return (
    <section className="w-full flex flex-col">
      {/* BLOCK 1: Full-width dark section */}
      <div className="bg-[#101010] text-[#f7f4ec] py-24 px-4 sm:px-6 md:px-12 lg:px-24 flex flex-col items-center text-center">
        <Reveal>
          <span className="text-[#c6a15b] tracking-[0.2em] text-sm md:text-base uppercase font-sans mb-6 block font-medium">
            THE ART OF BESPOKE
          </span>
        </Reveal>
        
        <Reveal>
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl mb-8 leading-tight">
            Where Fabric Meets Mastery
          </h2>
        </Reveal>

        <Reveal>
          <p className="font-sans text-base md:text-lg max-w-3xl mx-auto mb-12 text-[#f7f4ec]/80 leading-relaxed font-light">
            Every Harry Clinton garment begins with a conversation — your vision, our craft. From hand-selected Italian fabrics to precision-cut patterns, each piece carries over 40 hours of meticulous handwork by our master tailors.
          </p>
        </Reveal>

        <Reveal>
          <div className="w-24 h-px bg-[#c6a15b] mx-auto mb-16"></div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 max-w-5xl mx-auto w-full">
          <Reveal>
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-6xl md:text-7xl text-[#c6a15b] mb-4 block">40+</span>
              <span className="font-sans text-sm tracking-[0.1em] uppercase text-[#f7f4ec]/70">Hours of Handwork</span>
            </div>
          </Reveal>
          
          <Reveal>
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-6xl md:text-7xl text-[#c6a15b] mb-4 block">200+</span>
              <span className="font-sans text-sm tracking-[0.1em] uppercase text-[#f7f4ec]/70">Fabric Options</span>
            </div>
          </Reveal>
          
          <Reveal>
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-6xl md:text-7xl text-[#c6a15b] mb-4 block">15+</span>
              <span className="font-sans text-sm tracking-[0.1em] uppercase text-[#f7f4ec]/70">Master Tailors</span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* BLOCK 2: Three-column feature grid */}
      <div className="bg-[#f7f4ec] py-20 px-4 sm:px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <Reveal>
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white/60 backdrop-blur-sm border border-[#a8823f]/20  p-10 h-full flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="w-16 h-16  bg-[#f7f4ec] border border-[#c6a15b]/30 flex items-center justify-center mb-6">
                <i className="bi bi-scissors text-3xl text-[#c6a15b]"></i>
              </div>
              <h3 className="font-display text-2xl text-[#101010] mb-4">Precision Cutting</h3>
              <p className="font-sans text-base text-[#101010]/70 leading-relaxed font-light">
                Every pattern is hand-drawn and cut with surgical precision, ensuring a silhouette that moves with you.
              </p>
            </motion.div>
          </Reveal>

          <Reveal>
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white/60 backdrop-blur-sm border border-[#a8823f]/20  p-10 h-full flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="w-16 h-16  bg-[#f7f4ec] border border-[#c6a15b]/30 flex items-center justify-center mb-6">
                <i className="bi bi-palette2 text-3xl text-[#c6a15b]"></i>
              </div>
              <h3 className="font-display text-2xl text-[#101010] mb-4">Fine Fabrics</h3>
              <p className="font-sans text-base text-[#101010]/70 leading-relaxed font-light">
                Sourced from the finest mills across Italy, England, and Japan — only materials worthy of the Harry Clinton name.
              </p>
            </motion.div>
          </Reveal>

          <Reveal>
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white/60 backdrop-blur-sm border border-[#a8823f]/20  p-10 h-full flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="w-16 h-16  bg-[#f7f4ec] border border-[#c6a15b]/30 flex items-center justify-center mb-6">
                <i className="bi bi-award text-3xl text-[#c6a15b]"></i>
              </div>
              <h3 className="font-display text-2xl text-[#101010] mb-4">Perfect Fit</h3>
              <p className="font-sans text-base text-[#101010]/70 leading-relaxed font-light">
                Your measurements, your style, your rules. Every stitch is placed with intention and pride.
              </p>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
