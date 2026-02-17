"use client";

import { useEffect } from "react";

import { authFetch } from "@/lib/auth-fetch";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => null);
      }

      await authFetch("/api/profile/bootstrap", { method: "POST" }).catch(() => null);
      window.location.replace("/feed");
    };

    void run();
  }, []);

  return (
    <div className="min-h-screen px-6 pb-20 pt-24 md:px-12">
      <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-zinc-600">로그인 처리를 완료하는 중...</p>
      </div>
    </div>
  );
}
