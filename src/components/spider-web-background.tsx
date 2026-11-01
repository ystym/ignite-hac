import { cn } from "@/lib/utils";

/**
 * A faint, decorative spider-web layer behind the whole site.
 * It is fixed, pointer-events-free and hidden from assistive technology.
 * Kept low-contrast so it reads as texture rather than decoration.
 */
function Web({ className }: { className?: string }) {
  const angles = [6, 18, 30, 42, 54, 66, 78, 90];
  const rings = [64, 132, 204, 282, 366, 456];
  const spokes = angles.map((degrees) => {
    const radians = (degrees * Math.PI) / 180;
    return {
      x: Math.cos(radians) * 540,
      y: Math.sin(radians) * 540,
    };
  });

  const arcs = rings.flatMap((radius) =>
    angles.slice(0, -1).map((degrees, index) => {
      const a1 = (degrees * Math.PI) / 180;
      const a2 = (angles[index + 1] * Math.PI) / 180;
      const mid = (a1 + a2) / 2;
      const x1 = Math.cos(a1) * radius;
      const y1 = Math.sin(a1) * radius;
      const x2 = Math.cos(a2) * radius;
      const y2 = Math.sin(a2) * radius;
      const cx = Math.cos(mid) * radius * 0.82;
      const cy = Math.sin(mid) * radius * 0.82;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }),
  );

  const knots = [
    [132, 30],
    [204, 54],
    [282, 18],
    [366, 66],
    [456, 42],
  ].map(([radius, degrees]) => {
    const radians = (degrees * Math.PI) / 180;
    return { x: Math.cos(radians) * radius, y: Math.sin(radians) * radius };
  });

  return (
    <svg
      viewBox="0 0 560 560"
      fill="none"
      className={cn("text-ink-900", className)}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        {spokes.map((point, index) => (
          <line key={`spoke-${index}`} x1="0" y1="0" x2={point.x} y2={point.y} />
        ))}
        {arcs.map((path, index) => (
          <path key={`arc-${index}`} d={path} />
        ))}
      </g>
      <g fill="currentColor">
        {knots.map((knot, index) => (
          <circle key={`knot-${index}`} cx={knot.x} cy={knot.y} r="1.6" />
        ))}
      </g>
    </svg>
  );
}

export function SpiderWebBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "no-print pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <Web className="absolute -left-28 -top-28 h-[420px] w-[420px] opacity-[0.075] sm:h-[560px] sm:w-[560px]" />
      <Web className="absolute -right-28 -top-28 h-[420px] w-[420px] -scale-x-100 opacity-[0.065] sm:h-[560px] sm:w-[560px]" />
      <Web className="absolute -bottom-32 -right-32 h-[440px] w-[440px] -scale-100 opacity-[0.05] sm:h-[600px] sm:w-[600px]" />
      <Web className="absolute -bottom-24 -left-24 h-[320px] w-[320px] -scale-y-100 opacity-[0.045] sm:h-[420px] sm:w-[420px]" />
    </div>
  );
}
