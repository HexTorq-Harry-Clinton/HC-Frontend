import Link from "next/link";

// Breadcrumb trail: Home / Section / Current. One look across category,
// product, static and account pages.
export default function Breadcrumb({ trail = [], dark = false }) {
  const dim = dark ? "text-neutral-400" : "text-neutral-500";
  const strong = dark ? "text-white" : "text-neutral-900";
  return (
    <nav aria-label="Breadcrumb" className={`mx-auto max-w-7xl px-4 pt-6 text-xs uppercase tracking-widest ${dim}`}>
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className={dark ? "link-sweep hover:text-white" : "link-sweep hover:text-neutral-900"}>Home</Link>
        </li>
        {trail.map((t, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-gold">/</span>
            {t.href && i < trail.length - 1 ? (
              <Link href={t.href} className="link-sweep hover:text-neutral-900">{t.label}</Link>
            ) : (
              <span className={strong}>{t.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
