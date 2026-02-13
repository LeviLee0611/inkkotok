"use client";

import { useEffect, useState } from "react";
import UserPanel from "@/app/components/UserPanel";
import { authFetch } from "@/lib/auth-fetch";

type ProfileStats = {
  profile?: {
    display_name: string | null;
    email: string | null;
    image_url: string | null;
    created_at: string | null;
  } | null;
  stats?: {
    posts: number;
    comments: number;
    recentPosts: { id: string; title: string; lounge: string; created_at: string }[];
  } | null;
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await authFetch("/api/profile/stats");
        const json = (await res.json()) as ProfileStats;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">프로필</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          내 활동 요약
        </h1>
        <p className="text-sm text-zinc-600">
          닉네임과 계정 정보를 관리할 수 있어요.
        </p>
      </header>

      <UserPanel />

      <section className="mx-auto mt-6 grid w-full max-w-6xl gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs text-zinc-500">작성한 글</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
            {data?.stats?.posts ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs text-zinc-500">댓글</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
            {data?.stats?.comments ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
          <p className="text-xs text-zinc-500">가입일</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">-</p>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
        <p className="text-sm font-semibold text-[var(--ink)]">
          내가 공유한 글
        </p>
        {loading ? (
          <p className="mt-3 text-xs text-zinc-500">불러오는 중...</p>
        ) : data?.stats?.recentPosts?.length ? (
          <div className="mt-3 grid gap-2">
            {data.stats.recentPosts.map((post) => (
              <a
                key={post.id}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)]"
                href={`/post/${post.id}`}
              >
                <p className="text-xs text-zinc-500">{post.lounge}</p>
                <p className="mt-1 font-semibold">{post.title}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-zinc-500">
            아직 작성한 글이 없어요.
          </p>
        )}
      </section>
    </div>
  );
}
