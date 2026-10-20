"use client";

// One project on the mat: a real button wearing its object (P3). Hover lifts it one frame,
// press lifts it another (stepped, P6); the first frame lands on pointerdown (P2: <100ms).
import { useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import DeskArt from "./DeskArt";
import { ART_KIND, ART_SIZE, DESK_SPOTS } from "../content/layout";
import { PROJECTS } from "../content/projects";
import type { ProjectId } from "../types";
import s from "./Desk.module.css";

interface Props {
  id: ProjectId;
  tabIndex: number;
  buttonRef: Ref<HTMLButtonElement>;
  onOpen(id: ProjectId): void;
  onHover(id: ProjectId, el: HTMLElement): void;
  onFocusSpot(id: string, el: HTMLElement): void;
}

export default function DeskObject({ id, tabIndex, buttonRef, onOpen, onHover, onFocusSpot }: Props) {
  const p = PROJECTS[id];
  const kind = ART_KIND[id];
  const size = ART_SIZE[kind];
  const spot = DESK_SPOTS[id];
  const artRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(2);

  // px per desk unit, so the GB sticker can pick an integer pixel scale
  useEffect(() => {
    const el = artRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.offsetWidth / size.w || 2));
    ro.observe(el);
    return () => ro.disconnect();
  }, [size.w]);

  const style = {
    "--x": spot.x,
    "--y": spot.y,
    "--rot": `${spot.rot}deg`,
    "--aw": size.w,
    "--ah": size.h,
  } as CSSProperties;

  return (
    <li className={s.item} style={style} data-light>
      <button
        ref={buttonRef}
        type="button"
        className={s.obj}
        data-spot={id}
        data-kind={kind}
        tabIndex={tabIndex}
        aria-label={`${p.title}, ${p.medium.toLowerCase()}. Open its manual.`}
        onClick={() => onOpen(id)}
        onPointerEnter={(e) => e.pointerType !== "touch" && onHover(id, e.currentTarget)}
        onFocus={(e) => onFocusSpot(id, e.currentTarget)}
      >
        <span className={s.art} ref={artRef} style={{ aspectRatio: `${size.w} / ${size.h}` }}>
          <span className={s.artInner}>
            <DeskArt kind={kind} scale={scale} />
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
