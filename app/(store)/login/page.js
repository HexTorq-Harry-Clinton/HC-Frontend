"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, Field, useAuthForm, saveSession, apiFetch } from "../auth";

export default function LoginPage() {
  const { router, error, setError, busy, setBusy } = useAuthForm();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/Auth/Password-Login", { method: "POST", body: { email_id: email, password } });
      await saveSession(res);
      router.push("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Harry Clinton account">
      {error && <p className="bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Logging in…" : "Log In"}
        </button>
      </form>
      <div className="flex justify-between text-sm">
        <Link href="/register" className="underline">Create account</Link>
        <Link href="/forgot-password" className="underline">Forgot password?</Link>
      </div>
    </AuthShell>
  );
}
