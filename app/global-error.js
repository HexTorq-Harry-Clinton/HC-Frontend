"use client";

// Global error fallback: same texts as the previous UI.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
        <div>
          <h4 className="font-display text-2xl font-bold">Something went wrong.</h4>
          <p className="mt-2 text-sm text-neutral-500">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => (reset ? reset() : window.location.reload())}
            className="mt-5 bg-neutral-950 px-6 py-2 text-sm font-semibold text-white"
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
