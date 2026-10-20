// CRT "tape" bursts: the tube is clean at rest and only shows VHS artefacts
// (noise, tracking band, head-switch tear, OSD text) when something happens.

export const CRT_BURST_EVENT = "primordialrune:crt-burst";

export interface CRTBurstDetail {
  strength?: number; // 1 = channel change, 2-3 = heavy tear
  osd?: string; // text shown top-left during the burst, e.g. "CH 02"
}

export function triggerBurst(detail: CRTBurstDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CRTBurstDetail>(CRT_BURST_EVENT, { detail }));
}

// Follows the site's motion setting (AUTO = the system preference, or FULL / QUIET)
export { isQuiet as prefersReducedMotion } from "./motion";
