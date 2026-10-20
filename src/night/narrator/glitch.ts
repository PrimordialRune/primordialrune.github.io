// glitch(el, ms): a short RGB split and slice displacement that marks a state change
// (P6: glitch is punctuation, at most 300ms, never at rest). In QUIET it does nothing:
// the state simply changes. Resolves when the glitch is over.
import { isQuiet } from "@/lib/motion";
import styles from "./glitch.module.css";

const MAX_MS = 300;

export function glitch(el: HTMLElement | null, ms = 200): Promise<void> {
  if (!el || typeof window === "undefined" || isQuiet()) return Promise.resolve();
  const dur = Math.max(60, Math.min(MAX_MS, ms));
  el.classList.remove(styles.glitch);
  // Restart the animation if a glitch is already running on this element
  void el.offsetWidth;
  el.style.setProperty("--glitch-ms", `${dur}ms`);
  el.classList.add(styles.glitch);
  return new Promise((resolve) => {
    window.setTimeout(() => {
      el.classList.remove(styles.glitch);
      resolve();
    }, dur);
  });
}
