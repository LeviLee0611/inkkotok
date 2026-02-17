"use client";

import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth-fetch";
import {
  getSupabaseBrowserClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase-browser";

type Provider = "google" | "azure" | "kakao";

const PROVIDERS: Array<{ id: Provider; label: string; ui: "google" | "microsoft" | "apple" }> = [
  { id: "google", label: "Google로 계속", ui: "google" },
  { id: "azure", label: "Microsoft로 계속", ui: "microsoft" },
  { id: "kakao", label: "Apple로 계속", ui: "apple" },
];
const AZURE_LOGIN_HINT = "363CA7E3A9F2D085F027AF91E28207E5";

type AuthState = {
  email: string | null;
  loading: boolean;
};

export default function AuthActions() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [captchaChecked, setCaptchaChecked] = useState(false);
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
          queryParams:
            provider === "azure"
              ? {
                  login_hint: AZURE_LOGIN_HINT,
                }
              : undefined,
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
      if (!captchaChecked) {
        setMessage("캡차 확인 후 계속 진행해주세요.");
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

  const emailActionDisabled = working || !email.trim() || !captchaChecked;

  const renderOAuthIcon = (kind: "google" | "microsoft" | "apple") => {
    if (kind === "google") {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3a9.7 9.7 0 0 0 0 19.4c5.6 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.5H12Z"
          />
          <path
            fill="#34A853"
            d="M2.3 7.9 5.5 10.2a6 6 0 0 1 6.5-4.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3A9.7 9.7 0 0 0 2.3 7.9Z"
          />
          <path
            fill="#4A90E2"
            d="M12 21.7c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-2.7 0-5-1.8-5.8-4.3l-3.3 2.5A9.7 9.7 0 0 0 12 21.7Z"
          />
          <path
            fill="#FBBC05"
            d="M6.2 13.7A6 6 0 0 1 6 12c0-.6.1-1.2.2-1.8L2.9 7.7A9.7 9.7 0 0 0 2.3 12c0 1.6.4 3.2 1.1 4.6l2.8-2.9Z"
          />
        </svg>
      );
    }
    if (kind === "microsoft") {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" fill="#F25022" />
          <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
          <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
          <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M15.5 3.1c0 1.4-.6 2.7-1.5 3.6-.9.9-2 .9-2 .9s-.1-1.4.8-2.3c.8-.9 2.1-1.5 2.7-1.5ZM19.5 17.7c-.5 1.2-.8 1.7-1.4 2.7-.8 1.3-1.9 2.9-3.2 2.9-1.2 0-1.6-.8-3.1-.8s-2 .8-3.2.8c-1.3 0-2.3-1.4-3.1-2.7-2.2-3.3-2.5-7.1-1.1-9.3 1-1.6 2.7-2.5 4.4-2.5 1.3 0 2.5.9 3.1.9.6 0 2-.9 3.5-.8.6 0 2.3.2 3.4 1.8-3 .9-2.6 5.1.7 7Z" />
      </svg>
    );
  };

  return (
    <section
      className="fixed inset-0 z-[60] overflow-y-auto bg-[#090b10] text-zinc-100"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "22px 22px, 44px 44px, 44px 44px",
        backgroundPosition: "0 0, 0 0, 0 0",
      }}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/8 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <span className="text-lg font-semibold text-white" aria-hidden="true">
                잉
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              로그인 또는 회원가입
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              계정에 로그인해 커뮤니티 기능을 계속 이용하세요.
            </p>
          </div>

      {state.loading ? (
            <p className="text-sm text-zinc-300">로그인 상태를 확인하는 중...</p>
      ) : state.email ? (
            <div className="grid gap-3">
              <p className="text-sm text-zinc-200">현재 로그인: {state.email}</p>
              <div className="flex flex-wrap gap-2">
            <button
                  className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={onBootstrap}
            >
              프로필 초기화
            </button>
            <button
                  className="h-11 rounded-xl border border-white/25 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-60"
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
                  className="group flex h-12 items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 text-left text-sm font-medium text-zinc-100 transition hover:bg-white/10 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-60"
              type="button"
              disabled={working}
              onClick={() => onSignIn(provider.id)}
                  aria-label={provider.label}
            >
                  <span className="flex items-center gap-3">
                    <span className="text-white/90">{renderOAuthIcon(provider.ui)}</span>
                    {provider.label}
                  </span>
                  <span className="text-white/40 transition group-hover:text-white/70">→</span>
            </button>
          ))}

              <div className="my-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-xs text-zinc-400">또는</span>
                <div className="h-px flex-1 bg-white/15" />
              </div>

              <div className="grid gap-2">
                <label htmlFor="auth-email" className="text-sm font-medium text-zinc-200">
                  이메일
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="h-12 rounded-xl border border-white/20 bg-white/5 px-3.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-white/45 focus:ring-2 focus:ring-white/20"
                  disabled={working}
                  autoComplete="email"
                  aria-required="true"
                />
              </div>

              <div
                className="rounded-xl border border-dashed border-white/20 bg-white/5 p-3"
                aria-label="Captcha container"
              >
                <label className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={captchaChecked}
                    onChange={(event) => setCaptchaChecked(event.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-white focus:ring-2 focus:ring-white/50"
                    aria-label="캡차 확인"
                  />
                  <span>로봇이 아닙니다 (캡차 영역)</span>
                </label>
              </div>

              <button
                className="mt-1 h-12 w-full rounded-xl bg-white text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-300"
                type="button"
                disabled={emailActionDisabled}
                onClick={onEmailSignIn}
                aria-disabled={emailActionDisabled}
              >
                계속
              </button>
            </div>
      )}

          {message ? <p className="mt-4 text-xs text-zinc-300">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
