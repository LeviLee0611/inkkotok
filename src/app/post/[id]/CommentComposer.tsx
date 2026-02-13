"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth-fetch";
import { useAuthUser } from "@/lib/use-auth-user";

export default function CommentComposer({ postId }: { postId: string }) {
  const { user, loading } = useAuthUser({ syncOnSignIn: true });
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
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;

      if (!res.ok) {
        setMessage(data?.error ?? "댓글 작성에 실패했어요.");
        return;
      }

      window.location.reload();
    } catch {
      setMessage("댓글 작성 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <a
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
        href="/auth"
      >
        {loading ? "로그인 확인 중..." : "댓글 작성 (로그인 필요)"}
      </a>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] p-3">
      <textarea
        className="min-h-[88px] w-full rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
        placeholder="댓글을 입력해주세요"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={saving}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          로그인 상태라면 바로 댓글을 남길 수 있어요.
        </p>
        <button
          className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          type="button"
          onClick={onSubmit}
          disabled={saving}
        >
          {saving ? "등록 중..." : "댓글 등록"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-zinc-500">{message}</p> : null}
    </div>
  );
}
