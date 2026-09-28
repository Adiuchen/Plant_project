import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getCopy, statusText } from "@/lib/i18n";
import { generateQr, resubmit } from "../actions";

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

  const { data: species } = await supabase.from("species").select("uuid, id, scientific_name").order("scientific_name");
  const speciesName = Array.isArray(record.species) ? record.species[0]?.scientific_name : record.species?.scientific_name;
  const editable = record.status === "draft" || record.status === "needs_revision";

  let qrImage: string | null = null;
  if (record.qr_code) {
    const headerStore = await headers();
    const host = headerStore.get("host") ?? "localhost:3000";
    const proto = headerStore.get("x-forwarded-proto") ?? "http";
    qrImage = await QRCode.toDataURL(`${proto}://${host}/p/${record.qr_code}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/botanist" className="text-sm">{t.back}</Link>
      <h1 className="mt-2 text-2xl font-semibold">{speciesName || t.unidentifiedPlant}</h1>
      <p className="text-sm">{t.status}: {statusText(record.status, t)}</p>
      {record.review_note && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm">{t.officerNote}: {record.review_note}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

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
        <dl className="mt-4 space-y-1 text-sm">
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
      <input className="mt-1 w-full rounded border px-2 py-1" name={name} defaultValue={defaultValue ?? ""} />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="inline font-medium">{label}: </dt>
      <dd className="inline">{value ?? "—"}</dd>
    </div>
  );
}
