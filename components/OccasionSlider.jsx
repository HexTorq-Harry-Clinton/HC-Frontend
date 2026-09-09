"use client";

import { useState } from "react";

// 3-slide carousel with Previous/Next controls — same structure as before.
export default function OccasionSlider({ images }) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  if (total === 0) return null;

  const go = (dir) => setIndex((i) => (i + dir + total) % total);

  return (
    <div id="sliderCarousel" className="relative">
      <div className="overflow-hidden">
        {images.map((src, i) => (
          <div key={i} style={{ display: i === index ? "block" : "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              className="d-block w-100"
              alt={`Slide ${i + 1}`}
              style={{ height: "500px", objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 shadow"
        type="button"
        onClick={() => go(-1)}
      >
        <span aria-hidden="true">‹</span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 shadow"
        type="button"
        onClick={() => go(1)}
      >
        <span aria-hidden="true">›</span>
        <span className="visually-hidden">Next</span>
      </button>
      <style jsx>{`
        .d-block { display: block; }
        .w-100 { width: 100%; }
        .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      `}</style>
    </div>
  );
}
