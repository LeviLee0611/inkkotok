import AuthActions from "@/app/auth/AuthActions";

export default function AuthPage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">로그인</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          Supabase OAuth 로그인
        </h1>
        <p className="text-sm text-zinc-600">
          Google, Azure, Kakao로 로그인할 수 있습니다.
        </p>
      </header>
      <AuthActions />
    </div>
  );
}
