import { apiGet, unwrap, resolveUploadUrl } from "@/lib/api";
import ShowcaseHeader from "@/components/ShowcaseHeader";

export const revalidate = 300;
export const metadata = { title: "Style by HC" };

export default async function StyleByHCPage() {
  const [collections, media] = await Promise.all([
    apiGet("/Style-Collections").then(unwrap).catch(() => []),
    apiGet("/Style-Collection-Media").then(unwrap).catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <ShowcaseHeader eyebrow="Curated Looks" title="Style by HC" sub="Curated looks from our stylists." />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {collections.filter((c) => c.isactive !== false).map((c) => {
          const m = media.find((x) => x.style_collection_id === c.style_collection_id);
          const img = resolveUploadUrl(m?.media_url);
          return (
            <article key={c.style_collection_id} className="border border-neutral-200">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={c.style_collection_name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              )}
              <div className="p-5">
                <h2 className="font-display text-xl font-bold">{c.style_collection_name}</h2>
                {(c.description || c.short_description) && (
                  <p className="mt-2 text-sm text-neutral-600">{c.description || c.short_description}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
