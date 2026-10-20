"use client";

// "The AI writes in the margins": a note left in Omar's own documents (manual, notebook),
// growing with the story stage. Scene text, not information (P1), and it names its speaker
// with the narrator's name tag (P5). Stages 0-1: a slip of paper taped in the margin,
// Omar's Grotesk in aquamarine on peacock. Stage 2 and later: the machine writes straight
// onto the page in its pixel face, one single line per sentence (P5), in the AI's red.

import { cleanLine, marginNote, NAME_TAGS, parseLine } from "../narrator/lines";
import { useStory } from "../narrator/story";
import type { ProjectId } from "../types";
import s from "./MarginNote.module.css";

/** pixel lines stay short enough to fit a phone's page on one line */
const MAX_PIXEL_CHARS = 34;

function pixelLines(line: string): string[] {
  const out: string[] = [];
  // one sentence per line (P5); a margin note is handwriting, not dialogue: no "* "
  for (const chunk of cleanLine(line).split(/(?<=[.?!])\s+/).filter(Boolean)) {
    let cur = "";
    for (const word of chunk.split(/\s+/)) {
      if (cur && (cur + " " + word).length > MAX_PIXEL_CHARS) {
        out.push(cur);
        cur = word;
      } else cur = cur ? `${cur} ${word}` : word;
    }
    if (cur) out.push(cur);
  }
  return out;
}

export default function MarginNote({ id, className }: { id: ProjectId | "notebook"; className?: string }) {
  const { stage, nameTag } = useStory();
  const raw = marginNote(id, stage);
  if (!raw) return null;
  // a note that signs itself ("... — omar") keeps its own signature
  const m = /\s+—\s*([^—]+)$/.exec(raw);
  const line = m ? raw.slice(0, m.index) : raw;
  const signature = m ? m[1].trim() : nameTag;
  const machine = stage >= 2;
  const cls = [s.note, className].filter(Boolean).join(" ");

  return (
    <aside className={cls} data-stage={stage} data-machine={machine ? "" : undefined} aria-label={`A note in the margin, signed ${m ? signature : NAME_TAGS[stage]}`}>
      {machine ? (
        <p className={s.pixelText}>
          <span className="nd-sr-only">{cleanLine(line)}</span>
          {pixelLines(line).map((l, i) => (
            <span key={i} className={s.pixelLine} aria-hidden="true">
              {l}
            </span>
          ))}
        </p>
      ) : (
        <p className={s.text}>
          <span className="nd-sr-only">{cleanLine(line)}</span>
          <span aria-hidden="true">
            {parseLine(line).map((seg, i) =>
              seg.machine ? (
                <span key={i} className={s.creep}>
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </span>
        </p>
      )}
      <p className={s.sign} aria-hidden="true">
        — {signature}
      </p>
    </aside>
  );
}
