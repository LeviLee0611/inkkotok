"use client";

import Link from "next/link";

export default function BrandMark() {
  return (
    <Link
      className="fixed left-6 top-6 z-50 flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white/90 px-3 py-2 shadow-sm backdrop-blur"
      href="/"
    >
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-[var(--sun)]">
        <img
          src="/logo.png"
          alt="잉꼬부부 로고"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-semibold text-[var(--ink)]">
          잉꼬부부
        </p>
        <p className="text-[10px] text-zinc-500">커뮤니티 홈</p>
      </div>
    </Link>
  );
}
