"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function AppointmentCTA() {
  return (
    <section className="w-full bg-[#fbfaf7] py-16 md:py-24 border-y border-neutral-200/60">
      <div className="w-full px-0">
        <Reveal>
          <div className="relative bg-neutral-950 text-white overflow-hidden shadow-2xl border border-[#c6a15b]/25">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Left Column: High-Fashion Bespoke Atelier Photography */}
              <div className="lg:col-span-5 relative min-h-[340px] sm:min-h-[420px] lg:min-h-[560px] overflow-hidden">
                <Image
                  src="/brand/atelier-portrait.jpg"
                  alt="Harry Clinton Bespoke Tailoring Atelier"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-top transition-transform duration-1000 ease-out hover:scale-105"
                  priority={false}
                />
                {/* Subtle seam blend into dark card */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-neutral-950/40" />

                {/* Floating Atelier Badge matching site showcase labels */}
                <div className="absolute bottom-6 left-6 z-10">
                  <span className="inline-block bg-white text-neutral-950 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] shadow-md">
                    HC Atelier
                  </span>
                </div>
              </div>

              {/* Right Column: Editorial Bespoke Invitation */}
              <div className="lg:col-span-7 p-7 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-center relative z-10">
                {/* Brand Seal */}
                <div className="mb-5">
                  <Image
                    src="/brand/logo-gold.png"
                    alt="Harry Clinton"
                    width={112}
                    height={38}
                    className="object-contain"
                    style={{ width: "112px", height: "auto" }}
                  />
                </div>

                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-[1px] bg-[#c6a15b]" />
                  <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.28em] text-[#c6a15b]">
                    Bespoke Experience
                  </span>
                </div>

                {/* Heading */}
                <h2 className="font-display !text-[32px] !leading-tight font-bold text-white tracking-tight mb-4">
                  Your Perfect Suit Awaits
                </h2>

                {/* Subtitle / Description */}
                <p className="text-neutral-300 text-[14px] sm:text-[15px] leading-relaxed max-w-xl mb-7 font-normal">
                  Book a private consultation with our master tailors. We will guide you through fabric selection, measurements, and design — crafting a garment that is uniquely yours.
                </p>

                {/* 3 Bespoke Touchpoints / Process Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-6 my-2 border-y border-neutral-800/90">
                  <div>
                    <span className="text-[#c6a15b] text-[11px] font-bold uppercase tracking-[0.2em] block mb-1">
                      01 / Consultation
                    </span>
                    <p className="text-neutral-400 text-[12px] leading-snug">
                      Private styling session with our master clothiers.
                    </p>
                  </div>
                  <div>
                    <span className="text-[#c6a15b] text-[11px] font-bold uppercase tracking-[0.2em] block mb-1">
                      02 / 30+ Measures
                    </span>
                    <p className="text-neutral-400 text-[12px] leading-snug">
                      Precision drafting sculpted to your anatomy & posture.
                    </p>
                  </div>
                  <div>
                    <span className="text-[#c6a15b] text-[11px] font-bold uppercase tracking-[0.2em] block mb-1">
                      03 / Hand-Finished
                    </span>
                    <p className="text-neutral-400 text-[12px] leading-snug">
                      Curated European wools, silks, and floating canvas.
                    </p>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pt-5">
                  <Link
                    href="/book-appointment"
                    className="group inline-flex items-center justify-center gap-3 bg-white text-neutral-950 hover:bg-[#c6a15b] hover:text-neutral-950 px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer w-full sm:w-fit shrink-0"
                  >
                    <span>Book Your Appointment</span>
                    <svg
                      className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                  <div className="flex items-center gap-2 text-neutral-400 text-[12px] sm:text-[13px]">
                    <svg className="w-4 h-4 text-[#c6a15b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>
                      Or reach us at{" "}
                      <a
                        href="mailto:connect@harryclinton.com"
                        className="text-[#c6a15b] hover:text-white font-semibold underline underline-offset-4 transition-colors"
                      >
                        connect@harryclinton.com
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
