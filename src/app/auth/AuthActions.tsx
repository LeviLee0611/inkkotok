"use client";

import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth-fetch";
import {
  getSupabaseBrowserClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase-browser";

type Provider = "google" | "azure" | "kakao";

const PROVIDERS: Array<{ id: Provider; label: string }> = [
  { id: "google", label: "Google 계속하기" },
  { id: "azure", label: "Azure 계속하기" },
  { id: "kakao", label: "Kakao 계속하기" },
];

type AuthState = {
  email: string | null;
  loading: boolean;
};

export default function AuthActions() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<AuthState>({ email: null, loading: true });

  useEffect(() => {
    if (!hasSupabasePublicEnv()) {
      setMessage(
        "배포 환경변수(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)를 확인해주세요."
      );
      setState({ email: null, loading: false });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase 클라이언트를 생성할 수 없습니다.");
      setState({ email: null, loading: false });
      return;
    }

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
      if (!supabase) {
        setMessage("Supabase 환경변수가 누락되었습니다.");
        return;
      }
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

  const onEmailSignIn = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const resolvedEmail = email.trim();
      if (!resolvedEmail) {
        setMessage("이메일을 입력해주세요.");
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Supabase 환경변수가 누락되었습니다.");
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("이메일 로그인 링크를 보냈어요. 메일함을 확인해주세요.");
    } catch {
      setMessage("이메일 로그인 요청에 실패했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const onSignOut = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Supabase 환경변수가 누락되었습니다.");
        return;
      }
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
    <section className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {state.loading ? (
        <p className="text-sm text-zinc-600">로그인 상태를 확인하는 중...</p>
      ) : state.email ? (
        <div className="grid gap-3">
          <p className="text-sm text-zinc-700">현재 로그인: {state.email}</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={onBootstrap}
            >
              프로필 초기화
            </button>
            <button
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={onSignOut}
            >
              로그아웃
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="auth-email" className="text-sm font-medium text-zinc-700">
              이메일
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              disabled={working}
            />
            <button
              className="mt-1 h-11 rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={onEmailSignIn}
            >
              이메일로 계속하기
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-500">또는</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <p className="text-xs text-zinc-500">
            계정이 없다면 아래 로그인 방식으로 가입 후 자동 로그인됩니다.
          </p>

          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-left text-sm font-semibold text-zinc-800 disabled:opacity-60"
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
