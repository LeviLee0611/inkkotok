"use client";

import { useEffect, useState } from "react";

const LOUNGES = [
  "신혼 1-3년",
  "30-40대 부부",
  "50+ 동행",
  "관계 회복",
  "육아 루틴",
  "재정/자산",
];

type SessionResponse = {
  user?: {
    id?: string;
    email?: string | null;
  } | null;
};

export default function WriteForm() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [profile, setProfile] = useState<{
    display_name?: string | null;
    nickname_updated_at?: string | null;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [lounge, setLounge] = useState(LOUNGES[0]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });
        const data = (await res.json()) as SessionResponse;
        if (!cancelled) setSession(data);

        if (data?.user?.id) {
          const profileRes = await fetch("/api/profile", {
            credentials: "include",
          });
          const profileData = (await profileRes.json()) as {
            profile?: { display_name?: string | null; nickname_updated_at?: string | null };
          };
          if (!cancelled) {
            setProfile(profileData.profile ?? null);
          }
        }
      } catch {
        if (!cancelled) setMessage("로그인 정보를 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async () => {
    setMessage(null);
    if (!title.trim() || !content.trim()) {
      setMessage("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          lounge,
          content: content.trim(),
        }),
        credentials: "include",
      });

      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
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

  if (loading) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 text-sm text-zinc-500 shadow-sm">
        로그인 정보를 확인 중...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--ink)]">
          글 작성은 로그인 후 가능합니다.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Google 로그인 후 닉네임으로 글을 작성할 수 있어요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            href="/auth"
          >
            로그인하기
          </a>
          <a
            className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
            href="/feed"
          >
            피드 둘러보기
          </a>
        </div>
      </div>
    );
  }

  const needsNickname = !profile?.display_name;

  return (
    <main className="mx-auto mt-8 w-full max-w-4xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
      {needsNickname ? (
        <div className="mb-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--cocoa)]">
          닉네임을 먼저 설정하면 더 잘 보여요.{" "}
          <a className="font-semibold underline" href="/onboarding">
            닉네임 설정하러 가기
          </a>
        </div>
      ) : null}
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          제목
          <input
            className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
            placeholder="고민을 짧게 요약해요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={false}
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
                disabled={false}
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
            disabled={false}
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
          <p className="text-xs text-zinc-500">
            작성 후 바로 피드에 반영됩니다.
          </p>
        )}
      </div>
    </main>
  );
}
