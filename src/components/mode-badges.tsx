import { Badge } from "@/components/ui/badge";
import { confidenceMeta, cn, percent } from "@/lib/utils";

export function ConfidenceBadge({
  score,
  showValue = true,
  className,
  labelOverride,
}: {
  score: number | null | undefined;
  showValue?: boolean;
  className?: string;
  labelOverride?: string;
}) {
  const meta = confidenceMeta(score);
  const variant =
    meta.tone === "high"
      ? "green"
      : meta.tone === "medium"
        ? "amber"
        : meta.tone === "low"
          ? "orange"
          : "rose";
  return (
    <Badge
      variant={variant}
      className={cn("font-semibold", className)}
      title="Model-reported extraction confidence. This is a self-assessment, not a calibrated probability."
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.barClass)} aria-hidden="true" />
      {labelOverride ?? (score == null ? "Not scored" : `${meta.label} confidence`)}
      {showValue && score != null && (
        <span className="font-mono text-[10px] opacity-70">{percent(score)}</span>
      )}
    </Badge>
  );
}

export function ConfidenceBar({
  score,
  label = "Extraction confidence",
  className,
}: {
  score: number | null | undefined;
  label?: string;
  className?: string;
}) {
  const meta = confidenceMeta(score);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium">
        <span className="text-ink-400">{label}</span>
        <span className={meta.textClass}>
          {score == null ? "Not scored" : `${meta.label} · ${percent(score)}`}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
        title="Model-reported confidence, not a calibrated probability."
      >
        <div
          className={cn("h-full rounded-full", meta.barClass)}
          style={{ width: `${Math.round((score ?? 0) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function ModeBadge({
  mode,
  context = "output",
  className,
}: {
  mode: "LIVE" | "DEMO" | string;
  context?: "output" | "index";
  className?: string;
}) {
  if (mode === "LIVE") {
    return (
      <Badge
        variant="green"
        className={className}
        title="This output was produced by a live Gemini call in this workspace."
      >
        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" />
        Live AI
      </Badge>
    );
  }
  return (
    <Badge
      variant="amber"
      className={className}
      title={
        context === "index"
          ? "Demo retrieval uses local hashed-token vectors, not an AI embedding model."
          : "Curated sample output authored for this demo. It was not produced by a live model run."
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {context === "index" ? "Local demo index" : "Curated demo"}
    </Badge>
  );
}

export function OutputSourceTag({
  source,
  className,
}: {
  source: "extracted" | "ai" | "manual";
  className?: string;
}) {
  if (source === "ai") {
    return (
      <Badge variant="violet" className={className}>
        AI-generated interpretation
      </Badge>
    );
  }
  if (source === "manual") {
    return (
      <Badge variant="green" className={className}>
        Human-corrected
      </Badge>
    );
  }
  return (
    <Badge variant="default" className={className}>
      Extracted source
    </Badge>
  );
}
