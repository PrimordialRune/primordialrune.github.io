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
  ceremony = false,
  onOpen,
  onContact,
}: {
  project: StudioProject;
  /** During the power-on the card waits dimmed, but the contacts stay live (P2) */
  ceremony?: boolean;
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

  const wait = ceremony || undefined;

  if (omar) {
    // The TV carries the identity (status, skills); the card leads with how to reach him (P7)
    return (
      <section ref={root} className="info info--omar" aria-label={`About ${project.title}`}>
        <div className="info-wait" inert={wait} data-dim={wait}>
          <p className="info-medium">
            <span className="pixel-1">{project.medium.toUpperCase()}</span>
            <small lang="ja">{project.mediumJp}</small>
          </p>
          <h1 className="sr-only">
            {profile.name}, {profile.class.en.toLowerCase()}
          </h1>
        </div>
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
        <p className="info-pitch info-wait" data-dim={wait}>
          {profile.bio[0]}
        </p>
      </section>
    );
  }

  return (
    <section ref={root} className="info" aria-label={`About ${project.title}`}>
      <div className="info-wait" inert={wait} data-dim={wait}>
        <p className="info-medium">
          <span className="pixel-1">{project.medium.toUpperCase()}</span>
          <small lang="ja">{project.mediumJp}</small>
        </p>
        <h1 className="info-title">
          {project.title}
          <small lang="ja">{project.titleJp}</small>
        </h1>
        <p className="info-pitch">{project.pitch}</p>
        <button className="cta" onClick={onOpen}>
          <span className="cta-face">{ui.buttons.openGuide.en.toUpperCase()}</span>
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
      </div>
    </section>
  );
}
