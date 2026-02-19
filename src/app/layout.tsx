import type { Metadata } from "next";
import { Hahmlet, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
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

const hahmlet = Hahmlet({
  variable: "--font-hero",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "잉꼬톡 커뮤니티 | 부부 고민·육아·관계 정보 공유",
    template: "%s | 잉꼬톡 커뮤니티",
  },
  description:
    "잉꼬톡은 부부 고민, 육아, 관계 회복, 생활 꿀팁을 나누는 커뮤니티입니다. 세대별 라운지에서 경험을 공유하고 실질적인 도움을 받아보세요.",
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
        className={`${notoSans.variable} ${notoSerif.variable} ${hahmlet.variable} antialiased font-body`}
      >
        <ThemeInit />
        <BrandMark />
        <AppMenu />
        {children}
      </body>
    </html>
  );
}
