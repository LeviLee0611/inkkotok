import WriteForm from "./WriteForm";

export default function WritePage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">글 작성</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          정보와 경험을 작성해보세요
        </h1>
        <p className="text-sm text-zinc-600">
          카테고리를 선택해 정보글 또는 개인 이야기를 올릴 수 있어요.
        </p>
      </header>
      <WriteForm />
    </div>
  );
}
