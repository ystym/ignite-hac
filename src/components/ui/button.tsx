"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[14px] font-normal tracking-[-0.01em] transition-transform duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-focus focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-action text-white hover:bg-[#0071e3]",
        violet: "bg-action text-white hover:bg-[#0071e3]",
        sky: "bg-action text-white hover:bg-[#0071e3]",
        outline:
          "border border-action bg-transparent text-action hover:bg-[#f0f7ff]",
        secondary:
          "border border-[#e0e0e0] bg-pearl text-ink-800 hover:bg-white",
        ghost: "text-ink-600 hover:bg-black/[0.05] hover:text-ink-900",
        subtle: "bg-[#e8e8ed] text-ink-800 hover:bg-[#dcdce1]",
        danger: "bg-[#d70015] text-white hover:bg-[#b80012]",
        white: "bg-white text-ink-900 hover:bg-[#f5f5f7]",
        link: "h-auto rounded-none p-0 text-action underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-4 text-[13px]",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-[16px]",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
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
