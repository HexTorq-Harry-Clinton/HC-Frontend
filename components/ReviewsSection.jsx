"use client";

import { useState } from "react";
import { apiFetch, currentUserId } from "@/lib/api";

// Reviews: same structure/texts as the previous UI —
// "Customer Reviews", average + stars + count, author/date cards,
// login-gated "Write a Review" form with labelled fields.
export default function ReviewsSection({ productId, initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [loading] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const avg =
    reviews.length > 0
      ? reviews.reduce((n, r) => n + Number(r.rating || 0), 0) / reviews.length
      : 0;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const userId = currentUserId();
    if (!userId) {
      setMsg("Please log in to write a review.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch("/Reviews", {
        method: "POST",
        body: {
          product_id: productId, variant_id: null, user_id: userId,
          rating: Number(rating), review_title: title, review_text: text,
          is_verified: 1, rcu: "website",
        },
      });
      const created = res?.data || res;
      const list = unwrapList(await apiFetch("/Reviews").catch(() => []));
      const mine = (Array.isArray(list) ? list : []).filter((r) => r.product_id === productId);
      if (mine.length > 0) setReviews(mine);
      else if (created?.review_id) setReviews((r) => [created, ...r]);
      setTitle("");
      setText("");
      setRating(5);
      setMsg("Review submitted successfully.");
    } catch (err) {
      setMsg(err.message || "Failed to submit review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <h3 className="font-display text-3xl font-bold">Customer Reviews</h3>
      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Loading reviews...</p>
      ) : (
        <>
          {reviews.length > 0 && (
            <p className="mt-2 text-sm text-neutral-500">
              <span className="font-bold text-neutral-900">{avg.toFixed(1)}</span>{" "}
              <span className="text-gold">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</span>{" "}
              Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          )}
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No reviews yet. Be the first to review this product.</p>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.review_id} className="border border-neutral-200 p-5">
                  <p className="text-gold">
                    {"★".repeat(Math.min(Number(r.rating) || 5, 5))}
                    {"☆".repeat(5 - Math.min(Number(r.rating) || 5, 5))}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {r.user_name || "Verified Buyer"}
                    {r.created_at ? ` • ${new Date(r.created_at).toLocaleDateString("en-IN")}` : ""}
                  </p>
                  <h5 className="mt-1 font-semibold">{r.review_title}</h5>
                  <p className="mt-1 text-sm text-neutral-600">{r.review_text}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="mt-8 max-w-xl border border-neutral-200 p-6">
        <h4 className="font-semibold">Write a Review</h4>
        {msg && <p className="mt-2 text-sm text-neutral-600">{msg}</p>}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Rating</span>
            <select value={rating} onChange={(e) => setRating(e.target.value)} className="w-full border border-neutral-300 px-3 py-2 text-sm">
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Poor</option>
              <option value={1}>1 - Terrible</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-neutral-300 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Review</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} required rows="4" className="w-full border border-neutral-300 px-3 py-2 text-sm" />
          </label>
          <button disabled={busy} className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </section>
  );
}

function unwrapList(res) {
  return res?.data?.data || res?.data || res || [];
}
