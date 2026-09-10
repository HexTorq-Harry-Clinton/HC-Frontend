/**
 * @deprecated Unused reference — do not import.
 * Home video is served by FullWidthVideo.jsx (Menu-Video API + mute toggle).
 * Kept for reference only.
 */
import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import Reveal from "./Reveal";

// Full-width brand video section, driven by the Menu-Video API.
// Videos stream from the backend/CDN — never bundled.
export default async function HomeVideo() {
  let videos = [];
  try {
    videos = unwrap(await apiGet("/Menu-Video"));
  } catch {
    videos = [];
  }
  const active = videos.find((v) => v.isactive !== false);
  const src = resolveUploadUrl(active?.video_url || active?.media_url);
  if (!src) return null;

  return (
    <section className="bg-neutral-950 py-16 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-bold">
            {active?.title || "The House"}
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <video
            src={src}
            className="aspect-video w-full object-cover"
            autoPlay loop muted playsInline preload="none"
          />
        </Reveal>
      </div>
    </section>
  );
}
