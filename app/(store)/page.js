"use client";

import { useEffect, useState } from "react";
import VideoImageSlider from "@/components/VideoImageSlider";
import OfferBar from "@/components/OfferBar";
import FullWidthVideo from "@/components/FullWidthVideo";
import { Spotlight, StyleByHC } from "@/components/Spotlight";
import HomeFaqs from "@/components/HomeFaqs";
import SplashScreen from "@/components/SplashScreen";
import CategoryShowcase from "@/components/CategoryShowcase";
import FeaturedProducts from "@/components/FeaturedProducts";
import CollectionsEditorial from "@/components/CollectionsEditorial";
import AppointmentCTA from "@/components/AppointmentCTA";
import HomeTestimonials from "@/components/HomeTestimonials";

// Premium landing page: curated section order designed for a luxury menswear brand.
// Original sections (slider, offer bar, video, spotlight, style, FAQs) are preserved.
// New sections add editorial depth: categories, featured products, brand story,
// appointment CTA, and testimonials.
export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Keep the server and first client render identical. Several homepage
  // sections use browser-only animation/media state; mounting them after the
  // hydration boundary prevents React from replacing the whole homepage.
  if (!hydrated) return null;

  return (
    <>
      <SplashScreen />
      <VideoImageSlider />
      <OfferBar />
      <FullWidthVideo />
      <Spotlight />
      <StyleByHC />
      <CategoryShowcase />
      <FeaturedProducts />
      <CollectionsEditorial />
      <AppointmentCTA />
      <HomeTestimonials />
      <HomeFaqs />
    </>
  );
}
