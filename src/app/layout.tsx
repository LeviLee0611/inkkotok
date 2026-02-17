import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import AppMenu from "@/app/components/AppMenu";
import BrandMark from "@/app/components/BrandMark";
import ThemeInit from "@/app/components/ThemeInit";

const notoSans = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "잉꼬부부 커뮤니티: 잉꼬톡",
  description:
    "잉꼬부부가 고민과 꿀팁을 나누는 따뜻한 커뮤니티, 잉꼬톡.",
  verification: {
    other: {
      "naver-site-verification": "363CA7E3A9F2D085F027AF91E28207E5",
    },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSans.variable} ${notoSerif.variable} antialiased font-body`}
      >
        <ThemeInit />
        <BrandMark />
        <AppMenu />
        {children}
      </body>
    </html>
  );
}
