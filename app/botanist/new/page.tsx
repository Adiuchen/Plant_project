import { requireUser } from "@/lib/auth";
import { createRecord } from "../actions";

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireUser(["botanist"]);
  const { data: species } = await supabase
    .from("species")
    .select("uuid, id, scientific_name, common_name")
    .order("scientific_name");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">New field record</h1>
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <form action={createRecord} className="space-y-3">
        <label className="block text-sm">
          Species
          <select className="mt-1 w-full rounded border px-2 py-1" name="species_id">
            <option value="">Not identified yet</option>
            {(species ?? []).map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.id} · {item.scientific_name}
                {item.common_name ? ` (${item.common_name})` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field name="height_m" label="Height (m)" />
          <Field name="trunk_diameter_cm" label="Trunk diameter (cm)" />
          <Field name="latitude" label="Latitude" />
          <Field name="longitude" label="Longitude" />
        </div>
        <Field name="location_name" label="Place name" />
        <Field name="leaf_traits" label="Leaf traits" />
        <Field name="flower_fruit_traits" label="Flower or fruit" />
        <Field name="health_status" label="Health" />
        <Field name="other_traits" label="Other traits" area />
        <Field name="photo_url" label="Photo URL" />
        <Field name="photo_caption" label="Photo caption" />
        <label className="block text-sm">
          Save as
          <select className="mt-1 w-full rounded border px-2 py-1" name="status" defaultValue="submitted">
            <option value="draft">Draft</option>
            <option value="submitted">Submit for review</option>
          </select>
        </label>
        <button className="btn" type="submit">
          Save
        </button>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  area,
}: {
  name: string;
  label: string;
  area?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      {area ? (
        <textarea className="mt-1 w-full rounded border px-2 py-1" name={name} rows={3} />
      ) : (
        <input className="mt-1 w-full rounded border px-2 py-1" name={name} />
      )}
    </label>
  );
}
