"use client";

// One project on the mat: a real button wearing its object (P3). Hover lifts it one frame,
// press lifts it another (stepped, P6); the first frame lands on pointerdown (P2: <100ms).
// While its ceremony or manual is open the original is hidden (it is the one in the device)
// but keeps its layout, so the device layer can measure where to put it back.
import { useEffect, useState, type CSSProperties, type Ref } from "react";
import DeskArt, { GB_WINDOW_FRACTION, gbWindowPx } from "./DeskArt";
import { ART_KIND, ART_SIZE, DESK_SPOTS, deskUnit } from "../content/layout";
import { PROJECTS } from "../content/projects";
import { registerOrigin } from "./originRect";
import type { ProjectId } from "../types";
import s from "./Desk.module.css";

interface Props {
  id: ProjectId;
  tabIndex: number;
  /** in the device right now: hidden on the mat, layout kept */
  away: boolean;
  buttonRef: Ref<HTMLButtonElement>;
  onOpen(id: ProjectId): void;
  onHover(id: ProjectId, el: HTMLElement): void;
  onFocusSpot(id: string, el: HTMLElement): void;
}

/**
 * The GB cart is sized from its label, not the other way round (P1): the 160x144 cover shows
 * whole, at an integer number of device pixels per art pixel. Returns the cart width in CSS px.
 */
function useGbCartWidth(active: boolean): number | null {
  const [w, setW] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const fit = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const natural = vw < 720 ? Math.min(320, (64 / 104) * 0.62 * vw) : 64 * deskUnit(vw, vh);
      const win = gbWindowPx(natural * GB_WINDOW_FRACTION, window.devicePixelRatio || 1);
      // one CSS px of slack so sub-pixel layout never crops the cover's edge
      setW(Math.ceil((win + 1) / GB_WINDOW_FRACTION));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [active]);
  return w;
}

export default function DeskObject({ id, tabIndex, away, buttonRef, onOpen, onHover, onFocusSpot }: Props) {
  const p = PROJECTS[id];
  const kind = ART_KIND[id];
  const size = ART_SIZE[kind];
  const spot = DESK_SPOTS[id];
  const gbW = useGbCartWidth(kind === "gb-cart");

  const style = {
    "--x": spot.x,
    "--y": spot.y,
    "--rot": `${spot.rot}deg`,
    "--aw": size.w,
    "--ah": size.h,
    ...(gbW ? { "--gbw": `${gbW}px` } : null),
  } as CSSProperties;

  return (
    <li className={s.item} style={style} data-light data-kind={kind} data-away={away ? "" : undefined}>
      <button
        ref={buttonRef}
        type="button"
        className={s.obj}
        data-spot={id}
        data-kind={kind}
        tabIndex={tabIndex}
        aria-label={`${p.title}, ${p.medium}. Open its manual.`}
        onClick={() => onOpen(id)}
        onPointerEnter={(e) => e.pointerType !== "touch" && onHover(id, e.currentTarget)}
        onFocus={(e) => onFocusSpot(id, e.currentTarget)}
      >
        <span className={s.art} ref={(el) => registerOrigin(id, el)} style={{ aspectRatio: `${size.w} / ${size.h}` }}>
          <span className={s.artInner}>
            <DeskArt kind={kind} />
          </span>
        </span>
        <span className={s.caption} aria-hidden="true">
          <span className={s.capEn}>{p.title}</span>
          <span className={s.capJp}>{p.titleJp}</span>
        </span>
      </button>
    </li>
  );
}
