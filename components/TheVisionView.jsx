import Link from "next/link";

// The Vision: full editorial content verbatim from the previous UI.
export default function TheVisionView() {
  return (
    <div>
      <section className="bg-neutral-950 py-20 text-center text-white md:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">HC Presents</p>
        <h1 className="mt-2 font-display text-5xl font-bold md:text-7xl">THE VISION</h1>
        <p className="mt-3 font-display text-2xl italic text-neutral-300">Beyond Sight.</p>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-300">Not every vision begins with sight.</p>
        <p className="mx-auto mt-2 max-w-2xl text-neutral-300">
          A collection created with visually impaired artists who imagine, interpret and express the world in their own unique way.
        </p>
        <p className="mx-auto mt-2 max-w-2xl font-semibold text-white">Their art. Their story. Your style.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
          <span>👁️ Their Imagination Our Prints</span>
          <span>👕 Their Perspective Your Style</span>
          <span>❤️ Every Purchase Creates Impact</span>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="#tv-collection" className="btn-primary !bg-gold !text-neutral-950 hover:!bg-white">
            Explore Collection
          </a>
          <a href="#tv-artists" className="btn-ghost !border-white !text-white hover:!bg-white hover:!text-neutral-950">
            Meet the Artists →
          </a>
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-neutral-400">
          Wear more than fashion. Wear a different way of seeing.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <p className="eyebrow text-neutral-500">About the Vision</p>
        <h2 className="mt-2 font-display text-4xl font-bold">Vision is not limited to what the eyes can see.</h2>
        <p className="mt-4 text-neutral-600">
          For this collection, HC collaborated with visually impaired creators to understand how they imagine the world through touch, sound, memory, emotion, and personal experience.
        </p>
        <p className="mt-3 text-neutral-600">
          Their drawings, sketches, textures, and creative interpretations were transformed into original print designs — turning unseen perspectives into fashion that can be worn, felt, and shared.
        </p>
        <p className="mt-3 font-semibold">This is more than a collection. It is a celebration of imagination beyond sight.</p>
      </section>

      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="eyebrow text-neutral-500">How it Works</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Step no="01." icon="🤝" title="We Collaborate" desc="We open creative sessions with visually impaired artists through art sessions, conversations, sketches and tactile exploration." />
            <Step no="02." icon="✏️" title="They Create" desc="Artists express their imagination through drawings, textures, patterns and emotional storytelling." />
            <Step no="03." icon="👕" title="We Transform" desc="Their original artwork is carefully adapted into functional print designs while preserving the soul of the artist's idea." />
            <Step no="04." icon="🛍️" title="You Wear the Story" desc="Each piece becomes a wearable reminder that creativity has no limits." />
          </div>
        </div>
      </section>

      <section id="tv-collection" className="mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
        <p className="eyebrow text-neutral-500">Featured Collection</p>
        <h2 className="mt-2 font-display text-4xl font-bold">Wear Their Perspective.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
          A collection of shirts, jackets, co-ords, and statement pieces inspired by original artwork from visually impaired creators.
        </p>
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-sm text-neutral-600">
          <li>Artist name</li>
          <li>Artwork title</li>
          <li>Story behind the print</li>
          <li>Impact created through purchase</li>
        </ul>
        <Link href="/new-arrivals" className="btn-primary mt-8">
          Shop the Collection
        </Link>
      </section>

      <section className="bg-ink py-16 text-white md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="eyebrow text-gold">Impact</p>
          <h2 className="mt-2 font-display text-4xl font-bold">Every Purchase Creates Opportunity.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-300">
            Every purchase supports creative opportunities for visually impaired artists through fair collaboration, recognition, and continued artistic engagement.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="border border-neutral-800 p-8">
              <p className="font-display text-xl font-bold">Fair Collaboration</p>
              <p className="mt-2 text-sm text-neutral-400">Artists are compensated fairly and credited for every piece produced.</p>
            </div>
            <div className="border border-neutral-800 p-8">
              <p className="font-display text-xl font-bold">Artistic Recognition</p>
              <p className="mt-2 text-sm text-neutral-400">Their names and stories are shared with every customer who buys.</p>
            </div>
            <div className="border border-neutral-800 p-8">
              <p className="font-display text-xl font-bold">Creative Engagement</p>
              <p className="mt-2 text-sm text-neutral-400">Ongoing workshops keep artists connected, growing and creating.</p>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-2xl font-display text-xl italic leading-relaxed">
            This is not charity. It is partnership. It is fashion built with respect, creativity, and shared purpose. Wear the art. Share the impact.
          </p>
        </div>
      </section>

      <section id="tv-artists" className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <p className="eyebrow text-neutral-500">Artist Stories</p>
        <blockquote className="mt-4 font-display text-3xl italic leading-snug">
          &ldquo;I don&apos;t draw what I see. I draw what I feel.&rdquo;
        </blockquote>
        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-neutral-500">— Artist behind the collection</p>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
          Meet the creators behind the collection. Discover the memories, emotions, sounds, and textures that shaped every print.
        </p>
        <a href="#tv-artists" className="link-sweep mt-6 inline-block text-sm font-semibold">
          Meet the Artists →
        </a>
      </section>

      <section className="bg-neutral-950 py-16 text-center text-white md:py-24">
        <h2 className="font-display text-4xl font-bold md:text-5xl">Beyond Sight. Beyond Fashion.</h2>
        <div className="mx-auto mt-6 max-w-xl space-y-1 font-display text-xl italic text-neutral-300">
          <p>The Vision is an invitation to see differently.</p>
          <p>To wear something meaningful.</p>
          <p>To celebrate creativity with them.</p>
          <p>To turn imagination into impact.</p>
        </div>
        <p className="mt-8 text-sm uppercase tracking-[0.25em] text-gold">Their imagination. Our prints. Your style.</p>
        <div className="mt-6">
          <Link href="/new-arrivals" className="btn-primary !bg-gold !text-neutral-950 hover:!bg-white">
            Explore Collection
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({ no, icon, title, desc }) {
  return (
    <div className="bg-white p-8 shadow-sm">
      <p className="text-3xl">{icon}</p>
      <p className="mt-2 font-display text-lg font-bold">{no} {title}</p>
      <p className="mt-2 text-sm text-neutral-600">{desc}</p>
    </div>
  );
}
