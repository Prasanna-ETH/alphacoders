import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MULEX | Financial Crime Intelligence & Investigation Platform",
  description: "Next-generation financial intelligence and mule account network investigation system for cybercrime units.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-slate-950 text-slate-100 min-h-screen antialiased flex overflow-hidden`}>
        <Suspense fallback={<div className="w-64 bg-slate-950 border-r border-slate-800" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Suspense fallback={<div className="h-16 bg-slate-950 border-b border-slate-800" />}>
            <Header />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
            <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Loading investigation view...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </body>
    </html>
  );
}
