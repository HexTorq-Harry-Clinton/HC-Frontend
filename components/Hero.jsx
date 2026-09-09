"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// GSAP hero: headline lines slide up on load, media parallaxes on scroll.
export default function Hero({ title, tagline, ctaHref = "#shop" }) {
  const root = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".hero-line", {
        yPercent: 110,
        duration: 1.1,
        stagger: 0.12,
        ease: "power4.out",
      });
      gsap.to(".hero-media", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative flex min-h-[88vh] items-end overflow-hidden bg-neutral-950 text-white">
      <div className="hero-media absolute inset-0 bg-[radial-gradient(ellipse_at_top,#3a3a3a,#0a0a0a_70%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20">
        <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">
          <span className="block overflow-hidden"><span className="hero-line block">{title}</span></span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-neutral-300">
          <span className="block overflow-hidden"><span className="hero-line block">{tagline}</span></span>
        </p>
        <div className="mt-8 overflow-hidden">
          <a href={ctaHref} className="hero-line inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200">
            Shop Now
          </a>
        </div>
      </div>
    </section>
  );
}
