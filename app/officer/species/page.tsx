import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function SpeciesListPage() {
  const { supabase } = await requireUser(["conservation_officer"]);
  const { data, error } = await supabase
    .from("species")
    .select("uuid, id, scientific_name, common_name, conservation_status")
    .order("scientific_name");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Species</h1>
        <Link className="btn" href="/officer/species/new">
          Add species
        </Link>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error.message}</p>}
      <ul className="mt-4 divide-y surface">
        {(data ?? []).map((item) => (
          <li key={item.id} className="px-4 py-3">
            <Link href={`/officer/species/${item.uuid}`} className="font-medium">{item.id} · {item.scientific_name}</Link>
            <p className="text-sm text-neutral-600">
              {item.common_name || "No common name"} · {item.conservation_status || "Status not set"}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
