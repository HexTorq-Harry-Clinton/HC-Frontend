"use client";

import { useEffect } from "react";
import Link from "next/link";

// Root error boundary. Before this existed, ANY render error in a route
// (e.g. a product page hitting unexpected data) escaped as a raw 500 with
// no recovery path. This renders a branded fallback and offers a retry.
//
// Note: this only catches errors in page/component renders — errors thrown
// by a layout need app/global-error.js.
export default function Error({ error, reset }) {
  useEffect(() => {
    // Logged to the server runtime so the stack is retrievable in Vercel logs.
    console.error("route render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-5xl font-bold tracking-tight">Something went wrong</p>
      <p className="mt-3 max-w-md text-neutral-500">
        We couldn&rsquo;t load this page. Please try again — if the problem persists, browse our latest collection instead.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Try again
        </button>
        <Link href="/" className="border border-neutral-300 px-6 py-3 text-sm font-semibold transition hover:border-neutral-900">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
