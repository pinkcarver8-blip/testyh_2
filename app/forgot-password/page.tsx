"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

function toKorean(message: string, code?: string) {
  const m = message.toLowerCase();
  if (
    code === "over_email_send_rate_limit" ||
    m.includes("rate limit") ||
    m.includes("seconds")
  )
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "email_address_invalid" || m.includes("invalid"))
    return "올바른 이메일 형식이 아닙니다.";
  if (m.includes("fetch") || m.includes("network"))
    return "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.";
  return "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const canSubmit = email.trim() !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
      },
    );
    setLoading(false);
    if (error) {
      setError(toKorean(error.message, error.code));
      return;
    }
    setSentTo(email.trim());
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
        <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
        {sentTo ? (
          <div className="flex flex-col gap-3 rounded border border-zinc-300 p-4 text-sm dark:border-zinc-700">
            <p>
              <span className="font-medium">{sentTo}</span>(으)로 비밀번호
              재설정 링크를 보냈습니다. 메일의 링크를 눌러 새 비밀번호를 설정해
              주세요.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-zinc-500">
              가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
            />
            <button
              disabled={!canSubmit || loading}
              className="rounded bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-medium text-white  disabled:opacity-50"
            >
              비밀번호 리셋 링크 발송
            </button>
          </form>
        )}
        <p className="text-sm text-zinc-500">
          <Link href="/login" className="underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </main>
    </>
  );
}
