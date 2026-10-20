"use client";

// Omar's notebook, closed, on the mat (About). Object palette: kraft cover #c9a46a / #a8844c,
// elastic #2b2a29, cream page edges #f1ead6, a teal ribbon #339999.
import type { CSSProperties, Ref } from "react";
import { ART_SIZE, DESK_SPOTS } from "../content/layout";
import { registerOrigin } from "./originRect";
import s from "./Desk.module.css";

interface Props {
  tabIndex: number;
  /** open right now: hidden on the mat, layout kept */
  away: boolean;
  buttonRef: Ref<HTMLButtonElement>;
  onOpen(): void;
  onHover(el: HTMLElement): void;
  onFocusSpot(id: string, el: HTMLElement): void;
}

export default function NotebookObject({ tabIndex, away, buttonRef, onOpen, onHover, onFocusSpot }: Props) {
  const spot = DESK_SPOTS.notebook;
  const size = ART_SIZE.notebook;
  const style = { "--x": spot.x, "--y": spot.y, "--rot": `${spot.rot}deg`, "--aw": size.w, "--ah": size.h } as CSSProperties;
  return (
    <li className={s.item} style={style} data-light data-away={away ? "" : undefined}>
      <button
        ref={buttonRef}
        type="button"
        className={s.obj}
        data-spot="notebook"
        data-kind="notebook"
        tabIndex={tabIndex}
        aria-label="Omar's notebook: about Omar. Open it."
        onClick={onOpen}
        onPointerEnter={(e) => e.pointerType !== "touch" && onHover(e.currentTarget)}
        onFocus={(e) => onFocusSpot("notebook", e.currentTarget)}
      >
        <span className={s.art} ref={(el) => registerOrigin("notebook", el)} style={{ aspectRatio: `${size.w} / ${size.h}` }}>
          <span className={s.artInner}>
            <svg viewBox="0 0 104 136" className={s.svg} aria-hidden="true">
              <defs>
                <linearGradient id="nbCover" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#d4b37c" />
                  <stop offset=".6" stopColor="#c9a46a" />
                  <stop offset="1" stopColor="#a8844c" />
                </linearGradient>
              </defs>
              {/* page block peeking out */}
              <rect x="4" y="3" width="98" height="131" rx="3" fill="#f1ead6" />
              {[6, 8, 10].map((y) => (
                <path key={y} d={`M${100} ${y} V${128 + y / 4}`} stroke="#d8cfb6" strokeWidth=".5" />
              ))}
              {/* cover */}
              <rect x="1" y="1" width="97" height="132" rx="3.5" fill="url(#nbCover)" stroke="#8a6c3c" strokeWidth=".7" />
              {/* spine stitching */}
              <path d="M7 4 V130" stroke="#8a6c3c" strokeWidth=".6" strokeDasharray="2 2" />
              {/* label */}
              <rect x="26" y="26" width="52" height="22" rx="1.5" fill="#f1ead6" />
              <path d="M30 34 H74 M30 41 H64" stroke="#c9bfa4" strokeWidth=".6" />
              <text x="52" y="38.6" textAnchor="middle" className={s.svgBlack} fontSize="7.4" fill="#102f41" letterSpacing=".6">
                NOTES
              </text>
              {/* ribbon marker */}
              <path d="M70 133 V140 L73 137.6 L76 140 V133 Z" fill="#339999" />
              {/* elastic band */}
              <rect x="84" y="1" width="4.4" height="132" fill="#2b2a29" />
              <path d="M84.6 1.5 V132.5" stroke="#5a5856" strokeWidth=".5" />
              {/* light from the top-left: the specular edge */}
              <path d="M4.5 1.8 H95" stroke="#f6e3bd" strokeWidth=".8" strokeLinecap="round" />
              <path d="M1.8 4.5 V129" stroke="#f6e3bd" strokeWidth=".5" strokeLinecap="round" opacity=".7" />
            </svg>
          </span>
        </span>
        <span className={s.caption} aria-hidden="true">
          <span className={s.capEn}>Notebook</span>
          <span className={s.capJp}>ノート</span>
        </span>
      </button>
    </li>
  );
}
