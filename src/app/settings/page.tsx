"use client";

import { useState } from "react";

type Toggle = {
  key: string;
  label: string;
  description: string;
};

const TOGGLES: Toggle[] = [
  {
    key: "darkMode",
    label: "다크 모드",
    description: "어두운 배경 테마로 전환합니다.",
  },
  {
    key: "notifyReplies",
    label: "댓글 알림",
    description: "내 글에 댓글이 달리면 알림을 표시합니다.",
  },
  {
    key: "notifyMentions",
    label: "멘션 알림",
    description: "내가 언급되면 알림을 표시합니다.",
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    const initial: Record<string, boolean> = {};
    TOGGLES.forEach((toggle) => {
      const raw = localStorage.getItem(`setting:${toggle.key}`);
      initial[toggle.key] = raw ? raw === "true" : toggle.key === "darkMode" ? false : true;
    });
    return initial;
  });

  const setToggle = (key: string, value: boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(`setting:${key}`, String(value));

    if (key === "darkMode") {
      const root = document.documentElement;
      if (value) {
        root.classList.add("theme-dark");
      } else {
        root.classList.remove("theme-dark");
      }
      localStorage.setItem("theme", value ? "dark" : "light");
    }
  };

  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">설정</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          커뮤니티 경험을 맞춤 설정하세요
        </h1>
        <p className="text-sm text-zinc-600">
          설정은 브라우저에 저장됩니다.
        </p>
      </header>

      <section className="mx-auto mt-6 grid w-full max-w-5xl gap-4">
        {TOGGLES.map((toggle) => (
          <div
            key={toggle.key}
            className="flex items-center justify-between rounded-3xl border border-[var(--border-soft)] bg-white/90 px-5 py-4 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {toggle.label}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {toggle.description}
              </p>
            </div>
            <button
              className={`h-8 w-14 rounded-full border border-[var(--border-soft)] p-1 transition ${
                values[toggle.key] ? "bg-[var(--mint)]" : "bg-[var(--paper)]"
              }`}
              type="button"
              onClick={() => setToggle(toggle.key, !values[toggle.key])}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white shadow transition ${
                  values[toggle.key] ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
