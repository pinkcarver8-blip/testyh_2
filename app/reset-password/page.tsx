"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

function toKorean(message: string, code?: string) {
  const m = message.toLowerCase();
  if (code === "same_password" || m.includes("different from the old"))
    return "이전과 다른 비밀번호를 입력해 주세요.";
  if (code === "weak_password" || m.includes("password should be"))
    return "비밀번호는 6자 이상이어야 합니다.";
  if (code === "session_not_found" || m.includes("session"))
    return "링크가 만료되었습니다. 비밀번호 찾기를 다시 진행해 주세요.";
  if (m.includes("fetch") || m.includes("network"))
    return "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.";
  return "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const canSubmit = password !== "" && confirm !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(toKorean(error.message, error.code));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded bg-red-600 px-4 py-3 text-sm text-white shadow-lg"
        >
          {error}
        </div>
      )}
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
            className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="새 비밀번호 확인"
            className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          />
          <button
            disabled={!canSubmit || loading}
            className="rounded bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-medium text-white  disabled:opacity-50"
          >
            비밀번호 변경
          </button>
        </form>
        <p className="text-sm text-zinc-500">
          <Link href="/forgot-password" className="underline">
            링크가 만료되었나요? 다시 요청하기
          </Link>
        </p>
      </main>
    </>
  );
}
