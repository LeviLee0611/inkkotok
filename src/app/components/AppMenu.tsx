"use client";

import { useEffect, useRef, useState } from "react";
type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type SessionResponse = {
  user?: SessionUser | null;
};

type ProfileResponse = {
  profile?: { display_name: string | null } | null;
};

export default function AppMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", {
          credentials: "include",
        });
        const sessionData = (await sessionRes.json()) as SessionResponse;
        if (cancelled) return;
        setSession(sessionData);

        if (sessionData?.user?.id) {
          const profileRes = await fetch("/api/profile", {
            credentials: "include",
          });
          const profileData = (await profileRes.json()) as ProfileResponse;
          if (!cancelled) setProfile(profileData.profile ?? null);
        }
      } catch {
        if (!cancelled) setSession(null);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    session?.user?.name ||
    session?.user?.email ||
    "계정";

  return (
    <div
      ref={containerRef}
      className="fixed right-6 top-6 z-50 flex items-center"
    >
      {session?.user ? (
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
              window.location.assign("/api/logout?callbackUrl=/");
            }}
          >
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}
