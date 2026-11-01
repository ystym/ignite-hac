import { AlertTriangle, CheckCircle2, Info, ShieldAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS: Record<
  "info" | "warning" | "danger" | "success",
  { icon: LucideIcon; className: string; iconClass: string }
> = {
  info: {
    icon: Info,
    className: "border-[#d2d2d7] bg-[#f5f5f7] text-ink-800",
    iconClass: "text-action",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50/70 text-amber-950",
    iconClass: "text-amber-600",
  },
  danger: {
    icon: ShieldAlert,
    className: "border-rose-200 bg-rose-50/70 text-rose-950",
    iconClass: "text-rose-600",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50/70 text-emerald-950",
    iconClass: "text-emerald-600",
  },
};

export function Callout({
  variant = "info",
  title,
  children,
  action,
  className,
}: {
  variant?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const config = VARIANTS[variant];
  const Icon = config.icon;
  return (
    <div className={cn("rounded-2xl border px-4 py-4 sm:px-5", config.className, className)}>
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", config.iconClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {title && <p className="text-[14px] font-semibold leading-5">{title}</p>}
          <div className="text-[13.5px] leading-6 opacity-85">{children}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
