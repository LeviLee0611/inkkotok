"use client";

import { useMemo, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import type { PollRecord } from "@/lib/posts";

export default function PollCard({
  postId,
  initialPoll,
}: {
  postId: string;
  initialPoll: PollRecord;
}) {
  const [poll, setPoll] = useState(initialPoll);
  const [pending, setPending] = useState(false);

  const voted = useMemo(() => Boolean(poll.viewer_option_id), [poll.viewer_option_id]);

  const onVote = async (optionId: string) => {
    if (pending) return;
    setPending(true);
    try {
      const res = await authFetch(`/api/posts/${postId}/poll/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (res.status === 401) {
        window.alert("투표하려면 먼저 로그인해주세요.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(data?.error ?? "투표에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as { poll?: PollRecord };
      if (data.poll) setPoll(data.poll);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mx-auto mt-6 w-full max-w-5xl rounded-[24px] border border-rose-100 bg-rose-50/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-rose-700">선택 투표</p>
        <p className="text-xs text-rose-600">참여 {poll.total_votes}명</p>
      </div>
      <div className="mt-3 grid gap-2">
        {poll.options.map((option) => {
          const active = option.id === poll.viewer_option_id;
          const ratio = poll.total_votes > 0 ? Math.round((option.vote_count / poll.total_votes) * 100) : 0;
          return (
            <button
              key={option.id}
              type="button"
              disabled={pending}
              className={`relative overflow-hidden rounded-2xl border bg-white px-3 py-2 text-left text-sm transition ${
                active ? "border-rose-300" : "border-rose-100"
              }`}
              onClick={() => {
                void onVote(option.id);
              }}
            >
              <span
                className="absolute inset-y-0 left-0 bg-rose-100/70"
                style={{ width: `${ratio}%` }}
              />
              <span className="relative z-10 flex items-center justify-between">
                <span>{option.label}</span>
                <span className="text-xs text-zinc-500">
                  {option.vote_count}표 ({ratio}%)
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {!voted ? (
        <p className="mt-2 text-[11px] text-zinc-500">투표 후에도 다른 항목으로 변경할 수 있어요.</p>
      ) : null}
    </section>
  );
}
