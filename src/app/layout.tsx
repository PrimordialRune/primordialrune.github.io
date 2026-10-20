import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/night/night.css";
import { MOTION_INIT_SCRIPT } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Omar Golinelli — Game Designer",
  description:
    "Omar Golinelli (PrimordialRune), game designer and developer. Five games on a desk at night, each in its own medium: open one to read its manual.",
  // relative, so the icon also resolves when the export is served from a sub-path
  icons: { icon: "./favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#102f41",
};

// Fonts are declared inline, not through next/font: inline CSS resolves url() against the
// document, so "fonts/x.otf" keeps working when the export is served from any sub-path
// (a stylesheet under _next/static/css would resolve it against itself and miss).
const FONT_AND_TOKENS = `
@font-face{font-family:"FK Grotesk";src:url("fonts/FKGrotesk-Thin.otf") format("opentype");font-weight:300;font-style:normal;font-display:swap}
@font-face{font-family:"FK Grotesk";src:url("fonts/FKGrotesk-Black.otf") format("opentype");font-weight:900;font-style:normal;font-display:swap}
@font-face{font-family:"FK Grotesk";src:url("fonts/FKGrotesk-BlackItalic.otf") format("opentype");font-weight:900;font-style:italic;font-display:swap}
@font-face{font-family:"8bitDarling";src:url("fonts/8bitDarling-Regular.otf") format("opentype");font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:"GN KillGothic";src:url("fonts/GN-KillGothic-U-KanaNA.ttf") format("truetype");font-weight:400;font-style:normal;font-display:swap}
:root{
--cream:#fce8cd;--peacock-blue:#102f41;--teal:#339999;--aquamarine:#4eb99f;--dark-teal:#256069;--blood-orange:#ec563b;--gold:#fadb68;
--ai-red:#d4182b;
--f-omar:"FK Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
--f-machine:"8bitDarling",ui-monospace,monospace;
--f-kana:"GN KillGothic","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
--font-fk-grotesk:"FK Grotesk",sans-serif;--font-fk-grotesk-black:"FK Grotesk",sans-serif;--font-8bit-darling:"8bitDarling",monospace;--font-kill-gothic:"GN KillGothic",sans-serif;
}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-motion="full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: FONT_AND_TOKENS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
