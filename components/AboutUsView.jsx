import Link from "next/link";

// About Us: full content verbatim from the previous UI.
export default function AboutUsView() {
  return (
    <div>
      <section className="bg-neutral-950 py-20 text-center text-white md:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Est. in Pursuit of Perfection</p>
        <h1 className="mx-auto mt-2 max-w-4xl font-display text-5xl font-bold leading-tight md:text-7xl">
          Where Bespoke<br />Meets Soul.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-300">
          Harry Clinton is not a label. It is a declaration of men&apos;s bold craftsmanship, timeless design, and personal touch.
        </p>
        <Link href="/about-designer" className="btn-primary mt-8 !bg-gold !text-neutral-950 hover:!bg-white">
          Discover the Story
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          <Stat value="12+" label="Years of Craft" />
          <Stat value="2400+" label="Bespoke Pieces" />
          <Stat value="98%" label="Client Satisfaction" />
          <Stat value="6" label="Design Awards" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 text-center">
        <p className="eyebrow text-neutral-500">The Man Behind the Brand</p>
        <h2 className="mt-2 font-display text-4xl font-bold">Harry Clinton</h2>
        <p className="mx-auto mt-4 max-w-3xl text-neutral-600">
          A timeless menswear designer focused on refined craftsmanship. My work blends modern silhouettes with rich Italian tailoring traditions, delivering elegance with a bold personal touch. Every collection begins with a conversation and ends with a garment that defines the person who wears it.
        </p>
        <p className="mt-4 font-display text-xl italic">&ldquo;Design isn&apos;t just what I do — it&apos;s who I am.&rdquo;</p>
        <Link href="/about-designer" className="link-sweep mt-6 inline-block text-sm font-semibold">
          Full Story →
        </Link>
      </section>

      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2">
          <div className="flex min-h-72 items-center justify-center bg-neutral-950 p-10 text-center text-white">
            <div>
              <p className="eyebrow text-gold">The Atelier</p>
              <p className="mt-2 font-display text-2xl">Where It All Happens</p>
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold">Our Studio</h2>
            <p className="mt-4 text-neutral-600">
              Step inside the atelier — a space where fabric meets form. Our studio in Chennai is the beating heart of Harry Clinton, where every measurement, every cut, and every drape is handled with obsessive precision by our master tailors. From hand-stitched lapels to custom lining choices, the atelier experience is personal, unhurried, and utterly unique.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2">
          <div className="md:order-2">
            <div className="flex min-h-72 items-center justify-center bg-neutral-950 p-10 text-center text-white">
              <div>
                <p className="eyebrow text-gold">The Craft</p>
                <p className="mt-2 font-display text-2xl">Our Process</p>
              </div>
            </div>
          </div>
          <div className="md:order-1">
            <h2 className="font-display text-4xl font-bold">Craft & Detail</h2>
            <p className="mt-4 text-neutral-600">
              We source only the finest fabrics — Italian wools, Irish linens, and artisan silks — before a single cut is made. Each garment goes through a minimum of three fittings to ensure a silhouette that moves with you, not against you. The result is a piece that lasts decades, not seasons.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <p className="eyebrow text-center text-neutral-500">What We Stand For</p>
        <h2 className="mt-2 text-center font-display text-4xl font-bold">Our Values</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard title="Craftsmanship" desc="Every stitch is placed with intention. We never compromise on construction quality." />
          <ValueCard title="Excellence" desc="Award-winning garments recognised across top fashion publications and editorials." />
          <ValueCard title="Personal Touch" desc="Each piece is tailored to the individual — your fit, your story, your statement." />
          <ValueCard title="Integrity" desc="Transparent pricing, honest timelines, and a brand you can genuinely trust." />
        </div>
      </section>

      <section className="overflow-hidden border-y border-neutral-200 bg-white">
        <p className="pt-4 text-center text-xs uppercase tracking-[0.3em] text-neutral-500">As seen in & worn by</p>
        <div className="animate-marquee py-4">
          {Array(4).fill(["GQ", "·", "VOGUE", "·", "ESQUIRE", "·", "HARRY CLINTON", "·"]).flat().map((w, i) => (
            <span key={i} className="mx-6 font-display text-2xl text-neutral-300">{w}</span>
          ))}
        </div>
      </section>

      <section className="bg-neutral-950 py-16 text-center text-white md:py-24">
        <h2 className="font-display text-4xl font-bold md:text-5xl">Heritage. Craft. Identity.</h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-300">Committed to timeless tailoring since the very first stitch.</p>
        <Link href="/about-designer" className="btn-primary mt-8 !bg-gold !text-neutral-950 hover:!bg-white">
          Meet the Designer
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <p className="eyebrow text-center text-neutral-500">The People</p>
        <h2 className="mt-2 text-center font-display text-4xl font-bold">Our Team</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TeamCard name="Rajkumar" role="Head Designer" />
          <TeamCard name="Mounika" role="Operations Lead" />
          <TeamCard name="Sabarish" role="Master Tailor" />
          <TeamCard name="Suganthi" role="Client Relations" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 text-center md:pb-24">
        <h2 className="font-display text-4xl font-bold">Our Story</h2>
        <p className="mt-3 text-neutral-500">Dedicated to craftsmanship and timeless elegance since day one.</p>
        <button className="btn-ghost mt-6">Read Our Story</button>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="border border-neutral-200 p-6">
      <p className="font-display text-4xl font-bold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</p>
    </div>
  );
}

function ValueCard({ title, desc }) {
  return (
    <div className="border border-neutral-200 p-8">
      <p className="font-display text-xl font-bold">{title}</p>
      <p className="mt-2 text-sm text-neutral-600">{desc}</p>
    </div>
  );
}

function TeamCard({ name, role }) {
  return (
    <div className="border border-neutral-200 p-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 font-display text-2xl">
        {name.charAt(0)}
      </div>
      <p className="mt-3 font-semibold">{name}</p>
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{role}</p>
    </div>
  );
}
