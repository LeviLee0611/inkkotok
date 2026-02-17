"use client";

import { useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

const LOUNGES = [
  "신혼 1-3년",
  "30-40대 부부",
  "50+ 동행",
  "관계 회복",
  "육아 루틴",
  "재정/자산",
];

export default function WriteForm() {
  const [title, setTitle] = useState("");
  const [lounge, setLounge] = useState(LOUNGES[0]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setMessage(null);
    if (!title.trim() || !content.trim()) {
      setMessage("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          lounge,
          content: content.trim(),
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        if (res.status === 401) {
          setMessage("로그인 후 글을 작성할 수 있어요.");
          return;
        }
        setMessage(data.error ?? "글 저장에 실패했어요.");
        return;
      }

      if (data.id) {
        window.location.assign(`/post/${data.id}`);
      } else {
        setMessage("작성은 완료됐지만 이동에 실패했어요.");
      }
    } catch {
      setMessage("글 저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto mt-8 w-full max-w-4xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
      <div className="mb-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--cocoa)]">
        로그인 상태에서 작성하면 글이 바로 등록돼요.
      </div>
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          제목
          <input
            className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
            placeholder="고민을 짧게 요약해요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          라운지 선택
          <div className="grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
            {LOUNGES.map((label) => (
              <button
                key={label}
                className={`rounded-2xl border border-[var(--border-soft)] px-3 py-2 text-left ${
                  lounge === label
                    ? "bg-[var(--lavender)] text-[var(--ink)]"
                    : "bg-[var(--paper)]"
                }`}
                type="button"
                onClick={() => setLounge(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          내용
          <textarea
            className="min-h-[180px] rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
            placeholder="상황과 감정을 자유롭게 적어주세요"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          type="button"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? "작성 중..." : "작성 완료"}
        </button>
        {message ? (
          <p className="text-xs text-zinc-500">{message}</p>
        ) : (
          <p className="text-xs text-zinc-500">작성한 글은 바로 피드에 반영됩니다.</p>
        )}
      </div>
    </main>
  );
}
