"use client";

import { useState } from "react";
import { AuthShell, Field, useAuthForm, apiFetch } from "../auth";

export default function ResetPasswordPage() {
  const { router, error, setError, busy, setBusy } = useAuthForm();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiFetch("/Auth/Forgot-Password-Confirm", {
        method: "POST",
        body: { email_id: email, transaction_id: token, new_password: password },
      });
      router.push("/login");
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Set new password">
      {error && <p className="bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Reset token" required value={token} onChange={(e) => setToken(e.target.value)} />
        <Field label="New password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Saving…" : "Save Password"}
        </button>
      </form>
    </AuthShell>
  );
}
