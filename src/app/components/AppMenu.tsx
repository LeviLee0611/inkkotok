"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AppMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      const metadata = data.user?.user_metadata as
        | { avatar_url?: string; picture?: string }
        | undefined;
      setAvatar(metadata?.avatar_url ?? metadata?.picture ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      const metadata = session?.user?.user_metadata as
        | { avatar_url?: string; picture?: string }
        | undefined;
      setAvatar(metadata?.avatar_url ?? metadata?.picture ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
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

  const profileLabel = useMemo(() => {
    if (!email) return "";
    return email.split("@")[0] || "프로필";
  }, [email]);

  const onSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  return (
    <div ref={containerRef} className="fixed right-6 top-6 z-50 flex items-center gap-2">
      <Link
        className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm"
        href="/"
      >
        홈
      </Link>
      <Link
        className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm"
        href="/feed"
      >
        피드
      </Link>
      <Link
        className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm"
        href="/settings"
      >
        설정
      </Link>
      {email ? (
        <>
          <button
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white/90 text-xs font-semibold text-[var(--cocoa)] shadow-sm"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="프로필 메뉴 열기"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="프로필 이미지"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{profileLabel.slice(0, 1).toUpperCase()}</span>
            )}
          </button>
          {open ? (
            <div className="absolute right-14 top-11 w-48 rounded-2xl border border-[var(--border-soft)] bg-white/95 p-2 text-xs shadow-lg">
              <p className="truncate px-3 py-2 text-[11px] text-zinc-500">{email}</p>
              <Link
                className="block rounded-xl px-3 py-2 font-semibold text-[var(--ink)] hover:bg-[var(--paper)]"
                href="/profile"
                onClick={() => setOpen(false)}
              >
                프로필 보기
              </Link>
              <Link
                className="block rounded-xl px-3 py-2 font-semibold text-[var(--ink)] hover:bg-[var(--paper)]"
                href="/settings"
                onClick={() => setOpen(false)}
              >
                설정
              </Link>
              <button
                className="mt-1 w-full rounded-xl px-3 py-2 text-left font-semibold text-[var(--cocoa)] hover:bg-[var(--paper)]"
                type="button"
                onClick={() => {
                  setOpen(false);
                  void onSignOut();
                }}
              >
                로그아웃
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <Link
          className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm"
          href="/auth"
        >
          로그인
        </Link>
      )}
      <Link
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm"
        href="/write"
      >
        글쓰기
      </Link>
    </div>
  );
}
