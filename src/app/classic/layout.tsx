import type { Metadata } from "next";

// The first home page (pause menu, hero, desk), kept here after the room took over www.primordialrune.com
export const metadata: Metadata = {
  title: "PrimordialRune — Classic",
  robots: { index: false },
};

export default function ClassicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
