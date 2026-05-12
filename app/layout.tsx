import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeeklyShot - GLP-1注射リマインダー",
  description:
    "ウゴービ・ゼップバウンドの週1回注射を打ち忘れないLINEボット。完全無料・登録30秒・内分泌専門医監修。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500 leading-relaxed">
          <p>
            本サービスは健康管理の記録補助を目的としたツールです。
            <br />
            医学的判断・処方・用量調整は主治医の指示に従ってください。
            <br />
            本サービスの利用により生じたいかなる結果についても、
            運営者は責任を負いません。
          </p>
          <p className="mt-2 text-gray-400">
            &copy; {new Date().getFullYear()} WeeklyShot by Dr. いわたつ
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
