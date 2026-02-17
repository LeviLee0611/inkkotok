"use client";

import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth-fetch";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Provider = "google" | "azure" | "kakao";

const PROVIDERS: Array<{ id: Provider; label: string }> = [
  { id: "google", label: "Google로 로그인" },
  { id: "azure", label: "Azure로 로그인" },
  { id: "kakao", label: "Kakao로 로그인" },
];

type AuthState = {
  email: string | null;
  loading: boolean;
};

export default function AuthActions() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<AuthState>({ email: null, loading: true });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setState({
        email: data.user?.email ?? null,
        loading: false,
      });
    });
  }, []);

  const onSignIn = async (provider: Provider) => {
    setWorking(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage(error.message);
      }
    } catch {
      setMessage("로그인 시작에 실패했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const onSignOut = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch {
      setMessage("로그아웃에 실패했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const onBootstrap = async () => {
    setMessage(null);
    const res = await authFetch("/api/profile/bootstrap", { method: "POST" }).catch(
      () => null
    );
    if (!res?.ok) {
      setMessage("프로필 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setMessage("프로필 초기화가 완료되었습니다.");
  };

  return (
    <section className="mx-auto mt-6 w-full max-w-3xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
      {state.loading ? (
        <p className="text-sm text-zinc-600">로그인 상태를 확인하는 중...</p>
      ) : state.email ? (
        <div className="grid gap-3">
          <p className="text-sm text-zinc-600">현재 로그인: {state.email}</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={onBootstrap}
            >
              프로필 초기화
            </button>
            <button
              className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)] disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={onSignOut}
            >
              로그아웃
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-left text-sm font-semibold text-[var(--ink)] disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={() => onSignIn(provider.id)}
            >
              {provider.label}
            </button>
          ))}
        </div>
      )}

      {message ? <p className="mt-3 text-xs text-zinc-500">{message}</p> : null}
    </section>
  );
}
