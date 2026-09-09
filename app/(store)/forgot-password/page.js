"use client";

import { useState } from "react";
import { AuthShell, Field, useAuthForm, apiFetch } from "../auth";

export default function ForgotPasswordPage() {
  const { error, setError, busy, setBusy } = useAuthForm();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiFetch("/Auth/Forgot-Password", { method: "POST", body: { email_id: email } });
      setSent(true);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We will email you a reset link">
      {error && <p className="bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {sent ? (
        <p className="bg-green-50 p-3 text-sm text-green-700">If the email exists, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={busy} className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
