"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, unwrap, resolveUploadUrl } from "@/lib/api";

// Full-bleed brand video with mute toggle — same structure as the previous UI.
// Video comes from the Menu-Video API (backend-served by design).
export default function FullWidthVideo() {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const fetchMenuVideo = async () => {
      try {
        const data = unwrap(await apiFetch("/Menu-Video"));
        const list = Array.isArray(data) ? data : [];
        const activeVideo =
          list.find((v) => v.isactive === 1 || v.isactive === true || v.is_active === 1 || v.is_active === true) ||
          list[0];
        if (live && activeVideo?.video_url) {
          setVideoUrl(resolveUploadUrl(activeVideo.video_url));
          setPosterUrl(resolveUploadUrl(activeVideo.poster_image_url) || "");
        }
      } catch {
        // no video available
      } finally {
        if (live) setLoading(false);
      }
    };
    fetchMenuVideo();
    return () => {
      live = false;
    };
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading video...</span>
        </div>
        <SpinnerStyle />
      </div>
    );
  }

  if (!videoUrl) return null;

  return (
    <div className="video-section relative">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="aspect-video w-full object-cover"
      />
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        className="absolute bottom-4 right-4 rounded-full bg-black/60 px-4 py-2 text-sm text-white hover:bg-black"
      >
        {isMuted ? <i className="bi bi-volume-mute" /> : <i className="bi bi-volume-up" />}
      </button>
      <SpinnerStyle />
    </div>
  );
}

function SpinnerStyle() {
  return (
    <style jsx>{`
      .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius: 50%; animation: sd-spin 0.75s linear infinite; }
      @keyframes sd-spin { to { transform: rotate(360deg); } }
      .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    `}</style>
  );
}
