import VideoImageSlider from "@/components/VideoImageSlider";
import OfferBar from "@/components/OfferBar";
import FullWidthVideo from "@/components/FullWidthVideo";
import { Spotlight, StyleByHC } from "@/components/Spotlight";
import HomeFaqs from "@/components/HomeFaqs";
import SplashScreen from "@/components/SplashScreen";
import CategoryShowcase from "@/components/CategoryShowcase";
import FeaturedProducts from "@/components/FeaturedProducts";
import CraftsmanshipStory from "@/components/CraftsmanshipStory";
import CollectionsEditorial from "@/components/CollectionsEditorial";
import AppointmentCTA from "@/components/AppointmentCTA";
import HomeTestimonials from "@/components/HomeTestimonials";

export const revalidate = 300;

// Premium landing page: curated section order designed for a luxury menswear brand.
// Original sections (slider, offer bar, video, spotlight, style, FAQs) are preserved.
// New sections add editorial depth: categories, featured products, brand story,
// collections, appointment CTA, and testimonials.
export default function HomePage() {
  return (
    <>
      <SplashScreen />
      <VideoImageSlider />
      <OfferBar />
      <FullWidthVideo />
      <Spotlight />
      <CategoryShowcase />
      <FeaturedProducts />
      <CraftsmanshipStory />
      <CollectionsEditorial />
      <StyleByHC />
      <AppointmentCTA />
      <HomeTestimonials />
      <HomeFaqs />
    </>
  );
}
