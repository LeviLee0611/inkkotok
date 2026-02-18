"use client";

import { useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

type CommentComposerProps = {
  postId: string;
  parentId?: string | null;
  placeholder?: string;
  submitLabel?: string;
  compact?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export default function CommentComposer({
  postId,
  parentId = null,
  placeholder = "댓글을 입력해주세요",
  submitLabel = "댓글 등록",
  compact = false,
  onCancel,
  onSuccess,
}: CommentComposerProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setMessage(null);
    if (!content.trim()) {
      setMessage("댓글 내용을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: content.trim(), parentId }),
      });

      const data = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;

      if (!res.ok) {
        if (res.status === 401) {
          setMessage("로그인 후 댓글을 작성할 수 있어요.");
          return;
        }
        const errorText = (data?.error ?? "").toLowerCase();
        if (errorText.includes("parent_id")) {
          setMessage("대댓글 기능을 쓰려면 comments 테이블에 parent_id 컬럼이 필요해요.");
          return;
        }
        if (errorText.includes("depth")) {
          setMessage("대댓글은 최대 10단계까지만 작성할 수 있어요.");
          return;
        }
        setMessage(data?.error ?? "댓글 작성에 실패했어요.");
        return;
      }

      if (onSuccess) {
        onSuccess();
        return;
      }
      window.location.reload();
    } catch {
      setMessage("댓글 작성 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] ${compact ? "p-2.5" : "p-3"}`}>
      <textarea
        className={`w-full rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-[var(--ink)] ${compact ? "min-h-[72px]" : "min-h-[88px]"}`}
        placeholder={placeholder}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={saving}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">{parentId ? "답글로 등록됩니다." : "로그인 상태에서 댓글이 등록됩니다."}</p>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <button
              className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-2 text-xs font-semibold text-[var(--cocoa)] disabled:opacity-60"
              type="button"
              onClick={onCancel}
              disabled={saving}
            >
              취소
            </button>
          ) : null}
          <button
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            type="button"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "등록 중..." : submitLabel}
          </button>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs text-zinc-500">{message}</p> : null}
    </div>
  );
}
