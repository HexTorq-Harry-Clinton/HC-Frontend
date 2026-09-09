// Service page content — verbatim defaults from the previous UI.
// (Images now come from settings/API overrides; brand avatar stays local.)
export const AVATAR = "/brand/logo-gold.png";

const commonDefaults = {
  hero: {
    eyebrow: "HC Atelier Services",
    title: "Service",
    subtitle: "Crafted with Precision. Designed for You.",
    body: "Experience luxury craftsmanship and personalized service that brings your wardrobe vision to life.",
    cta: "Book a Consultation",
  },
  about: {
    label: "Heritage",
    title: "The Art of Service",
    desc: "At HC, we combine time-honored craftsmanship with contemporary style to deliver a service experience that is as exceptional as the garments we create.",
  },
  experience: {
    label: "Our Experience",
    title: "A Legacy of Excellence",
    cards: [
      { icon: "✦", stat: "10,000+", label: "Clients Served" },
      { icon: "✦", stat: "25+", label: "Years of Expertise" },
      { icon: "✦", stat: "500+", label: "Bridal & Couture Clients" },
      { icon: "✦", stat: "∞", label: "Dedication to Quality" },
    ],
  },
  why: {
    label: "Why Choose HC",
    title: "The HC Difference",
    cards: [
      { icon: "✦", title: "Premium Quality", desc: "Only the finest materials, finishes, and techniques leave our studio." },
      { icon: "✦", title: "Master Craftsmen", desc: "Decades of inherited skill passed through artisan families." },
      { icon: "✦", title: "Custom Solutions", desc: "Bespoke service tailored to your unique vision and lifestyle." },
      { icon: "✦", title: "Fast Turnaround", desc: "Efficient production without compromising on luxury." },
    ],
  },
  gallery: {
    label: "Portfolio",
    title: "Editorial Gallery",
    items: [
      { caption: "Bridal Elegance", wide: true },
      { caption: "Travel Collection", tall: true },
      { caption: "Smart Casual Style" },
      { caption: "Signature Detailing", wide: true },
      { caption: "Business Sophistication" },
      { caption: "Designer Craftsmanship" },
    ],
  },
  process: {
    label: "Process",
    title: "How We Work",
    steps: [
      { no: "1", label: "Consultation" },
      { no: "2", label: "Design & Planning" },
      { no: "3", label: "Crafting" },
      { no: "4", label: "Quality Check" },
      { no: "5", label: "Delivery" },
    ],
  },
  testimonials: {
    label: "Testimonials",
    title: "Client Words",
    items: [
      { quote: "HC brought my vision to life with incredible attention to detail and craftsmanship.", name: "Rohit Mehra", role: "Fashion Brand Director" },
      { quote: "The service was exceptional from start to finish. I felt truly valued as a client.", name: "Ananya Sharma", role: "Bride, Delhi" },
      { quote: "Professional, premium, and deeply personal. I would not go anywhere else.", name: "Vikram Rao", role: "Couture Designer" },
    ],
  },
  cta: {
    title: "Ready to Elevate Your Wardrobe?",
    sub: "Book a consultation and let our specialists craft the perfect experience for you.",
    button: "Get a Quote",
  },
};

export const SERVICE_PAGES = {
  embroidery: {
    serviceKey: "embroidery",
    title: "Embroidery",
    defaults: {
      ...commonDefaults,
      hero: {
        ...commonDefaults.hero,
        title: "Embroidery",
        subtitle: "Crafted with Precision. Stitched with Passion.",
        body: "From timeless hand embroidery to precision computer embroidery, we transform every design into a masterpiece.",
        cta: "Get a Quote",
      },
      about: {
        ...commonDefaults.about,
        title: "The Art of Embroidery",
        desc: "Embroidery is where craftsmanship meets storytelling. At HC, we combine modern embroidery technology with traditional artistry to create garments that celebrate luxury, precision, and individuality.",
      },
      experience: {
        ...commonDefaults.experience,
        title: "A Legacy of Stitched Excellence",
        cards: [
          { icon: "✦", stat: "3000+", label: "Embroidery Projects Completed" },
          { icon: "✦", stat: "20+", label: "Years of Hand & Computer Embroidery" },
          { icon: "✦", stat: "150+", label: "Fashion Brands & Designers Trust Us" },
          { icon: "✦", stat: "∞", label: "Premium Quality in Every Stitch" },
        ],
      },
      services: {
        label: "Services",
        title: "Two Disciplines. One Standard.",
        items: [
          {
            title: "Computer Embroidery",
            label: "Precision Technology",
            points: ["High precision embroidery", "Large production capacity", "Premium thread finish", "Corporate uniforms", "Fashion brands", "Custom logo embroidery"],
            cta: "Explore Computer Embroidery",
          },
          {
            title: "Hand Embroidery",
            label: "Artisan Craft",
            points: ["Zardozi", "Aari Work", "Beadwork", "Sequin embroidery", "Bridal couture", "Luxury bespoke designs"],
            cta: "Explore Hand Embroidery",
          },
        ],
      },
      why: {
        ...commonDefaults.why,
        cards: [
          { icon: "✦", title: "Premium Quality", desc: "Only the finest threads, fabrics, and finishes leave our studio." },
          { icon: "✦", title: "Master Craftsmen", desc: "Decades of inherited skill passed through artisan families." },
          { icon: "✦", title: "Custom Design Solutions", desc: "Bespoke embroidery tailored to your unique vision." },
          { icon: "✦", title: "Fast Turnaround", desc: "Efficient production without compromising on luxury." },
        ],
      },
      process: {
        ...commonDefaults.process,
        title: "From Thread to Treasure",
        steps: [
          { no: "1", label: "Consultation" },
          { no: "2", label: "Design Digitization" },
          { no: "3", label: "Embroidery Production" },
          { no: "4", label: "Quality Inspection" },
          { no: "5", label: "Delivery" },
        ],
      },
      testimonials: {
        ...commonDefaults.testimonials,
        items: [
          { quote: "The precision of their computer embroidery is unmatched. Our brand logos have never looked better.", name: "Rohit Mehra", role: "Fashion Brand Director" },
          { quote: "HC brought my bridal lehenga to life with zardozi work that felt like heirloom craftsmanship.", name: "Ananya Sharma", role: "Bride, Delhi" },
          { quote: "From concept to stitch, the entire process felt premium, professional, and deeply personal.", name: "Vikram Rao", role: "Couture Designer" },
        ],
      },
      cta: {
        title: "Ready to Stitch Your Vision?",
        sub: "Whether you need precision machine embroidery or handcrafted luxury detailing, HC brings your ideas to life with exceptional craftsmanship.",
        button: "Get a Quote",
      },
    },
  },
  alterations: {
    serviceKey: "alterations",
    title: "Alterations",
    defaults: {
      ...commonDefaults,
      hero: {
        ...commonDefaults.hero,
        title: "Alterations",
        subtitle: "Tailored to Fit. Perfected for You.",
        body: "From subtle tweaks to complete restyling, our expert tailors ensure every garment fits you flawlessly and feels like it was made just for you.",
      },
      about: {
        ...commonDefaults.about,
        label: "Precision",
        title: "The Art of Alteration",
        desc: "An impeccable fit transforms how you look and feel. Our master tailors combine traditional techniques with modern precision to alter garments to your exact measurements while preserving their original design integrity.",
      },
      experience: {
        ...commonDefaults.experience,
        cards: [
          { icon: "✦", stat: "10,000+", label: "Garments Altered" },
          { icon: "✦", stat: "25+", label: "Years of Tailoring" },
          { icon: "✦", stat: "1,000+", label: "Bridal Fittings" },
          { icon: "✦", stat: "24h", label: "Express Service" },
        ],
      },
      services: {
        label: "Services",
        title: "Precision Fit for Every Garment",
        items: [
          {
            title: "Clothing Alterations",
            label: "Everyday to Couture",
            points: ["Suit and blazer alterations", "Dress and gown resizing", "Hemming and tapering", "Zipper and button repairs", "Jacket and coat adjustments"],
            cta: "Alter Your Garment",
          },
          {
            title: "Restyling & Resizing",
            label: "Modern Refresh",
            points: ["Vintage piece modernisation", "Size adjustments", "Restyling outdated silhouettes", "Restructuring fit and length", "Sustainable wardrobe updates"],
            cta: "Restyle Today",
          },
        ],
      },
      process: {
        ...commonDefaults.process,
        title: "From Measure to Masterpiece",
        steps: [
          { no: "1", label: "Consultation" },
          { no: "2", label: "Measurement" },
          { no: "3", label: "Alteration" },
          { no: "4", label: "Fitting" },
          { no: "5", label: "Delivery" },
        ],
      },
      cta: {
        title: "Ready for the Perfect Fit?",
        sub: "Whether it is a small tweak or a complete transformation, our tailors will make it fit like a dream.",
        button: "Get a Quote",
      },
    },
  },
  "personal-styling": {
    serviceKey: "personal-styling",
    title: "Personal Styling",
    defaults: {
      ...commonDefaults,
      hero: {
        ...commonDefaults.hero,
        title: "Personal Styling",
        subtitle: "Curated Looks. Confident You.",
        body: "Discover a wardrobe that reflects your personality, lifestyle, and ambitions with one-on-one personal styling from HC's fashion experts.",
      },
      about: {
        ...commonDefaults.about,
        label: "Style",
        title: "Your Style, Redefined",
        desc: "Personal styling is more than choosing clothes — it is about building a wardrobe that tells your story. Our stylists work with you to define a look that is authentically yours.",
      },
      experience: {
        ...commonDefaults.experience,
        cards: [
          { icon: "✦", stat: "2,000+", label: "Wardrobes Curated" },
          { icon: "✦", stat: "15+", label: "Styling Experts" },
          { icon: "✦", stat: "300+", label: "Events Styled" },
          { icon: "✦", stat: "100%", label: "Personalised Approach" },
        ],
      },
      services: {
        label: "Services",
        title: "Wardrobe Solutions for Every Occasion",
        items: [
          {
            title: "Personal Consultation",
            label: "One-on-One Styling",
            points: ["Wardrobe assessment", "Colour and body analysis", "Style personality mapping", "Capsule wardrobe planning", "Seasonal refresh"],
            cta: "Book a Styling Session",
          },
          {
            title: "Event & Bridal Styling",
            label: "Special Moments",
            points: ["Wedding party coordination", "Black-tie event styling", "Corporate look curation", "Travel wardrobe packing", "Gifting and trousseau planning"],
            cta: "Style Your Event",
          },
        ],
      },
      process: {
        ...commonDefaults.process,
        title: "Your Style Journey",
        steps: [
          { no: "1", label: "Discovery" },
          { no: "2", label: "Style Audit" },
          { no: "3", label: "Curation" },
          { no: "4", label: "Fitting" },
          { no: "5", label: "Follow-up" },
        ],
      },
      cta: {
        title: "Ready to Find Your Signature Style?",
        sub: "Let our stylists curate a wardrobe that makes every day feel effortlessly elegant.",
        button: "Get a Quote",
      },
    },
  },
  "custom-tailoring": {
    serviceKey: "custom-tailoring",
    title: "Custom Tailoring",
    defaults: {
      ...commonDefaults,
      hero: {
        ...commonDefaults.hero,
        title: "Custom Tailoring",
        subtitle: "Bespoke Garments. Made for You.",
        body: "From the first measurement to the final stitch, experience the luxury of custom tailoring where every detail is crafted to your exact specifications.",
      },
      about: {
        ...commonDefaults.about,
        label: "Bespoke",
        title: "The Craft of Custom Tailoring",
        desc: "True bespoke tailoring is an art. We create garments that honour your proportions, preferences, and personal style using the finest fabrics and time-honoured techniques.",
      },
      experience: {
        ...commonDefaults.experience,
        cards: [
          { icon: "✦", stat: "5,000+", label: "Custom Garments" },
          { icon: "✦", stat: "30+", label: "Master Tailors" },
          { icon: "✦", stat: "500+", label: "Fabrics Available" },
          { icon: "✦", stat: "50+", label: "Measurements" },
        ],
      },
      services: {
        label: "Services",
        title: "Tailored for Every Detail",
        items: [
          {
            title: "Bespoke Suits & Blazers",
            label: "Tailored Foundations",
            points: ["Custom pattern drafting", "Hand-finished details", "Premium fabric selection", "Multiple fittings", "Lining and button personalisation"],
            cta: "Design Your Suit",
          },
          {
            title: "Made-to-Measure Shirts & Trousers",
            label: "Everyday Elegance",
            points: ["Personalised measurements", "Collar and cuff options", "Trouser fit and length", "Monogramming available", "Coordinated wardrobe sets"],
            cta: "Create Your Look",
          },
        ],
      },
      process: {
        ...commonDefaults.process,
        title: "From Fabric to Finish",
        steps: [
          { no: "1", label: "Consultation" },
          { no: "2", label: "Measurements" },
          { no: "3", label: "Pattern & Fabric" },
          { no: "4", label: "Fittings" },
          { no: "5", label: "Final Delivery" },
        ],
      },
      cta: {
        title: "Ready for a Garment Made Just for You?",
        sub: "Experience the luxury of true bespoke tailoring with a complimentary consultation and fitting.",
        button: "Get a Quote",
      },
    },
  },
};

export function servicePage(slug) {
  return SERVICE_PAGES[slug] || null;
}
