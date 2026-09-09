"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, Field, useAuthForm, saveSession, apiFetch } from "../auth";

export default function RegisterPage() {
  const { router, error, setError, busy, setBusy } = useAuthForm();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/Auth/Register", {
        method: "POST",
        body: { full_name: fullName, email_id: email, password, rcu: "website" },
      });
      await saveSession(res);
      router.push("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Join the Harry Clinton circle">
      {error && <p className="bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Creating…" : "Register"}
        </button>
      </form>
      <p className="text-center text-sm">Have an account? <Link href="/login" className="underline">Log in</Link></p>
    </AuthShell>
  );
}
