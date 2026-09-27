import { requireUser } from "@/lib/auth";
import { statusLabel } from "@/lib/format";
import { createAccount, updateAccount } from "./actions";

const roles = [
  { value: "botanist", label: "Botanist" },
  { value: "conservation_officer", label: "Officer" },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
  const { supabase } = await requireUser(["administrator"]);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("uuid, id, name, email, role, status")
    .order("name");
  const { data: logs } = await supabase
    .from("login_logs")
    .select("id, created_at, success, profiles(name, id)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Users</h1>
      {(error || profileError) && (
        <p className="mt-3 text-sm text-red-700">{error || profileError?.message}</p>
      )}
      {created && (
        <p className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-900">
          Account created. Login ID is {created}.
        </p>
      )}

      <form action={createAccount} className="mt-4 grid gap-2 surface p-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-medium">Create account</h2>
        <p className="sm:col-span-2 text-sm text-neutral-600">
          The login ID is assigned automatically. Botanists get B001, B002. Officers get O001, O002.
        </p>
        <input className="rounded border px-2 py-1" name="full_name" placeholder="Full name" required />
        <input className="rounded border px-2 py-1" name="password" type="password" placeholder="Password" minLength={6} required />
        <select className="rounded border px-2 py-1" name="role" defaultValue="botanist">
          {roles.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <button className="btn sm:col-span-2" type="submit">Create</button>
      </form>

      <div className="mt-6 space-y-3">
        {(profiles ?? []).map((profile) => (
          <form key={profile.uuid} action={updateAccount} className="flex flex-wrap items-center gap-2 surface p-3 text-sm">
            <input type="hidden" name="id" value={profile.uuid} />
            <span className="min-w-24 font-medium">{profile.id}</span>
            <span className="min-w-40">{profile.name}</span>
            <span className="text-neutral-500">{profile.email || "—"}</span>
            {profile.role === "botanist" || profile.role === "conservation_officer" ? (
              <select className="rounded border px-2 py-1" name="role" defaultValue={profile.role}>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            ) : (
              <>
                <input type="hidden" name="role" value={profile.role} />
                <span>{statusLabel(profile.role)}</span>
              </>
            )}
            <select className="rounded border px-2 py-1" name="status" defaultValue={profile.status}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button className="rounded border px-2 py-1" type="submit">Save</button>
          </form>
        ))}
      </div>

      <h2 className="mt-8 text-xl font-semibold">Recent logins</h2>
      <ul className="mt-2 divide-y surface text-sm">
        {(logs ?? []).map((log) => {
          const person = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
          return (
            <li key={log.id} className="px-3 py-2">
              {person?.name || person?.id || "Unknown"} · {new Date(log.created_at).toLocaleString()} · {log.success ? "Success" : "Failed"}
            </li>
          );
        })}
        {(logs ?? []).length === 0 && <li className="px-3 py-4 text-neutral-500">No logins yet.</li>}
      </ul>
    </main>
  );
}
