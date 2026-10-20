"use client";

// THE VOID (act 4): nothing. The absence is the lead. One pixel line low in the glass is a real
// button. The frame strip around it still works: WORK and CONTACT are still Omar's.

import { useGame } from "../ctx";
import { clearNarrator } from "../narrator/narrator";
import { writePowered } from "../persist";

export default function Void() {
  const { dispatch, go, headingRef } = useGame();
  const newGame = () => {
    dispatch({ type: "NEW_GAME" });
    clearNarrator();
    writePowered(false);
    go({ kind: "power" }, { replace: true });
  };
  return (
    <div className="view void">
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        The screen is empty.
      </h1>
      <button type="button" className="void-new v-machine" onClick={newGame} aria-label="New game">
        NEW GAME
      </button>
    </div>
  );
}
