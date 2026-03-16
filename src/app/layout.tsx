import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lumina — AI Study Companion",
  description:
    "Transform any learning material into interactive notes, quizzes, flashcards, and more with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <body className={`${inter.variable} font-sans antialiased text-zinc-100 min-h-screen selection:bg-zinc-800 selection:text-white`}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-black font-bold">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-zinc-300 transition-colors">
                Lumina
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/upload"
                className="text-sm px-4 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-medium transition-colors"
              >
                Upload
              </Link>
            </div>
          </div>
        </nav>
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
