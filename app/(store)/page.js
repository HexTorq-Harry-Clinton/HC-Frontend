import VideoImageSlider from "@/components/VideoImageSlider";
import OfferBar from "@/components/OfferBar";
import FullWidthVideo from "@/components/FullWidthVideo";
import { Spotlight, StyleByHC } from "@/components/Spotlight";
import HomeFaqs from "@/components/HomeFaqs";
import SplashScreen from "@/components/SplashScreen";

export const revalidate = 300;

// Home: exact section order of the previous UI —
// slider, offers, full video, spotlight, style, FAQs.
// (RunningBar + Header + Footer render from the store layout, same as before.)
export default function HomePage() {
  return (
    <>
      <SplashScreen />
      <VideoImageSlider />
      <OfferBar />
      <FullWidthVideo />
      <Spotlight />
      <StyleByHC />
      <HomeFaqs />
    </>
  );
}
