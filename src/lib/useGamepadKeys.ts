"use client";

import { useEffect } from "react";

// Standard-mapping gamepad buttons, replayed as keyboard keys so every screen
// that handles the keyboard also works with a controller.
const BUTTON_KEYS: Record<number, string> = {
  0: "Enter", // A
  1: "Escape", // B
  4: "PageUp", // LB: previous section
  5: "PageDown", // RB: next section
  9: "Home", // Start: back to the title screen
  12: "ArrowUp",
  13: "ArrowDown",
  14: "ArrowLeft",
  15: "ArrowRight",
};

export function useGamepadKeys() {
  useEffect(() => {
    let raf = 0;
    const held = new Set<string>();

    const poll = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pressedNow = new Set<string>();
      for (const pad of pads) {
        if (!pad) continue;
        for (const [index, key] of Object.entries(BUTTON_KEYS)) {
          if (pad.buttons[Number(index)]?.pressed) pressedNow.add(key);
        }
      }
      pressedNow.forEach((key) => {
        if (!held.has(key)) {
          const target = document.activeElement ?? document.body;
          target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        }
      });
      held.clear();
      pressedNow.forEach((key) => held.add(key));
      raf = requestAnimationFrame(poll);
    };

    // Only poll while a controller is connected
    const start = () => {
      if (!raf) raf = requestAnimationFrame(poll);
    };
    const stop = () => {
      if ((navigator.getGamepads?.() ?? []).some(Boolean)) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    window.addEventListener("gamepadconnected", start);
    window.addEventListener("gamepaddisconnected", stop);
    return () => {
      window.removeEventListener("gamepadconnected", start);
      window.removeEventListener("gamepaddisconnected", stop);
      cancelAnimationFrame(raf);
    };
  }, []);
}
