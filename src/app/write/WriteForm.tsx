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
              className="h-12 w-full appearance-none rounded-2xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,0.97))] px-4 pr-12 text-sm font-semibold text-zinc-700 shadow-[0_8px_22px_rgba(120,53,15,0.08)] outline-none transition focus:border-amber-300 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.18)]"
              value={lounge}
              onChange={(event) => setLounge(event.target.value)}
              aria-label="라운지 선택"
            >
              {LOUNGES.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-amber-700/80">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5.25 7.5L10 12.25L14.75 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <p className="px-1 text-[11px] font-normal text-zinc-500">
            비슷한 상황의 라운지를 고르면 더 잘 공감받을 수 있어요.
          </p>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          내용
          <div className="overflow-hidden rounded-3xl border border-amber-100/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98)_0%,rgba(254,252,245,0.97)_42%,rgba(248,244,235,0.95)_100%)] shadow-[0_18px_45px_rgba(120,53,15,0.09)]">
            <div className="flex items-center justify-between border-b border-amber-100/80 bg-[linear-gradient(90deg,rgba(255,255,255,0.82),rgba(255,251,235,0.78))] px-4 py-2 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-[11px] font-medium text-zinc-500">Private Note</span>
              </div>
              <span className="rounded-full border border-amber-100 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                {content.trim().length}자
              </span>
            </div>
            <div className="p-3 sm:p-4">
              <textarea
                className="min-h-[300px] w-full rounded-2xl border border-amber-100/90 bg-white/92 px-4 py-4 text-[15px] leading-7 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-amber-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(251,191,36,0.16)] sm:min-h-[340px]"
                placeholder="오늘 있었던 일, 내 감정, 상대와의 상황을 차분히 적어보세요."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-normal text-zinc-500">
                  문단을 나눠 쓰면 다른 사람이 더 쉽게 읽을 수 있어요.
                </p>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-700/80">
                  저장 시 즉시 반영
                </span>
              </div>
            </div>
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
