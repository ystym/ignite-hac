import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 tracking-[-0.005em]",
  {
    variants: {
      variant: {
        default: "border-hairline bg-white text-ink-600",
        violet: "border-[#b9dcff] bg-[#f0f7ff] text-[#0055b3]",
        navy: "border-ink-900 bg-ink-900 text-white",
        green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        orange: "border-orange-200 bg-orange-50 text-orange-700",
        rose: "border-rose-200 bg-rose-50 text-rose-700",
        blue: "border-[#b9dcff] bg-[#f0f7ff] text-[#0055b3]",
        sky: "border-[#b9dcff] bg-[#f0f7ff] text-[#0055b3]",
        white: "border-white/20 bg-white/10 text-white",
      },
      size: {
        sm: "px-2 py-0 text-[10px]",
        md: "",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
