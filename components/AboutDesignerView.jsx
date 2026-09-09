// About the Designer: story bullets verbatim from the previous UI.
export default function AboutDesignerView() {
  return (
    <div>
      <section className="bg-neutral-950 py-20 text-center text-white md:py-28">
        <h1 className="font-display text-5xl font-bold md:text-6xl">About Us</h1>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-14 md:py-20">
        <h2 className="text-center font-display text-4xl font-bold">The Story of Harry Clinton</h2>
        <ul className="mt-8 space-y-5 text-neutral-600">
          <li className="flex gap-3">
            <span className="text-gold">✦</span>
            Harry Clinton is more than a brand — it is a journey shaped by passion, precision, and purpose.
          </li>
          <li className="flex gap-3">
            <span className="text-gold">✦</span>
            I began designing at the age of 18, driven not by trends but by instinct. Fabric, fit, and form were never just garments to me; they were expressions of identity.
          </li>
          <li className="flex gap-3">
            <span className="text-gold">✦</span>
            Over the past decade, I have styled more than 5,000 weddings, created original collections, and earned the trust of men on the most important days of their lives.
          </li>
          <li className="flex gap-3">
            <span className="text-gold">✦</span>
            Harry Clinton stands for men who lead with quiet confidence — where every stitch tells a story and every piece is built for legacy.
          </li>
        </ul>
      </section>
    </div>
  );
}
