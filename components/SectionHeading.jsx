import Reveal from "./Reveal";

// Section heading: eyebrow + display title + optional sub, centered or left.
// Replaces hand-rolled h2 blocks so every section opens the same way.
export default function SectionHeading({ eyebrow, title, sub, align = "center", dark = false }) {
  const alignCls = align === "center" ? "text-center" : "text-left";
  return (
    <Reveal>
      <div className={alignCls}>
        {eyebrow && (
          <p className={`eyebrow ${dark ? "text-gold" : "text-neutral-500"}`}>{eyebrow}</p>
        )}
        <h2 className={`mt-2 font-display text-4xl font-bold ${dark ? "text-white" : ""}`}>{title}</h2>
        {sub && <p className={`mt-3 ${dark ? "text-neutral-300" : "text-neutral-500"}`}>{sub}</p>}
      </div>
    </Reveal>
  );
}
