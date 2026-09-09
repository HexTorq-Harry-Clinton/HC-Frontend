"use client";

import { useRouter } from "next/navigation";

// Guest nudge: same texts/flow as the previous UI.
export default function LoginPopup({ onSkip }) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center bg-black/55 p-4"
      onClick={onSkip}
    >
      <div
        className="w-full max-w-md bg-white p-8 text-center shadow-xl"
        style={{ borderRadius: "12px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-3xl font-bold">Welcome to Harry Clinton</h2>
        <p className="mt-3 text-sm text-neutral-500">
          Login to enjoy a personalised experience, save addresses, and track your orders.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="btn-primary mt-6 w-full"
        >
          Login / Register
        </button>
        <button onClick={onSkip} className="mt-3 text-sm text-neutral-500 underline">
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
