"use client";

import { useRouter } from "next/navigation";

export function BackPage({ label, className }: { label: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => router.back()}
      className={className ?? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-forest bg-white text-sm font-semibold leading-none text-forest hover:bg-emerald-50"}
    >
      &lt;
    </button>
  );
}
