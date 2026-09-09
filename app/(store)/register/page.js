"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

// Register: same structure/texts as the previous UI —
// Full Name, Email, Mobile, Password, policy checkbox gate.
export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = fullName.trim() && email.trim() && mobile.trim() && password && acceptPolicy;

  const submit = async (e) => {
    e.preventDefault();
    if (!acceptPolicy) {
      setError("Please accept Privacy Policy & Terms");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/Auth/Register", {
        method: "POST",
        body: {
          full_name: fullName.trim(),
          email_id: email.trim(),
          mobile_number: mobile.trim(),
          password,
          rcu: "website",
        },
      });
      setError(res?.Message || "Registration successful!");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full border border-neutral-300 px-4 py-3 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h3 className="text-center font-display text-4xl font-bold">Register</h3>
      {error && <p className="mt-4 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Full Name</span>
          <input name="full_name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" required className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Mobile</span>
          <input type="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Enter your mobile number" required className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
            >
              <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} />
            </button>
          </div>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input id="policy" type="checkbox" checked={acceptPolicy} onChange={(e) => setAcceptPolicy(e.target.checked)} className="mt-1" />
          <span>
            Accept{" "}
            <Link href="/privacy-policy" target="_blank" className="underline">Privacy</Link>
            {" & "}
            <Link href="/terms-and-conditions" target="_blank" className="underline">Terms</Link>
          </span>
        </label>
        <button disabled={busy || !valid} className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Creating..." : "Register"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">Login</Link>
      </p>
    </div>
  );
}
