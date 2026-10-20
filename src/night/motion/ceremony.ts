"use client";

// Ceremony runner shared by every device (P2: any ceremony can be skipped, plays in full
// only the first time). A device builds ONE timeline for the opening; the runner decides
// how it plays:
//   full   at 1x
//   short  the same timeline at SHORT_SCALE (~500ms)
//   cut    end state at once, onReady on the next frame (QUIET always cuts)
//   reverse  the closing version: the same timeline rewound at SHORT_SCALE
// skipToken changes jump to the end and call onReady. onReady fires exactly once per run.
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { isQuiet } from "@/lib/motion";
import type { CeremonyMode, DeviceProps } from "../types";

export const SHORT_SCALE = 3.5;

export interface Ceremony {
  tl: gsap.core.Timeline;
  /** Jump to the end of this run (the start, when reversed) */
  skip(): void;
}

/** A paused timeline set up for a mode; call `start()` after filling it */
export function makeCeremony(mode: CeremonyMode, reverse = false) {
  const tl = gsap.timeline({ paused: true });
  const cut = mode === "cut" || isQuiet();
  const end = () => tl.progress(reverse ? 0 : 1, true);
  return {
    tl,
    cut,
    skip: () => {
      tl.pause();
      end();
    },
    /** Starts playback; `done` is called once when the run ends (or at once when cut) */
    start(done: () => void) {
      if (cut) {
        // the end state, rendered before paint; the caller defers `done` by one frame
        tl.progress(1, true);
        if (reverse) tl.progress(0, true);
        done();
        return;
      }
      tl.timeScale(reverse || mode === "short" ? SHORT_SCALE : 1);
      if (reverse) {
        tl.progress(1, true);
        tl.eventCallback("onReverseComplete", done);
        tl.reverse();
      } else {
        tl.eventCallback("onComplete", done);
        tl.play(0);
      }
    },
  };
}

type Build = (tl: gsap.core.Timeline, ctx: { reverse: boolean; q: (sel: string) => Element[] }) => void;

/**
 * Runs a device ceremony inside gsap.context (reverted on cleanup). `build` sets the
 * opening pose with gsap.set and fills `tl` with the beats. `layout` gates the run until
 * the device has laid itself out (falsy = not yet), and is a key of that layout: when it
 * changes (the stage resized, e.g. the device stepping aside for the manual or back), the
 * ceremony is rebuilt for the new layout. A run that already finished is rebuilt straight
 * at its end state, without calling onReady again.
 */
export function useCeremony(
  scope: RefObject<HTMLElement | null>,
  props: Pick<DeviceProps, "mode" | "reverse" | "skipToken" | "onReady">,
  build: Build,
  layout: string | number | boolean = true,
) {
  const { mode, reverse = false, skipToken, onReady } = props;
  const ready = !!layout;
  const onReadyRef = useRef(onReady);
  const buildRef = useRef(build);
  const skipRef = useRef<() => void>(() => {});
  const lastSkip = useRef(skipToken);
  const doneRun = useRef<string | null>(null);

  useLayoutEffect(() => {
    onReadyRef.current = onReady;
    buildRef.current = build;
  });

  useLayoutEffect(() => {
    if (!ready || !scope.current) return;
    const runKey = `${mode}|${reverse}`;
    const already = doneRun.current === runKey;
    let fired = already;
    let raf = 0;
    const finish = () => {
      if (fired) return;
      fired = true;
      doneRun.current = runKey;
      onReadyRef.current();
    };
    let run: ReturnType<typeof makeCeremony> | null = null;
    const ctx = gsap.context((self) => {
      run = makeCeremony(mode, reverse);
      const q = (sel: string) => (self.selector ? (self.selector(sel) as Element[]) : []);
      buildRef.current(run.tl, { reverse, q });
      run.tl.progress(1, true).progress(0, true);
      if (already) {
        // relaid out after the run ended: just its end state
        run.tl.progress(reverse ? 0 : 1, true);
        return;
      }
      run.start(() => {
        if (run?.cut) raf = requestAnimationFrame(finish);
        else finish();
      });
    }, scope);
    skipRef.current = () => {
      if (fired || !run) return;
      run.skip();
      finish();
    };
    return () => {
      cancelAnimationFrame(raf);
      skipRef.current = () => {};
      ctx.revert();
    };
  }, [mode, reverse, ready, layout, scope]);

  useEffect(() => {
    if (skipToken === lastSkip.current) return;
    lastSkip.current = skipToken;
    skipRef.current();
  }, [skipToken]);
}
