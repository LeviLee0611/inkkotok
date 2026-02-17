import AuthActions from "@/app/auth/AuthActions";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 pb-20 pt-16 md:px-12">
      <header className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold text-zinc-900">로그인 또는 회원가입</h1>
        <p className="mt-2 text-sm text-zinc-600">
          이메일로 로그인하거나 아래 소셜 계정을 선택하세요.
        </p>
      </header>
      <AuthActions />
    </div>
  );
}
