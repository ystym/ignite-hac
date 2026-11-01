"use client";

import katex from "katex";
import { cn } from "@/lib/utils";

function looksLikeMath(value: string): boolean {
  return /\\|\^|_|=|∫|√|≤|≥|→|Δ/.test(value);
}

/**
 * Formulas come from the model or the curated dataset. KaTeX is run with
 * `trust: false`; we never inject arbitrary HTML/scripts from model output.
 */
export function MathText({
  value,
  displayMode = false,
  className,
}: {
  value: string;
  displayMode?: boolean;
  className?: string;
}) {
  if (!looksLikeMath(value)) {
    return <span className={className}>{value}</span>;
  }

  let html: string | null = null;
  try {
    html = katex.renderToString(value.replace(/^\$+|\$+$/g, ""), {
      throwOnError: false,
      displayMode,
      strict: "ignore",
      trust: false,
      output: "html",
    });
  } catch {
    html = null;
  }

  if (!html) return <span className={cn("font-mono text-[13px]", className)}>{value}</span>;

  return (
    <span
      className={cn(displayMode && "formula block", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
