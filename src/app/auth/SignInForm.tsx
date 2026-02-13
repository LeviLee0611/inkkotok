"use client";

import { useState } from "react";
import {
  GoogleAuthProvider,
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
} from "firebase/auth";

import { authFetch } from "@/lib/auth-fetch";
import { firebaseAuth } from "@/lib/firebase-client";

async function syncAuthUser() {
  const res = await authFetch("/api/auth/sync", {
    method: "POST",
    retryOnUnauthorized: true,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "sync_failed");
  }

  return res.json();
}

export default function SignInForm() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onGoogle = async () => {
    setWorking(true);
    setMessage(null);
    try {
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      await syncAuthUser();
      window.location.assign("/feed");
    } catch {
      setMessage("Google 로그인에 실패했어요.");
    } finally {
      setWorking(false);
    }
  };

  const onAnonymous = async () => {
    setWorking(true);
    setMessage(null);
    try {
      await signInAnonymously(firebaseAuth);
      await syncAuthUser();
      window.location.assign("/feed");
    } catch {
      setMessage("익명 시작에 실패했어요.");
    } finally {
      setWorking(false);
    }
  };

  const onLinkGoogle = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const user = firebaseAuth.currentUser;
      if (!user || !user.isAnonymous) {
        setMessage("익명 계정 로그인 상태에서만 Google 연결이 가능해요.");
        return;
      }
      await linkWithPopup(user, new GoogleAuthProvider());
      await syncAuthUser();
      setMessage("Google 계정 연결이 완료됐어요.");
    } catch {
      setMessage("Google 계정 연결에 실패했어요.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="mx-auto mt-6 grid w-full max-w-3xl gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
      <button
        className="w-full rounded-3xl border border-[var(--border-soft)] bg-white/90 px-6 py-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={working}
        onClick={onGoogle}
      >
        Google로 로그인
        <p className="mt-1 text-xs text-zinc-500">기존 이메일 기반 계정 흐름을 그대로 사용해요</p>
      </button>

      <button
        className="w-full rounded-3xl border border-[var(--border-soft)] bg-[var(--paper)] px-6 py-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={working}
        onClick={onAnonymous}
      >
        이메일 없이 시작하기
        <p className="mt-1 text-xs text-zinc-500">바로 커뮤니티 읽기/작성 가능, 나중에 Google 연결 가능</p>
      </button>

      <button
        className="w-full rounded-3xl border border-[var(--border-soft)] bg-white px-6 py-3 text-left text-xs font-semibold text-[var(--cocoa)] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={working}
        onClick={onLinkGoogle}
      >
        익명 계정을 Google 계정으로 업그레이드
      </button>

      {message ? <p className="text-xs text-zinc-500">{message}</p> : null}
    </section>
  );
}
