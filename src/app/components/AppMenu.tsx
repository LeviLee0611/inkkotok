"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { authFetch } from "@/lib/auth-fetch";
import { firebaseAuth } from "@/lib/firebase-client";
import { useAuthUser } from "@/lib/use-auth-user";

type ProfileResponse = {
  profile?: { display_name: string | null } | null;
};

export default function AppMenu() {
  const [open, setOpen] = useState(false);
  const { user: authUser } = useAuthUser({ syncOnSignIn: true });
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profileRes = await authFetch("/api/profile", {
          cache: "no-store",
        });
        if (!profileRes.ok) return;
        const profileData = (await profileRes.json()) as ProfileResponse;
        if (!cancelled) setProfile(profileData.profile ?? null);
      } catch {
        if (!cancelled) setProfile(null);
      }
    };

    const onNicknameUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ nickname?: string }>;
      const nickname = customEvent.detail?.nickname?.trim();
      if (!nickname) return;
      setProfile((prev) =>
        prev ? { ...prev, display_name: nickname } : { display_name: nickname }
      );
    };

    if (authUser) {
      void loadProfile();
    }

    window.addEventListener("nickname-updated", onNicknameUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("nickname-updated", onNicknameUpdated);
    };
  }, [authUser]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, []);

  const label =
    profile?.display_name ||
    authUser?.displayName ||
    authUser?.email ||
    "계정";

  return (
    <div
      ref={containerRef}
      className="fixed right-6 top-6 z-50 flex items-center"
    >
      {authUser ? (
        <button
          className="flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-sm"
          type="button"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="max-w-[140px] truncate">{label}</span>
          <span className="text-[10px] text-zinc-400">▼</span>
        </button>
      ) : (
        <a
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm"
          href="/auth"
        >
          로그인
        </a>
      )}

      {open ? (
        <div className="absolute right-0 top-12 w-44 rounded-2xl border border-[var(--border-soft)] bg-white p-2 text-xs text-[var(--ink)] shadow-lg">
          <a
            className="block rounded-xl px-3 py-2 hover:bg-[var(--paper)]"
            href="/profile"
          >
            프로필
          </a>
          <a
            className="block rounded-xl px-3 py-2 hover:bg-[var(--paper)]"
            href="/write"
          >
            글쓰기
          </a>
          <a
            className="block rounded-xl px-3 py-2 hover:bg-[var(--paper)]"
            href="/settings"
          >
            설정
          </a>
          <button
            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-[var(--cocoa)] hover:bg-[var(--paper)]"
            type="button"
            onClick={() => {
              void signOut(firebaseAuth).finally(() => {
                window.location.assign("/");
              });
            }}
          >
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}
