export default function OnboardingPage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">
          닉네임 설정
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          온보딩 기능 준비중
        </h1>
        <p className="text-sm text-zinc-600">
          기존 로그인/닉네임 설정 코드는 제거되었습니다. Supabase 연동 후 이
          화면에서 닉네임 설정을 다시 연결할 수 있습니다.
        </p>
      </header>

      <div className="mx-auto mt-6 flex w-full max-w-6xl justify-end">
        <a
          className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
          href="/feed"
        >
          나중에 하기
        </a>
      </div>
    </div>
  );
}
