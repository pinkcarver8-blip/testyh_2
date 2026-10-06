"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Post = { id: number; title: string; content: string };
type Board = { id: number; name: string };

const supabase = createClient();
const POST = "post";
const BOARD = "board";

export default function Blog() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    supabase
      .from(BOARD)
      .select("id, name")
      .order("id")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        const rows = (data ?? []) as Board[];
        setBoards(rows);
        setBoardId(rows[0]?.id ?? null);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (boardId === null) {
      setPosts([]);
      setSelectedId(null);
      return;
    }
    let cancelled = false;
    supabase
      .from(POST)
      .select("id, title, description")
      .eq("board_id", boardId)
      .order("id", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
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
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const selected = posts.find((p) => p.id === selectedId) ?? null;

  function selectBoard(id: number) {
    setBoardId(id);
    setWriting(false);
    setEditingBoardId(null);
  }

  async function createBoard() {
    const { data, error } = await supabase
      .from(BOARD)
      .insert({ name: "새 게시판" })
      .select("id, name")
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setBoards([...boards, data as Board]);
    selectBoard(data.id);
    setNameDraft(data.name);
    setEditingBoardId(data.id);
  }

  async function saveName(id: number) {
    const next = nameDraft.trim();
    if (next) {
      const { error } = await supabase.from(BOARD).update({ name: next }).eq("id", id);
      if (error) {
        setError(error.message);
        return;
      }
      setError("");
      setBoards(boards.map((b) => (b.id === id ? { ...b, name: next } : b)));
    }
    setEditingBoardId(null);
  }

  async function deleteBoard(board: Board) {
    if (!confirm(`'${board.name}' 게시판을 삭제할까요?`)) return;
    const { error } = await supabase.from(BOARD).delete().eq("id", board.id);
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    const rest = boards.filter((b) => b.id !== board.id);
    setBoards(rest);
    if (board.id === boardId) {
      setBoardId(rest[0]?.id ?? null);
      setWriting(false);
    }
  }

  async function deletePost(id: number) {
    if (!confirm("이 게시글을 삭제할까요?")) return;
    const { error } = await supabase.from(POST).delete().eq("id", id);
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
        .from(POST)
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
      .from(POST)
      .insert({ title: title.trim(), description: content, board_id: boardId })
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
          disabled={boardId === null}
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
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">게시판</h2>
            <button
              onClick={createBoard}
              aria-label="게시판 추가"
              title="게시판 추가"
              className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>

          <ul className="flex flex-col gap-1">
            {boards.map((b) => (
              <li key={b.id}>
                {editingBoardId === b.id ? (
                  <form
                    className="flex gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveName(b.id);
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
                  <div
                    className={`flex items-center justify-between gap-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                      b.id === boardId ? "bg-zinc-100 dark:bg-zinc-900" : ""
                    }`}
                  >
                    <button
                      onClick={() => selectBoard(b.id)}
                      className={`min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm ${
                        b.id === boardId ? "font-semibold" : ""
                      }`}
                    >
                      {b.name}
                    </button>
                    <div className="flex shrink-0 items-center pr-1">
                      <button
                        onClick={() => {
                          setNameDraft(b.name);
                          setEditingBoardId(b.id);
                        }}
                        aria-label="게시판 이름 수정"
                        title="게시판 이름 수정"
                        className="rounded p-1 text-zinc-500 hover:text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                      <button
                        onClick={() => deleteBoard(b)}
                        aria-label="게시판 삭제"
                        title="게시판 삭제"
                        className="rounded p-1 text-zinc-500 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                      </button>
                    </div>
                  </div>
                )}
                {b.id === boardId && (
                  <ul className="mb-1 ml-3 mt-1 flex flex-col gap-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {posts.length === 0 && (
                      <li className="px-2 py-1 text-xs text-zinc-500">글이 없습니다.</li>
                    )}
                    {posts.map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => {
                            setSelectedId(p.id);
                            setWriting(false);
                          }}
                          className={`w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
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
                )}
              </li>
            ))}
          </ul>
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
            <p className="text-center text-zinc-500">{!loaded ? "" : boardId !== null ? "글을 선택하거나 새 글을 작성하세요." : "게시판이 없습니다. + 버튼으로 게시판을 만들어 주세요."}</p>
          )}
        </main>
      </div>
    </div>
  );
}
