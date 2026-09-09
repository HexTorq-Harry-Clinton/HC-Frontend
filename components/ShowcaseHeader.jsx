import Reveal from "./Reveal";

// ONE showcase header for all browse pages: centered eyebrow + display title + sub.
// Props: eyebrow, title, sub, dark (category banner variant).
export default function ShowcaseHeader({ eyebrow = "Harry Clinton", title, sub, dark = false }) {
  if (dark) {
    return (
      <section className="bg-neutral-950 py-20 text-center text-white">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">{eyebrow}</p>
          <h1 className="mt-2 font-display text-5xl font-bold">{title}</h1>
          {sub && <p className="mx-auto mt-3 max-w-xl text-neutral-300">{sub}</p>}
        </Reveal>
      </section>
    );
  }
  return (
    <Reveal>
      <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">{eyebrow}</p>
      <h1 className="mt-2 text-center font-display text-5xl font-bold">{title}</h1>
      {sub && <p className="mt-3 text-center text-neutral-500">{sub}</p>}
    </Reveal>
  );
}
