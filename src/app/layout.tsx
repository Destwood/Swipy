import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, DM_Mono } from "next/font/google";
import { FrameNav } from "@/components/FrameNav";
import { Grain } from "@/components/Grain";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Swipy",
  description: "Swipe games. Keep what you love.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-hidden bg-sw-bg font-body text-sw-text">
        <Grain />
        <FrameNav />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
