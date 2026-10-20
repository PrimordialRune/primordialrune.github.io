"use client";

// The notebook's portrait: Omar's photo, already made abstract (36 × 48 px, the four brand
// tones, ordered dither: omar-portrait-gb.png). Pixel art, so a whole-number scale only and
// nearest-neighbour edges (P1). Taped onto the page like a print.

import { asset } from "../asset";
import { useIntScaleWidth } from "../manual/hooks";
import s from "./Paper.module.css";

const W = 36;
const H = 48;

export default function Portrait({ max = 180 }: { max?: number }) {
  const { box, width } = useIntScaleWidth(W, "pixel", max);
  return (
    <div ref={box} className={s.portraitBox}>
      <span className={s.portraitPrint}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("resources/desk/omar-portrait-gb.png")}
          alt="Self-portrait of Omar, abstracted into 36 × 48 pixels in four tones of teal, blue and cream."
          width={width}
          height={(width * H) / W}
          className={`${s.portraitImg} nd-pixel`}
          draggable={false}
        />
      </span>
    </div>
  );
}
