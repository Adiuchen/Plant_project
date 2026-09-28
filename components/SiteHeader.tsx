import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ProfilePanel } from "@/components/ProfilePanel";
import { homeForRole, getSessionProfile } from "@/lib/auth";
import { getCopy, statusText } from "@/lib/i18n";

export async function SiteHeader() {
  const { profile } = await getSessionProfile();
  const { locale, t } = await getCopy();

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={profile ? homeForRole(profile.role) : "/"} className="flex items-center gap-2 font-semibold text-forest">
          <BrandMark />
          {t.siteName}
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {profile ? (
            <>
              <Link href="/dashboard" className="rounded-full px-3 py-1.5 hover:bg-emerald-50">
                {t.dashboard}
              </Link>
              <ProfilePanel profile={profile} locale={locale} t={t} roleLabel={statusText(profile.role, t)} />
            </>
          ) : (
            <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-emerald-50">
              {t.search}
            </Link>
          )}
          {!profile && (
            <Link href="/login" className="btn ml-1">
              {t.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
