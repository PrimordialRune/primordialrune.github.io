"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { triggerBurst, prefersReducedMotion } from "@/lib/crt";
import { formatPlayTime, readSave } from "@/lib/save";
import { getSection } from "@/lib/sections";

interface SaveSelectProps {
  onContinue: (sectionId: string) => void;
  onNewGame: () => void;
  onCorrupt: () => void;
}

interface FileBodyProps {
  tag: string;
  name: string;
  sub: string;
  time?: string;
}

function FileBody({ tag, name, sub, time }: FileBodyProps) {
  return (
    <span className="save-body">
      <span className="save-main">
        <span className="save-tag">{tag}</span> <span className="save-name">{name}</span>
        <span className="save-sub">{sub}</span>
      </span>
      {time && <span className="save-time">{time}</span>}
    </span>
  );
}

const GLYPHS = "▓▒░█#@%&?!0MAR∆◆◇<>/\\";
const scramble = (n: number) =>
  Array.from({ length: n }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");

// A save slot that should not exist. It is erased and glitching at the same
// time: a blurred smear with sharp, offset slices tearing through it. Picking
// it tears the picture into the empty void the story ends in: a glimpse of
// the future, after which everything carries on as if nothing happened.
function useCorruptText() {
  const [text, setText] = useState({ name: "████", sub: "▓▒░ · ░▒▓▒░", time: "??:??" });
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => {
      setText({
        name: Math.random() < 0.12 ? "OMAR" : scramble(4),
        sub: `${scramble(5)} · ${scramble(7)}`,
        time: `${scramble(2)}:${scramble(2)}`,
      });
    }, 90);
    return () => clearInterval(id);
  }, []);
  return text;
}

type Row = { key: "continue" | "corrupt" | "new"; label: string };

// Only rendered on the client after power on, so storage can be read directly
export default function SaveSelect({ onContinue, onNewGame, onCorrupt }: SaveSelectProps) {
  const [save] = useState(readSave);
  const rows = useMemo<Row[]>(
    () => [
      ...(save ? [{ key: "continue" as const, label: "Continue from file 1" }] : []),
      { key: "corrupt", label: "Corrupted file" },
      { key: "new", label: "New game, guided tour" },
    ],
    [save]
  );
  const defaultIndex = save ? 0 : rows.length - 1;
  const [cursor, setCursor] = useState(defaultIndex);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const corrupt = useCorruptText();
  const [tearing, setTearing] = useState(false);

  const choose = useCallback(
    (key: Row["key"]) => {
      if (key === "continue" && save) onContinue(save.lastSection);
      else if (key === "new") onNewGame();
      else {
        triggerBurst({ strength: 3 });
        setTearing(true);
        setTimeout(() => setTearing(false), 600);
        onCorrupt();
      }
    },
    [save, onContinue, onNewGame, onCorrupt]
  );

  useEffect(() => {
    buttonRefs.current[defaultIndex]?.focus({ preventScroll: true });
  }, [defaultIndex]);

  // Arrow keys move the cursor; Enter picks it when no button would handle it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const focusIsFree = !document.activeElement || document.activeElement === document.body;
      const inRows = buttonRefs.current.some((b) => b === document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!focusIsFree && !inRows) return;
        e.preventDefault();
        setCursor((c) => {
          const next = (c + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
          buttonRefs.current[next]?.focus({ preventScroll: true });
          return next;
        });
      } else if (e.key === "Enter" && (focusIsFree || (inRows && !e.isTrusted))) {
        // Synthetic Enter (gamepad A) doesn't click the focused button by itself
        e.preventDefault();
        choose(rows[cursor].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, cursor, choose]);

  const continueSection = save ? getSection(save.lastSection) : null;

  return (
    <div className="save-screen">
      <header className="save-header">
        <h1 className="save-title">SELECT A FILE</h1>
        <p className="save-title-jp">ぼうけんのしょを えらんでください</p>
      </header>

      <div className="save-list" role="list">
        {rows.map((row, index) => (
          <motion.button
            key={row.key}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            role="listitem"
            className={`save-file save-file-${row.key}`}
            data-selected={cursor === index}
            data-tearing={row.key === "corrupt" && tearing}
            aria-label={row.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + index * 0.07, type: "spring", damping: 25, stiffness: 250, mass: 0.8 }}
            onMouseEnter={() => setCursor(index)}
            onFocus={() => setCursor(index)}
            onClick={() => choose(row.key)}
          >
            <span className="save-arrow" aria-hidden="true">
              ▶
            </span>
            {row.key === "continue" && continueSection && save && (
              <FileBody
                tag="FILE 1"
                name="OMAR"
                sub={`Game Designer · ${continueSection.label}`}
                time={`TIME ${formatPlayTime(save.playSeconds)}`}
              />
            )}
            {row.key === "corrupt" && (
              <span className="corrupt-stack" aria-hidden="true">
                <span className="corrupt-layer corrupt-smear">
                  <FileBody tag="FILE ?" name={corrupt.name} sub={corrupt.sub} time={`TIME ${corrupt.time}`} />
                </span>
                <span className="corrupt-layer corrupt-slice corrupt-slice-a">
                  <FileBody tag="FILE ?" name={corrupt.name} sub={corrupt.sub} time={`TIME ${corrupt.time}`} />
                </span>
                <span className="corrupt-layer corrupt-slice corrupt-slice-b">
                  <FileBody tag="FILE ?" name={corrupt.name} sub={corrupt.sub} time={`TIME ${corrupt.time}`} />
                </span>
              </span>
            )}
            {row.key === "new" && <FileBody tag="" name="NEW GAME" sub="Guided tour · はじめから" />}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
