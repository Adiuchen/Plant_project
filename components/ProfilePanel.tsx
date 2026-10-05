"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { saveEmail, setLocale, type SaveEmailState } from "@/app/profile/actions";
import type { Copy, Locale } from "@/lib/i18n";

type ProfileSummary = {
  name: string;
  id: string;
  email: string | null;
  role: string;
};

export type ProfileNotice = {
  id: string;
  href: string;
  title: string;
  detail: string;
};

export function ProfilePanel({
  profile,
  locale,
  t,
  roleLabel,
  notices,
}: {
  profile: ProfileSummary;
  locale: Locale;
  t: Copy;
  roleLabel: string;
  notices: ProfileNotice[];
}) {
  const [state, formAction, pending] = useActionState(saveEmail, null as SaveEmailState);
  const email = state?.email ?? profile.email;
  const initial = profile.name.slice(0, 1).toUpperCase();

  return (
    <>
      <button
        id="profile-trigger"
        className="relative inline-flex items-center gap-2 rounded-full border border-emerald-950/15 bg-white px-3 py-1.5 hover:bg-emerald-50"
        type="button"
        popoverTarget="profile-menu"
        popoverTargetAction="toggle"
      >
        {t.profile}
        {notices.length > 0 ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {notices.length}
          </span>
        ) : !email ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600" />
        ) : null}
      </button>
      <div id="profile-menu" popover="auto" role="menu">
        <div className="px-3 pt-3">
          <p className="flex items-center gap-2 px-2 text-sm font-medium">
            <BellIcon />
            {t.notifications}
          </p>
          {notices.length === 0 ? (
            <p className="px-2 py-3 text-sm text-white/60">{t.noNotifications}</p>
          ) : (
            <ul className="mt-1 max-h-64 space-y-1 overflow-y-auto pb-2">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <Link href={notice.href} className="block rounded-lg px-2 py-2 hover:bg-white/10">
                    <span className="block text-sm">{notice.title}</span>
                    <span className="mt-0.5 block text-xs text-white/60">{notice.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form action={formAction} className="space-y-2 border-t border-white/10 px-3 py-3">
          {!email && <p className="text-xs text-amber-200">{t.emailReminder}</p>}
          {state?.saved && <p className="text-xs text-emerald-300">{t.emailSaved}</p>}
          {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
          <label className="block text-xs text-white/60">
            {t.personalEmail}
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-white px-2 py-1.5 text-sm text-ink"
              name="email"
              type="email"
              defaultValue={email ?? ""}
              key={email ?? ""}
              required
            />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? t.saving : t.save}
          </button>
        </form>
        <form action={setLocale} className="border-t border-white/10 px-3 py-3">
          <label className="block text-xs text-white/60">
            {t.language}
            <select
              className="mt-1 w-full rounded-lg border border-white/15 bg-white px-2 py-1.5 text-sm text-ink"
              name="locale"
              defaultValue={locale}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="en">{t.english}</option>
              <option value="ms">{t.malay}</option>
            </select>
          </label>
        </form>
        <div className="flex items-center gap-3 border-t border-white/10 px-3 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-700 text-sm font-semibold">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile.name}</p>
            <p className="truncate text-xs text-white/60">{profile.id} · {roleLabel}</p>
          </div>
          <form action={logout}>
            <button className="rounded-lg px-2 py-1 text-sm text-white/80 hover:bg-white/10" type="submit">
              {t.logout}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
