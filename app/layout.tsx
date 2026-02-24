import type { Metadata } from "next";
import { LanguageProvider } from "@/components/LanguageProvider";
import Topbar from "@/components/Topbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grid Arcade",
  description:
    "A Next.js mini game hub featuring Conway's Game of Life, multi-mode Tetris, Spin Sum Puzzle, and Arrow Matrix."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="page-shell">
            <Topbar />
            <main className="main-area">{children}</main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
