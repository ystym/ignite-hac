"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[-0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-ink-900 text-white shadow-[0_10px_24px_-12px_rgba(15,20,51,0.7)] hover:bg-ink-800 hover:shadow-[0_14px_28px_-12px_rgba(15,20,51,0.72)]",
        violet:
          "bg-violet-600 text-white shadow-[0_12px_28px_-12px_rgba(106,59,250,0.8)] hover:bg-violet-700 hover:shadow-[0_16px_32px_-12px_rgba(106,59,250,0.85)]",
        outline:
          "border border-slate-200 bg-white text-ink-800 shadow-sm hover:border-slate-300 hover:bg-slate-50",
        secondary:
          "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100",
        ghost: "text-ink-600 hover:bg-ink-900/[0.055] hover:text-ink-900",
        subtle: "bg-slate-100 text-ink-700 hover:bg-slate-200/80",
        danger:
          "bg-rose-600 text-white shadow-[0_10px_24px_-12px_rgba(225,29,72,0.65)] hover:bg-rose-700",
        white:
          "bg-white text-ink-900 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.4)] hover:bg-violet-50",
        link: "h-auto rounded-none p-0 text-violet-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-5 text-[15px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
        none: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
