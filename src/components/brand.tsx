import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = 36,
  tone = "dark",
}: {
  className?: string;
  size?: number;
  tone?: "dark" | "light";
}) {
  // Flat mark only — one surface, one blue accent. No gradients.
  const tile = tone === "dark" ? "#1d1d1f" : "#ffffff";
  const glyph = tone === "dark" ? "#ffffff" : "#1d1d1f";
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <rect width="48" height="48" rx="11" fill={tile} />
        <path
          d="M12 33V15h5.8l6.2 10.1L30.2 15H36v18h-5.1V24.1L25 33h-1.9l-6-8.9V33H12Z"
          fill={glyph}
        />
        <circle cx="38.5" cy="9.5" r="4.5" fill="#0066cc" />
      </svg>
    </span>
  );
}

export function BrandLockup({
  href = "/",
  compact = false,
  inverse = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="STUDYMATE AI home"
    >
      <BrandMark tone={inverse ? "light" : "dark"} size={compact ? 30 : 34} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[15px] font-semibold tracking-[-0.025em]",
            inverse ? "text-white" : "text-ink-900",
          )}
        >
          STUDYMATE <span className={inverse ? "text-action-dark" : "text-action"}>AI</span>
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 text-[9px] font-medium uppercase tracking-[0.16em]",
              inverse ? "text-white/50" : "text-ink-400",
            )}
          >
            Study intelligence
          </span>
        )}
      </span>
    </Link>
  );
}
