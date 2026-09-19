"use client";

import { useEffect, useRef, useState } from "react";
import { apiCached, resolveUploadUrl } from "@/lib/api";

// Homepage video section (tbl_menu_videos) — full-viewport, video-only.
// Sits below the running bar. Renders EVERY active row in display_order:
// autoplay / loop / mute_default honored per row, poster before load,
// play-pause + mute controls per screen, prev/next chevrons between screens
// (hero-style, only when 2+ videos).
const on = (v) => v === 1 || v === true;

function VideoScreen({ row, index, total, screenRef, onNav }) {
  const ref = useRef(null);
  const [muted, setMuted] = useState(!row.muteOff);
  const [playing, setPlaying] = useState(!!row.autoplay);
  const [failed, setFailed] = useState(false);

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = ref.current;
    const next = !muted;
    setMuted(next);
    if (v) v.muted = next;
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    if (playing) v.pause();
    else v.play().catch(() => {});
    setPlaying(!playing);
  };

  if (failed) return null;
  return (
    <div ref={screenRef} className="group/vscreen relative h-[100svh] w-full overflow-hidden bg-neutral-950">
      <video
        ref={ref}
        src={row.src}
        poster={row.poster || undefined}
        className="h-full w-full object-cover"
        autoPlay={row.autoplay}
        muted={!row.muteOff}
        loop={row.loop}
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
      <div className="absolute bottom-6 right-5 flex gap-2">
        <button
          type="button"
          aria-label={playing ? "Pause video" : "Play video"}
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-neutral-950/55 text-white backdrop-blur-sm transition-colors hover:border-gold hover:bg-gold hover:text-neutral-950"
        >
          <i className={`bi ${playing ? "bi-pause-fill" : "bi-play-fill"} leading-none`} />
        </button>
        <button
          type="button"
          aria-label={muted ? "Unmute video" : "Mute video"}
          onClick={toggleMute}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-neutral-950/55 text-white backdrop-blur-sm transition-colors hover:border-gold hover:bg-gold hover:text-neutral-950"
        >
          <i className={`bi ${muted ? "bi-volume-mute-fill" : "bi-volume-up-fill"} leading-none`} />
        </button>
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous video"
            onClick={(e) => { e.stopPropagation(); onNav(-1); }}
            className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-neutral-950/55 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:border-gold hover:bg-gold hover:text-neutral-950 focus-visible:opacity-100 group-hover/vscreen:opacity-100"
          >
            <i className="bi bi-chevron-left text-lg leading-none" />
          </button>
          <button
            type="button"
            aria-label="Next video"
            onClick={(e) => { e.stopPropagation(); onNav(1); }}
            className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-neutral-950/55 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:border-gold hover:bg-gold hover:text-neutral-950 focus-visible:opacity-100 group-hover/vscreen:opacity-100"
          >
            <i className="bi bi-chevron-right text-lg leading-none" />
          </button>
        </>
      )}
    </div>
  );
}

const isUnrelatedVideo = (url) => {
  if (!url) return true;
  const s = String(url).toLowerCase();
  return (
    s.includes("example.com") ||
    s.includes("w3schools") ||
    s.includes("mov_bbb") ||
    s.includes("bunny") ||
    s.includes("sample") ||
    s.includes("test")
  );
};

export default function FullWidthVideo() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const screensRef = useRef([]);

  useEffect(() => {
    let live = true;
    apiCached("/Menu-Video")
      .then((data) => {
        const list = (Array.isArray(data) ? data : [])
          .filter((v) => on(v.isactive ?? v.is_active) && !v.isdeleted && v.video_url)
          .filter((v) => !isUnrelatedVideo(v.video_url))
          .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
          .map((v) => ({
            id: v.menu_video_id,
            src: resolveUploadUrl(v.video_url),
            poster: resolveUploadUrl(v.poster_image_url) || "",
            autoplay: v.autoplay === 0 || v.autoplay === false ? false : true,
            loop: v.loop_video === 0 || v.loop_video === false ? false : true,
            muteOff: v.mute_default === 0 || v.mute_default === false,
          }))
          .filter((v) => v.src && !isUnrelatedVideo(v.src));
        if (live && list.length > 0) setRows(list);
        else if (live) {
          // Fallback to client luxury menswear video
          setRows([{
            id: 'local-luxury',
            src: '/brand/luxury-wedding-home.mp4',
            poster: '',
            autoplay: true,
            loop: true,
            muteOff: false,
          }]);
        }
      })
      .catch(() => {
        // Fallback to client luxury menswear video
        if (live) setRows([{
          id: 'local-luxury',
          src: '/brand/luxury-wedding-home.mp4',
          poster: '',
          autoplay: true,
          loop: true,
          muteOff: false,
        }]);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  if (loading) return null;
  if (rows.length === 0) return null;
  const goScreen = (from, dir) => {
    const el = screensRef.current[(from + dir + rows.length) % rows.length];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      {rows.map((r, i) => (
        <VideoScreen
          key={r.id}
          row={r}
          index={i}
          total={rows.length}
          screenRef={(el) => {
            screensRef.current[i] = el;
          }}
          onNav={(dir) => goScreen(i, dir)}
        />
      ))}
    </>
  );
}
