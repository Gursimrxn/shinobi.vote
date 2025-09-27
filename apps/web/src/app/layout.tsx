import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";

const phantom = localFont({
  src: "../../public/fonts/phantomfont.woff2",
  variable: "--font-phantom",
  display: "swap",
  weight: "400",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Skill Sensai - Master Your Skills",
  description: "Personalized skill assessment and learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${phantom.variable} ${poppins.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
