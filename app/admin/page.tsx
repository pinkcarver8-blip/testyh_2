"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CommentIcon,
  CheckIcon,
  ClassIcon,
  DeleteIcon,
  EditIcon,
  HtmlFileIcon,
  FolderIcon,
  MoveIcon,
  ShieldIcon,
} from "../icons";

const supabase = createClient();
const BUCKET = "post-attachments";

type Board = {
  id: number;
  name: string;
  ownerEmail: string;
  isPublic: boolean;
};
type Attachment = { name: string; path: string; size: number };
type Post = {
  id: number;
  boardId: number | null;
  title: string;
  content: string;
  ownerEmail: string;
  attachments: Attachment[];
  isNotice: boolean;
};
type Comment = {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
};
type Dialog =
  | { kind: "comment"; comment: Comment }
  | { kind: "rename"; board: Board }
  | { kind: "edit"; post: Post }
  | { kind: "move"; post: Post }
  | null;

const UNASSIGNED = 0;

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [moveTarget, setMoveTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [commentDraft, setCommentDraft] = useState("");

  useEffect(() => {
    async function load() {
      const { data: admin } = await supabase.rpc("is_admin");
      if (admin !== true) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      const [b, p, c] = await Promise.all([
        supabase
          .from("board")
          .select("id, name, owner_email, is_public")
          .order("id"),
        supabase
          .from("post")
          .select(
            "id, board_id, title, description, owner_email, attachments, is_notice",
          )
          .order("id", { ascending: false }),
        supabase
          .from("comment")
          .select("id, post_id, author_email, content, create_at")
          .order("id"),
      ]);
      if (b.error || p.error || c.error) {
        setError((b.error ?? p.error ?? c.error)!.message);
        return;
      }
      setComments(
        (c.data ?? []).map((r) => ({
          id: r.id as number,
          postId: r.post_id as number,
          author: (r.author_email ?? "알 수 없음") as string,
          content: r.content as string,
          createdAt: r.create_at as string,
        })),
      );
      setBoards(
        (b.data ?? []).map((r) => ({
          id: r.id as number,
          name: r.name as string,
          ownerEmail: (r.is_public
            ? "공용"
            : (r.owner_email ?? "알 수 없음")) as string,
          isPublic: r.is_public as boolean,
        })),
      );
      setPosts(
        (p.data ?? []).map((r) => ({
          id: r.id as number,
          boardId: (r.board_id ?? null) as number | null,
          title: r.title as string,
          content: (r.description ?? "") as string,
          ownerEmail: (r.owner_email ?? "알 수 없음") as string,
          attachments: (r.attachments ?? []) as Attachment[],
          isNotice: (r.is_notice ?? false) as boolean,
        })),
      );
    }
    load();
  }, []);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const sortedBoards = [...boards].sort(
    (a, b) =>
      Number(b.isPublic) - Number(a.isPublic) ||
      a.ownerEmail.localeCompare(b.ownerEmail) ||
      a.id - b.id,
  );
  const unassigned = posts.filter((p) => p.boardId === null);

  function toggle(id: number) {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  }

  function openRename(board: Board) {
    setNameDraft(board.name);
    setDialog({ kind: "rename", board });
  }
  function openEdit(post: Post) {
    setTitleDraft(post.title);
    setContentDraft(post.content);
    setDialog({ kind: "edit", post });
  }
  function toggleComments(postId: number) {
    const next = new Set(openComments);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    setOpenComments(next);
  }
  function openCommentEdit(comment: Comment) {
    setCommentDraft(comment.content);
    setDialog({ kind: "comment", comment });
  }
  function openMove(post: Post) {
    setMoveTarget(null);
    setDialog({ kind: "move", post });
  }

  async function run(action: () => Promise<string | null>) {
    if (busy) return;
    setBusy(true);
    const message = await action();
    setBusy(false);
    if (message) setError(message);
    else setDialog(null);
  }

  const renameBoard = (board: Board) =>
    run(async () => {
      const name = nameDraft.trim();
      if (!name) return "게시판 이름을 입력해 주세요.";
      const { error } = await supabase
        .from("board")
        .update({ name })
        .eq("id", board.id);
      if (error) return error.message;
      setBoards(boards.map((b) => (b.id === board.id ? { ...b, name } : b)));
      return null;
    });

  const savePost = (post: Post) =>
    run(async () => {
      const title = titleDraft.trim();
      if (!title) return "제목을 입력해 주세요.";
      const { error } = await supabase
        .from("post")
        .update({ title, description: contentDraft })
        .eq("id", post.id);
      if (error) return error.message;
      setPosts(
        posts.map((p) =>
          p.id === post.id ? { ...p, title, content: contentDraft } : p,
        ),
      );
      return null;
    });

  const movePost = (post: Post) =>
    run(async () => {
      if (moveTarget === null) return null;
      const { error } = await supabase
        .from("post")
        .update({ board_id: moveTarget })
        .eq("id", post.id);
      if (error) return error.message;
      setPosts(
        posts.map((p) =>
          p.id === post.id ? { ...p, boardId: moveTarget } : p,
        ),
      );
      return null;
    });

  async function deleteBoard(board: Board) {
    if (
      !confirm(
        `'${board.name}' (${board.ownerEmail}) 게시판을 삭제할까요?\n게시글은 삭제되지 않고 '미분류'로 이동합니다.`,
      )
    )
      return;
    const { error } = await supabase.from("board").delete().eq("id", board.id);
    if (error) {
      setError(error.message);
      return;
    }
    setBoards(boards.filter((b) => b.id !== board.id));
    setPosts(
      posts.map((p) => (p.boardId === board.id ? { ...p, boardId: null } : p)),
    );
  }

  const saveComment = (comment: Comment) =>
    run(async () => {
      const content = commentDraft.trim();
      if (!content) return "댓글 내용을 입력해 주세요.";
      const { error } = await supabase
        .from("comment")
        .update({ content })
        .eq("id", comment.id);
      if (error) return error.message;
      setComments(
        comments.map((c) => (c.id === comment.id ? { ...c, content } : c)),
      );
      return null;
    });

  async function deleteComment(comment: Comment) {
    if (!confirm(`${comment.author}님의 댓글을 삭제할까요?`)) return;
    const { error } = await supabase
      .from("comment")
      .delete()
      .eq("id", comment.id);
    if (error) {
      setError(error.message);
      return;
    }
    setComments(comments.filter((c) => c.id !== comment.id));
  }

  async function toggleNotice(post: Post) {
    const next = !post.isNotice;
    const { error } = await supabase
      .from("post")
      .update({ is_notice: next })
      .eq("id", post.id);
    if (error) {
      setError(error.message);
      return;
    }
    setPosts(
      posts.map((p) => (p.id === post.id ? { ...p, isNotice: next } : p)),
    );
  }

  async function deletePost(post: Post) {
    if (!confirm(`'${post.title}' (${post.ownerEmail}) 게시글을 삭제할까요?`))
      return;
    const { error } = await supabase.from("post").delete().eq("id", post.id);
    if (error) {
      setError(error.message);
      return;
    }
    if (post.attachments.length > 0)
      await supabase.storage
        .from(BUCKET)
        .remove(post.attachments.map((a) => a.path));
    setPosts(posts.filter((p) => p.id !== post.id));
    setComments(comments.filter((c) => c.postId !== post.id));
  }

  function postRow(p: Post) {
    const mine = comments.filter((c) => c.postId === p.id);
    const open = openComments.has(p.id);
    return (
      <li key={p.id}>
        <div className="group flex h-7 items-center gap-1.5 rounded px-2 hover:bg-zinc-100">
          {p.isNotice ? (
            <ClassIcon className="h-4 w-4 shrink-0" />
          ) : (
            <HtmlFileIcon className="h-4 w-4 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate">{p.title}</span>
          <span className="shrink-0 text-xs text-zinc-500">{p.ownerEmail}</span>
          <button
            onClick={() => toggleComments(p.id)}
            aria-expanded={open}
            aria-label="댓글 보기"
            title="댓글"
            className="inline-flex shrink-0 items-center gap-1 rounded px-1 text-xs text-zinc-500 hover:text-foreground"
          >
            <CommentIcon className="h-4 w-4" />
            {mine.length}
          </button>
          <div className="flex shrink-0 items-center">
            {boards.find((b) => b.id === p.boardId)?.isPublic && (
              <button
                onClick={() => toggleNotice(p)}
                aria-pressed={p.isNotice}
                aria-label={p.isNotice ? "공지 해제" : "공지로 설정"}
                title={p.isNotice ? "공지 해제" : "공지로 설정"}
                className="rounded p-1"
              >
                <ClassIcon
                  className={`h-4 w-4 ${p.isNotice ? "" : "opacity-40 grayscale"}`}
                />
              </button>
            )}
            <button
              onClick={() => openMove(p)}
              aria-label="게시글 이동"
              title="이동"
              className="rounded p-1 text-zinc-500 hover:text-foreground"
            >
              <MoveIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => openEdit(p)}
              aria-label="게시글 수정"
              title="수정"
              className="rounded p-1 text-zinc-500 hover:text-foreground"
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => deletePost(p)}
              aria-label="게시글 삭제"
              title="삭제"
              className="rounded p-1 text-zinc-500 hover:text-ij-error"
            >
              <DeleteIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        {open && (
          <ul className="ml-[15px] flex flex-col gap-px border-l border-zinc-200 pl-1">
            {mine.length === 0 && (
              <li className="h-7 px-2 leading-7 text-zinc-500">
                댓글이 없습니다.
              </li>
            )}
            {mine.map((c) => (
              <li
                key={c.id}
                className="group flex min-h-7 items-center gap-1.5 rounded px-2 hover:bg-zinc-100"
              >
                <CommentIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="min-w-0 flex-1 truncate">{c.content}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {c.author}
                </span>
                <div className="flex shrink-0 items-center">
                  <button
                    onClick={() => openCommentEdit(c)}
                    aria-label="댓글 수정"
                    title="수정"
                    className="rounded p-1 text-zinc-500 hover:text-foreground"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteComment(c)}
                    aria-label="댓글 삭제"
                    title="삭제"
                    className="rounded p-1 text-zinc-500 hover:text-ij-error"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {error && (
        <div
          role="alert"
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded bg-red-600 px-4 py-3 text-white shadow-lg"
        >
          {error}
        </div>
      )}

      <header className="shrink-0 border-b border-zinc-200">
        <div className="mx-auto flex h-10 w-full max-w-5xl items-center gap-2 px-3">
          <Link
            href="/settings"
            aria-label="Settings로 돌아가기"
            title="Settings로 돌아가기"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <ShieldIcon className="h-4 w-4 text-ij-keyword" />
          <h1 className="font-bold">관리자 모드</h1>
          <span className="rounded bg-ij-keyword/20 px-1.5 text-xs text-ij-keyword">
            ADMIN
          </span>
        </div>
      </header>

      <main className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto px-3 pb-8 pt-3">
        {isAdmin === null && <p className="text-zinc-500">확인 중…</p>}

        {isAdmin === false && (
          <div className="flex flex-col gap-2">
            <p className="text-ij-error">관리자 권한이 없는 계정입니다.</p>
            <Link href="/settings" className="text-ij-link underline">
              Settings로 돌아가기
            </Link>
          </div>
        )}

        {isAdmin && (
          <ul className="flex flex-col gap-px">
            {sortedBoards.map((b) => {
              const open = !collapsed.has(b.id);
              const children = posts
                .filter((p) => p.boardId === b.id)
                .sort((x, y) => Number(y.isNotice) - Number(x.isNotice));
              return (
                <li key={b.id}>
                  <div className="group flex h-7 items-center gap-1 rounded px-1 hover:bg-zinc-100">
                    <button
                      onClick={() => toggle(b.id)}
                      aria-expanded={open}
                      className="flex min-w-0 flex-1 items-center gap-1 text-left"
                    >
                      {open ? (
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                      )}
                      <FolderIcon
                        className={`h-4 w-4 shrink-0 ${b.isPublic ? "text-[#dba73a]" : "text-[#9aa7b0]"}`}
                      />
                      <span className="truncate text-ij-function">
                        {b.name}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {b.ownerEmail} · {children.length}
                      </span>
                    </button>
                    <div
                      className={`flex shrink-0 items-center ${b.isPublic ? "hidden" : ""}`}
                    >
                      <button
                        onClick={() => openRename(b)}
                        aria-label="게시판 이름 수정"
                        title="이름 수정"
                        className="rounded p-1 text-zinc-500 hover:text-foreground"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteBoard(b)}
                        aria-label="게시판 삭제"
                        title="삭제"
                        className="rounded p-1 text-zinc-500 hover:text-ij-error"
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {open && (
                    <ul className="ml-[15px] flex flex-col gap-px border-l border-zinc-200 pl-1">
                      {children.length === 0 && (
                        <li className="h-7 px-2 leading-7 text-zinc-500">
                          글이 없습니다.
                        </li>
                      )}
                      {children.map(postRow)}
                    </ul>
                  )}
                </li>
              );
            })}

            {unassigned.length > 0 && (
              <li>
                <div className="flex h-7 items-center gap-1 px-1">
                  <button
                    onClick={() => toggle(UNASSIGNED)}
                    className="flex min-w-0 flex-1 items-center gap-1 text-left"
                  >
                    {collapsed.has(UNASSIGNED) ? (
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                    )}
                    <FolderIcon className="h-4 w-4 shrink-0 text-[#9aa7b0]" />
                    <span className="truncate text-zinc-500">
                      미분류 (게시판 없음)
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {unassigned.length}
                    </span>
                  </button>
                </div>
                {!collapsed.has(UNASSIGNED) && (
                  <ul className="ml-[15px] flex flex-col gap-px border-l border-zinc-200 pl-1">
                    {unassigned.map(postRow)}
                  </ul>
                )}
              </li>
            )}

            {boards.length === 0 && unassigned.length === 0 && (
              <li className="px-2 text-zinc-500">등록된 게시판이 없습니다.</li>
            )}
          </ul>
        )}
      </main>

      {dialog && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDialog(null)}
          onKeyDown={(e) => e.key === "Escape" && setDialog(null)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-zinc-300 bg-background p-6 shadow-xl"
          >
            {dialog.kind === "rename" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  renameBoard(dialog.board);
                }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-lg font-semibold">게시판 이름 수정</h2>
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="rounded border border-zinc-300 bg-transparent px-3 py-2"
                />
                <div className="flex justify-end gap-2">
                  <button
                    disabled={busy || nameDraft.trim() === ""}
                    className="rounded bg-primary px-4 py-1.5 text-white hover:bg-primary-hover disabled:opacity-40"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="rounded border border-zinc-300 px-4 py-1.5 hover:bg-zinc-100"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}

            {dialog.kind === "comment" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveComment(dialog.comment);
                }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-lg font-semibold">댓글 수정</h2>
                <p className="text-xs text-zinc-500">
                  작성자 {dialog.comment.author}
                </p>
                <textarea
                  autoFocus
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={5}
                  className="rounded border border-zinc-300 bg-transparent px-3 py-2"
                />
                <div className="flex justify-end gap-2">
                  <button
                    disabled={busy || commentDraft.trim() === ""}
                    className="rounded bg-primary px-4 py-1.5 text-white hover:bg-primary-hover disabled:opacity-40"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="rounded border border-zinc-300 px-4 py-1.5 hover:bg-zinc-100"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}

            {dialog.kind === "edit" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  savePost(dialog.post);
                }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-lg font-semibold">게시글 수정</h2>
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  placeholder="제목"
                  className="rounded border border-zinc-300 bg-transparent px-3 py-2"
                />
                <textarea
                  value={contentDraft}
                  onChange={(e) => setContentDraft(e.target.value)}
                  rows={8}
                  placeholder="내용"
                  className="rounded border border-zinc-300 bg-transparent px-3 py-2"
                />
                <div className="flex justify-end gap-2">
                  <button
                    disabled={busy || titleDraft.trim() === ""}
                    className="rounded bg-primary px-4 py-1.5 text-white hover:bg-primary-hover disabled:opacity-40"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="rounded border border-zinc-300 px-4 py-1.5 hover:bg-zinc-100"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}

            {dialog.kind === "move" && (
              <>
                <h2 className="text-lg font-semibold">이동할 게시판 선택</h2>
                <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                  {sortedBoards.map((b, i) => {
                    const current = b.id === dialog.post.boardId;
                    const chosen = b.id === moveTarget;
                    const startsPersonal =
                      !b.isPublic && i > 0 && sortedBoards[i - 1].isPublic;
                    return (
                      <Fragment key={b.id}>
                        {startsPersonal && (
                          <li
                            role="separator"
                            className="mx-2 my-1.5 h-px bg-zinc-200"
                          />
                        )}
                        <li>
                          <button
                            type="button"
                            disabled={current}
                            onClick={() => setMoveTarget(b.id)}
                            aria-pressed={chosen}
                            className={`flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-left ${
                              current
                                ? "cursor-not-allowed text-zinc-400"
                                : chosen
                                  ? "bg-selection"
                                  : "hover:bg-zinc-100"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <FolderIcon
                                className={`h-4 w-4 shrink-0 ${
                                  b.isPublic
                                    ? "text-[#dba73a]"
                                    : "text-[#9aa7b0]"
                                }`}
                              />
                              <span className="truncate">
                                <span className="text-ij-function">
                                  {b.name}
                                </span>{" "}
                                <span className="text-xs text-zinc-500">
                                  {b.ownerEmail}
                                </span>
                              </span>
                            </span>
                            {current && (
                              <span className="shrink-0 text-xs">
                                현재 게시판
                              </span>
                            )}
                            {chosen && (
                              <CheckIcon className="h-4 w-4 shrink-0" />
                            )}
                          </button>
                        </li>
                      </Fragment>
                    );
                  })}
                </ul>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => movePost(dialog.post)}
                    disabled={moveTarget === null || busy}
                    className="rounded bg-primary px-4 py-1.5 text-white hover:bg-primary-hover disabled:opacity-40"
                  >
                    이동
                  </button>
                  <button
                    onClick={() => setDialog(null)}
                    className="rounded border border-zinc-300 px-4 py-1.5 hover:bg-zinc-100"
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
