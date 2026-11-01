"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/utils";

/**
 * Renders a relative timestamp without causing an SSR hydration mismatch.
 *
 * The server and the browser evaluate "x minutes ago" at slightly different
 * moments. React suppresses that one text node, then this component refreshes
 * the label on the client and every 30 seconds afterwards.
 */
export function TimeAgo({
  value,
  className,
  title,
}: {
  value: string | Date;
  className?: string;
  title?: string;
}) {
  const iso = typeof value === "string" ? value : value.toISOString();
  const [label, setLabel] = useState(() => relativeTime(value));

  useEffect(() => {
    setLabel(relativeTime(value));
    const timer = window.setInterval(() => setLabel(relativeTime(value)), 30_000);
    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <time dateTime={iso} title={title ?? iso} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
