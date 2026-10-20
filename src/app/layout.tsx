import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/studio/studio.css";
import { MOTION_INIT_SCRIPT } from "@/lib/motion";

const fkGrotesk = localFont({
  src: [{ path: "../../public/fonts/FKGrotesk-Thin.otf", weight: "300", style: "normal" }],
  variable: "--font-fk-grotesk",
});

const fkGroteskBlack = localFont({
  src: [
    { path: "../../public/fonts/FKGrotesk-Black.otf", weight: "900", style: "normal" },
    { path: "../../public/fonts/FKGrotesk-BlackItalic.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-fk-grotesk-black",
});

const bitDarling = localFont({
  src: "../../public/fonts/8bitDarling-Regular.otf",
  variable: "--font-8bit-darling",
});

const killGothic = localFont({
  src: "../../public/fonts/GN-KillGothic-U-KanaNA.ttf",
  variable: "--font-kill-gothic",
});

export const metadata: Metadata = {
  title: "Omar Golinelli — Game Designer",
  description:
    "Portfolio of Omar Golinelli (PrimordialRune), game designer and developer. Board games, videogames and the stories around them.",
};

export const viewport: Viewport = {
  themeColor: "#fce8cd",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-motion="full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} />
      </head>
      <body className={`${fkGrotesk.variable} ${fkGroteskBlack.variable} ${bitDarling.variable} ${killGothic.variable}`}>
        {children}
      </body>
    </html>
  );
}
