"use client";

// First visit with the system asking for less motion: say plainly that motion is off and why,
// with FULL one press away. Shown once (dismissal remembered, storage guarded), never again
// once the visitor has picked a setting themselves.
import { useEffect, useState, useSyncExternalStore } from "react";
import { readMotionSetting, subscribeMotion, writeMotionSetting } from "@/lib/motion";
import { useMotionSetting, useSystemQuiet } from "../useMotionLevel";
import s from "./TopBar.module.css";

const KEY = "night:motion-toast";

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function rememberDismissed() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
}

const noSubscribe = () => () => {};

export default function MotionToast() {
  const setting = useMotionSetting();
  const systemQuiet = useSystemQuiet();
  // storage isn't readable on the server: hidden there, decided on the client
  const stored = useSyncExternalStore(noSubscribe, wasDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);

  // picking any setting (here or in the bar) answers the question for good
  useEffect(
    () =>
      subscribeMotion(() => {
        if (readMotionSetting() !== "auto") {
          rememberDismissed();
          setDismissed(true);
        }
      }),
    [],
  );

  const open = !stored && !dismissed && setting === "auto" && systemQuiet;
  if (!open) return null;
  const dismiss = () => {
    rememberDismissed();
    setDismissed(true);
  };
  return (
    <div className={s.toast} role="status" aria-label="Motion setting">
      <p className={s.toastText}>
        Motion is off because your system asks for less.
      </p>
      <button
        type="button"
        className={s.toastFull}
        onClick={() => {
          writeMotionSetting("full");
          dismiss();
        }}
      >
        Turn on FULL
      </button>
      <button type="button" className={s.toastClose} aria-label="Keep motion off and dismiss" onClick={dismiss}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
