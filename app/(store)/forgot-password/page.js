"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// Forgot Password: same structure/texts/flow as the previous UI.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/Auth/Forgot-Password", {
        method: "POST",
        body: { email_id: email, rcu: "website" },
      });
      const data = res?.data || res;
      if (data?.Status === "1" || data?.Status === "true" || data?.Status === true || data?.success === true) {
        setMessage(data?.Message || "Reset instructions sent. Please check your email.");
        setIsError(false);
      } else {
        setMessage(data?.Message || "Could not send reset instructions. Please try again.");
        setIsError(true);
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-neutral-100 px-4 py-14">
      <div className="w-full max-w-md bg-white p-6 shadow-lg" style={{ borderRadius: "12px" }}>
        <h3 className="mb-4 text-center font-display text-3xl font-bold">Forgot Password</h3>
        {message && (
          <div className={`mb-3 p-2 text-center text-sm ${isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}
        <form onSubmit={submit}>
          <label className="mb-1 block text-sm font-medium">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
            className="w-full border border-neutral-900 px-3 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={!email.trim() || loading}
            className="mt-4 w-full bg-neutral-950 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <div className="mt-3 text-center text-sm">
          <Link href="/login" className="underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
