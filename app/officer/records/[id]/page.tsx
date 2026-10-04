import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { PhotoList } from "@/components/PhotoList";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { reviewRecord } from "../../actions";

export default async function OfficerRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string; error?: string }>;
}) {
  const { id } = await params;
  const { status = "submitted", q = "", error } = await searchParams;
  const { supabase } = await requireUser(["conservation_officer"]);
  const { locale, t } = await getCopy();

  const { data: record, error: queryError } = await supabase
    .from("plant_records")
    .select(
      "uuid, id, status, location_name, latitude, longitude, recorded_at, height_m, trunk_diameter_cm, leaf_traits, flower_fruit_traits, health_status, other_traits, review_note, species(scientific_name, common_name, local_name, family, genus, conservation_status, distribution, description, ecological_info, cultural_significance), profiles!plant_records_botanist_id_fkey(name)",
    )
    .eq("uuid", id)
    .maybeSingle();

  if (queryError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-700">{queryError.message}</p>
      </main>
    );
  }
  if (!record) notFound();

  const { data: photos, error: photoError } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("plant_record_id", record.uuid)
    .is("hidden_at", null);

  const species = Array.isArray(record.species) ? record.species[0] : record.species;
  const botanist = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
  const canDecide = record.status === "submitted" || record.status === "needs_revision";
  const listQuery = new URLSearchParams({ status, q }).toString();
  const here = `/officer/records/${record.uuid}?${listQuery}`;
  const mapUrl =
    record.latitude != null && record.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=15/${record.latitude}/${record.longitude}`
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <article className="surface px-6 py-7">
        <PageHeading
          backLabel={t.backPage}
          title={`${record.id} · ${species?.scientific_name || t.unidentifiedPlant}`}
        />
        <p className="mt-1 text-sm text-neutral-600">
          {species?.common_name || t.noCommonName}
          {species?.local_name ? ` · ${species.local_name}` : ""} · {botanist?.name || t.unknownBotanist} ·{" "}
          <StatusBadge status={record.status} />
        </p>
        {(error || photoError) && <p className="mt-3 text-sm text-red-700">{error || photoError?.message}</p>}

        <h2 className="mt-6 font-medium">{t.photos}</h2>
        {photos && photos.length > 0 ? (
          <PhotoList photos={photos} />
        ) : (
          <p className="mt-2 text-sm text-neutral-500">{t.noPhotos}</p>
        )}

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <Field label={t.recorded} value={formatWhen(record.recorded_at, locale)} />
          <Field label={t.botanist} value={botanist?.name || t.unknownBotanist} />
          <Field label={t.familyGenus} value={[species?.family, species?.genus].filter(Boolean).join(" · ") || null} />
          <Field label={t.conservationStatus} value={species?.conservation_status} />
          <Field label={t.place} value={record.location_name} />
          <div>
            <dt className="font-medium">{t.gps}</dt>
            <dd className="text-neutral-700">
              {record.latitude != null ? `${record.latitude}, ${record.longitude}` : "—"}
              {mapUrl && (
                <>
                  {" · "}
                  <a href={mapUrl} target="_blank" rel="noreferrer">
                    {t.openMap}
                  </a>
                </>
              )}
            </dd>
          </div>
          <Field label={t.height} value={record.height_m} />
          <Field label={t.trunkDiameter} value={record.trunk_diameter_cm} />
          <Field label={t.leaves} value={record.leaf_traits} />
          <Field label={t.flowerFruit} value={record.flower_fruit_traits} />
          <Field label={t.health} value={record.health_status} />
          <Field label={t.other} value={record.other_traits} />
        </dl>

        <dl className="mt-5 space-y-3 text-sm">
          <Info label={t.distribution} value={species?.distribution} />
          <Info label={t.description} value={species?.description} />
          <Info label={t.ecology} value={species?.ecological_info} />
          <Info label={t.cultural} value={species?.cultural_significance} />
          {record.review_note && <Info label={t.officerNote} value={record.review_note} />}
        </dl>

        {canDecide && (
          <form action={reviewRecord} className="mt-6 space-y-2 border-t pt-4">
            <input type="hidden" name="id" value={record.uuid} />
            <input type="hidden" name="next" value={here} />
            <textarea
              className="w-full rounded border px-2 py-1"
              name="review_note"
              rows={3}
              placeholder={t.noteToBotanist}
              defaultValue={record.review_note ?? ""}
            />
            <div className="flex flex-wrap gap-2">
              <button className="btn" name="status" value="approved">
                {t.approve}
              </button>
              <button className="rounded border px-3 py-1" name="status" value="needs_revision">
                {t.requestChanges}
              </button>
              <button className="rounded border border-red-300 px-3 py-1 text-red-800" name="status" value="rejected">
                {t.reject}
              </button>
            </div>
          </form>
        )}
      </article>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="whitespace-pre-wrap text-neutral-700">{value == null || value === "" ? "—" : value}</dd>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return <Field label={label} value={value} />;
}

function formatWhen(value: string | null, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ms" ? "ms-MY" : "en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
