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
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <defs>
          <linearGradient id="brand-bg" x1="0" y1="0" x2="48" y2="48">
            <stop stopColor={tone === "dark" ? "#171D45" : "#FFFFFF"} />
            <stop offset="1" stopColor={tone === "dark" ? "#0F1433" : "#EDEAFF"} />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="13" fill="url(#brand-bg)" />
        <path
          d="M12 33V15h5.8l6.2 10.1L30.2 15H36v18h-5.1V24.1L25 33h-1.9l-6-8.9V33H12Z"
          fill={tone === "dark" ? "#FFFFFF" : "#0F1433"}
        />
        <circle cx="38" cy="10" r="6" fill="#7C53FF" />
        <circle cx="38" cy="10" r="2.2" fill="#D5C9FF" />
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
      <BrandMark tone={inverse ? "light" : "dark"} size={compact ? 32 : 38} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[15px] font-extrabold tracking-[-0.03em]",
            inverse ? "text-white" : "text-ink-900",
          )}
        >
          STUDYMATE{" "}
          <span className={inverse ? "text-violet-300" : "text-violet-600"}>AI</span>
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 text-[9px] font-semibold uppercase tracking-[0.19em]",
              inverse ? "text-white/45" : "text-ink-400",
            )}
          >
            Study intelligence
          </span>
        )}
      </span>
    </Link>
  );
}
