import { getPostById, listComments } from "@/lib/posts";
import { CommentAdminActions, PostAdminActions } from "./AdminActions";
import CommentComposer from "./CommentComposer";

export const runtime = "edge";

type PostDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailProps) {
  const { id } = await params;
  const post = await getPostById(id).catch((error) => {
    console.error("post getPostById failed", error);
    return null;
  });
  const comments = post
    ? await listComments(id, 100).catch((error) => {
        console.error("post listComments failed", error);
        return [];
      })
    : [];

  if (!post) {
    return (
      <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
        <div className="mx-auto w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
          <p className="text-sm text-zinc-600">글을 찾을 수 없습니다.</p>
          <a
            className="mt-4 inline-flex rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
            href="/feed"
          >
            피드로 돌아가기
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold text-[var(--cocoa)]">
          {post.lounge}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          {post.title}
        </h1>
        <p className="text-sm text-zinc-600">
          작성자 · {post.author?.[0]?.display_name ?? post.author_id.slice(0, 6)}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
          <span>공감 32</span>
          <span>댓글 {comments.length}</span>
          <span>방금 전</span>
        </div>
        <PostAdminActions
          postId={id}
          title={post.title}
          lounge={post.lounge}
          body={post.body}
        />
      </header>

      <main className="mx-auto mt-6 w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
        <p className="text-sm leading-7 text-zinc-700">
          {post.body}
        </p>
      </main>

      <section className="mx-auto mt-6 w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink)]">댓글</h2>
          <CommentComposer postId={id} />
        </div>
        <div className="mt-4 grid gap-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-xs text-zinc-600"
            >
              <p className="text-[11px] font-semibold text-[var(--cocoa)]">
                {comment.author?.[0]?.display_name ??
                  comment.author_id.slice(0, 6)}
              </p>
              <p className="mt-1">{comment.body}</p>
              <CommentAdminActions commentId={comment.id} body={comment.body} />
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap gap-3">
        <a
          className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
          href="/feed"
        >
          목록으로
        </a>
        <a
          className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          href="/write"
        >
          비슷한 고민 글쓰기
        </a>
      </footer>
    </div>
  );
}
