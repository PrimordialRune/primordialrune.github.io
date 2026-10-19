import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const fkGrotesk = localFont({
  src: [
    {
      path: "../../public/fonts/FKGrotesk-Thin.otf",
      weight: "300",
      style: "normal",
    },
  ],
  variable: "--font-fk-grotesk",
});

const fkGroteskBlack = localFont({
  src: [
    {
      path: "../../public/fonts/FKGrotesk-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/FKGrotesk-BlackItalic.otf",
      weight: "900",
      style: "italic",
    },
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

const genEiKiwami = localFont({
  src: "../../public/fonts/GenEiKiwamiGo.ttf",
  variable: "--font-gen-ei-kiwami",
});

const siteTitle = "PrimordialRune — Game Design & Development Portfolio";
const siteDescription = "Portfolio of Omar Golinelli (PrimordialRune) — Game Designer and Developer. Board games, videogames, UI/UX, and interactive experiences.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: siteTitle,
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PrimordialRune",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    creator: "@PrimordialRune",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fkGrotesk.variable} ${fkGroteskBlack.variable} ${bitDarling.variable} ${killGothic.variable} ${genEiKiwami.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
