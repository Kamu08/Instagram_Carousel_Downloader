import type { Metadata } from "next";
import {
  Space_Grotesk,
  Caveat,
  Patrick_Hand,
  JetBrains_Mono,
  Inter,
  Titan_One,
  Paytone_One,
} from "next/font/google";
import "./globals.css";

const titanOne = Titan_One({
  variable: "--font-titan",
  subsets: ["latin"],
  weight: ["400"],
});

const paytoneOne = Paytone_One({
  variable: "--font-paytone",
  subsets: ["latin"],
  weight: ["400"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick",
  subsets: ["latin"],
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkedIn Carousel Processor — Instagram to LinkedIn-Ready PNGs",
  description: "Turn Instagram carousels into high-resolution LinkedIn-ready PNGs in seconds. Sketchbook & Doodle studio edition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${titanOne.variable} ${paytoneOne.variable} ${spaceGrotesk.variable} ${caveat.variable} ${patrickHand.variable} ${jetbrainsMono.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Titan+One&family=Paytone+One&family=Bungee&family=Bowlby+One+SC&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
