import type { ReactNode } from "react";
import { BackPage } from "@/components/BackPage";
import { StickyBar } from "@/components/StickyBar";

export function PageHeading({
  backLabel,
  title,
  extra,
  className,
  titleClassName = "text-2xl font-semibold",
  backClassName,
  sticky = true,
}: {
  backLabel: string;
  title: ReactNode;
  extra?: ReactNode;
  className?: string;
  titleClassName?: string;
  backClassName?: string;
  sticky?: boolean;
}) {
  const row = (
    <div className={className ?? "flex flex-wrap items-center justify-between gap-3"}>
      <div className="flex flex-wrap items-center gap-3">
        <BackPage label={backLabel} className={backClassName} />
        <h1 className={titleClassName}>{title}</h1>
      </div>
      {extra}
    </div>
  );

  if (!sticky) return row;
  return <StickyBar>{row}</StickyBar>;
}
