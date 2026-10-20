// Spring presets for interface motion (P6: interfaces move on springs)
import { springEase } from "@/lib/motion";

/** Camera, chrome, drawers: snappy (k=170, c=22) */
export const SPRING_UI = springEase(170, 22);
/** Reading surfaces settling in: softer (k=120, c=20) */
export const SPRING_SOFT = springEase(120, 20);
