import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  let request = supabase
    .from("species")
    .select("uuid, id, scientific_name, common_name, local_name, conservation_status, distribution")
    .order("scientific_name")
    .limit(50);

  if (query) {
    request = request.or(
      `scientific_name.ilike.%${query}%,common_name.ilike.%${query}%,local_name.ilike.%${query}%`,
    );
  }

  const { data: species, error } = await request;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="surface px-6 py-8">
        <p className="text-sm font-medium text-forest">Public plant knowledge</p>
        <h1 className="mt-1 text-3xl font-semibold">Find a species</h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-600">
          Search by scientific, common, or local name. Exact GPS locations are not shown here.
        </p>
        <form className="mt-5 flex gap-2" action="/">
          <input
            className="w-full rounded-lg border px-3 py-2"
            name="q"
            defaultValue={query}
            placeholder="Search plants"
          />
          <button className="btn" type="submit">
            Search
          </button>
        </form>
      </section>
      {error && <p className="mt-4 text-sm text-red-700">{error.message}</p>}
      <ul className="mt-6 grid gap-3">
        {(species ?? []).map((item) => (
          <li key={item.id}>
            <Link href={`/species/${item.uuid}`} className="surface block px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="font-medium">
                <span className="mr-2 text-forest">{item.id}</span>
                {item.scientific_name}
              </span>
              <span className="mt-1 block text-sm text-neutral-600">
                {[item.common_name, item.local_name].filter(Boolean).join(" · ") || "No common name"}
              </span>
              <span className="mt-1 block text-sm">
                {item.conservation_status || "Status not set"}
                {item.distribution ? ` · ${item.distribution}` : ""}
              </span>
            </Link>
          </li>
        ))}
        {!error && (species ?? []).length === 0 && (
          <li className="surface px-5 py-8 text-sm text-neutral-500">No species yet.</li>
        )}
      </ul>
    </main>
  );
}
