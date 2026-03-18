import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UK Wind Power — Forecast Monitor",
  description:
    "Real-time monitoring dashboard for UK wind power generation vs forecasts, powered by Elexon BMRS data.",
  keywords: [
    "UK wind power",
    "forecast monitoring",
    "BMRS",
    "Elexon",
    "energy dashboard",
    "wind generation",
  ],
};

/**
 * Root layout with Inter font and clean light styling.
 * No dark mode — intentionally minimal and professional.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
