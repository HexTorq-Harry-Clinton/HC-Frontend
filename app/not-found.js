import Link from "next/link";
import Image from "next/image";

// Root 404 boundary. Without this, notFound() thrown anywhere under app/
// had no boundary to render and the whole request degraded to a 500.
// Kept dependency-free and static on purpose: it must render even when the
// backend is slow/unreachable, otherwise a bad link takes down the request.
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Image src="/brand/logo-black.png" alt="Harry Clinton" width={180} height={48} className="mx-auto" priority />
      <p className="mt-8 font-display text-6xl font-bold tracking-tight">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">Page Not Found</h1>
      <p className="mt-3 max-w-md text-neutral-500">
        The page you are looking for may have been moved or is no longer available.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
          Back to Home
        </Link>
        <Link href="/suits" className="border border-neutral-300 px-6 py-3 text-sm font-semibold transition hover:border-neutral-900">
          Browse Suits
        </Link>
      </div>
    </div>
  );
}
