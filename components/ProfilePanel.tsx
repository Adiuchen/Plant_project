"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/app/login/actions";
import { saveEmail, type SaveEmailState } from "@/app/profile/actions";
import { statusLabel } from "@/lib/format";

type ProfileSummary = {
  name: string;
  id: string;
  email: string | null;
  role: string;
};

export function ProfilePanel({ profile }: { profile: ProfileSummary }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, formAction, pending] = useActionState(saveEmail, null as SaveEmailState);
  const email = state?.email ?? profile.email;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className="relative rounded-full px-3 py-1.5 pr-4 hover:bg-emerald-50" type="button" onClick={() => setOpen(true)}>
        Profile
        {!email && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600" />}
      </button>
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-950/30" onMouseDown={() => setOpen(false)}>
          <div className="flex min-h-full justify-center p-4 sm:p-8">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-title"
              className="m-auto w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-100 px-4 py-2.5">
                <h2 id="profile-title" className="text-sm font-semibold">
                  Profile
                </h2>
                <button
                  className="grid h-7 w-7 place-items-center rounded-md text-lg leading-none text-neutral-600 hover:bg-neutral-200"
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 font-semibold text-forest">
                    {profile.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-neutral-600">
                      {profile.id} · {statusLabel(profile.role)}
                    </p>
                  </div>
                </div>
                {!email && (
                  <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                    Add a personal email so you can reset your password later.
                  </p>
                )}
                {state?.saved && <p className="mt-4 text-sm text-green-800">Email saved.</p>}
                {state?.error && <p className="mt-4 text-sm text-red-700">{state.error}</p>}
                <form action={formAction} className="mt-4 space-y-3">
                  <label className="block text-sm">
                    Personal email
                    <input
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      name="email"
                      type="email"
                      defaultValue={email ?? ""}
                      key={email ?? ""}
                      required
                    />
                  </label>
                  <button className="btn" type="submit" disabled={pending}>
                    {pending ? "Saving…" : "Save"}
                  </button>
                </form>
                <form action={logout} className="mt-6 border-t border-neutral-200 pt-4">
                  <button className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700" type="submit">
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
