import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full border border-[#d2d2d7] bg-white text-[15px] text-ink-900 transition placeholder:text-ink-400 focus:border-action-focus focus:outline-none focus:ring-4 focus:ring-[#0071e3]/10 disabled:cursor-not-allowed disabled:bg-parchment disabled:text-ink-400";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "h-11 rounded-full px-5",
        invalid && "border-[#d70015] focus:border-[#d70015] focus:ring-[#d70015]/10",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      fieldBase,
      "flex min-h-[120px] resize-y rounded-2xl px-4 py-3 leading-6",
      invalid && "border-[#d70015] focus:border-[#d70015] focus:ring-[#d70015]/10",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-[13px] font-semibold tracking-[-0.01em] text-ink-700", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        fieldBase,
        "flex h-11 appearance-none rounded-full bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%236e6e73%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat py-0 pl-5 pr-10 text-[14px]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export { Input, Textarea, Label, Select };
