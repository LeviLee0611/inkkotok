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

type WriteFormProps = {
  mode?: "create" | "edit";
  postId?: string;
  initialTitle?: string;
  initialLounge?: string;
  initialContent?: string;
};

export default function WriteForm({
  mode = "create",
  postId,
  initialTitle = "",
  initialLounge = LOUNGES[0],
  initialContent = "",
}: WriteFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [lounge, setLounge] = useState(initialLounge);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isEditMode = mode === "edit";

  const onSubmit = async () => {
    setMessage(null);
    if (!title.trim() || !content.trim()) {
      setMessage("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch(isEditMode && postId ? `/api/posts/${postId}` : "/api/posts", {
        method: isEditMode ? "PATCH" : "POST",
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
          setMessage(`로그인 후 글을 ${isEditMode ? "수정" : "작성"}할 수 있어요.`);
          return;
        }
        if (res.status === 403) {
          setMessage("작성자 또는 관리자만 수정할 수 있어요.");
          return;
        }
        setMessage(data.error ?? `글 ${isEditMode ? "수정" : "저장"}에 실패했어요.`);
        return;
      }

      if (isEditMode && postId) {
        window.location.assign(`/post/${postId}`);
        return;
      }

      if (!isEditMode && data.id) {
        window.location.assign(`/post/${data.id}`);
      } else {
        setMessage(`${isEditMode ? "수정" : "작성"}은 완료됐지만 이동에 실패했어요.`);
      }
    } catch {
      setMessage(`글 ${isEditMode ? "수정" : "저장"} 중 오류가 발생했어요.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto mt-8 w-full max-w-4xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
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
          <div className="relative">
            <select
              className="h-11 w-full appearance-none rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 pr-10 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              value={lounge}
              onChange={(event) => setLounge(event.target.value)}
            >
              {LOUNGES.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              ▼
            </span>
          </div>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          내용
          <div className="rounded-2xl border border-[var(--border-soft)] bg-gradient-to-b from-white via-white to-[var(--paper)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-zinc-500">
              <span className="font-medium">본문</span>
              <span>{content.trim().length}자</span>
            </div>
            <textarea
              className="min-h-[260px] w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm leading-7 text-zinc-700 outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
              placeholder="상황과 감정을 자유롭게 적어주세요"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <p className="mt-2 px-1 text-[11px] font-normal text-zinc-500">
              줄바꿈과 문단을 나눠 쓰면 읽기 쉬워져요.
            </p>
          </div>
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          type="button"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? `${isEditMode ? "수정" : "작성"} 중...` : isEditMode ? "수정 완료" : "작성 완료"}
        </button>
        {message ? (
          <p className="text-xs text-zinc-500">{message}</p>
        ) : (
          <p className="text-xs text-zinc-500">
            {isEditMode
              ? "수정한 내용은 즉시 게시글에 반영됩니다."
              : "작성한 글은 바로 피드에 반영됩니다."}
          </p>
        )}
      </div>
    </main>
  );
}
