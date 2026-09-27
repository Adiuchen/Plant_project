import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ProfilePanel } from "@/components/ProfilePanel";
import { homeForRole, getSessionProfile } from "@/lib/auth";

export async function SiteHeader() {
  const { profile } = await getSessionProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={profile ? homeForRole(profile.role) : "/"} className="flex items-center gap-2 font-semibold text-forest">
          <BrandMark />
          Plant Records
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {profile ? (
            <>
              <Link href="/dashboard" className="rounded-full px-3 py-1.5 hover:bg-emerald-50">
                Dashboard
              </Link>
              <ProfilePanel profile={profile} />
            </>
          ) : (
            <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-emerald-50">
              Search
            </Link>
          )}
          {!profile && (
            <Link href="/login" className="btn ml-1">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
