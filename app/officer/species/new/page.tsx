import { SpeciesForm } from "@/components/SpeciesForm";
import { requireUser } from "@/lib/auth";
import { createSpecies } from "../../actions";

export default async function NewSpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireUser(["conservation_officer"]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Add species</h1>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <SpeciesForm action={createSpecies} />
    </main>
  );
}
