import Link from "next/link";
import { Fragment } from "react";
import { apiGet, unwrap } from "@/lib/api";

const COMMON_SERVICE_GALLERY = [
  "/service-media/Wedding.jpeg",
  "/service-media/TravelNew.jpeg",
  "/service-media/SmartCasual.jpeg",
  "/service-media/LabelNew.jpeg",
  "/service-media/Business.jpeg",
  "/service-media/Designer.jpeg",
];

const SERVICE_MEDIA = {
  embroidery: {
    hero: "/service-media/vision1.jpeg",
    about: "/service-media/vision_title.jpeg",
    services: ["/service-media/LabelNew2.jpeg", "/service-media/WeddingNew.jpeg"],
    cta: "/service-media/DesignerNew.jpeg",
    gallery: COMMON_SERVICE_GALLERY,
  },
  alterations: {
    hero: "/service-media/vision1.jpeg",
    about: "/service-media/vision_title.jpeg",
    services: ["/service-media/LabelNew2.jpeg", "/service-media/WeddingNew.jpeg"],
    cta: "/service-media/DesignerNew.jpeg",
    gallery: COMMON_SERVICE_GALLERY,
  },
  "personal-styling": {
    hero: "/service-media/vision1.jpeg",
    about: "/service-media/vision_title.jpeg",
    services: ["/service-media/SmartCasualNew.jpeg", "/service-media/TravelNew.jpeg"],
    cta: "/service-media/DesignerNew.jpeg",
    gallery: COMMON_SERVICE_GALLERY,
  },
  "custom-tailoring": {
    hero: "/service-media/vision1.jpeg",
    about: "/service-media/vision_title.jpeg",
    services: ["/service-media/Wedding.jpeg", "/service-media/DesignerNew.jpeg"],
    cta: "/service-media/DesignerNew.jpeg",
    gallery: COMMON_SERVICE_GALLERY,
  },
};

function EmbroideryPage({ hero, about, experience, services, why, gallery, process, testimonials, cta, media }) {
  return (
    <div className="embroidery-page">
      <section className="ep-hero-landing">
        <img src={hero.image || media.hero} alt={hero.title} className="ep-hero-landing__bg" />
        <div className="ep-hero-landing__overlay" />
        <div className="ep-hero-landing__content">
          <p className="ep-hero-landing__eyebrow">{hero.eyebrow}</p>
          <h1 className="ep-hero-landing__title">{hero.title}</h1>
          <p className="ep-hero-landing__subtitle">{hero.subtitle}</p>
          <p className="ep-hero-landing__body">{hero.body}</p>
          <Link href="/book-appointment" className="ep-hero-landing__btn">{hero.cta}</Link>
        </div>
      </section>

      <section className="ep-about-split">
        <div className="ep-about-split__img-wrap"><img src={about.image || media.about} alt={about.title} className="ep-about-split__img" /></div>
        <div className="ep-about-split__body">
          <p className="ep-section__label">{about.label}</p>
          <h2 className="ep-section__title">{about.title}</h2>
          <div className="ep-about-divider" />
          <p className="ep-about-split__desc">{about.desc}</p>
        </div>
      </section>

      <section className="ep-experience">
        <p className="ep-section__label">{experience.label}</p>
        <h2 className="ep-section__title" style={{ color: "#fff" }}>{experience.title}</h2>
        <div className="ep-experience__grid">{experience.cards.map((c) => <div className="ep-experience__card" key={c.label}><span className="ep-experience__icon">{c.icon}</span><p className="ep-experience__stat">{c.stat}</p><p className="ep-experience__label">{c.label}</p></div>)}</div>
      </section>

      <section className="ep-section" style={{ paddingBottom: "1rem" }}><p className="ep-section__label">{services.label}</p><h2 className="ep-section__title">{services.title}</h2></section>
      <section className="ep-services">{services.items.map((service, i) => <div className="ep-service-card" key={service.title}><img src={service.img || media.services[i]} alt={service.title} className="ep-service-card__img" /><div className="ep-service-card__overlay" /><div className="ep-service-card__content"><p className="ep-service-card__label">{service.label}</p><h3 className="ep-service-card__title">{service.title}</h3><ul className="ep-service-card__list">{service.points.map((point) => <li key={point}>{point}</li>)}</ul><Link href="/book-appointment" className="ep-service-card__btn">{service.cta}</Link></div></div>)}</section>

      <section className="ep-why"><p className="ep-section__label">{why.label}</p><h2 className="ep-section__title">{why.title}</h2><div className="ep-why__grid">{why.cards.map((card) => <div className="ep-why__card" key={card.title}><span className="ep-why__icon">{card.icon}</span><p className="ep-why__title">{card.title}</p><p className="ep-why__desc">{card.desc}</p></div>)}</div></section>

      <section className="ep-section" style={{ paddingBottom: "1rem" }}><p className="ep-section__label">{gallery.label}</p><h2 className="ep-section__title">{gallery.title}</h2></section>
      <section className="ep-gallery">{gallery.items.map((item, i) => <div className={`ep-gallery__item${item.wide ? " ep-gallery__item--wide" : ""}${item.tall ? " ep-gallery__item--tall" : ""}`} key={item.caption}><img src={item.img || media.gallery[i]} alt={item.caption} className="ep-gallery__img" /><div className="ep-gallery__overlay"><p className="ep-gallery__caption">{item.caption}</p></div></div>)}</section>

      <section className="ep-process"><p className="ep-section__label">{process.label}</p><h2 className="ep-section__title">{process.title}</h2><div className="ep-process__timeline">{process.steps.map((step, i) => <Fragment key={step.label}><div className="ep-process__step"><div className="ep-process__circle">{step.no}</div><p className="ep-process__label">{step.label}</p></div>{i < process.steps.length - 1 && <span className="ep-process__arrow">↓</span>}</Fragment>)}</div></section>

      <section className="ep-testimonials"><p className="ep-section__label">{testimonials.label}</p><h2 className="ep-section__title">{testimonials.title}</h2><div className="ep-testimonials__grid">{testimonials.items.map((item) => <div className="ep-testimonial" key={item.name}><p className="ep-testimonial__quote">&quot;{item.quote}&quot;</p><div className="ep-testimonial__author"><img src={item.avatar || "/service-media/HC-Logo-Golden.PNG"} alt={item.name} className="ep-testimonial__avatar" /><div><p className="ep-testimonial__name">{item.name}</p><p className="ep-testimonial__role">{item.role}</p></div></div></div>)}</div></section>

      <section className="ep-cta-banner"><img src={cta.image || media.cta} alt={hero.title} className="ep-cta-banner__bg" /><div className="ep-cta-banner__overlay" /><div className="ep-cta-banner__content"><h2 className="ep-cta-banner__title">{cta.title}</h2><p className="ep-cta-banner__sub">{cta.sub}</p><Link href="/book-appointment" className="ep-hero-landing__btn">{cta.button}</Link></div></section>
    </div>
  );
}

// Service editorial page: same section order/content as the previous UI —
// hero, about, experience, services, why, gallery, process, testimonials, CTA.
// Copy overridable via Settings (`{serviceKey}_*`) and Legal sections.
export default async function ServicePage({ config }) {
  const [settings, sections] = await Promise.all([
    apiGet("/Settings").then(unwrap).catch(() => []),
    apiGet("/Legal-Page-Sections").then(unwrap).catch(() => []),
  ]);
  const settingsList = Array.isArray(settings) ? settings : [];
  const sectionsList = Array.isArray(sections) ? sections : [];
  const defs = config.defaults;
  const key = config.serviceKey;

  const s = (suffix) => {
    const m = settingsList.find(
      (x) => x.setting_key?.toLowerCase() === `${key}_${suffix}` || x.key?.toLowerCase() === `${key}_${suffix}`
    );
    return m?.setting_value ?? m?.value ?? "";
  };
  const sec = (title) => {
    const m = sectionsList.find((x) => x.section_title?.toLowerCase() === title.toLowerCase());
    return m?.content || "";
  };
  const parsed = (suffix, fallback) => {
    const raw = s(suffix);
    if (!raw) return fallback;
    try {
      const p = JSON.parse(raw);
      return p || fallback;
    } catch {
      return fallback;
    }
  };

  const hero = {
    image: s("hero_image") || defs.hero.image,
    eyebrow: s("hero_eyebrow") || sec("Hero Eyebrow") || defs.hero.eyebrow,
    title: s("hero_title") || sec("Hero Title") || defs.hero.title,
    subtitle: s("hero_subtitle") || sec("Hero Subtitle") || defs.hero.subtitle,
    body: s("hero_body") || sec("Hero Body") || defs.hero.body,
    cta: s("hero_cta") || sec("Hero CTA") || defs.hero.cta,
  };
  const about = {
    image: s("about_image") || defs.about.image,
    label: s("about_label") || sec("About Label") || defs.about.label,
    title: s("about_title") || sec("About Title") || defs.about.title,
    desc: s("about_desc") || sec("About Description") || defs.about.desc,
  };
  const experience = {
    label: s("experience_label") || sec("Experience Label") || defs.experience.label,
    title: s("experience_title") || sec("Experience Title") || defs.experience.title,
    cards: parsed("experience_cards", defs.experience.cards),
  };
  const services = {
    label: s("services_label") || sec("Services Label") || defs.services.label,
    title: s("services_title") || sec("Services Title") || defs.services.title,
    items: parsed("services", defs.services.items),
  };
  const why = {
    label: s("why_label") || sec("Why Label") || defs.why.label,
    title: s("why_title") || sec("Why Title") || defs.why.title,
    cards: parsed("why_cards", defs.why.cards),
  };
  const gallery = {
    label: s("gallery_label") || sec("Gallery Label") || defs.gallery.label,
    title: s("gallery_title") || sec("Gallery Title") || defs.gallery.title,
    items: parsed("gallery", defs.gallery.items),
  };
  const process = {
    label: s("process_label") || sec("Process Label") || defs.process.label,
    title: s("process_title") || sec("Process Title") || defs.process.title,
    steps: parsed("process_steps", defs.process.steps),
  };
  const testimonials = {
    label: s("testimonials_label") || sec("Testimonials Label") || defs.testimonials.label,
    title: s("testimonials_title") || sec("Testimonials Title") || defs.testimonials.title,
    items: parsed("testimonials", defs.testimonials.items),
  };
  const cta = {
    image: s("cta_image") || defs.cta.image,
    label: s("cta_label") || sec("CTA Label") || defs.cta.label || "",
    title: s("cta_title") || sec("CTA Title") || defs.cta.title,
    sub: s("cta_sub") || sec("CTA Subtitle") || defs.cta.sub,
    button: s("cta_button") || sec("CTA Button") || defs.cta.button,
  };

  if (SERVICE_MEDIA[key]) {
    return <EmbroideryPage hero={hero} about={about} experience={experience} services={services} why={why} gallery={gallery} process={process} testimonials={testimonials} cta={cta} media={SERVICE_MEDIA[key]} />;
  }

  return (
    <div className={`service-editorial-page service-editorial-page--${key}`}>
      <section
        className="service-editorial-page__hero bg-neutral-950 text-white"
         style={key === "embroidery" ? { backgroundImage: "linear-gradient(90deg, rgba(10,8,7,.88), rgba(10,8,7,.48)), url('/brand/Wedding.jpeg')" } : undefined}
      >
        <div className="service-editorial-page__hero-inner mx-auto max-w-4xl px-4 text-center">
          <p className="eyebrow text-gold">{hero.eyebrow}</p>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">{hero.title}</h1>
          <p className="mt-3 font-display text-xl italic text-neutral-300">{hero.subtitle}</p>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-300">{hero.body}</p>
          <Link href="/book-appointment" className="btn-primary mt-8 !bg-gold !text-neutral-950 hover:!bg-white">
            {hero.cta}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
            <div
              className="service-editorial-page__heritage-image flex min-h-72 items-center justify-center bg-cream p-10 text-center"
              style={galleryImages[0] ? { backgroundImage: `url(${galleryImages[0]})` } : undefined}
            >
            <p className="font-display text-3xl italic text-white">Harry Clinton</p>
          </div>
          <div>
            <p className="eyebrow text-gold">{about.label}</p>
            <h2 className="mt-2 font-display text-4xl font-bold">{about.title}</h2>
            <p className="mt-4 text-neutral-600">{about.desc}</p>
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="eyebrow text-gold">{experience.label}</p>
          <h2 className="mt-2 font-display text-4xl font-bold">{experience.title}</h2>
          <div className="mt-10 grid gap-px bg-neutral-800 sm:grid-cols-2 lg:grid-cols-4">
            {experience.cards.map((c, i) => (
              <div key={i} className="bg-neutral-950 p-8">
                <p className="text-gold">{c.icon}</p>
                <p className="mt-2 font-display text-4xl font-bold">{c.stat}</p>
                <p className="mt-1 text-sm text-neutral-400">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <p className="eyebrow text-center text-neutral-500">{services.label}</p>
        <h2 className="mt-2 text-center font-display text-4xl font-bold">{services.title}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {services.items.map((sv, i) => (
            <div key={i} className="border border-neutral-200 p-8">
              <p className="eyebrow text-gold">{sv.label}</p>
              <h3 className="mt-2 font-display text-2xl font-bold">{sv.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                {(sv.points || []).map((pt, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-gold">✦</span> {pt}
                  </li>
                ))}
              </ul>
              <Link href="/book-appointment" className="link-sweep mt-5 inline-block text-xs font-semibold uppercase tracking-[0.2em]">
                {sv.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="eyebrow text-neutral-500">{why.label}</p>
          <h2 className="mt-2 font-display text-4xl font-bold">{why.title}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {why.cards.map((w, i) => (
              <div key={i} className="bg-white p-8 shadow-sm">
                <p className="text-xl text-gold">{w.icon}</p>
                <p className="mt-2 font-display text-xl font-bold">{w.title}</p>
                <p className="mt-2 text-sm text-neutral-600">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <p className="eyebrow text-center text-neutral-500">{gallery.label}</p>
        <h2 className="mt-2 text-center font-display text-4xl font-bold">{gallery.title}</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.items.map((g, i) => (
            <div key={i} className={`service-editorial-page__gallery-item flex min-h-56 flex-col justify-end bg-neutral-950 p-6 text-white ${g.wide ? "sm:col-span-2" : ""} ${g.tall ? "lg:row-span-2" : ""}`} style={galleryImages[i] ? { backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.72), rgba(0,0,0,.08)), url(${galleryImages[i]})` } : undefined}>
              <p className="font-display text-xl">{g.caption}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="eyebrow text-gold">{process.label}</p>
          <h2 className="mt-2 font-display text-4xl font-bold">{process.title}</h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-2 md:flex-row md:gap-4">
            {process.steps.map((step, idx) => (
              <div key={step.label} className="flex flex-col items-center md:flex-row md:gap-4">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center  border border-gold font-display text-xl font-bold text-gold">
                    {step.no}
                  </div>
                  <p className="mt-2 text-sm">{step.label}</p>
                </div>
                {idx < process.steps.length - 1 && <span className="my-2 text-gold md:mx-2">↓</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <p className="eyebrow text-center text-neutral-500">{testimonials.label}</p>
        <h2 className="mt-2 text-center font-display text-4xl font-bold">{testimonials.title}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.items.map((t) => (
            <div className="border border-neutral-200 p-8 text-center" key={t.name}>
              <p className="font-display text-lg italic leading-snug">&quot;{t.quote}&quot;</p>
              <p className="mt-4 font-semibold">{t.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-24">
        <div className="bg-ink px-6 py-14 text-center text-white md:py-20">
          {cta.label && <p className="eyebrow text-gold">{cta.label}</p>}
          <h2 className="font-display text-4xl font-bold md:text-5xl">{cta.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-300">{cta.sub}</p>
          <Link href="/book-appointment" className="btn-primary mt-8 !bg-gold !text-neutral-950 hover:!bg-white">
            {cta.button}
          </Link>
        </div>
      </section>
    </div>
  );
}
