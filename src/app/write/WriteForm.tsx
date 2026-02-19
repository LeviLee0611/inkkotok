"use client";

import { useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { EMOTION_CATEGORIES } from "@/lib/emotions";
import FancySelect from "@/app/components/FancySelect";

const LOUNGES = [
  "신혼부부",
  "잉꼬부부",
  "관계 회복",
  "육아 루틴",
  "재정/자산",
];

const LOUNGE_EMOJI: Record<string, string> = {
  신혼부부: "💍",
  잉꼬부부: "🐦",
  "관계 회복": "🤝",
  "육아 루틴": "🍼",
  "재정/자산": "💰",
};

const CATEGORY_META: Record<number, { emoji: string; hint: string }> = {
  1: { emoji: "💪", hint: "루틴·건강관리" },
  2: { emoji: "👨‍👩‍👧", hint: "육아·가족 이야기" },
  3: { emoji: "📈", hint: "경제·생활 정보" },
  4: { emoji: "🗳️", hint: "의견·투표" },
  5: { emoji: "📝", hint: "일상·경험 공유" },
};

type WriteFormProps = {
  mode?: "create" | "edit";
  postId?: string;
  initialTitle?: string;
  initialLounge?: string;
  initialContent?: string;
  initialCategoryId?: number;
  initialInfoWeight?: number;
};

export default function WriteForm({
  mode = "create",
  postId,
  initialTitle = "",
  initialLounge = LOUNGES[0],
  initialContent = "",
  initialCategoryId = 2,
  initialInfoWeight = 50,
}: WriteFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [lounge, setLounge] = useState(initialLounge);
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [infoWeight, setInfoWeight] = useState(initialInfoWeight);
  const [pollOption1, setPollOption1] = useState("");
  const [pollOption2, setPollOption2] = useState("");
  const [pollOption3, setPollOption3] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isEditMode = mode === "edit";

  const onSubmit = async () => {
    setMessage(null);
    if (!title.trim() || !content.trim()) {
      setMessage("제목과 내용을 모두 입력해주세요.");
      return;
    }
    if (categoryId === 4) {
      const pollOptions = [pollOption1, pollOption2, pollOption3]
        .map((item) => item.trim())
        .filter(Boolean);
      if (pollOptions.length < 2) {
        setMessage("투표 글은 항목을 최소 2개 입력해주세요.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await authFetch(isEditMode && postId ? `/api/posts/${postId}` : "/api/posts", {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          lounge,
          categoryId,
          infoWeight,
          content: content.trim(),
          pollOptions:
            categoryId === 4
              ? [pollOption1, pollOption2, pollOption3].map((item) => item.trim()).filter(Boolean)
              : undefined,
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
          글 카테고리
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EMOTION_CATEGORIES.map((item) => {
              const active = categoryId === item.id;
              const meta = CATEGORY_META[item.id] ?? { emoji: "🗂️", hint: "카테고리" };
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-[var(--accent)]/45 bg-[var(--accent)]/12 text-[var(--ink)]"
                      : "border-[var(--border-soft)] bg-white text-[var(--cocoa)] hover:bg-[var(--paper)]"
                  }`}
                  onClick={() => setCategoryId(item.id)}
                >
                  <p className="text-sm font-semibold">
                    <span className="mr-1.5">{meta.emoji}</span>
                    {item.label}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-zinc-500">{meta.hint}</p>
                </button>
              );
            })}
          </div>
        </label>
        {categoryId === 4 ? (
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            투표 항목
            <input
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="항목 1"
              value={pollOption1}
              onChange={(event) => setPollOption1(event.target.value)}
            />
            <input
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="항목 2"
              value={pollOption2}
              onChange={(event) => setPollOption2(event.target.value)}
            />
            <input
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="항목 3 (선택)"
              value={pollOption3}
              onChange={(event) => setPollOption3(event.target.value)}
            />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          라운지 선택
          <FancySelect
            value={lounge}
            options={LOUNGES.map((item) => ({
              value: item,
              label: item,
              emoji: LOUNGE_EMOJI[item],
            }))}
            onChange={setLounge}
            placeholder="라운지를 선택해 주세요"
          />
          <p className="px-1 text-[11px] font-normal text-zinc-500">
            원하시는 라운지에서 자유롭게 공유해 주세요.
          </p>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          글 성격 게이지
          <div className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={infoWeight}
              onChange={(event) => setInfoWeight(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
              aria-label="글 성격 게이지"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
              <span className="text-zinc-500">자유주제</span>
              <span className="rounded-full bg-[var(--accent)]/12 px-2.5 py-1 text-[var(--accent)]">
                정보기반 {infoWeight}%
              </span>
            </div>
          </div>
          <p className="px-1 text-[11px] font-normal text-zinc-500">
            작성 글이 어느 쪽에 가까운지 대략 표시해 주세요.
          </p>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          제목
          <input
            className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
            placeholder="제목을 짧고 명확하게 적어보세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
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
            </div>
            <div className="p-3 sm:p-4">
              <textarea
                className="min-h-[300px] w-full rounded-2xl border border-amber-100/90 bg-white/92 px-4 py-4 text-[15px] leading-7 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-amber-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(251,191,36,0.16)] sm:min-h-[340px]"
                placeholder="정보 정리, 경험 공유, 질문 등 원하는 내용을 자유롭게 적어보세요."
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
