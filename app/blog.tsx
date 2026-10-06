"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Post = { id: number; title: string; content: string };

const supabase = createClient();
const TABLE = "testyh_2";

export default function Blog() {
  const [boardName, setBoardName] = useState("게시판");
  const [boardExists, setBoardExists] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(boardName);

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    supabase
      .from(TABLE)
      .select("id, title, description")
      .order("id", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        const rows = (data ?? []).map((r) => ({
          id: r.id as number,
          title: r.title as string,
          content: (r.description ?? "") as string,
        }));
        setPosts(rows);
        setSelectedId(rows[0]?.id ?? null);
      });
  }, []);

  const selected = posts.find((p) => p.id === selectedId) ?? null;

  function saveName() {
    const next = nameDraft.trim();
    if (next) setBoardName(next);
    setEditingName(false);
  }

  async function deleteBoard() {
    if (!confirm(`'${boardName}' 게시판과 모든 게시글을 삭제할까요?`)) return;
    const { error } = await supabase.from(TABLE).delete().gte("id", 0);
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setBoardExists(false);
    setPosts([]);
    setSelectedId(null);
    setWriting(false);
  }

  function createBoard() {
    setBoardName("게시판");
    setBoardExists(true);
  }

  async function deletePost(id: number) {
    if (!confirm("이 게시글을 삭제할까요?")) return;
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setPosts(posts.filter((p) => p.id !== id));
    setSelectedId(null);
    setWriting(false);
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

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingId !== null) {
      const { error } = await supabase
        .from(TABLE)
        .update({ title: title.trim(), description: content })
        .eq("id", editingId);
      if (error) {
        setError(error.message);
        return;
      }
      setError("");
      setPosts(
        posts.map((p) =>
          p.id === editingId ? { ...p, title: title.trim(), content } : p,
        ),
      );
      setWriting(false);
      return;
    }
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ title: title.trim(), description: content })
      .select("id")
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setPosts([{ id: data.id, title: title.trim(), content }, ...posts]);
    setSelectedId(data.id);
    setWriting(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <button
          onClick={startWriting}
          disabled={!boardExists}
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 disabled:opacity-40"
        >
          글쓰기
        </button>
        <nav className="flex gap-2">
          <Link
            href="/login"
            className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80"
          >
            회원가입
          </Link>
        </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <aside className="w-64 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800">
          {!boardExists ? (
            <button
              onClick={createBoard}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              게시판 만들기
            </button>
          ) : (
          <>
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
                <button
                  onClick={deleteBoard}
                  aria-label="게시판 삭제"
                  title="게시판 삭제"
                  className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-900"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
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
          </>
          )}
        </aside>

        <main className="flex-1 p-8">
          {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}
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
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEditing(selected)}
                    className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deletePost(selected.id)}
                    className="rounded border border-zinc-300 px-3 py-1 text-sm text-red-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap leading-7">{selected.content}</p>
            </article>
          ) : (
            <p className="text-center text-zinc-500">{boardExists ? "글을 선택하거나 새 글을 작성하세요." : "게시판이 없습니다. 게시판을 만들어 주세요."}</p>
          )}
        </main>
      </div>
    </div>
  );
}
