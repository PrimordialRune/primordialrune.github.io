"use client";
// The save select, on the Trinitron's own screen (hero: the save files). It never blocks
// the desk: it only takes keys while focus is inside it, and the desk works behind it.
// FILE 1 / CONTINUE (when a file exists), the corrupted FILE ? (static corruption that
// glitches only when touched, P6) and NEW GAME.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { emitStory } from "../bus";
import { glitch } from "./glitch";
import { noteSaveSelectShown, useSaveSelect, useStory } from "./story";
import styles from "./saveSelect.module.css";

type RowKey = "continue" | "corrupt" | "newgame";

export default function SaveSelect() {
  const { hasSave, openedCount } = useSaveSelect();
  const { nameTag } = useStory();
  const rows: RowKey[] = hasSave ? ["continue", "corrupt", "newgame"] : ["corrupt", "newgame"];
  const [cursor, setCursor] = useState<RowKey>(hasSave ? "continue" : "newgame");
  const refs = useRef<Partial<Record<RowKey, HTMLButtonElement | null>>>({});

  useEffect(() => {
    noteSaveSelectShown();
  }, []);

  const choose = (key: RowKey) => {
    if (key === "continue") emitStory({ type: "continue" });
    else if (key === "newgame") emitStory({ type: "newgame" });
    else emitStory({ type: "corrupt" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const i = rows.indexOf(cursor);
      const next = rows[(i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length];
      setCursor(next);
      refs.current[next]?.focus();
    } else if (e.key === "Escape") {
      // Esc keeps playing: the existing file, or a first visit's fresh one
      e.preventDefault();
      e.stopPropagation();
      choose(hasSave ? "continue" : "newgame");
    }
  };

  const touchCorrupt = () => {
    setCursor("corrupt");
    glitch(refs.current.corrupt ?? null, 240);
  };

  return (
    <div className={styles.screen} onKeyDown={onKeyDown} role="group" aria-labelledby="night-save-title">
      <div className={styles.head}>
        <p id="night-save-title" className={styles.title}>
          SELECT FILE
        </p>
        <p className={styles.kana} aria-hidden="true">
          ファイルセレクト
        </p>
      </div>
      <ul className={styles.list}>
        {rows.map((key) => (
          <li key={key}>
            <button
              ref={(el) => {
                refs.current[key] = el;
              }}
              type="button"
              className={styles.row}
              data-row={key}
              data-selected={cursor === key}
              tabIndex={cursor === key ? 0 : -1}
              aria-label={
                key === "continue"
                  ? `Continue file 1, ${openedCount} of 5 projects opened`
                  : key === "corrupt"
                    ? "Corrupted file"
                    : "New game"
              }
              onPointerEnter={key === "corrupt" ? touchCorrupt : () => setCursor(key)}
              onFocus={key === "corrupt" ? touchCorrupt : () => setCursor(key)}
              onClick={() => choose(key)}
            >
              <span className={styles.arrow} aria-hidden="true">
                ▶
              </span>
              {key === "continue" && (
                <span className={styles.body} aria-hidden="true">
                  <span>FILE 1</span>
                  <span>{nameTag}</span>
                  <span className={styles.meta}>{openedCount}/5</span>
                </span>
              )}
              {key === "corrupt" && (
                <span className={styles.body} aria-hidden="true">
                  <span>FILE ?</span>
                  <span>▓▒░▒</span>
                  <span className={styles.meta}>?/5</span>
                </span>
              )}
              {key === "newgame" && (
                <span className={styles.body} aria-hidden="true">
                  <span>NEW GAME</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
