import Link from "next/link";
import { requireUser, type Profile } from "@/lib/auth";
import { statusLabel } from "@/lib/format";

const cards: Record<Profile["role"], { href: string; title: string; text: string }[]> = {
  botanist: [
    { href: "/botanist", title: "My records", text: "See the plants you submitted and their review status." },
    { href: "/botanist/new", title: "New record", text: "Register a plant in the field." },
  ],
  conservation_officer: [
    { href: "/officer", title: "Review records", text: "Approve, reject, or ask for changes." },
    { href: "/officer/species", title: "Species", text: "Add and edit plant knowledge." },
    { href: "/officer/map", title: "Distribution map", text: "See exact locations of recorded plants." },
  ],
  administrator: [
    { href: "/admin", title: "Users", text: "Create botanist and officer accounts." },
    { href: "/admin/iot", title: "IoT", text: "Sensors, readings, and alerts." },
  ],
  visitor: [],
};

export default async function DashboardPage() {
  const { profile } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const items = cards[profile.role];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl bg-forest px-6 py-8 text-white shadow-sm">
        <p className="text-sm text-emerald-100">Niah National Park</p>
        <h1 className="mt-1 text-3xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm text-emerald-50">
          {profile.name} · {profile.id}
          <span className="ml-2 rounded-full bg-white/15 px-2.5 py-0.5">{statusLabel(profile.role)}</span>
        </p>
      </section>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="surface block p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-medium text-lg">{item.title}</span>
              <span className="mt-1 block text-sm text-neutral-600">{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
