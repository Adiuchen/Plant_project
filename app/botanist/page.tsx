import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { PendingDrafts } from "@/components/PendingDrafts";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

export default async function BotanistHome() {
  const { supabase, user } = await requireUser(["botanist"]);
  const { t } = await getCopy();
  const { data: records, error } = await supabase
    .from("plant_records")
    .select("uuid, id, status, location_name, recorded_at, qr_code, review_note, species(scientific_name)")
    .eq("botanist_id", user.id)
    .order("recorded_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageHeading
        backLabel={t.backPage}
        title={t.fieldRecords}
        extra={<Link className="btn" href="/botanist/new">{t.newRecord}</Link>}
      />
      {error && <p className="mt-4 text-sm text-red-700">{error.message}</p>}
      <PendingDrafts t={t} />
      <div className="surface mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-emerald-50 text-left text-forest">
              <th className="p-3 font-medium">{t.species}</th>
              <th className="p-3 font-medium">{t.place}</th>
              <th className="p-3 font-medium">{t.status}</th>
              <th className="p-3 font-medium">{t.review}</th>
            </tr>
          </thead>
          <tbody>
            {(records ?? []).map((record) => {
              const species = Array.isArray(record.species) ? record.species[0] : record.species;
              return (
                <tr key={record.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link className="font-medium hover:underline" href={`/botanist/${record.uuid}`}>{record.id} · {species?.scientific_name || t.unidentified}</Link>
                  </td>
                  <td className="p-3">{record.location_name || "—"}</td>
                  <td className="p-3"><StatusBadge status={record.status} /></td>
                  <td className="p-3">{record.review_note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
