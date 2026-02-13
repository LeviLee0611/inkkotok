import SignInForm from "@/app/auth/SignInForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">로그인</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          Firebase Auth로 시작하기
        </h1>
        <p className="text-sm text-zinc-600">
          Google 또는 이메일 없이 익명으로 시작한 뒤, 나중에 계정을 연결할 수 있어요.
        </p>
      </header>
      <SignInForm />
    </div>
  );
}
