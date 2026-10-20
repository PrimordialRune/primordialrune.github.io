"use client";

import { useId } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";

// Omar's logo, the narrator's face. The inner fill turns the AI's warning red with the
// story: stage 1 a lower band, stage 2 all of it (P4: that red belongs to the AI only).
export default function Logo({
  stage = 0,
  size = 28,
  outer = "var(--peacock)",
  className,
  title,
}: {
  stage?: number;
  size?: number;
  outer?: string;
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const inner = stage >= 2 ? "var(--ai-red)" : "var(--blood-orange)";
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 554.72 555"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-stage={stage}
    >
      <path d={LOGO_OUTER} fill={outer} />
      <path d={LOGO_INNER} fill={inner} />
      {stage === 1 && (
        <>
          <clipPath id={`band-${id}`}>
            <rect x="0" y="330" width="555" height="230" />
          </clipPath>
          <path d={LOGO_INNER} fill="var(--ai-red)" clipPath={`url(#band-${id})`} />
        </>
      )}
    </svg>
  );
}
