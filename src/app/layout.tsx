import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/studio/styles/studio.css";
import { MOTION_INIT_SCRIPT } from "@/studio/lib/motionInit";

// P5: three voices. Grotesk (Omar), 8bitDarling (the machine), GenEiKiwamiGo (the subtitle)
const grotesk = localFont({
  src: [
    { path: "../../public/fonts/FKGrotesk-Thin.otf", weight: "300", style: "normal" },
    { path: "../../public/fonts/FKGrotesk-Black.otf", weight: "900", style: "normal" },
    { path: "../../public/fonts/FKGrotesk-BlackItalic.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-grotesk",
  display: "swap",
});

const pixel = localFont({
  src: "../../public/fonts/8bitDarling-Regular.otf",
  variable: "--font-pixel",
  display: "swap",
});

const kana = localFont({
  src: "../../public/fonts/GenEiKiwamiGo.ttf",
  variable: "--font-kana",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Omar Golinelli · PrimordialRune · Game Designer",
  description:
    "Omar Golinelli (PrimordialRune) designs games, the board kind and the screen kind. A shelf of his projects under a remembered TV.",
};

export const viewport: Viewport = {
  themeColor: "#fce8cd",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-motion="full" suppressHydrationWarning className={`${grotesk.variable} ${pixel.variable} ${kana.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
