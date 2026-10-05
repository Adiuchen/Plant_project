import type { ReactNode } from "react";
import { BackPage } from "@/components/BackPage";
import { StickyBar } from "@/components/StickyBar";

export function RecordTopic({
  backLabel,
  title,
  subtitle,
  children,
}: {
  backLabel: string;
  title: string;
  subtitle?: string | null;
  children?: ReactNode;
}) {
  return (
    <StickyBar>
      <div className="flex items-center gap-3">
        <BackPage label={backLabel} />
        <h1 className="min-w-0 truncate text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="min-w-0 truncate text-sm text-neutral-600">{subtitle}</p> : null}
        {children ? <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div> : null}
      </div>
    </StickyBar>
  );
}
