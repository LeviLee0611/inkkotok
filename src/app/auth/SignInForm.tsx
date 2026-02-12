"use client";

import { useState } from "react";

export default function SignInForm() {
  const [loading, setLoading] = useState(false);

  const onGoogleSignIn = async () => {
    setLoading(true);
    // Avoid fetch-based signIn to prevent CORS errors on OAuth redirects.
    window.location.assign("/api/auth/signin/google?callbackUrl=%2Ffeed");
  };

  return (
    <button
      className="w-full rounded-3xl border border-[var(--border-soft)] bg-white/90 px-6 py-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={loading}
      onClick={onGoogleSignIn}
    >
      Google로 로그인
      <p className="mt-1 text-xs text-zinc-500">가장 빠른 시작 방법이에요</p>
    </button>
  );
}
