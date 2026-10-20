"use client";

// The CRT: a Trinitron-style rounded glass with a teal ring, frame only. A static 4% scanline
// layer at rest (never over the manual, contact or card values), and the glitch layers fx.ts drives.

import { useEffect, useRef } from "react";
import { registerTube } from "./fx";

export default function Tube({ children }: { children: React.ReactNode }) {
  const tube = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerTube(tube.current, glass.current);
    return () => registerTube(null, null);
  }, []);
  return (
    <div className="tube" ref={tube}>
      <div className="glass" ref={glass}>
        <div className="glass-content">{children}</div>
        <div className="scan" aria-hidden="true" />
        <div className="fx-static" aria-hidden="true" />
        <div className="fx-tear" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>
      <div className="fx-bezel" aria-hidden="true" />
    </div>
  );
}
