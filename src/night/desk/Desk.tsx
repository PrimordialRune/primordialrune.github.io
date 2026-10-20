"use client";

// The mat: the five projects, the notebook and the contact card, lit by the Trinitron.
// DOM order is the reading order (projects, notebook, card); arrows move spatially.
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import DeskObject from "./DeskObject";
import NotebookObject from "./NotebookObject";
import Trinitron from "./Trinitron";
import Lighting from "./Lighting";
import { useSpatialFocus } from "./useSpatialFocus";
import { ART_SIZE, DESK_SPOTS, awayFromLight } from "../content/layout";
import { PROJECT_IDS, type ProjectId, type StoryState } from "../types";
import { emitStory } from "../bus";
import NarratorScreen from "../narrator/NarratorScreen";
import Card from "../paper/Card";
import { registerOrigin } from "./originRect";
import s from "./Desk.module.css";

interface Props {
  story: StoryState;
  powered: boolean;
  /** the void: the desk empties (objects, card and CRT light gone) */
  empty: boolean;
  /** the object that is in a device / open right now: hidden on the mat, layout kept */
  away: string | null;
  /** each item's element, so focus can return to it */
  register(id: string, el: HTMLElement | null): void;
  onOpen(id: ProjectId): void;
  onNotebook(): void;
  onCard(): void;
  /** the element the narrator should sit beside once it leaves the CRT */
  onAnchor(el: HTMLElement): void;
}

export default function Desk({ story, powered, empty, away, register, onOpen, onNotebook, onCard, onAnchor }: Props) {
  const matRef = useRef<HTMLDivElement>(null);
  const crtRef = useRef<HTMLDivElement>(null);
  const { active, setActive, onKeyDown } = useSpatialFocus(matRef);

  // Shadows fall away from the CRT: one unit vector per object, per layout (no per-frame JS)
  useLayoutEffect(() => {
    const mat = matRef.current, crt = crtRef.current;
    if (!mat || !crt) return;
    const place = () => {
      const phone = window.innerWidth < 720;
      const c = crt.getBoundingClientRect();
      const lx = c.left + c.width / 2, ly = c.top + c.height * 0.45;
      mat.querySelectorAll<HTMLElement>("[data-light]").forEach((li) => {
        const r = li.getBoundingClientRect();
        const v = phone ? { x: 0, y: 1 } : awayFromLight(r.left + r.width / 2, r.top + r.height / 2, lx, ly);
        li.style.setProperty("--lx", v.x.toFixed(3));
        li.style.setProperty("--ly", v.y.toFixed(3));
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  // Keep the most recently touched object as the narrator's anchor (stage 3)
  const touch = (id: string, el: HTMLElement) => {
    setActive(id);
    onAnchor(el);
  };
  const hover = (id: ProjectId | "notebook" | "card", el: HTMLElement) => {
    onAnchor(el);
    // the card reports its own hover; the story store rate-limits what the narrator says
    if (id !== "card") emitStory({ type: "hover", id });
  };

  const cardSpot = DESK_SPOTS.card;
  const cardStyle = {
    "--x": cardSpot.x,
    "--y": cardSpot.y,
    "--rot": `${cardSpot.rot}deg`,
    "--aw": ART_SIZE.card.w,
    "--ah": ART_SIZE.card.h,
  } as CSSProperties;

  return (
    <div className={s.mat} ref={matRef} data-empty={empty ? "" : undefined}>
      <div className={s.grid} aria-hidden="true" />
      {!empty && <Lighting stage={story.stage} powered={powered} inCrt={story.inCrt} />}
      <div className={s.crt} ref={crtRef} data-empty={empty ? "" : undefined}>
        <Trinitron screen={<NarratorScreen />} powered={powered && !empty} inCrt={story.inCrt} />
      </div>
      {!empty && (
        <ul className={s.objects} aria-label="Projects on the desk" onKeyDown={onKeyDown}>
          {PROJECT_IDS.map((id) => (
            <DeskObject
              key={id}
              id={id}
              tabIndex={active === id ? 0 : -1}
              away={away === id}
              buttonRef={(el) => register(id, el)}
              onOpen={onOpen}
              onHover={hover}
              onFocusSpot={touch}
            />
          ))}
          <NotebookObject
            tabIndex={active === "notebook" ? 0 : -1}
            away={away === "notebook"}
            buttonRef={(el) => register("notebook", el)}
            onOpen={onNotebook}
            onHover={(el) => hover("notebook", el)}
            onFocusSpot={touch}
          />
          <li
            className={`${s.item} ${s.cardItem}`}
            style={cardStyle}
            data-light
            data-spot="card"
            data-away={away === "card" ? "" : undefined}
            ref={(el) => {
              register("card", el);
              registerOrigin("card", el);
            }}
            onPointerEnter={(e) => e.pointerType !== "touch" && hover("card", e.currentTarget)}
            onFocus={(e) => touch("card", e.currentTarget)}
          >
            <Card variant="desk" onOpen={onCard} />
          </li>
        </ul>
      )}
    </div>
  );
}
