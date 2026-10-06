"use client";

import { useState } from "react";

type Post = { id: number; title: string; content: string };

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    title: "첫 번째 글",
    content: "블로그에 오신 것을 환영합니다.\n왼쪽 상단의 글쓰기 버튼으로 새 글을 작성해 보세요.",
  },
];

export default function Blog() {
  const [boardName, setBoardName] = useState("게시판");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(boardName);

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [writing, setWriting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const selected = posts.find((p) => p.id === selectedId) ?? null;

  function saveName() {
    const next = nameDraft.trim();
    if (next) setBoardName(next);
    setEditingName(false);
  }

  function startEditing(post: Post) {
    setTitle(post.title);
    setContent(post.content);
    setEditingId(post.id);
    setWriting(true);
  }

  function startWriting() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setWriting(true);
  }

  function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingId !== null) {
      setPosts(
        posts.map((p) =>
          p.id === editingId ? { ...p, title: title.trim(), content } : p,
        ),
      );
      setWriting(false);
      return;
    }
    const id = Math.max(0, ...posts.map((p) => p.id)) + 1;
    setPosts([{ id, title: title.trim(), content }, ...posts]);
    setSelectedId(id);
    setWriting(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-3">
        <button
          onClick={startWriting}
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80"
        >
          글쓰기
        </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <aside className="w-64 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-4 flex items-center justify-between gap-2">
            {editingName ? (
              <form
                className="flex w-full gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
              >
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="min-w-0 flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                />
                <button className="rounded border border-zinc-300 px-2 text-sm dark:border-zinc-700">
                  저장
                </button>
              </form>
            ) : (
              <>
                <h2 className="truncate text-lg font-semibold">{boardName}</h2>
                <button
                  onClick={() => {
                    setNameDraft(boardName);
                    setEditingName(true);
                  }}
                  className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  이름 수정
                </button>
              </>
            )}
          </div>

          <ul className="flex flex-col gap-1">
            {posts.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setSelectedId(p.id);
                    setWriting(false);
                  }}
                  className={`w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                    !writing && p.id === selectedId
                      ? "bg-zinc-100 font-medium dark:bg-zinc-900"
                      : ""
                  }`}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 p-8">
          {writing ? (
            <form onSubmit={submitPost} className="mx-auto flex max-w-2xl flex-col gap-3">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={12}
                className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
              />
              <div className="flex gap-2">
                <button className="rounded bg-foreground px-4 py-2 text-sm text-background hover:opacity-80">
                  {editingId !== null ? "저장" : "등록"}
                </button>
                <button
                  type="button"
                  onClick={() => setWriting(false)}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                >
                  취소
                </button>
              </div>
            </form>
          ) : selected ? (
            <article className="mx-auto max-w-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold">{selected.title}</h1>
                <button
                  onClick={() => startEditing(selected)}
                  className="shrink-0 rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  수정
                </button>
              </div>
              <p className="whitespace-pre-wrap leading-7">{selected.content}</p>
            </article>
          ) : (
            <p className="text-center text-zinc-500">글을 선택하거나 새 글을 작성하세요.</p>
          )}
        </main>
      </div>
    </div>
  );
}
