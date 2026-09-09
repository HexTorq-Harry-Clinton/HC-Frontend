import Link from "next/link";
import { PLACEHOLDER_IMAGE } from "./ProductCard";

// ONE empty state for the whole store: image + title + text + optional CTA.
// Props: title, text, actionHref, actionLabel, compact (plain line for small slots).
export default function EmptyState({ title, text, actionHref, actionLabel, compact = false }) {
  if (compact) {
    return <p className="mt-6 text-sm text-neutral-500">{text || title}</p>;
  }
  return (
    <div className="py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PLACEHOLDER_IMAGE} alt="" aria-hidden className="mx-auto w-28 opacity-70" />
      <h3 className="mt-4 font-display text-2xl">{title}</h3>
      {text && <p className="mt-2 text-sm text-neutral-500">{text}</p>}
      {actionHref && (
        <Link href={actionHref} className="mt-6 inline-block bg-neutral-950 px-8 py-3 text-sm font-semibold text-white">
          {actionLabel || "Explore"}
        </Link>
      )}
    </div>
  );
}
