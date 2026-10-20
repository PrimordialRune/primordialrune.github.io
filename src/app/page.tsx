"use client";

// STILL HERE: a single route. Every view is client state inside <Game/>. The static first paint
// is the frame (stripes, name, WORK and CONTACT as plain hash links) and the empty tube, so a
// recruiter sees the way to the work before anything has loaded.

import dynamic from "next/dynamic";
import { FrameLogo } from "@/studio/Logo";

function Shell() {
  return (
    <div className="studio" data-act="0" data-boxpos="hidden" data-view="power">
      <header className="frame" data-protected>
        <div className="stripe" aria-hidden="true" />
        <div className="strip">
          <div className="strip-id">
            <FrameLogo size={24} />
            <p className="strip-name">
              <span className="strip-omar">Omar Golinelli</span>
              <span className="strip-role"> · Game designer &amp; developer</span>
            </p>
          </div>
          <nav aria-label="Portfolio" className="strip-nav">
            <a href="#works" className="strip-btn">
              <span className="lbl">
                <span className="lbl-en">WORK</span>
                <span className="lbl-jp" lang="ja">ワーク</span>
              </span>
            </a>
            <a href="#contact" className="strip-btn">
              <span className="lbl">
                <span className="lbl-en">CONTACT</span>
                <span className="lbl-jp" lang="ja">コンタクト</span>
              </span>
            </a>
          </nav>
        </div>
      </header>
      <main className="stage" id="main">
        <div className="tube">
          <div className="glass" />
        </div>
      </main>
      <div className="stripe stripe-bottom" aria-hidden="true" />
    </div>
  );
}

const Game = dynamic(() => import("@/studio/Game"), { ssr: false, loading: Shell });

export default function Page() {
  return <Game />;
}
