 "use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AppMenu() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
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
    <div className="fixed right-6 top-6 z-50 flex items-center gap-2">
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
          <Link
            className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm"
            href="/profile"
          >
            {profileLabel}
          </Link>
          <button
            className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm"
            type="button"
            onClick={() => {
              void onSignOut();
            }}
          >
            로그아웃
          </button>
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
