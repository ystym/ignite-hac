import { AlertTriangle, CheckCircle2, Info, ShieldAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS: Record<
  "info" | "warning" | "danger" | "success",
  { icon: LucideIcon; className: string; iconClass: string }
> = {
  info: {
    icon: Info,
    className: "border-sky-200 bg-sky-50/75 text-sky-950",
    iconClass: "text-sky-600",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50/80 text-amber-950",
    iconClass: "text-amber-600",
  },
  danger: {
    icon: ShieldAlert,
    className: "border-rose-200 bg-rose-50/80 text-rose-950",
    iconClass: "text-rose-600",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
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
    <div className={cn("rounded-2xl border p-4 sm:p-5", config.className, className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {title && <p className="text-sm font-bold">{title}</p>}
          <div className="text-[13px] leading-6 opacity-90">{children}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
