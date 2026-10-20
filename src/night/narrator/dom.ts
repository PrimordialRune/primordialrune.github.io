// Reading the desk from the DOM: the objects ([data-spot]) and the Trinitron set that holds
// the narrator's screen ([data-night-screen], set by NarratorScreen).

/** The Trinitron's slot on the mat: climb from the screen to the element whose parent also holds the object list */
export function crtElement(): HTMLElement | null {
  const screen = document.querySelector<HTMLElement>("[data-night-screen]");
  if (!screen) return null;
  let el: HTMLElement = screen;
  while (el.parentElement && !el.parentElement.querySelector(":scope > ul")) el = el.parentElement;
  return el.parentElement ? el : screen;
}
