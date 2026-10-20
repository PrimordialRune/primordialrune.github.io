"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { UI_SPRING } from "@/studio/lib/motion";
import { factsFor, profile } from "@/studio/data/projects";
import { ui } from "@/studio/data/script";
import type { StudioProject } from "@/studio/types";

// The info card: Omar's voice (P5), clean informational text (P1), supporting the
// focused object. Swaps in under 100ms on focus, with a small spring.
export default function InfoCard({
  project,
  onOpen,
  onContact,
}: {
  project: StudioProject;
  onOpen: () => void;
  onContact: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = root.current;
    if (el) gsap.fromTo(el, { y: 6, opacity: 0.4 }, { y: 0, opacity: 1, duration: UI_SPRING.duration * 0.7, ease: UI_SPRING.ease });
  }, [project.slug]);

  const omar = project.slug === "omar";
  const facts = omar ? [] : factsFor(project.slug);

  return (
    <section ref={root} className="info" aria-label={`About ${project.title}`}>
      <p className="info-medium">
        <span className="pixel-1">{project.medium.toUpperCase()}</span>
        <small lang="ja">{project.mediumJp}</small>
      </p>
      <h1 className="info-title">
        {project.title}
        <small lang="ja">{project.titleJp}</small>
      </h1>
      {omar ? (
        <>
          <p className="info-role">
            {profile.class.en}
            <small lang="ja">{profile.class.jp}</small>
          </p>
          <p className="info-pitch">{profile.bio[0]}</p>
          <div className="info-contact" id="contact">
            <p className="info-label">
              CONTACT<small lang="ja">コンタクト</small>
            </p>
            <ul>
              {profile.contact.map((c) => (
                <li key={c.id}>
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" onClick={onContact} onFocus={onContact}>
                    <b>{c.label.en}</b>
                    <span>{c.value}</span>
                  </a>
                  <em>{c.note}</em>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <p className="info-pitch">{project.pitch}</p>
          <button className="cta" onClick={onOpen}>
            {ui.buttons.openGuide.en.toUpperCase()}
            <small lang="ja">{ui.buttons.openGuide.jp}</small>
          </button>
          {facts.length > 0 && (
            <dl className="info-facts">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt>
                    {f.label}
                    <small lang="ja">{f.labelJp}</small>
                  </dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </section>
  );
}
