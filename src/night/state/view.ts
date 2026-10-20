// The view reducer and its hash mirror. One route; every view is client state.
import type { CeremonyMode, ProjectId, Side, View } from "../types";
import { PROJECT_IDS } from "../types";

export interface ViewState {
  view: View;
  /** how the current (or last) ceremony plays */
  mode: CeremonyMode;
  /** increments when the visitor skips a ceremony */
  skipToken: number;
  /** side the manual opens on when the ceremony ends */
  pendingSide: Side;
}

export type ViewAction =
  | { type: "open"; id: ProjectId; mode: CeremonyMode; side?: Side }
  | { type: "ready" }
  | { type: "close"; mode: CeremonyMode }
  | { type: "side"; side: Side }
  | { type: "show"; view: View }
  | { type: "skip" };

export const INITIAL_VIEW: ViewState = {
  view: { kind: "desk" },
  mode: "full",
  skipToken: 0,
  pendingSide: "A",
};

export function viewReducer(s: ViewState, a: ViewAction): ViewState {
  const v = s.view;
  switch (a.type) {
    case "open":
      return { ...s, view: { kind: "ceremony", id: a.id }, mode: a.mode, pendingSide: a.side ?? "A" };
    case "ready":
      if (v.kind !== "ceremony") return s;
      if (v.reverse) return { ...s, view: { kind: "desk" } };
      return { ...s, view: { kind: "manual", id: v.id, side: s.pendingSide } };
    case "close":
      if (v.kind === "manual") return { ...s, view: { kind: "ceremony", id: v.id, reverse: true }, mode: a.mode, pendingSide: v.side };
      if (v.kind === "ceremony") {
        // closing mid-ceremony: run it backwards from wherever it is
        return v.reverse ? s : { ...s, view: { kind: "ceremony", id: v.id, reverse: true }, mode: a.mode };
      }
      if (v.kind === "desk") return s;
      return { ...s, view: { kind: "desk" } };
    case "side":
      return v.kind === "manual" && v.id === "crossfader" ? { ...s, view: { ...v, side: a.side } } : s;
    case "show":
      return { ...s, view: a.view };
    case "skip":
      return v.kind === "ceremony" ? { ...s, skipToken: s.skipToken + 1 } : s;
  }
}

/** The hash a view is mirrored to ("" = the desk) */
export function viewHash(v: View): string {
  switch (v.kind) {
    case "manual":
      return "#" + v.id + (v.id === "crossfader" && v.side === "B" ? "/b" : "");
    case "ceremony":
      return v.reverse ? "" : "#" + v.id;
    case "notebook":
      return "#about";
    case "card":
      return "#contact";
    default:
      return "";
  }
}

/** What a hash asks for. Projects come back as their manual (the shell plays the ceremony) */
export function parseHash(hash: string): View {
  const h = decodeURIComponent(hash.replace(/^#/, "")).toLowerCase();
  if (!h) return { kind: "desk" };
  if (h === "about") return { kind: "notebook" };
  if (h === "contact") return { kind: "card" };
  const [id, side] = h.split("/");
  if ((PROJECT_IDS as string[]).includes(id)) {
    return { kind: "manual", id: id as ProjectId, side: id === "crossfader" && side === "b" ? "B" : "A" };
  }
  return { kind: "desk" };
}

/** Is this a view that sits over the desk (and closes with Esc / back)? */
export const isOverlay = (v: View) => v.kind === "manual" || v.kind === "notebook" || v.kind === "card";
