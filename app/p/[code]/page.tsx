import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PhotoList } from "@/components/PhotoList";
import { getCopy } from "@/lib/i18n";

export default async function PublicPlantPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: plant } = await supabase
    .from("public_plant_pages")
    .select("*")
    .eq("qr_code", code)
    .maybeSingle();

  if (!plant) notFound();
  const { t } = await getCopy();

  const { data: photos } = await supabase
    .from("public_plant_photos")
    .select("id, storage_path, caption")
    .eq("qr_code", code);

  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const pageUrl = `${proto}://${host}/p/${code}`;
  const qr = await QRCode.toDataURL(pageUrl);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <article className="surface px-6 py-7">
      <h1 className="text-3xl font-semibold">{plant.scientific_name}</h1>
      <p className="text-neutral-700">
        {[plant.common_name, plant.local_name].filter(Boolean).join(" · ")}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <Field label={t.familyGenus} value={[plant.family, plant.genus].filter(Boolean).join(" · ")} />
        <Field label={t.conservationStatus} value={plant.conservation_status} />
        <Field label={t.distribution} value={plant.distribution} />
        <Field label={t.description} value={plant.description} />
        <Field label={t.ecology} value={plant.ecological_info} />
        <Field label={t.cultural} value={plant.cultural_significance} />
        <Field label={t.healthOfPlant} value={plant.health_status} />
      </dl>
      <PhotoList photos={photos ?? []} />
      <div className="mt-6">
        {/* QR image is generated on the server for this public page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={t.qrCode} width={160} height={160} />
        <p className="text-xs text-neutral-500">{pageUrl}</p>
      </div>
      </article>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
