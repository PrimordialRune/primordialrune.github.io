"use client";

// One fixed overlay, no per-frame JS: the Trinitron's phosphor glow on the mat (P4: free
// light). Its tint follows the story: aquamarine; at stage 2 it takes 6% of the AI's red;
// when the AI leaves (stage 3) or the set is switched off, only moonlight is left.
import s from "./Lighting.module.css";

interface Props {
  stage: 0 | 1 | 2 | 3;
  powered: boolean;
  inCrt: boolean;
}

export default function Lighting({ stage, powered, inCrt }: Props) {
  const tone = !powered || !inCrt ? "moon" : stage >= 2 ? "warn" : "phosphor";
  return <div className={s.light} data-tone={tone} aria-hidden="true" />;
}
