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
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[clamp(1.65rem,2.4vw,2.2rem)] font-extrabold leading-[1.12] text-ink-900">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
