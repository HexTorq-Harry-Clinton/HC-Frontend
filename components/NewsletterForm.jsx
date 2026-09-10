"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/api";

// Newsletter signup — duplicates show "already subscribed", never raw errors.
export default function NewsletterForm({ dark = false }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await subscribeNewsletter(email);
      setDone(true);
      setMsg("Thank you for subscribing!");
    } catch (err) {
      setMsg(err.message || "Subscription failed. Please try again.");
    }
  };

  if (done) return <p className={`text-sm ${dark ? "text-gold" : "text-green-700"}`}>{msg}</p>;

  return (
    <form onSubmit={submit}>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className={`flex-1 px-4 py-3 text-sm focus:outline-none ${
            dark ? "bg-neutral-900 text-white placeholder:text-neutral-500" : "border border-neutral-300"
          }`}
        />
        <button className={`px-6 text-sm font-semibold uppercase tracking-widest transition ${dark ? "bg-gold text-neutral-950 hover:bg-white" : "bg-neutral-950 text-white hover:bg-gold hover:text-neutral-950"}`}>
          Join
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-red-500">{msg}</p>}
    </form>
  );
}
