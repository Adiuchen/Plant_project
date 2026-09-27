export function SpeciesForm({
  action,
  species,
}: {
  action: (formData: FormData) => void | Promise<void>;
  species?: {
    uuid: string;
    id: string;
    scientific_name: string;
    common_name: string | null;
    local_name: string | null;
    family: string | null;
    genus: string | null;
    description: string | null;
    conservation_status: string | null;
    distribution: string | null;
    ecological_info: string | null;
    cultural_significance: string | null;
  };
}) {
  return (
    <form action={action} className="space-y-3">
      {species && <input type="hidden" name="id" value={species.uuid} />}
      <Field name="scientific_name" label="Scientific name" required defaultValue={species?.scientific_name} />
      <Field name="common_name" label="Common name" defaultValue={species?.common_name} />
      <Field name="local_name" label="Local name" defaultValue={species?.local_name} />
      <div className="grid grid-cols-2 gap-3">
        <Field name="family" label="Family" defaultValue={species?.family} />
        <Field name="genus" label="Genus" defaultValue={species?.genus} />
      </div>
      <Field name="conservation_status" label="Conservation status" defaultValue={species?.conservation_status} />
      <Field name="distribution" label="General distribution" defaultValue={species?.distribution} />
      <Field name="description" label="Description" area defaultValue={species?.description} />
      <Field name="ecological_info" label="Ecology" area defaultValue={species?.ecological_info} />
      <Field name="cultural_significance" label="Cultural significance" area defaultValue={species?.cultural_significance} />
      <Field name="photo_url" label="Reference photo URL" />
      <Field name="photo_caption" label="Photo caption" />
      <button className="btn" type="submit">Save</button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  area,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  area?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      {area ? (
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" name={name} rows={3} defaultValue={defaultValue ?? ""} />
      ) : (
        <input className="mt-1 w-full rounded-lg border px-3 py-2" name={name} required={required} defaultValue={defaultValue ?? ""} />
      )}
    </label>
  );
}
