"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

// Reviews for a product: server-rendered list + client submit form.
export default function ReviewsSection({ productId, initialReviews, summary }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [msg, setMsg] = useState("");

  const avg = summary?.average_rating || summary?.avg_rating ||
    (reviews.length > 0
      ? (reviews.reduce((n, r) => n + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
      : null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await apiFetch("/Reviews", {
        method: "POST",
        body: {
          product_id: productId, rating: Number(rating),
          review_title: title, review_text: text,
          is_verified: false, is_approved: false, rcu: "website",
        },
      });
      const created = res?.data || res;
      if (created?.review_id) setReviews((r) => [created, ...r]);
      setTitle("");
      setText("");
      setRating(5);
      setMsg("Thanks! Your review is awaiting moderation.");
    } catch (err) {
      setMsg(err.message || "Could not submit review.");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <h2 className="font-display text-3xl font-bold">
        Reviews {avg ? <span className="text-lg text-neutral-500">★ {avg}</span> : null}
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No reviews yet — be the first.</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <li key={r.review_id} className="border border-neutral-200 p-5">
              <p className="text-sm font-bold">★ {r.rating} — {r.review_title || "Review"}</p>
              <p className="mt-2 text-sm text-neutral-600">{r.review_text}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-8 max-w-xl space-y-3 border border-neutral-200 p-6">
        <p className="font-semibold">Write a review</p>
        {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        <div className="flex items-center gap-2 text-sm">
          <span>Rating</span>
          <select value={rating} onChange={(e) => setRating(e.target.value)} className="border border-neutral-300 px-2 py-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} ★</option>
            ))}
          </select>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full border border-neutral-300 px-3 py-2 text-sm" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} required placeholder="Your review" rows={3} className="w-full border border-neutral-300 px-3 py-2 text-sm" />
        <button className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white">Submit Review</button>
      </form>
    </section>
  );
}
