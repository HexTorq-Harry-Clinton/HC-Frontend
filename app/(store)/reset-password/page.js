"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

// Reset Password: same structure/texts/flow as the previous UI.
function ResetInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState(() => params.get("email") || "");
  const [token, setToken] = useState(() => params.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsError(true);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/Auth/Forgot-Password-Confirm", {
        method: "POST",
        body: { email_id: email, transaction_id: token, new_password: password, luu: "website" },
      });
      const data = res?.data || res;
      if (data?.Status === "1" || data?.Status === "true" || data?.Status === true || data?.success === true) {
        setMessage(data?.Message || "Password reset successful. Please login.");
        setIsError(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        setMessage(data?.Message || "Could not reset password. Please try again.");
        setIsError(true);
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-neutral-300 px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-neutral-100 px-4 py-14">
      <div className="w-full max-w-md bg-white p-6 shadow-lg" style={{ borderRadius: "12px" }}>
        <h3 className="mb-4 text-center font-display text-3xl font-bold">Reset Password</h3>
        {message && (
          <div className={`mb-3 p-2 text-center text-sm ${isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}
        <form onSubmit={submit}>
          <label className="mb-1 block text-sm font-medium">Email address</label>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`${inputCls} mb-3`} />
          <label className="mb-1 block text-sm font-medium">Reset Token / Code</label>
          <input type="text" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} required className={`${inputCls} mb-3`} />
          <label className="mb-1 block text-sm font-medium">New Password</label>
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <label className="mb-1 block text-sm font-medium">Confirm New Password</label>
          <div className="relative mb-4">
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
            >
              <i className={showConfirm ? "bi bi-eye-slash" : "bi bi-eye"} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!email.trim() || !token.trim() || !password.trim() || !confirmPassword.trim() || loading}
            className="w-full bg-neutral-950 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <div className="mt-3 text-center text-sm">
          <Link href="/login" className="underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-14 text-center">Loading...</p>}>
      <ResetInner />
    </Suspense>
  );
}
