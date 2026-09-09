import Link from "next/link";
import { apiGet, unwrap } from "@/lib/api";

// FAQs page: same structure as the previous UI —
// H2 title, accordion, footer block with links.
export default async function FAQsView() {
  const faqs = await apiGet("/FAQs").then(unwrap).catch(() => []);
  const list = (Array.isArray(faqs) ? faqs : []).filter((f) => f.isactive !== false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h2 className="text-center font-display text-4xl font-bold">Frequently Asked Questions</h2>
      {list.length === 0 ? (
        <p className="mt-8 text-center text-sm text-neutral-500">Unable to load FAQs. Please try again later.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {list.map((f) => (
            <details key={f.faq_id} className="border border-neutral-200">
              <summary className="cursor-pointer p-4 font-medium">{f.question}</summary>
              <p className="px-4 pb-4 text-sm text-neutral-600">{f.answer}</p>
            </details>
          ))}
        </div>
      )}
      <div className="mt-12 border-t border-neutral-200 bg-neutral-950 py-6 text-center text-sm text-white">
        <p>© 2025 Harry Clinton. All rights reserved.</p>
        <p className="mt-2">
          <Link href="/" className="underline">Home</Link>
          <span className="mx-2">|</span>
          <Link href="/FAQs" className="underline">FAQs</Link>
          <span className="mx-2">|</span>
          <Link href="/contact-us" className="underline">Contact</Link>
        </p>
      </div>
    </div>
  );
}
