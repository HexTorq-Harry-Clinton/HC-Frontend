import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import Reveal from "@/components/Reveal";

export const revalidate = 300;
export const metadata = { title: "HC Spotlight" };

export default async function HCSpotlightPage() {
  const [entries, media] = await Promise.all([
    apiGet("/Spotlight-Entries").then(unwrap).catch(() => []),
    apiGet("/Spotlight-Media").then(unwrap).catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <Reveal>
        <h1 className="text-center font-display text-5xl font-bold">HC Spotlight</h1>
        <p className="mt-3 text-center text-neutral-500">Moments in Harry Clinton, worn by you.</p>
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {entries.filter((e) => e.isactive !== false).map((e) => {
          const m = media.find((x) => x.spotlight_entry_id === e.spotlight_entry_id);
          const img = resolveUploadUrl(m?.media_url);
          return (
            <article key={e.spotlight_entry_id} className="border border-neutral-200">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={e.title || "Spotlight"} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              )}
              <div className="p-5">
                <h2 className="font-display text-xl font-bold">{e.title}</h2>
                {e.description && <p className="mt-2 text-sm text-neutral-600">{e.description}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
