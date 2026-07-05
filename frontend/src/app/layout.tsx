import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Or whatever font you are using
import "./globals.css";
// 1. Import your new component
import MouseBackground from "../components/MouseBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Exaim Hub",
  description: "AI Exam Evaluation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white`}>

        {/* 2. Place the background behind everything */}
        <MouseBackground />

        {/* 3. Wrap your page content so it sits ON TOP of the background */}
        <div className="relative z-10">
          {children}
        </div>

      </body>
    </html>
  );
}