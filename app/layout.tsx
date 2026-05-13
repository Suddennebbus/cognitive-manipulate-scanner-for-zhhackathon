import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "照妖镜 CMS v0.1 - 认知操控检测器",
  description: "高赞之下，未必真实。你的防认知操控守护神。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0a0a0f] text-white" suppressHydrationWarning>{children}</body>
    </html>
  );
}
