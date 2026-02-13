"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { authFetch } from "@/lib/auth-fetch";
import { firebaseAuth } from "@/lib/firebase-client";

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type ProfileResponse = {
  profile?: {
    id: string;
    display_name: string | null;
    email: string | null;
    image_url: string | null;
  } | null;
};

type UserPanelProps = {
  redirectTo?: string;
};

export default function UserPanel({ redirectTo }: UserPanelProps) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (authUser) => {
      setLoading(true);
      setMessage(null);

      if (!authUser) {
        if (!cancelled) {
          setSessionUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setSessionUser({
          id: authUser.uid,
          name: authUser.displayName,
          email: authUser.email,
          image: authUser.photoURL,
        });
      }

      try {
        const profileRes = await authFetch("/api/profile", {
          cache: "no-store",
        });
        const profileData = (await profileRes.json()) as ProfileResponse;
        if (cancelled || !profileRes.ok) return;
        setProfile(profileData.profile ?? null);
        setUsername(profileData.profile?.display_name ?? "");
      } catch {
        if (!cancelled) {
          setMessage("로그인 정보를 불러오지 못했어요.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const onSave = async () => {
    setMessage(null);
    if (!username.trim()) {
      setMessage("닉네임을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = (await res.json()) as { error?: string; username?: string };

      if (!res.ok) {
        setMessage(data.error ?? "닉네임 저장에 실패했어요.");
        return;
      }

      setMessage("닉네임이 저장됐어요.");
      const resolvedName = data.username ?? username.trim();
      setProfile((prev) =>
        prev ? { ...prev, display_name: resolvedName } : prev
      );
      window.dispatchEvent(
        new CustomEvent("nickname-updated", {
          detail: { nickname: resolvedName },
        })
      );
      if (redirectTo) {
        window.location.assign(redirectTo);
      }
    } catch {
      setMessage("닉네임 저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 text-sm text-zinc-500 shadow-sm">
        로그인 정보를 불러오는 중...
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="mx-auto mt-6 flex w-full max-w-6xl items-center justify-between rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">
            로그인 후 닉네임을 설정할 수 있어요.
          </p>
        <p className="mt-1 text-xs text-zinc-500">
          닉네임은 2~16자, 한글/영문/숫자/밑줄만 가능합니다. 30일에 1회 변경.
        </p>
        </div>
        <a
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          href="/auth"
        >
          로그인하기
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-[var(--paper)]">
            {sessionUser.image ? (
              <img
                src={sessionUser.image}
                alt="프로필 이미지"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {profile?.display_name || "닉네임을 설정해주세요"}
            </p>
            <p className="text-xs text-zinc-500">{sessionUser.email}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          placeholder="닉네임 (2~16자, 한글/영문/숫자/밑줄)"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <button
          className="rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          type="button"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? "저장 중..." : "닉네임 저장"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-xs text-zinc-500">{message}</p>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">
          닉네임 변경은 30일에 1회만 가능합니다.
        </p>
      )}
    </div>
  );
}
