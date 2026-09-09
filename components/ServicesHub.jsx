import Link from "next/link";

// Services hub: the four atelier services.
const SERVICES = [
  { href: "/embroidery", title: "Embroidery", note: "Crafted with Precision. Stitched with Passion." },
  { href: "/alterations", title: "Alterations", note: "Tailored to Fit. Perfected for You." },
  { href: "/personal-styling", title: "Personal Styling", note: "Curated Looks. Confident You." },
  { href: "/custom-tailoring", title: "Custom Tailoring", note: "Bespoke Garments. Made for You." },
];

export default function ServicesHub() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <p className="eyebrow text-center text-neutral-500">HC Atelier Services</p>
      <h1 className="mt-2 text-center font-display text-5xl font-bold">Our Services</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-neutral-500">
        Crafted with Precision. Designed for You.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <Link key={s.href} href={s.href} className="group border border-neutral-200 bg-neutral-950 p-10 text-white transition-colors hover:border-gold">
            <h2 className="font-display text-3xl font-bold group-hover:text-gold">{s.title}</h2>
            <p className="mt-2 text-sm text-neutral-400">{s.note}</p>
            <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gold">Discover →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
