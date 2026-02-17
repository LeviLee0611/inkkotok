export default function ProfilePage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">프로필</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          프로필 기능 준비중
        </h1>
        <p className="text-sm text-zinc-600">
          Supabase 로그인 연동 후 내 활동/닉네임 관리 화면이 연결됩니다.
        </p>
      </header>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
        <p className="text-sm text-zinc-600">
          기존 Firebase 기반 프로필 코드는 제거했습니다.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          새 Supabase 인증 플로우가 준비되면 이 페이지에서 계정 정보를 바로
          보여주도록 연결하면 됩니다.
        </p>
      </section>
    </div>
  );
}
