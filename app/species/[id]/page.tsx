import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PhotoList } from "@/components/PhotoList";

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: species } = await supabase.from("species").select("*").eq("uuid", id).maybeSingle();
  if (!species) notFound();

  const { data: photos } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("species_id", id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <article className="surface px-6 py-7">
      <p className="text-sm font-medium text-forest">{[species.family, species.genus].filter(Boolean).join(" · ")}</p>
      <h1 className="mt-1 text-3xl font-semibold">{species.scientific_name}</h1>
      <p className="mt-1 text-neutral-700">
        {[species.common_name, species.local_name].filter(Boolean).join(" · ")}
      </p>
      <dl className="mt-5 space-y-3 text-sm">
        <Info label="Conservation status" value={species.conservation_status} />
        <Info label="Distribution" value={species.distribution} />
        <Info label="Description" value={species.description} />
        <Info label="Ecology" value={species.ecological_info} />
        <Info label="Cultural significance" value={species.cultural_significance} />
      </dl>
      <PhotoList photos={photos ?? []} />
      </article>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="whitespace-pre-wrap text-neutral-700">{value}</dd>
    </div>
  );
}
