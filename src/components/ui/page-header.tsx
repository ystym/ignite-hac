import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[clamp(1.85rem,2.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-ink-900">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-[14.5px] leading-6 text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
