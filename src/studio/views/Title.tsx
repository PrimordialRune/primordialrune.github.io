"use client";

// TITLE (save select). Hero: the save files. FILE 2 is Omar's, corrupted: it twitches in
// response to any input on this screen (never on its own timer). Opening it shows the void.

import { useEffect, useRef } from "react";
import { useGame } from "../ctx";
import { say } from "../narrator/narrator";
import { twitch } from "../fx";
import { formatPlaytime, hasProgress, nameTag } from "../story";
import { Label } from "../Frame";

export default function Title({ peek }: { peek: boolean }) {
  const { story, go, dispatch, enterHub, openRecord, headingRef } = useGame();
  const corrupt = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const peekTimer = useRef(0);

  useEffect(() => {
    if (!peek) say("title.enter");
  }, [peek]);

  // the corrupted file glitches in response to any pointer move or focus change here
  useEffect(() => {
    const el = root.current;
    if (!el || peek) return;
    let last = 0;
    const poke = () => {
      const now = performance.now();
      if (now - last < 260) return;
      last = now;
      twitch(corrupt.current);
    };
    el.addEventListener("pointermove", poke);
    el.addEventListener("focusin", poke);
    window.addEventListener("keydown", poke);
    return () => {
      el.removeEventListener("pointermove", poke);
      el.removeEventListener("focusin", poke);
      window.removeEventListener("keydown", poke);
    };
  }, [peek]);

  useEffect(() => () => window.clearTimeout(peekTimer.current), []);

  const progress = hasProgress(story);
  const file1 = () => {
    const line = story.endings > 0 && !progress ? "boot.afterEnd" : progress ? "boot.continue" : "boot.new";
    enterHub(line);
  };
  const file2 = () => {
    if (story.act >= 2) {
      say("title.corrupt", { interrupt: true });
      return;
    }
    say("title.corrupt", {
      interrupt: true,
      onShown: () => {
        peekTimer.current = window.setTimeout(() => {
          dispatch({ type: "PEEK" });
          go({ kind: "title", peek: true }, { replace: true });
          say("void.peek", { interrupt: true, replace: true });
          peekTimer.current = window.setTimeout(() => go({ kind: "title" }, { replace: true }), 1500);
        }, 700);
      },
    });
  };
  const skip = () => {
    dispatch({ type: "SET_MODE", mode: "direct" });
    say("title.skip", { force: true, interrupt: true });
    openRecord();
  };

  if (peek) {
    return (
      <div className="view peek">
        <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
          An empty screen.
        </h1>
      </div>
    );
  }

  return (
    <div className="view title" ref={root}>
      <div className="title-head">
        <h1 className="title-name v-machine" tabIndex={-1} ref={headingRef}>
          STILL HERE
        </h1>
        <p className="v-sub title-jp" lang="ja" aria-hidden="true">
          まだここ
        </p>
      </div>
      <ul className="files" aria-label="Save files">
        <li>
          <button type="button" className="file" onClick={file1}>
            <span className="file-n v-machine">FILE 1</span>
            {progress ? (
              <span className="file-meta v-machine">
                CONTINUE · {nameTag(story.act) || "----"} · {formatPlaytime(story.activeSeconds)}
              </span>
            ) : (
              <span className="file-meta">
                <Label en="NEW GAME" jp="ニューゲーム" />
              </span>
            )}
          </button>
        </li>
        <li>
          <button type="button" className="file file-corrupt" ref={corrupt} onClick={file2} aria-label="File 2, Omar, corrupted">
            <span className="file-n v-machine">FILE 2</span>
            <span className="file-meta v-machine" aria-hidden="true">
              OMAR · ▒▒:▒▒
            </span>
          </button>
        </li>
        {story.archive.map((a, i) => (
          <li key={a.endedAt}>
            <button
              type="button"
              className="file file-corrupt file-archive"
              onClick={() => say("title.archive", { interrupt: true })}
              aria-label={`File ${i + 3}, unknown, ended after ${formatPlaytime(a.playSeconds)}`}
            >
              <span className="file-n v-machine">FILE {i + 3}</span>
              <span className="file-meta v-machine" aria-hidden="true">
                ??? · {formatPlaytime(a.playSeconds)}
              </span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="file file-skip" onClick={skip}>
            <span className="file-n v-machine">SKIP</span>
            <span className="file-meta file-skip-text">Just the work</span>
          </button>
        </li>
      </ul>
      <p className="title-hint v-machine" aria-hidden="true">
        PRESS START
      </p>
    </div>
  );
}
