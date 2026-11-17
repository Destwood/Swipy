import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Bricolage_Grotesque, DM_Sans, DM_Mono } from "next/font/google";
import { Grain } from "@/features/shell/components/Grain";
import { CustomCursor } from "@/features/custom-cursor";
import { SteamBackgroundSync } from "@/features/steam/components/SteamBackgroundSync";
import { THEME_INIT_SCRIPT } from "@/features/theme/theme-script";
import { ToastHost } from "@/shared/ui/ToastHost";
import "./globals.css";
import styles from "./layout.module.css";

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
      suppressHydrationWarning
      className={`${bricolage.variable} ${dmSans.variable} ${dmMono.variable} ${styles.html}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={styles.body}>
        <Grain />
        <CustomCursor />
        <div className={styles.main}>{children}</div>
        <ToastHost />
        <SteamBackgroundSync />
        <Analytics />
      </body>
    </html>
  );
}
