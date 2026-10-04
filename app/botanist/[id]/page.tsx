import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { PhotoList } from "@/components/PhotoList";
import { StatusBadge } from "@/components/StatusBadge";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { addRecordPhoto, generateQr, resubmit } from "../actions";

export default async function RecordDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, user } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const { data: record } = await supabase
    .from("plant_records")
    .select("*, species(scientific_name)")
    .eq("uuid", id)
    .eq("botanist_id", user.id)
    .maybeSingle();

  if (!record) notFound();

  const { data: species } = await supabase
    .from("species")
    .select("uuid, id, scientific_name")
    .is("hidden_at", null)
    .order("scientific_name");
  const { data: photos } = await supabase
    .from("plant_photos")
    .select("id, storage_path, caption")
    .eq("plant_record_id", record.uuid)
    .is("hidden_at", null);
  const speciesName = Array.isArray(record.species) ? record.species[0]?.scientific_name : record.species?.scientific_name;
  const editable = record.status === "draft" || record.status === "needs_revision";
  const canAddPhoto = editable || record.status === "submitted";

  let qrImage: string | null = null;
  if (record.qr_code) {
    const headerStore = await headers();
    const host = headerStore.get("host") ?? "localhost:3000";
    const proto = headerStore.get("x-forwarded-proto") ?? "http";
    qrImage = await QRCode.toDataURL(`${proto}://${host}/p/${record.qr_code}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeading backLabel={t.backPage} title={`${record.id} · ${speciesName || t.unidentifiedPlant}`} />
      <p className="mt-2 text-sm"><StatusBadge status={record.status} /></p>
      {record.review_note && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm">{t.officerNote}: {record.review_note}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      <section className="surface mt-4 p-4">
        <h2 className="font-medium">{t.photos}</h2>
        {photos && photos.length > 0 ? <PhotoList photos={photos} /> : <p className="mt-2 text-sm text-neutral-500">{t.noPhotos}</p>}
        {canAddPhoto && (
          <form action={addRecordPhoto} className="mt-3 space-y-2">
            <input type="hidden" name="id" value={record.uuid} />
            <input className="w-full rounded-lg border px-3 py-2 text-sm" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" capture="environment" />
            <input className="w-full rounded-lg border px-3 py-2 text-sm" name="photo_caption" placeholder={t.photoCaption} />
            <button className="btn" type="submit">{t.addPhoto}</button>
          </form>
        )}
      </section>

      {editable ? (
        <form action={resubmit} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={record.uuid} />
          <label className="block text-sm">
            {t.species}
            <select className="mt-1 w-full rounded border px-2 py-1" name="species_id" defaultValue={record.species_id ?? ""}>
              <option value="">{t.notIdentified}</option>
              {(species ?? []).map((item) => (
                <option key={item.uuid} value={item.uuid}>{item.id} · {item.scientific_name}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input name="height_m" label={t.height} defaultValue={record.height_m} />
            <Input name="trunk_diameter_cm" label={t.trunk} defaultValue={record.trunk_diameter_cm} />
            <Input name="latitude" label={t.latitude} defaultValue={record.latitude} />
            <Input name="longitude" label={t.longitude} defaultValue={record.longitude} />
          </div>
          <Input name="location_name" label={t.placeName} defaultValue={record.location_name} />
          <Input name="leaf_traits" label={t.leafTraits} defaultValue={record.leaf_traits} />
          <Input name="flower_fruit_traits" label={t.flowerFruit} defaultValue={record.flower_fruit_traits} />
          <Input name="health_status" label={t.health} defaultValue={record.health_status} />
          <Input name="other_traits" label={t.otherTraits} defaultValue={record.other_traits} />
          <button className="btn" type="submit">{t.submitAgain}</button>
        </form>
      ) : (
        <dl className="surface mt-4 grid gap-3 p-4 text-sm sm:grid-cols-2">
          <Row label={t.place} value={record.location_name} />
          <Row label={t.gps} value={record.latitude != null ? `${record.latitude}, ${record.longitude}` : null} />
          <Row label={t.height} value={record.height_m} />
          <Row label={t.trunkDiameter} value={record.trunk_diameter_cm} />
          <Row label={t.leaves} value={record.leaf_traits} />
          <Row label={t.flowerFruit} value={record.flower_fruit_traits} />
          <Row label={t.health} value={record.health_status} />
          <Row label={t.other} value={record.other_traits} />
        </dl>
      )}

      {record.status === "approved" && !record.qr_code && (
        <form action={generateQr} className="mt-4">
          <input type="hidden" name="id" value={record.uuid} />
          <button className="btn" type="submit">{t.generateQr}</button>
        </form>
      )}
      {qrImage && record.qr_code && (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImage} alt={t.qrCode} width={160} height={160} />
          <p className="text-sm">
            {t.publicPage}: <Link href={`/p/${record.qr_code}`}>/p/{record.qr_code}</Link>
          </p>
        </div>
      )}
    </main>
  );
}

function Input({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | number | null }) {
  return (
    <label className="block text-sm">
      {label}
      <input className="mt-1 w-full rounded-lg border px-3 py-2" name={name} defaultValue={defaultValue ?? ""} />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="text-neutral-700">{value ?? "—"}</dd>
    </div>
  );
}
