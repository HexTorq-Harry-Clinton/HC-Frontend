"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

// Newsletter signup wired to /Newsletter-Subscriptions. Used in footer + home.
export default function NewsletterForm({ dark = false }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await apiFetch("/Newsletter-Subscriptions", {
        method: "POST",
        body: { email_id: email, rcu: "website" },
      });
      setDone(true);
      setMsg("Welcome to the circle. Watch your inbox.");
    } catch (err) {
      setMsg(err.message || "Could not subscribe. Try again.");
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
