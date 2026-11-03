import type { Metadata } from "next";

// GitHub Pages serves this for any wrong address (old /projects links too): the standby card's NO SIGNAL, with the ways in
export const metadata: Metadata = {
  title: "No signal · Omar’s Room",
  robots: { index: false },
};

const link = "block border-2 border-blood-orange px-4 py-3 text-cream hover:bg-gold hover:text-peacock-blue hover:border-gold focus-visible:bg-gold focus-visible:text-peacock-blue focus-visible:outline-2 focus-visible:outline-blood-orange";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-peacock-blue text-cream grid place-content-center justify-items-center gap-3 px-4 py-10 text-center">
      <p className="text-2xl tracking-wider" style={{ fontFamily: "var(--font-8bit-darling)" }}>NO SIGNAL</p>
      <small lang="ja" className="text-aquamarine text-xs font-black" style={{ fontFamily: "var(--font-fk-grotesk-black)" }}>ノーシグナル</small>
      <p className="max-w-sm text-base" style={{ fontFamily: "var(--font-fk-grotesk-black)" }}>Nothing is on this channel. Omar’s room and the games are one click away.</p>
      <nav className="mt-2 grid gap-3 w-full max-w-xs" style={{ fontFamily: "var(--font-8bit-darling)" }}>
        <a className={link} href="/">BACK TO THE ROOM</a>
        <a className={link} href="/new/quick/">QUICK VIEW →</a>
      </nav>
      <a className="mt-2 text-gold underline underline-offset-4" style={{ fontFamily: "var(--font-fk-grotesk-black)" }} href="mailto:primordialrune@gmail.com">primordialrune@gmail.com</a>
    </main>
  );
}
