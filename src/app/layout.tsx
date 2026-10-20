import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/studio/styles/studio.css";
import { MOTION_INIT_SCRIPT } from "@/studio/lib/motionInit";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";

// The favicon is the logo, inlined: no file path to break under a preview sub-path
const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 554.72 555"><path d="${LOGO_OUTER}" fill="#102f41"/><path d="${LOGO_INNER}" fill="#ec563b"/></svg>`,
)}`;

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

// Subset to the characters the site uses (npm run subset-kana): 2.4 MB -> ~23 KB.
// Subtitle text only, so it is not preloaded; swap covers the gap.
const kana = localFont({
  src: "../studio/fonts/GenEiKiwamiGo-subset.woff2",
  variable: "--font-kana",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Omar Golinelli · PrimordialRune · Game Designer",
  description:
    "Omar Golinelli (PrimordialRune) designs games, the board kind and the screen kind. A shelf of his projects under a remembered TV.",
  icons: { icon: [{ url: FAVICON, type: "image/svg+xml" }] },
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
