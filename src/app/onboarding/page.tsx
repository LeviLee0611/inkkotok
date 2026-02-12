import UserPanel from "@/app/components/UserPanel";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">
          닉네임 설정
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          먼저 사용할 닉네임을 정해주세요
        </h1>
        <p className="text-sm text-zinc-600">
          닉네임은 커뮤니티에서 보여지는 이름이에요. 부적절한 단어는 사용할 수
          없고, 30일에 1회만 변경할 수 있습니다.
        </p>
      </header>

      <UserPanel />

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
