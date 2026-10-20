// Server-safe part of the motion setting: the storage key and the <head> script that
// resolves html[data-motion] before first paint (stored choice, else the system's wish).

export const MOTION_KEY = "afterimage:motion";

export const MOTION_INIT_SCRIPT = `try{var s=localStorage.getItem("${MOTION_KEY}");document.documentElement.dataset.motion=s==="full"||s==="soft"?s:(matchMedia("(prefers-reduced-motion: reduce)").matches?"soft":"full")}catch(e){document.documentElement.dataset.motion="full"}`;
