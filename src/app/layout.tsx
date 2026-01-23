import type { Metadata } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "PrimordialRune — Game Design & Development Portfolio",
  description: "Portfolio of Omar Golinelli (PrimordialRune) — Game Designer and Developer. Board games, videogames, UI/UX, and interactive experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fkGrotesk.variable} ${fkGroteskBlack.variable} ${bitDarling.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
