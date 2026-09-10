"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveSession, isAdminRole, throwIfAuthFailed } from "../auth";

// Login: same structure/texts as the previous UI —
// OTP block, "or" divider, password block with eye toggle.
// Admins land on /admin after login, everyone else on /.
export default function LoginPage() {
  const router = useRouter();
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const afterLogin = (roleCode) => {
    router.push(isAdminRole(roleCode) ? "/admin" : "/");
  };

  // Backend OTP endpoints require email_id; when the input looks like a
  // mobile number we also send mobile_number so either lookup can match.
  // email_id is always sent (required) — never dropped.
  const otpIdentity = (value) => {
    const v = (value || "").trim();
    const body = { email_id: v };
    if (/^[+\d][\d\s-]{7,}$/.test(v)) body.mobile_number = v;
    return body;
  };

  const sendOtp = async () => {
    if (!emailOrMobile.trim()) {
      setOtpMessage("Enter email or mobile.");
      return;
    }
    setSendingOtp(true);
    setOtpMessage("");
    try {
      const sent = await apiFetch("/Auth/OTP-Login", { method: "POST", body: otpIdentity(emailOrMobile) });
      throwIfAuthFailed(sent, "Failed to send OTP.");
      setOtpSent(true);
      setOtpMessage("OTP sent! Check your email.");
    } catch (err) {
      setOtpMessage(err.message || "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setOtpMessage("Enter the OTP.");
      return;
    }
    setVerifying(true);
    setOtpMessage("");
    try {
      const res = await apiFetch("/Auth/Verify-Login-OTP", {
        method: "POST",
        body: { ...otpIdentity(emailOrMobile), otp: otp.trim() },
      });
      throwIfAuthFailed(res, "Invalid OTP.");
      afterLogin(saveSession(res));
    } catch (err) {
      setOtpMessage(err.message || "Invalid OTP." || "OTP verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const passwordLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/Auth/Password-Login", {
        method: "POST",
        body: { email_id: email.trim(), password },
      });
      throwIfAuthFailed(res, "Login failed.");
      afterLogin(saveSession(res));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full border border-neutral-300 px-4 py-3 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h2 className="text-center font-display text-4xl font-bold">Login</h2>
      {error && <p className="mt-4 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email or Mobile</span>
          <input value={emailOrMobile} onChange={(e) => setEmailOrMobile(e.target.value)} placeholder="Enter email or mobile number" className={inputCls} />
        </label>
        {otpSent ? (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Enter OTP</span>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP from email" className={inputCls} />
            </label>
            <button onClick={verifyOtp} disabled={verifying} className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {verifying ? "Verifying..." : "Verify OTP & Login"}
            </button>
            <p className="text-center text-sm">
              Didn&apos;t receive?{" "}
              <button onClick={sendOtp} disabled={sendingOtp} className="underline">
                Resend OTP
              </button>
            </p>
          </>
        ) : (
          <button onClick={sendOtp} disabled={sendingOtp} className="w-full border border-neutral-900 py-3 text-sm font-semibold disabled:opacity-50">
            {sendingOtp ? "Sending..." : "Send OTP"}
          </button>
        )}
        {otpMessage && <p className="text-center text-sm text-neutral-600">{otpMessage}</p>}
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-300" />
        <span className="text-sm text-neutral-500">or</span>
        <span className="h-px flex-1 bg-neutral-300" />
      </div>

      <form onSubmit={passwordLogin} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email ID</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
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
        <p className="text-right text-sm">
          <Link href="/forgot-password" className="underline">Forgot password?</Link>
        </p>
        <button disabled={busy} className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Logging in..." : "Login with Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Not a user?{" "}
        <Link href="/register" className="underline">Register</Link>
      </p>
    </div>
  );
}
