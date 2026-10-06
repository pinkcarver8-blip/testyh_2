"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  AddIcon,
  AttachIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClassIcon,
  CloseIcon,
  CollapseAllIcon,
  ExpandAllIcon,
  CommentIcon,
  DeleteIcon,
  EditIcon,
  ExitIcon,
  HtmlFileIcon,
  FolderIcon,
  LinkIcon,
  MenuIcon,
  MoveIcon,
  SettingsIcon,
  UserIcon,
} from "./icons";

type Attachment = { name: string; path: string; size: number };
type Post = {
  id: number;
  title: string;
  content: string;
  attachments: Attachment[];
  userId: string;
  ownerEmail: string;
  isNotice: boolean;
};
type Board = { id: number; name: string; isPublic: boolean };
type Comment = {
  id: number;
  userId: string;
  author: string;
  content: string;
  createdAt: string;
};

const supabase = createClient();
const POST = "post";
const BOARD = "board";
const BUCKET = "post-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
// 이미지로 취급할 확장자 (본문에서 미리보기로 표시)
const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "jpe",
  "jfif",
  "pjpeg",
  "pjp",
  "png",
  "apng",
  "gif",
  "webp",
  "avif",
  "bmp",
  "dib",
  "ico",
  "cur",
  "svg",
  "svgz",
  "tif",
  "tiff",
  "heic",
  "heif",
  "jxl",
  "jp2",
  "j2k",
  "jpf",
  "jpx",
  "psd",
  "raw",
  "arw",
  "cr2",
  "nef",
  "dng",
  "orf",
  "rw2",
  "tga",
  "pcx",
  "ppm",
  "pgm",
  "pbm",
  "pnm",
  "xbm",
];

function isImageFile(name: string) {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return IMAGE_EXTENSIONS.includes(ext);
}
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// 본문 속 http(s) 링크를 클릭 가능한 링크로 표시
function renderContent(text: string) {
  return text.split(URL_PATTERN).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ij-link underline"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

const TAB_SIZE = 4;

// IntelliJ 에디터 스타일 본문: 행 번호(거터), 거터 구분선, 들여쓰기(부모-자식) 가이드
function CodeView({ text }: { text: string }) {
  const lines = text.split("\n");

  // 줄별 들여쓰기 칸 수 (빈 줄은 null)
  const columns = lines.map((line) => {
    if (line.trim() === "") return null;
    const indent = /^[ \t]*/.exec(line)![0];
    return Array.from(indent).reduce(
      (n, ch) => n + (ch === "\t" ? TAB_SIZE : 1),
      0,
    );
  });

  // IntelliJ 들여쓰기 가이드: 자식 줄(부모보다 더 들여쓴 줄)마다 부모 줄의 시작 칸에 세로선
  // 예) 1행 "a" 아래 2행 " b" → 2행에 0칸 위치 세로선
  const guides: number[][] = [];
  const stack: number[] = [];
  columns.forEach((col, i) => {
    if (col === null) {
      guides[i] = [];
      return;
    }
    while (stack.length > 0 && stack[stack.length - 1] >= col) stack.pop();
    guides[i] = [...stack];
    stack.push(col);
  });
  // 빈 줄: 앞뒤 줄이 함께 지나가는 가이드는 이어서 그린다
  for (let i = 0; i < lines.length; i++) {
    if (columns[i] !== null) continue;
    let p = i - 1;
    while (p >= 0 && columns[p] === null) p--;
    let n = i + 1;
    while (n < lines.length && columns[n] === null) n++;
    if (p >= 0 && n < lines.length)
      guides[i] = guides[n].filter(
        (c) => guides[p].includes(c) || columns[p] === c,
      );
  }

  return (
    <div className="font-mono leading-6" style={{ tabSize: TAB_SIZE }}>
      {lines.map((line, i) => (
        <div key={i} className="group/line flex hover:bg-[#1b1c1f]">
          <span className="w-12 shrink-0 select-none border-r border-zinc-200 pr-3 text-right text-[#6f737a] group-hover/line:text-[#a1a3ab]">
            {i + 1}
          </span>
          <span className="relative min-w-0 flex-1 whitespace-pre-wrap break-words pl-4">
            {guides[i].map((col) => (
              <span
                key={col}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px bg-zinc-300"
                style={{ left: `calc(1rem + ${col}ch)` }}
              />
            ))}
            {renderContent(line)}
            {line === "" && "\u200b"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Blog() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  // 글 작성 대상 게시판 (글쓰기 화면의 게시판 선택)
  const [writeBoardId, setWriteBoardId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentEditDraft, setCommentEditDraft] = useState("");
  const commentBusyRef = useRef(false);
  // null: 확인 중, false: 비로그인, true: 로그인
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<number | null>(null);
  const pendingSelectRef = useRef<number | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [linkError, setLinkError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
      setUserId(data.user?.id ?? "");
      setAuthed(!!data.user);
    });
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setPickerOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  // 햄버거 메뉴: 바깥을 누르거나 Esc를 누르면 닫는다
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // 블로그 제목: public 게시판의 최신 공지 게시물로 이동 (공지가 없으면 최신 게시물)
  function goToLatestPublicPost() {
    setWriting(false);
    setEditingBoardId(null);
    setMoveOpen(false);
    setLinkOpen(false);
    setPickerOpen(false);
    const pub = boards.find((b) => b.isPublic);
    if (!pub) return;
    if (pub.id === boardId) {
      // 이미 public 게시판이면 목록을 펼치고 가장 최신 글(목록 맨 위)을 연다
      setListOpen(true);
      setSelectedId((posts.find((p) => p.isNotice) ?? posts[0])?.id ?? null);
    } else {
      // 다른 게시판이면 public으로 전환 (불러온 뒤 최신 글이 자동 선택됨)
      pendingSelectRef.current = null;
      selectBoard(pub.id);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    async function loadBoards() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoaded(true);
        return;
      }
      // 관리자도 일반 화면에서는 공용 게시판과 본인 게시판만 본다
      const { data, error } = await supabase
        .from(BOARD)
        .select("id, name, is_public")
        .or(`is_public.eq.true,user_id.eq.${user.id}`)
        .order("is_public", { ascending: false })
        .order("id");
      if (error) setError(error.message);
      const rows = (data ?? []).map((r) => ({
        id: r.id as number,
        name: r.name as string,
        isPublic: r.is_public as boolean,
      }));
      setBoards(rows);
      setBoardId(rows[0]?.id ?? null);
      setLoaded(true);
    }
    loadBoards();
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
      .select(
        "id, title, description, attachments, user_id, owner_email, is_notice",
      )
      .eq("board_id", boardId)
      .order("is_notice", { ascending: false })
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
          attachments: (r.attachments ?? []) as Attachment[],
          userId: (r.user_id ?? "") as string,
          ownerEmail: (r.owner_email ?? "") as string,
          isNotice: (r.is_notice ?? false) as boolean,
        }));
        setPosts(rows);
        const pending = pendingSelectRef.current;
        pendingSelectRef.current = null;
        setSelectedId(
          pending !== null && rows.some((r) => r.id === pending)
            ? pending
            : (rows[0]?.id ?? null),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const selected = posts.find((p) => p.id === selectedId) ?? null;

  // 이미지 첨부 파일의 미리보기 주소 (비공개 저장소라 서명된 임시 주소를 사용)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  useEffect(() => {
    setImageUrls({});
    setBrokenImages(new Set());
    const images = (selected?.attachments ?? []).filter((a) =>
      isImageFile(a.name),
    );
    if (images.length === 0) return;
    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        images.map((a) => a.path),
        3600,
      )
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, string> = {};
        data.forEach((d) => {
          if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
        });
        setImageUrls(map);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.attachments]);

  // 다른 게시글로 바뀌면 댓글 영역을 닫고 초기화
  useEffect(() => {
    setCommentsOpen(false);
    setComments([]);
    setCommentDraft("");
    setEditingCommentId(null);
  }, [selectedId]);

  // 댓글 영역을 열면 해당 게시글의 댓글을 불러온다
  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    supabase
      .from("comment")
      .select("id, user_id, author_email, content, create_at")
      .eq("post_id", selectedId)
      .order("id")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          return;
        }
        setComments(
          (data ?? []).map((c) => ({
            id: c.id as number,
            userId: c.user_id as string,
            author: (c.author_email ?? "알 수 없음") as string,
            content: c.content as string,
            createdAt: c.create_at as string,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentDraft.trim();
    if (!text || selectedId === null || commentBusyRef.current) return;
    commentBusyRef.current = true;
    const { data, error } = await supabase
      .from("comment")
      .insert({ post_id: selectedId, content: text })
      .select("id, user_id, author_email, content, create_at")
      .single();
    commentBusyRef.current = false;
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setComments([
      ...comments,
      {
        id: data.id,
        userId: data.user_id,
        author: data.author_email ?? "알 수 없음",
        content: data.content,
        createdAt: data.create_at,
      },
    ]);
    setCommentDraft("");
  }

  async function saveComment(id: number) {
    const text = commentEditDraft.trim();
    if (!text || commentBusyRef.current) return;
    commentBusyRef.current = true;
    const { error } = await supabase
      .from("comment")
      .update({ content: text })
      .eq("id", id);
    commentBusyRef.current = false;
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setComments(
      comments.map((c) => (c.id === id ? { ...c, content: text } : c)),
    );
    setEditingCommentId(null);
  }

  async function deleteComment(id: number) {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    const { error } = await supabase.from("comment").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setComments(comments.filter((c) => c.id !== id));
  }

  function selectBoard(id: number) {
    setBoardId(id);
    setListOpen(true);
    setWriting(false);
    setEditingBoardId(null);
  }

  // 현재 게시판 제목을 누르면 글 목록을 접고 펼친다
  function toggleBoard(id: number) {
    if (id === boardId) {
      setListOpen(!listOpen);
    } else {
      selectBoard(id);
    }
  }

  function startCreatingBoard() {
    setEditingBoardId(null);
    setNameDraft("새 게시판");
    setCreatingBoard(true);
  }

  async function createBoard() {
    const name = nameDraft.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from(BOARD)
      .insert({ name })
      .select("id, name, is_public")
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setBoards([
      ...boards,
      { id: data.id, name: data.name, isPublic: data.is_public },
    ]);
    setCreatingBoard(false);
    selectBoard(data.id);
  }

  async function saveName(id: number) {
    const next = nameDraft.trim();
    if (next) {
      const { error } = await supabase
        .from(BOARD)
        .update({ name: next })
        .eq("id", id);
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
    const files = posts.find((p) => p.id === id)?.attachments ?? [];
    if (files.length > 0)
      await supabase.storage.from(BUCKET).remove(files.map((f) => f.path));
    setError("");
    setPosts(posts.filter((p) => p.id !== id));
    setSelectedId(null);
    setWriting(false);
  }

  function startEditing(post: Post) {
    setWriteBoardId(boardId);
    setPickerOpen(false);
    setTitle(post.title);
    setContent(post.content);
    setAttachments(post.attachments);
    setNewFiles([]);
    setEditingId(post.id);
    setWriting(true);
  }

  function startWriting() {
    setWriteBoardId(boardId);
    setPickerOpen(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setAttachments([]);
    setNewFiles([]);
    setWriting(true);
  }

  function openMoveDialog() {
    setMoveTarget(null);
    setMoveOpen(true);
  }

  async function movePost() {
    if (selected === null || moveTarget === null || moveTarget === boardId)
      return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const { error } = await supabase
      .from(POST)
      .update({ board_id: moveTarget })
      .eq("id", selected.id);
    submittingRef.current = false;
    setSubmitting(false);
    if (error) {
      setError(error.message);
      setMoveOpen(false);
      return;
    }
    setError("");
    setMoveOpen(false);
    pendingSelectRef.current = selected.id;
    selectBoard(moveTarget);
  }

  async function openLinkDialog() {
    let text = "";
    try {
      text = (await navigator.clipboard.readText()).trim();
    } catch {
      // 클립보드 권한이 없으면 빈 입력창으로 연다
    }
    setLinkDraft(/^https?:\/\/\S+$/i.test(text) ? text : "");
    setLinkError("");
    setLinkOpen(true);
  }

  function insertLink(e: React.FormEvent) {
    e.preventDefault();
    const url = linkDraft.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setLinkError(
        "http:// 또는 https://로 시작하는 올바른 링크를 입력해 주세요.",
      );
      return;
    }
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    setContent(content.slice(0, start) + url + content.slice(end));
    setLinkOpen(false);
  }

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const tooBig = picked.filter((f) => f.size > MAX_FILE_SIZE);
    const ok = picked.filter((f) => f.size <= MAX_FILE_SIZE);
    if (tooBig.length > 0) {
      setError(
        `${tooBig.map((f) => f.name).join(", ")}: 파일 용량이 10MB를 초과해 첨부할 수 없습니다.`,
      );
    } else {
      setError("");
    }
    setNewFiles((prev) => [...prev, ...ok]);
  }

  async function downloadAttachment(att: Attachment) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(att.path, 60, { download: att.name });
    if (error || !data) {
      setError("파일을 불러오지 못했습니다.");
      return;
    }
    window.location.href = data.signedUrl;
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    // 요청이 끝나기 전의 중복 제출(더블 클릭, Enter 연타)을 막는다
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await savePost();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function savePost() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    // 새 파일 업로드 (저장 경로는 사용자 폴더 + 랜덤 ID, 원본 이름은 메타데이터로 보관)
    const uploaded: Attachment[] = [];
    for (const file of newFiles) {
      const path = `${user.id}/${crypto.randomUUID()}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) {
        if (uploaded.length > 0)
          await supabase.storage
            .from(BUCKET)
            .remove(uploaded.map((u) => u.path));
        setError(`'${file.name}' 업로드에 실패했습니다.`);
        return;
      }
      uploaded.push({ name: file.name, path, size: file.size });
    }
    const nextAttachments = [...attachments, ...uploaded];

    if (editingId !== null) {
      const { error } = await supabase
        .from(POST)
        .update({
          title: title.trim(),
          description: content,
          attachments: nextAttachments,
        })
        .eq("id", editingId);
      if (error) {
        if (uploaded.length > 0)
          await supabase.storage
            .from(BUCKET)
            .remove(uploaded.map((u) => u.path));
        setError(error.message);
        return;
      }
      // 편집 중 제거한 기존 첨부 파일은 저장소에서도 삭제
      const before = posts.find((p) => p.id === editingId)?.attachments ?? [];
      const removed = before.filter(
        (o) => !attachments.some((k) => k.path === o.path),
      );
      if (removed.length > 0)
        await supabase.storage.from(BUCKET).remove(removed.map((r) => r.path));
      setError("");
      setPosts(
        posts.map((p) =>
          p.id === editingId
            ? {
                ...p,
                title: title.trim(),
                content,
                attachments: nextAttachments,
              }
            : p,
        ),
      );
      setWriting(false);
      return;
    }
    const { data, error } = await supabase
      .from(POST)
      .insert({
        title: title.trim(),
        description: content,
        board_id: writeBoardId,
        attachments: nextAttachments,
      })
      .select("id")
      .single();
    if (error) {
      if (uploaded.length > 0)
        await supabase.storage.from(BUCKET).remove(uploaded.map((u) => u.path));
      setError(error.message);
      return;
    }
    setError("");
    setWriting(false);
    if (writeBoardId !== null && writeBoardId !== boardId) {
      // 다른 게시판에 쓴 경우: 그 게시판으로 이동해서 새 글을 연다
      pendingSelectRef.current = data.id;
      selectBoard(writeBoardId);
      return;
    }
    setPosts([
      {
        id: data.id,
        title: title.trim(),
        content,
        attachments: nextAttachments,
        userId,
        ownerEmail: userEmail,
        isNotice: false,
      },
      ...posts.filter((p) => p.isNotice),
      ...posts.filter((p) => !p.isNotice),
    ]);
    setSelectedId(data.id);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 border-b border-zinc-200">
        <div className="mx-auto flex h-10 w-full max-w-5xl items-center justify-between px-3">
          <div ref={menuRef} className="relative flex items-center gap-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="메뉴"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="메뉴"
              className={`rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-foreground ${
                menuOpen ? "bg-zinc-100 text-foreground" : ""
              }`}
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-40 mt-1 w-48 rounded-md border border-zinc-300 bg-background p-1 shadow-xl"
              >
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-7 items-center gap-2 rounded px-2 font-mono text-[13px] font-normal leading-6 text-foreground hover:bg-selection"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings...
                </Link>
              </div>
            )}
            <Link
              href="/"
              onClick={goToLatestPublicPost}
              className="rounded px-2 py-1 font-bold text-foreground hover:bg-zinc-100"
            >
              hello_world
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {authed === false && (
              <>
                <Link
                  href="/login"
                  className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="rounded bg-primary px-3 py-1 font-medium text-white hover:bg-primary-hover"
                >
                  회원가입
                </Link>
              </>
            )}
            {authed && userEmail && (
              <span className="inline-flex items-center gap-1.5 text-zinc-500">
                <UserIcon className="h-4 w-4" />
                <span>
                  <span className="font-bold text-foreground">{userEmail}</span>
                  로 로그인 되었습니다
                </span>
              </span>
            )}
            {authed && (
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100"
              >
                <ExitIcon className="h-4 w-4" />
                로그아웃
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200">
          <div
            className={`flex h-9 shrink-0 items-center justify-end gap-0.5 px-2 ${authed ? "" : "hidden"}`}
          >
            <button
              onClick={startCreatingBoard}
              aria-label="게시판 추가"
              title="게시판 추가"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-foreground"
            >
              <AddIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setListOpen(!listOpen)}
              aria-label={listOpen ? "모두 접기" : "모두 펼치기"}
              title={listOpen ? "모두 접기" : "모두 펼치기"}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-foreground"
            >
              {listOpen ? (
                <CollapseAllIcon className="h-4 w-4" />
              ) : (
                <ExpandAllIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          <ul className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-1.5 pt-3">
            {boards.map((b, i) => {
              const open = b.id === boardId && listOpen;
              const startsPersonal =
                !b.isPublic && i > 0 && boards[i - 1].isPublic;
              return (
                <Fragment key={b.id}>
                  {startsPersonal && (
                    <li
                      role="separator"
                      className="mx-2 my-1.5 h-px bg-zinc-200"
                    />
                  )}
                  <li>
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
                          className="min-w-0 flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1"
                        />
                        <button className="rounded border border-zinc-300 px-2 hover:bg-zinc-100">
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBoardId(null)}
                          className="rounded border border-zinc-300 px-2 hover:bg-zinc-100"
                        >
                          취소
                        </button>
                      </form>
                    ) : (
                      <div className="group flex h-7 items-center justify-between gap-1 rounded hover:bg-zinc-100">
                        <button
                          onClick={() => toggleBoard(b.id)}
                          aria-expanded={open}
                          className="flex min-w-0 flex-1 items-center gap-1 px-1 text-left"
                        >
                          {open ? (
                            <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                          )}
                          <FolderIcon
                            className={`h-4 w-4 shrink-0 ${
                              b.isPublic ? "text-[#dba73a]" : "text-[#9aa7b0]"
                            }`}
                          />
                          <span className="truncate text-ij-function">
                            {b.name}
                          </span>
                        </button>
                        <div
                          className={`flex shrink-0 items-center pr-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 ${
                            b.isPublic ? "hidden" : ""
                          }`}
                        >
                          <button
                            onClick={() => {
                              setNameDraft(b.name);
                              setEditingBoardId(b.id);
                            }}
                            aria-label="게시판 이름 수정"
                            title="게시판 이름 수정"
                            className="rounded p-1 text-zinc-500 hover:text-foreground"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteBoard(b)}
                            aria-label="게시판 삭제"
                            title="게시판 삭제"
                            className="rounded p-1 text-zinc-500 hover:text-ij-error"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {open && (
                      <ul className="ml-[15px] flex flex-col gap-px border-l border-zinc-200 pl-1">
                        {posts.length === 0 && (
                          <li className="h-7 px-2 leading-7 text-zinc-500">
                            글이 없습니다.
                          </li>
                        )}
                        {(() => {
                          const notices = b.isPublic
                            ? posts.filter((p) => p.isNotice)
                            : [];
                          const normals = b.isPublic
                            ? posts.filter((p) => !p.isNotice)
                            : posts;
                          const row = (p: Post, notice: boolean) => {
                            const active = !writing && p.id === selectedId;
                            return (
                              <li key={p.id}>
                                <button
                                  onClick={() => {
                                    setSelectedId(p.id);
                                    setWriting(false);
                                  }}
                                  className={`flex h-7 w-full items-center gap-1.5 rounded px-2 text-left ${
                                    active
                                      ? "bg-selection"
                                      : "hover:bg-zinc-100"
                                  }`}
                                >
                                  {notice ? (
                                    <ClassIcon className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <HtmlFileIcon className="h-4 w-4 shrink-0" />
                                  )}
                                  <span className="truncate">{p.title}</span>
                                </button>
                              </li>
                            );
                          };
                          return (
                            <>
                              {notices.map((p) => row(p, true))}
                              {notices.length > 0 ? (
                                // 공지(부모) 아래에 일반 글(자식)을 한 단계 들여쓰고 세로선으로 구분
                                <li>
                                  <ul className="ml-[15px] flex flex-col gap-px border-l border-zinc-200 pl-1">
                                    {normals.map((p) => row(p, false))}
                                  </ul>
                                </li>
                              ) : (
                                normals.map((p) => row(p, false))
                              )}
                            </>
                          );
                        })()}
                      </ul>
                    )}
                  </li>
                </Fragment>
              );
            })}
            {creatingBoard && (
              <>
                {boards.length > 0 && boards[boards.length - 1].isPublic && (
                  <li
                    role="separator"
                    className="mx-2 my-1.5 h-px bg-zinc-200"
                  />
                )}
                <li>
                  <form
                    className="flex gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      createBoard();
                    }}
                  >
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Escape" && setCreatingBoard(false)
                      }
                      className="min-w-0 flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1"
                    />
                    <button
                      disabled={nameDraft.trim() === ""}
                      className="rounded border border-zinc-300 px-2 hover:bg-zinc-100 disabled:opacity-40"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatingBoard(false)}
                      className="rounded border border-zinc-300 px-2 hover:bg-zinc-100"
                    >
                      취소
                    </button>
                  </form>
                </li>
              </>
            )}
          </ul>

          {/* 게시판 목록 스크롤과 무관하게 항상 사이드바 맨 아래 가운데에 고정 */}
          <div
            className={`mb-16 mt-4 flex shrink-0 justify-center ${authed ? "" : "hidden"}`}
          >
            <button
              onClick={startWriting}
              disabled={boardId === null}
              className="rounded bg-primary px-6 py-1.5 font-medium text-white hover:bg-primary-hover disabled:opacity-40"
            >
              글쓰기
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          {/* 에디터 탭 */}
          <div className="flex h-9 shrink-0 items-stretch border-b border-zinc-200">
            {(writing || selected) && (
              <div className="flex items-center gap-2 border-b-[3px] border-primary px-3">
                {!writing && selected?.isNotice ? (
                  <ClassIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <HtmlFileIcon className="h-4 w-4 shrink-0" />
                )}
                <span className="max-w-[16rem] truncate">
                  {writing
                    ? title || (editingId !== null ? "글 수정" : "새 글")
                    : selected?.title}
                </span>
                <button
                  onClick={() =>
                    writing ? setWriting(false) : setSelectedId(null)
                  }
                  aria-label="탭 닫기"
                  title="닫기"
                  className="rounded p-0.5 text-zinc-500 hover:bg-zinc-100 hover:text-foreground"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-3">
            {error && (
              <p className="mb-4 text-center text-sm text-ij-error">{error}</p>
            )}
            {writing ? (
              <form
                onSubmit={submitPost}
                className="flex max-w-3xl flex-col gap-3"
              >
                <div
                  ref={pickerRef}
                  className="relative flex items-center gap-2"
                >
                  <span className="text-zinc-500">게시판</span>
                  <button
                    type="button"
                    disabled={editingId !== null}
                    onClick={() => setPickerOpen(!pickerOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={pickerOpen}
                    title={
                      editingId !== null
                        ? "수정 중에는 게시판을 바꿀 수 없습니다"
                        : "게시판 선택"
                    }
                    className="inline-flex items-center gap-1.5 rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100 disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <FolderIcon
                      className={`h-4 w-4 shrink-0 ${
                        boards.find((b) => b.id === writeBoardId)?.isPublic
                          ? "text-[#dba73a]"
                          : "text-[#9aa7b0]"
                      }`}
                    />
                    <span className="text-ij-function">
                      {boards.find((b) => b.id === writeBoardId)?.name ??
                        "게시판 선택"}
                    </span>
                    {editingId === null && (
                      <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                    )}
                  </button>
                  {pickerOpen && (
                    <ul
                      role="listbox"
                      className="absolute left-12 top-full z-40 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-zinc-300 bg-background p-1 shadow-xl"
                    >
                      {boards.map((b, i) => (
                        <Fragment key={b.id}>
                          {!b.isPublic && i > 0 && boards[i - 1].isPublic && (
                            <li
                              role="separator"
                              className="mx-2 my-1.5 h-px bg-zinc-200"
                            />
                          )}
                          <li>
                            <button
                              type="button"
                              role="option"
                              aria-selected={b.id === writeBoardId}
                              onClick={() => {
                                setWriteBoardId(b.id);
                                setPickerOpen(false);
                              }}
                              className={`flex h-7 w-full items-center gap-2 rounded px-2 text-left ${
                                b.id === writeBoardId
                                  ? "bg-selection"
                                  : "hover:bg-zinc-100"
                              }`}
                            >
                              <FolderIcon
                                className={`h-4 w-4 shrink-0 ${
                                  b.isPublic
                                    ? "text-[#dba73a]"
                                    : "text-[#9aa7b0]"
                                }`}
                              />
                              <span className="min-w-0 flex-1 truncate text-ij-function">
                                {b.name}
                              </span>
                              {b.id === writeBoardId && (
                                <CheckIcon className="h-4 w-4 shrink-0" />
                              )}
                            </button>
                          </li>
                        </Fragment>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  className="rounded border border-zinc-300 bg-transparent px-3 py-2"
                />
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={12}
                  className="rounded border border-zinc-300 bg-transparent px-3 py-2"
                />
                {(attachments.length > 0 || newFiles.length > 0) && (
                  <ul className="flex flex-col gap-1 text-sm">
                    {attachments.map((a) => (
                      <li
                        key={a.path}
                        className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-1.5"
                      >
                        <span className="min-w-0 truncate">
                          {a.name}{" "}
                          <span className="text-zinc-500">
                            ({formatSize(a.size)})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments(
                              attachments.filter((x) => x.path !== a.path),
                            )
                          }
                          className="shrink-0 text-zinc-500 hover:text-ij-error"
                          aria-label={`${a.name} 제거`}
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                    {newFiles.map((file, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-1.5"
                      >
                        <span className="min-w-0 truncate">
                          {file.name}{" "}
                          <span className="text-zinc-500">
                            ({formatSize(file.size)})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewFiles(newFiles.filter((_, j) => j !== i))
                          }
                          className="shrink-0 text-zinc-500 hover:text-ij-error"
                          aria-label={`${file.name} 제거`}
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openLinkDialog}
                      className="inline-flex items-center gap-1.5 rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
                    >
                      <LinkIcon className="h-4 w-4" />
                      링크
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
                    >
                      <AttachIcon className="h-4 w-4" />
                      첨부
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={pickFiles}
                      className="hidden"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={submitting}
                      className="rounded bg-primary hover:bg-primary-hover px-4 py-2 text-sm text-white  disabled:opacity-50"
                    >
                      {editingId !== null ? "저장" : "등록"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWriting(false)}
                      className="rounded border border-zinc-300 px-4 py-2 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </form>
            ) : selected ? (
              <article className="max-w-4xl">
                <div className="mb-11 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-ij-keyword text-2xl font-bold">
                      {selected.title}
                    </h1>
                    {selected.ownerEmail && (
                      <p className="mt-1 text-xs text-zinc-500">
                        작성자 {selected.ownerEmail}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex h-8 shrink-0 items-center gap-2 ${
                      selected.userId === userId ? "" : "hidden"
                    }`}
                  >
                    <button
                      onClick={openMoveDialog}
                      aria-label="이동"
                      title="이동"
                      className="inline-flex h-7 min-w-[3.25rem] items-center justify-center rounded border border-zinc-300 px-3 text-sm hover:bg-zinc-100"
                    >
                      <MoveIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEditing(selected)}
                      className="inline-flex h-7 min-w-[3.25rem] items-center justify-center rounded border border-zinc-300 px-3 text-sm hover:bg-zinc-100"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deletePost(selected.id)}
                      className="inline-flex h-7 min-w-[3.25rem] items-center justify-center rounded border border-zinc-300 px-3 text-sm text-ij-error hover:bg-zinc-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <CodeView text={selected.content} />
                {selected.attachments.some(
                  (a) => isImageFile(a.name) && !brokenImages.has(a.path),
                ) && (
                  <div className="mt-6 flex flex-col gap-4">
                    {selected.attachments
                      .filter(
                        (a) => isImageFile(a.name) && !brokenImages.has(a.path),
                      )
                      .map((a) =>
                        imageUrls[a.path] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={a.path}
                            src={imageUrls[a.path]}
                            alt={a.name}
                            loading="lazy"
                            onError={() =>
                              setBrokenImages((prev) =>
                                new Set(prev).add(a.path),
                              )
                            }
                            className="max-h-[32rem] max-w-full self-start rounded border border-zinc-200"
                          />
                        ) : null,
                      )}
                  </div>
                )}
                {selected.attachments.length > 0 && (
                  <ul className="mt-8 flex flex-col gap-1 border-t border-zinc-200 pt-4 text-sm">
                    <li className="font-medium">첨부 파일</li>
                    {selected.attachments.map((a) => (
                      <li key={a.path}>
                        <button
                          onClick={() => downloadAttachment(a)}
                          className="text-ij-string text-left underline"
                        >
                          {a.name}
                        </button>{" "}
                        <span className="text-zinc-500">
                          ({formatSize(a.size)})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-8 border-t border-zinc-200 pt-4">
                  <button
                    onClick={() => setCommentsOpen(!commentsOpen)}
                    aria-expanded={commentsOpen}
                    className="inline-flex items-center gap-1.5 rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
                  >
                    <CommentIcon className="h-4 w-4" />
                    댓글
                  </button>

                  <div className="mt-4 flex flex-col gap-4">
                    {commentsOpen && (
                      <form
                        onSubmit={addComment}
                        className="flex flex-col gap-2"
                      >
                        <textarea
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="댓글을 입력하세요"
                          rows={3}
                          className="rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm"
                        />
                        <div className="flex justify-end">
                          <button
                            disabled={commentDraft.trim() === ""}
                            className="rounded bg-primary hover:bg-primary-hover px-4 py-2 text-sm text-white  disabled:opacity-40"
                          >
                            작성
                          </button>
                        </div>
                      </form>
                    )}

                    <ul className="flex flex-col gap-2">
                      {comments.map((c) => {
                        const mine = c.userId === userId;
                        const editing = editingCommentId === c.id;
                        return (
                          <li
                            key={c.id}
                            className="rounded border border-zinc-200"
                          >
                            {editing ? (
                              <div className="flex flex-col gap-2 p-3">
                                <textarea
                                  autoFocus
                                  value={commentEditDraft}
                                  onChange={(e) =>
                                    setCommentEditDraft(e.target.value)
                                  }
                                  rows={3}
                                  className="rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => saveComment(c.id)}
                                    disabled={commentEditDraft.trim() === ""}
                                    className="rounded bg-primary hover:bg-primary-hover px-3 py-1 text-sm text-white  disabled:opacity-40"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => setEditingCommentId(null)}
                                    className="rounded border border-zinc-300 px-3 py-1 text-sm"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="p-3">
                                  <span className="block text-xs text-zinc-500">
                                    <span className="text-ij-field font-semibold">
                                      {c.author}
                                    </span>{" "}
                                    ·{" "}
                                    {new Date(c.createdAt).toLocaleString(
                                      "ko-KR",
                                    )}
                                  </span>
                                  <span className="mt-1 block whitespace-pre-wrap text-sm leading-6">
                                    {c.content}
                                  </span>
                                </div>
                                {mine && (
                                  <div className="flex justify-end gap-2 px-3 pb-3">
                                    <button
                                      onClick={() => {
                                        setCommentEditDraft(c.content);
                                        setEditingCommentId(c.id);
                                      }}
                                      className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => deleteComment(c.id)}
                                      className="rounded border border-zinc-300 px-3 py-1 text-sm text-ij-error hover:bg-zinc-100"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </article>
            ) : !loaded || authed === null ? null : authed === false ? (
              // 비로그인 상태 본문: IntelliJ(Java) 구문 강조 색으로 표시
              <code className="block text-center">
                <span className="text-foreground">System</span>
                <span className="text-foreground">.</span>
                <span className="text-ij-field">out</span>
                <span className="text-foreground">.</span>
                <span className="text-ij-function">println</span>
                <span className="text-foreground">(</span>
                <Link
                  href="/login"
                  title="로그인"
                  className="text-ij-string hover:underline"
                >
                  &quot;Hello, World!&quot;
                </Link>
                <span className="text-foreground">);</span>
              </code>
            ) : (
              <p className="text-center text-zinc-500">
                {boardId !== null
                  ? "글을 선택하거나 새 글을 작성하세요."
                  : "게시판이 없습니다. + 버튼으로 게시판을 만들어 주세요."}
              </p>
            )}
          </div>
        </main>
      </div>
      <footer className="shrink-0 border-t border-zinc-200 text-xs text-zinc-500">
        <div className="mx-auto flex h-6 w-full max-w-5xl items-center justify-between px-3">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            hello_world
            {boards.find((b) => b.id === boardId) && (
              <>
                <ChevronRightIcon className="h-3 w-3 shrink-0" />
                {boards.find((b) => b.id === boardId)?.name}
              </>
            )}
            {selected && !writing && (
              <>
                <ChevronRightIcon className="h-3 w-3 shrink-0" />
                {selected.title}
              </>
            )}
          </span>
          <span className="shrink-0">
            {selected && !writing
              ? `${selected.content.split("\n").length}줄 · ${selected.content.length}자 · `
              : ""}
            UTF-8 · LF
          </span>
        </div>
      </footer>
      {moveOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setMoveOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMoveOpen(false)}
        >
          <div
            role="dialog"
            aria-label="게시판 선택"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-background border border-zinc-300 p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">이동할 게시판 선택</h2>
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {boards.map((b, i) => {
                const current = b.id === boardId;
                const chosen = b.id === moveTarget;
                const startsPersonal =
                  !b.isPublic && i > 0 && boards[i - 1].isPublic;
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
                        className={`flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm ${
                          current
                            ? "cursor-not-allowed text-zinc-400"
                            : chosen
                              ? "bg-zinc-200 font-semibold"
                              : "hover:bg-zinc-100"
                        }`}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <FolderIcon
                            className={`h-4 w-4 shrink-0 ${
                              b.isPublic ? "text-[#dba73a]" : "text-[#9aa7b0]"
                            }`}
                          />
                          <span className="text-ij-function truncate">
                            {b.name}
                          </span>
                        </span>
                        {current && (
                          <span className="shrink-0 text-xs">현재 게시판</span>
                        )}
                        {chosen && <CheckIcon className="h-4 w-4 shrink-0" />}
                      </button>
                    </li>
                  </Fragment>
                );
              })}
            </ul>
            {boards.length < 2 && (
              <p className="text-sm text-zinc-500">
                이동할 수 있는 다른 게시판이 없습니다.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={movePost}
                disabled={moveTarget === null || submitting}
                className="rounded bg-primary hover:bg-primary-hover px-4 py-2 text-sm text-white  disabled:opacity-40"
              >
                이동
              </button>
              <button
                onClick={() => setMoveOpen(false)}
                className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      {linkOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setLinkOpen(false)}
        >
          <form
            onSubmit={insertLink}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-background border border-zinc-300 p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">링크 추가</h2>
            <input
              autoFocus
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder="https://"
              className="rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm"
            />
            {linkError && <p className="text-sm text-ij-error">{linkError}</p>}
            <div className="flex justify-end gap-2">
              <button className="rounded bg-primary hover:bg-primary-hover px-4 py-2 text-sm text-white ">
                삽입
              </button>
              <button
                type="button"
                onClick={() => setLinkOpen(false)}
                className="rounded border border-zinc-300 px-4 py-2 text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
