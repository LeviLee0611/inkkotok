"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth-fetch";

export default function PostLikeButton({
  postId,
  initialLikeCount,
}: {
  postId: string;
  initialLikeCount: number;
}) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  const onLike = async () => {
    if (pending) return;
    setPending(true);

    try {
      const res = await authFetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (res.status === 401) {
        window.alert("공감하려면 먼저 로그인해주세요.");
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(data?.error ?? "공감 처리에 실패했습니다.");
        return;
      }

      const data = (await res.json()) as { liked: boolean; likeCount: number };
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        void onLike();
      }}
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${
        liked
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-[var(--border-soft)] bg-white text-zinc-500"
      }`}
      aria-label="게시글 공감"
    >
      <span>{liked ? "❤️" : "🤍"}</span>
      <span>공감 {likeCount}</span>
    </button>
  );
}
