"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Bar from "./Bar";
import Options from "./Options";
import Tv, { type TvHandle } from "./Tv";
import Shelf from "./Shelf";
import InfoCard from "./InfoCard";
import Narrator from "./Narrator";
import Guide from "./Guide";
import { EmptyRoom, PowerOnScreen, SaveSelectScreen, StandbyScreen, StatusScreen, TitleScreen } from "./screens";
import { openTimeline, staticBurst } from "./transitions";
import Daylight from "./Daylight";
import { applySpeedParam, frames, isSoft, setMotion, getMotion, SHEET_SPRING } from "@/studio/lib/motion";
import { isPowered, setPowered } from "@/studio/lib/save";
import { getStory, onStageChange, story, useStory } from "@/studio/lib/story";
import { ask, lineFor, say, sayLine, script, scriptTopic } from "@/studio/lib/narrator";
import { getProject, nextWork, projects, works } from "@/studio/data/projects";
import { NOT_YET_REPLY, TWISTS, nameTags } from "@/studio/data/lines";
import { ui } from "@/studio/data/script";

type Phase = "boot" | "standby" | "power" | "save" | "room" | "peek" | "ending";

const CEREMONY: Phase[] = ["boot", "standby", "power", "save"];
const FIRST_WORK = works[0].slug;

function hashSlug(): string | null {
  const m = window.location.hash.match(/^#work\/([\w-]+)/);
  return m && getProject(m[1]) && m[1] !== "omar" ? m[1] : null;
}

const objectEl = (slug: string) => document.querySelector<HTMLElement>(`#obj-${slug} .shelf-object`);
const focusObject = (slug: string) => window.setTimeout(() => document.getElementById(`obj-${slug}`)?.focus({ preventScroll: true }), 30);
const PHONE = "(max-width: 720px)";

/** CONTACT: on a phone the card sits below the fold, so bring it up before focusing (P2) */
function revealContact() {
  const block = document.getElementById("contact");
  if (!block) return;
  block.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
  if (!window.matchMedia(PHONE).matches) return;
  const go = (behavior: ScrollBehavior) => block.scrollIntoView({ block: "start", behavior });
  go(isSoft() ? "auto" : "smooth");
  // The narrator's box opens above the card a moment later and pushes it down: follow it
  window.setTimeout(() => {
    const top = block.getBoundingClientRect().top;
    if (top < 0 || top > 160) go(isSoft() ? "auto" : "smooth");
  }, 650);
}

export default function Room() {
  const save = useStory();
  const [phase, setPhase] = useState<Phase>("boot");
  const [shortPower, setShortPower] = useState(false);
  const [focus, setFocus] = useState("omar");
  const [view, setView] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [options, setOptions] = useState<{ open: boolean; contact: boolean }>({ open: false, contact: false });
  const [tagOverride, setTagOverride] = useState<string | null>(null);
  const [peekLine, setPeekLine] = useState("* not yet.");
  // At the top of a guide the narrator's toast sits up by the cover, clear of the facts strip
  const [guideTop, setGuideTop] = useState(true);

  const tv = useRef<TvHandle>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const powerTl = useRef<gsap.core.Timeline | null>(null);
  const openTl = useRef<gsap.core.Timeline | null>(null);
  const openSlug = useRef<string | null>(null);
  const optionsTrigger = useRef<HTMLElement | null>(null);
  const pushed = useRef(false);
  const pendingBeat = useRef<number | null>(null);
  const seenFocus = useRef(new Set<string>());
  const offerAsked = useRef(false);
  const logoClicks = useRef(0);
  const keyNavs = useRef(0);
  const guideEndSaid = useRef<string | null>(null);
  const endingRun = useRef(false);
  const live = useRef({ phase, view, opening, focus, optionsOpen: options.open });
  useEffect(() => {
    live.current = { phase, view, opening, focus, optionsOpen: options.open };
  });

  // Put an opened object back on the shelf. revert() (not progress(0)) undoes the hard
  // opacity/visibility sets at time 0 and runs the transition's own cleanup.
  const revertOpen = useCallback(() => {
    const tl = openTl.current;
    const slug = openSlug.current;
    openTl.current = null;
    openSlug.current = null;
    tl?.revert();
    const root = slug ? objectEl(slug)?.querySelector<HTMLElement>(".obj") : null;
    if (root) gsap.set(root, { clearProps: "opacity,visibility" });
  }, []);

  const ceremony = CEREMONY.includes(phase);
  const project = getProject(focus) ?? projects[0];
  const guideProject = view ? getProject(view) : undefined;

  /* ------------------------------------------------------------------ entry ---- */
  // Reads browser-only state (hash, storage) once after hydration, so setState here is the point
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    applySpeedParam();
    const deep = hashSlug();
    const q = new URLSearchParams(window.location.search).get("focus");
    const s = getStory();
    let next: Phase;
    if (deep) {
      // Deep links skip every ceremony (P2)
      setPowered(true);
      story.ensureStarted();
      setFocus(deep);
      setView(deep);
      next = s.stage === 3 ? "ending" : "room";
    } else if ((q && getProject(q)) || isPowered()) {
      setPowered(true);
      story.ensureStarted();
      setFocus(q && getProject(q) ? q : s.focus);
      next = s.stage === 3 ? "ending" : "room";
    } else {
      setShortPower(s.started);
      next = "standby";
    }
    setPhase(next);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Standby: the TV wakes by itself after 300ms (no gate)
  useEffect(() => {
    if (phase !== "standby") return;
    const id = window.setTimeout(() => setPhase("power"), 300);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Any key or click finishes the power-on at once
  useEffect(() => {
    if (phase !== "power") return;
    const finish = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.(".bar")) return;
      powerTl.current?.progress(1);
    };
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [phase]);

  /* ---------------------------------------------------------- save select ---- */
  const greetNight = () => {
    const h = new Date().getHours();
    if (h < 6) window.setTimeout(() => sayLine(lineFor("nightVisit") ?? "", { force: true }), 400);
  };

  const enterRoom = useCallback((how: "new" | "continue" | "skip", target?: string) => {
    powerTl.current?.kill();
    const s = getStory();
    const fresh = how === "new" || (how === "skip" && !s.started);
    // A peek at the corrupt file is remembered across NEW GAME, but its beat waits
    // until the greeting (at stage 0) has been said
    const peeks = s.corruptPeeks;
    if (fresh) {
      story.newGame();
      pendingBeat.current = null;
    } else story.continueGame();
    const restorePeeks = () => peeks > 0 && story.restorePeeks(peeks);
    setPowered(true);
    const f = target ?? (how === "new" || !s.started ? "omar" : s.focus);
    setFocus(f);
    setPhase("room");
    focusObject(f);
    window.setTimeout(() => {
      if (how === "new")
        scriptTopic("newGame", () => {
          greetNight();
          restorePeeks();
        });
      else if (how === "continue") script([lineFor("returning") ?? ""].filter(Boolean), greetNight);
      else {
        sayLine(lineFor("skipIntro") ?? "", { force: true });
        if (fresh) window.setTimeout(restorePeeks, 2600);
      }
    }, 250);
  }, []);

  const runPeek = () => {
    story.corruptPeek();
    const first = TWISTS["empty-file"].lines[0];
    setPeekLine(getStory().corruptPeeks <= 1 ? first : (lineFor("emptyFile") ?? first));
    setPhase("peek");
    window.setTimeout(() => setPhase("save"), isSoft() ? 1600 : 2400);
  };

  const pickFile = (id: "file1" | "new" | "corrupted") => {
    if (id === "corrupted") return runPeek();
    enterRoom(id === "new" ? "new" : "continue");
  };

  /* ------------------------------------------------------------ story beats ---- */
  const tear = useCallback((to: number) => {
    const frames12 = nameTags[to as 0 | 1 | 2]?.glitchFrames ?? [];
    const tag = document.querySelector<HTMLElement>(".narrator .name-tag");
    if (isSoft() || !frames12.length) return; // SOFT: a hard cut
    if (tag) staticBurst(tag, false, { force: true });
    const logo = document.querySelector<HTMLElement>(".bar-mark svg");
    if (logo) staticBurst(logo.parentElement as HTMLElement, false, { force: true });
    frames12.forEach((f, i) => window.setTimeout(() => setTagOverride(f), (i * 280) / frames12.length));
    window.setTimeout(() => setTagOverride(null), 280);
  }, []);

  const offer = () => {
    offerAsked.current = true;
    const t = TWISTS["the-offer"];
    const choices = (t.choices ?? []).map((c, i) => ({ label: c.label.en.toUpperCase(), value: i === 0 ? "yes" : "no" }));
    const asked = ask(t.lines[t.lines.length - 1], choices, (v) => (v === "yes" ? runEnding() : sayLine(NOT_YET_REPLY, { force: true })), t.lines.slice(0, -1));
    if (!asked) runEnding();
  };

  const playBeat = useCallback(
    (to: number) => {
      pendingBeat.current = null;
      tear(to);
      const id = to === 1 ? "wrong-memory" : "reflection";
      if (getStory().twistsPlayed.includes(id)) return;
      story.twist(id);
      if (to === 2 && !isSoft() && tv.current?.glass) {
        // One black frame: a face in the glass
        gsap.set(tv.current.glass, { filter: "brightness(0)" });
        gsap.set(tv.current.glass, { filter: "none", delay: 1 / 12 });
      }
      window.setTimeout(() => script(TWISTS[id].lines), 320);
    },
    [tear],
  );

  useEffect(
    () =>
      onStageChange((_from, to) => {
        if (to === 3) return;
        pendingBeat.current = to;
        const l = live.current;
        if (l.phase === "room" && !l.view && !l.opening) playBeat(to);
      }),
    [playBeat],
  );

  // A beat that happened inside a guide or the save select plays back in the Room
  useEffect(() => {
    if (phase === "room" && !view && !opening && pendingBeat.current !== null) {
      const to = pendingBeat.current;
      const id = window.setTimeout(() => playBeat(to), 600);
      return () => window.clearTimeout(id);
    }
  }, [phase, view, opening, playBeat]);

  /* ----------------------------------------------------------------- ending ---- */
  function runEnding() {
    if (endingRun.current) return;
    endingRun.current = true;
    story.twist("terminate");
    setView(null);
    setOptions({ open: false, contact: false });
    const soft = isSoft();
    const items = [...document.querySelectorAll<HTMLElement>(".shelf-item")].reverse();
    const lines = TWISTS.terminate.lines.slice(0, -1);
    const narrated = getStory().narrator;
    const gap = narrated ? Math.max(0.09, (lines.length * 2.6) / Math.max(items.length, 1)) : 0.09;
    const drop = gsap.timeline();
    items.forEach((el, i) => {
      drop.to(el, { y: 140, opacity: 0, ...frames(soft ? 2 : 4) }, i * gap);
    });
    drop.to(".room-info", { opacity: 0, duration: 0.4 }, 0.6);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      drop.progress(1);
      const glass = tv.current?.frame;
      const end = () => {
        story.ending();
        setPhase("ending");
        endingRun.current = false;
      };
      if (!glass) return end();
      const tl = gsap.timeline({ onComplete: end });
      if (soft) tl.to(glass, { opacity: 0, scale: 0.98, duration: 0.4 });
      else tl.to(glass, { scaleY: 0.01, duration: 0.15, ease: "power2.in" }).to(glass, { scaleX: 0.01, duration: 0.15, ease: "power2.in" }).to(glass, { opacity: 0, duration: 0.15 });
    };
    if (narrated) script(lines, finish);
    else drop.eventCallback("onComplete", finish);
  }

  const powerOnAgain = () => {
    story.reset();
    setPowered(false);
    seenFocus.current.clear();
    offerAsked.current = false;
    pendingBeat.current = null;
    setView(null);
    setFocus("omar");
    setShortPower(false);
    setOptions({ open: false, contact: false });
    setPhase("standby");
  };

  /* --------------------------------------------------------- focus and open ---- */
  const select = (slug: string) => {
    if (slug === live.current.focus || live.current.opening) return;
    setFocus(slug);
    story.focus(slug);
    const s = getStory();
    if (slug === "omar" && s.stage === 2 && s.twistsPlayed.includes("reflection") && !offerAsked.current) return offer();
    if (slug === "ptcg-cube" && s.stage === 1 && !s.twistsPlayed.includes("hands")) {
      story.twist("hands");
      return script(TWISTS.hands.lines);
    }
    if (!seenFocus.current.has(slug)) {
      seenFocus.current.add(slug);
      say(`focus.${slug}`);
    }
  };

  const showGuide = useCallback((slug: string, push: boolean) => {
    if (push) {
      history.pushState({ afterimage: slug }, "", `#work/${slug}`);
      pushed.current = true;
    }
    guideEndSaid.current = null;
    setGuideTop(true);
    setView(slug);
    story.opened(slug);
  }, []);

  const open = (slug: string) => {
    if (live.current.opening || live.current.phase !== "room") return;
    const p = getProject(slug);
    if (!p) return;
    if (slug !== live.current.focus) {
      setFocus(slug);
      story.focus(slug);
    }
    say(`open.${slug}`);
    const el = objectEl(slug);
    const glass = tv.current?.glass;
    const done = () => {
      setOpening(false);
      if (slug === "omar") {
        // The card shows its back for a moment, then slides home
        window.setTimeout(revertOpen, 1400);
        revealContact();
        return;
      }
      showGuide(slug, true);
    };
    if (!el || !glass) return done();
    setOpening(true);
    revertOpen();
    const tl = openTimeline(p.kind, el, glass, isSoft());
    openTl.current = tl;
    openSlug.current = slug;
    tl.eventCallback("onComplete", done);
  };

  // Any input during an open jumps to its end (P2)
  useEffect(() => {
    if (!opening) return;
    const jump = () => openTl.current?.progress(1);
    const t = window.setTimeout(() => {
      window.addEventListener("keydown", jump);
      window.addEventListener("pointerdown", jump);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", jump);
      window.removeEventListener("pointerdown", jump);
    };
  }, [opening]);

  /* ------------------------------------------------------------------ guide ---- */
  useEffect(() => {
    const el = sheet.current;
    if (!view || !el) return;
    el.scrollTop = 0;
    el.focus({ preventScroll: true });
    const reset = () => revertOpen();
    if (pushed.current) {
      gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: SHEET_SPRING.duration, ease: SHEET_SPRING.ease, onComplete: reset });
    } else reset();
  }, [view, revertOpen]);

  const leaveGuide = useCallback((slug: string) => {
    revertOpen();
    setView(null);
    setFocus(slug);
    story.focus(slug);
    focusObject(slug);
    window.setTimeout(() => say("closeGuide"), 300);
  }, [revertOpen]);

  const closeGuide = useCallback(() => {
    const slug = live.current.view;
    const el = sheet.current;
    if (!slug) return;
    const after = () => {
      if (pushed.current && history.state?.afterimage) {
        pushed.current = false;
        history.back(); // popstate leaves the guide
      } else {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        leaveGuide(slug);
      }
    };
    if (el) gsap.to(el, { yPercent: 100, duration: 0.32, ease: "power2.in", onComplete: after });
    else after();
  }, [leaveGuide]);

  useEffect(() => {
    const onPop = () => {
      const slug = hashSlug();
      if (slug) {
        setFocus(slug);
        setView(slug);
        story.opened(slug);
      } else if (live.current.view) leaveGuide(live.current.view);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, [leaveGuide]);

  const nextGuide = () => {
    if (!view) return;
    const n = nextWork(view);
    history.replaceState(history.state, "", `#work/${n.slug}`);
    setFocus(n.slug);
    story.focus(n.slug);
    showGuide(n.slug, false);
    sheet.current?.scrollTo({ top: 0 });
  };

  const onSheetScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const top = el.scrollTop < 240;
    if (top !== guideTop) setGuideTop(top);
    if (!view || guideEndSaid.current === view) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      guideEndSaid.current = view;
      story.finished(view);
      say("guideEnd");
    }
  };

  /* ------------------------------------------------------- global listeners ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && live.current.view && !live.current.optionsOpen) {
        e.preventDefault();
        closeGuide();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeGuide]);

  // Idle (30s, then 60s more once per view), tab return, keyboard-only, play time
  useEffect(() => {
    if (phase !== "room") return;
    let short: number, long: number;
    let longSaid = false;
    const arm = () => {
      window.clearTimeout(short);
      window.clearTimeout(long);
      short = window.setTimeout(() => {
        say("idleShort");
        if (longSaid) return;
        long = window.setTimeout(() => {
          longSaid = true;
          const s = getStory();
          if (s.stage === 1 && !s.twistsPlayed.includes("hands")) {
            story.twist("hands");
            script(TWISTS.hands.lines);
          } else say("idleLong");
        }, 60000);
      }, 30000);
    };
    const onPointer = () => {
      keyNavs.current = 0;
      arm();
    };
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 1500) {
        hiddenAt = 0;
        window.setTimeout(() => say("tabReturn"), 300);
      }
    };
    const tick = window.setInterval(() => !document.hidden && story.tick(5), 5000);
    arm();
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("keydown", arm);
    window.addEventListener("scroll", arm, { passive: true, capture: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(short);
      window.clearTimeout(long);
      window.clearInterval(tick);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("scroll", arm, { capture: true });
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [phase, view]);

  const onKeyNav = () => {
    keyNavs.current++;
    if (keyNavs.current === 3) say("keyboardOnly");
  };

  /* -------------------------------------------------------------------- bar ---- */
  const toWork = () => {
    if (ceremony) return enterRoom("skip", FIRST_WORK);
    if (phase === "ending" || phase === "peek") return showGuide(FIRST_WORK, true);
    if (view) closeGuide();
    const target = focus === "omar" ? FIRST_WORK : focus;
    setFocus(target);
    story.focus(target);
    focusObject(target);
  };

  const toContact = () => {
    if (ceremony) {
      enterRoom("skip", "omar");
      window.setTimeout(revealContact, 120);
      return;
    }
    if (phase === "ending" || phase === "peek") return setOptions({ open: true, contact: true });
    if (view) closeGuide();
    setFocus("omar");
    story.focus("omar");
    say("readContact");
    window.setTimeout(revealContact, view ? 400 : 60);
  };

  const changeMotion = (m: "full" | "soft") => {
    if (m === getMotion()) return;
    setMotion(m);
    sayLine(lineFor(m === "full" ? "motionFull" : "motionSoft") ?? "", { force: true });
  };

  const closeOptions = useCallback(() => {
    setOptions({ open: false, contact: false });
    optionsTrigger.current?.focus();
  }, []);

  const bareClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) say("bareRoom");
  };

  /* ----------------------------------------------------------------- render ---- */
  let screen: React.ReactNode;
  let channel = phase as string;
  let announce = "";
  if (phase === "boot" || phase === "standby") screen = <StandbyScreen />;
  else if (phase === "power") screen = <PowerOnScreen short={shortPower} tlRef={powerTl} onDone={() => setPhase("save")} />;
  else if (phase === "save") {
    screen = (
      <SaveSelectScreen
        hasSave={save.started}
        playSeconds={save.playSeconds}
        opened={save.opened.length}
        onPick={pickFile}
        onCorruptFocus={() => say("corruptFocus")}
      />
    );
    announce = ui.sr.saveSelect;
  } else {
    channel = focus;
    // The shelf option already names what is focused; a second "now showing" would repeat it
    const ch = projects.findIndex((p) => p.slug === focus) + 1;
    screen = focus === "omar" ? <StatusScreen stage={save.stage} playSeconds={save.playSeconds} onAfter={offer} /> : <TitleScreen project={project} channel={ch} />;
  }

  const narratorStage = Math.min(save.stage, 2);
  const narrator = (
    <Narrator
      variant="tv"
      stage={narratorStage}
      enabled={save.narrator}
      tagOverride={tagOverride}
      onTurnOff={() => story.setNarrator(false)}
      onLogo={() => {
        const n = Math.min(logoClicks.current++, 4);
        sayLine(lineFor(`logo${n}`) ?? "", { force: true });
      }}
    />
  );

  const empty = phase === "peek" || phase === "ending";

  return (
    <div
      className="studio"
      data-phase={phase}
      data-guide={view ? "" : undefined}
      data-guide-top={view && guideTop ? "" : undefined}
      data-opening={opening && focus !== "omar" ? "" : undefined}
    >
      <Bar
        stage={save.stage}
        ceremony={ceremony}
        onHome={() => (ceremony ? enterRoom("skip") : view ? closeGuide() : focusObject(focus))}
        onWork={toWork}
        onContact={toContact}
        onMotion={() => changeMotion(getMotion() === "full" ? "soft" : "full")}
        onOptions={(t) => {
          optionsTrigger.current = t;
          setOptions({ open: true, contact: false });
        }}
        onSkip={() => enterRoom("skip")}
        onSkipLink={() => (ceremony ? enterRoom("skip", FIRST_WORK) : view ? closeGuide() : focusObject(focus))}
        optionsOpen={options.open}
      />

      {empty ? (
        <EmptyRoom
          variant={phase === "peek" ? "peek" : "ending"}
          line={phase === "peek" ? peekLine : TWISTS.terminate.lines[TWISTS.terminate.lines.length - 1]}
          tag={phase === "peek" ? nameTags[2].tag : undefined}
          light={<Daylight />}
          onPowerOn={powerOnAgain}
        />
      ) : (
        <main className="room" inert={view || options.open ? true : undefined} aria-hidden={view ? true : undefined}>
          <Daylight />
          <div className="room-stage" onClick={bareClick}>
            <div className="room-tv">
              <Tv
                ref={tv}
                channel={channel}
                tint={phase === "room" ? project.palette[0] : undefined}
                announce={announce}
                narrator={phase === "room" || phase === "save" ? narrator : undefined}
              >
                {screen}
              </Tv>
            </div>
            <aside className="room-info">
              <InfoCard project={project} ceremony={ceremony} onOpen={() => open(focus)} onContact={() => say("readContact")} />
            </aside>
          </div>
          <Shelf projects={projects} selected={focus} inert={ceremony} onSelect={select} onOpen={open} onKeyNav={onKeyNav} />
        </main>
      )}

      {guideProject && (
        <>
          <div
            ref={sheet}
            className="sheet"
            role="dialog"
            aria-label={`${guideProject.title}: ${ui.sr.guide}`}
            tabIndex={-1}
            onScroll={onSheetScroll}
          >
            <Guide key={guideProject.slug} project={guideProject} onBack={closeGuide} onNext={nextGuide} />
          </div>
          <Narrator
            variant="dock"
            stage={narratorStage}
            enabled={save.narrator}
            onTurnOff={() => story.setNarrator(false)}
            onLogo={() => {
              const n = Math.min(logoClicks.current++, 4);
              sayLine(lineFor(`logo${n}`) ?? "", { force: true });
            }}
          />
        </>
      )}

      <Options
        open={options.open}
        focusContact={options.contact}
        narrator={save.narrator}
        onClose={closeOptions}
        onMotion={changeMotion}
        onNarrator={(on) => story.setNarrator(on)}
        onReset={powerOnAgain}
        onWork={() => {
          setOptions({ open: false, contact: false });
          toWork();
        }}
      />
    </div>
  );
}
