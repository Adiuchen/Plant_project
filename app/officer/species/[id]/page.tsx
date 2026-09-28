import { notFound } from "next/navigation";
import { SpeciesForm } from "@/components/SpeciesForm";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { deleteSpecies, updateSpecies } from "../../actions";

export default async function EditSpeciesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { t } = await getCopy();
  const { data: species } = await supabase.from("species").select("*").eq("uuid", id).maybeSingle();
  if (!species) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{t.editSpecies}</h1>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <SpeciesForm action={updateSpecies} species={species} />
      <form action={deleteSpecies} className="mt-6">
        <input type="hidden" name="id" value={species.id} />
        <button className="text-sm text-red-700" type="submit">{t.deleteSpecies}</button>
      </form>
    </main>
  );
}
