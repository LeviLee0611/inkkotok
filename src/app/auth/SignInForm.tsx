"use client";

import { useEffect, useState } from "react";

type CsrfResponse = {
  csrfToken?: string;
};

export default function SignInForm() {
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/auth/csrf", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await response.json()) as CsrfResponse;
        if (active) setCsrfToken(data.csrfToken ?? "");
      } catch {
        if (active) setCsrfToken("");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <form action="/api/auth/signin/google" method="post">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <button
        className="w-full rounded-3xl border border-[var(--border-soft)] bg-white/90 px-6 py-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading || !csrfToken}
      >
        Google로 로그인
        <p className="mt-1 text-xs text-zinc-500">
          가장 빠른 시작 방법이에요
        </p>
      </button>
    </form>
  );
}
