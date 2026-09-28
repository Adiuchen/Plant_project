import { FieldRecordForm } from "@/components/FieldRecordForm";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const { data: species } = await supabase
    .from("species")
    .select("uuid, id, scientific_name, common_name")
    .order("scientific_name");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{t.newFieldRecord}</h1>
      <FieldRecordForm species={species ?? []} t={t} serverError={error} />
    </main>
  );
}
