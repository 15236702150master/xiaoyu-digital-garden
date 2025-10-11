import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import CodeHighlighter from "@/components/CodeHighlighter";

const inter = Inter({
  subsets: ["latin"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "小宇的数字花园",
  description: "收集日常生活中碎片化知识记录的数字花园",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.className} ${merriweather.variable}`}>
      <body className="antialiased">
        <CodeHighlighter />
        {children}
      </body>
    </html>
  );
}
