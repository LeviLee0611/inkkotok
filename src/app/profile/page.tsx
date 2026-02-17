"use client";

import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth-fetch";

type ProfileStats = {
  profile?: {
    display_name: string | null;
    email: string | null;
    image_url: string | null;
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
  const [unauthorized, setUnauthorized] = useState(false);
  const [nickname, setNickname] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await authFetch("/api/profile/stats", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled) setUnauthorized(true);
            return;
          }
          if (!cancelled) setData(null);
          return;
        }
        const json = (await res.json()) as ProfileStats;
        if (!cancelled) {
          setData(json);
          setNickname(json.profile?.display_name ?? "");
        }
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

  const onSaveNickname = async () => {
    setNicknameMessage(null);
    if (!nickname.trim()) {
      setNicknameMessage("닉네임을 입력해주세요.");
      return;
    }

    setSavingNickname(true);
    try {
      const res = await authFetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: nickname.trim() }),
      });
      const json = (await res.json().catch(() => null)) as
        | { username?: string; error?: string }
        | null;
      if (!res.ok) {
        setNicknameMessage(json?.error ?? "닉네임 저장에 실패했어요.");
        return;
      }
      const resolved = json?.username ?? nickname.trim();
      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: prev.profile
                ? { ...prev.profile, display_name: resolved }
                : { display_name: resolved, email: null, image_url: null },
            }
          : prev
      );
      setNickname(resolved);
      setNicknameMessage("닉네임이 저장됐어요.");
    } catch {
      setNicknameMessage("닉네임 저장 중 오류가 발생했어요.");
    } finally {
      setSavingNickname(false);
    }
  };

  const onUploadAvatar = async () => {
    setAvatarMessage(null);
    if (!avatarFile) {
      setAvatarMessage("업로드할 이미지를 먼저 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    setSavingAvatar(true);
    try {
      const res = await authFetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json().catch(() => null)) as
        | { imageUrl?: string; error?: string }
        | null;
      if (!res.ok) {
        setAvatarMessage(json?.error ?? "프로필 이미지 업로드에 실패했어요.");
        return;
      }

      const imageUrl = json?.imageUrl ?? null;
      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: prev.profile
                ? { ...prev.profile, image_url: imageUrl }
                : { display_name: null, email: null, image_url: imageUrl },
            }
          : prev
      );
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarMessage("프로필 이미지가 저장됐어요.");
      window.dispatchEvent(
        new CustomEvent("profile-avatar-updated", {
          detail: { imageUrl },
        })
      );
    } catch {
      setAvatarMessage("프로필 이미지 업로드 중 오류가 발생했어요.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const onResetAvatar = async () => {
    setAvatarMessage(null);
    setSavingAvatar(true);
    try {
      const res = await authFetch("/api/profile/avatar", { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok) {
        setAvatarMessage(json?.error ?? "프로필 이미지 초기화에 실패했어요.");
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: prev.profile
                ? { ...prev.profile, image_url: null }
                : { display_name: null, email: null, image_url: null },
            }
          : prev
      );
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarMessage("기본 프로필 이미지로 변경됐어요.");
      window.dispatchEvent(
        new CustomEvent("profile-avatar-updated", {
          detail: { imageUrl: null },
        })
      );
    } catch {
      setAvatarMessage("프로필 이미지 초기화 중 오류가 발생했어요.");
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">프로필</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          내 활동 요약
        </h1>
        <p className="text-sm text-zinc-600">
          Supabase 로그인 계정 기준으로 활동 정보를 보여줍니다.
        </p>
      </header>

      {unauthorized ? (
        <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-zinc-600">로그인 후 프로필을 확인할 수 있어요.</p>
          <a
            className="mt-3 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            href="/auth"
          >
            로그인하러 가기
          </a>
        </section>
      ) : (
        <>
          <section className="mx-auto mt-6 grid w-full max-w-6xl gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
              <p className="text-xs text-zinc-500">닉네임</p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
                {loading ? "불러오는 중..." : data?.profile?.display_name ?? "-"}
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
              <p className="text-xs text-zinc-500">작성한 글</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {loading ? "-" : data?.stats?.posts ?? 0}
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
              <p className="text-xs text-zinc-500">댓글</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {loading ? "-" : data?.stats?.comments ?? 0}
              </p>
            </div>
          </section>

          <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">프로필 사진</p>
            <p className="mt-1 text-xs text-zinc-500">
              기본 이미지를 유지하거나 원하는 사진으로 고정할 수 있어요.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-[var(--paper)]">
                {avatarPreview || data?.profile?.image_url ? (
                  <img
                    src={avatarPreview ?? data?.profile?.image_url ?? ""}
                    alt="프로필 미리보기"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-[var(--cocoa)]">
                    {(data?.profile?.display_name ?? "익명").slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setAvatarFile(file);
                    setAvatarPreview(file ? URL.createObjectURL(file) : null);
                  }}
                  className="text-xs text-zinc-600"
                />
                <button
                  className="h-10 rounded-xl bg-[var(--ink)] px-4 text-xs font-semibold text-white disabled:opacity-60"
                  type="button"
                  disabled={savingAvatar}
                  onClick={() => {
                    void onUploadAvatar();
                  }}
                >
                  {savingAvatar ? "업로드 중..." : "사진 저장"}
                </button>
                <button
                  className="h-10 rounded-xl border border-[var(--border-soft)] bg-white px-4 text-xs font-semibold text-[var(--cocoa)] disabled:opacity-60"
                  type="button"
                  disabled={savingAvatar}
                  onClick={() => {
                    void onResetAvatar();
                  }}
                >
                  기본 이미지로
                </button>
              </div>
            </div>
            {avatarMessage ? <p className="mt-2 text-xs text-zinc-500">{avatarMessage}</p> : null}
          </section>

          <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">닉네임 설정</p>
            <p className="mt-1 text-xs text-zinc-500">
              실명 대신 사용할 닉네임을 설정할 수 있어요.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                className="h-11 rounded-xl border border-[var(--border-soft)] bg-white px-4 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="닉네임 (2~16자)"
              />
              <button
                className="h-11 rounded-xl bg-[var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-60"
                type="button"
                disabled={savingNickname}
                onClick={() => {
                  void onSaveNickname();
                }}
              >
                {savingNickname ? "저장 중..." : "닉네임 저장"}
              </button>
            </div>
            {nicknameMessage ? (
              <p className="mt-2 text-xs text-zinc-500">{nicknameMessage}</p>
            ) : null}
          </section>

          <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">내 이메일</p>
            <p className="mt-2 text-sm text-zinc-600">{data?.profile?.email ?? "-"}</p>
          </section>

          <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">최근 작성 글</p>
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
              <p className="mt-3 text-xs text-zinc-500">아직 작성한 글이 없어요.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
