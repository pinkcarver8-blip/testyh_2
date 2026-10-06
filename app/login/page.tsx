"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

function toKorean(message: string, code?: string) {
  const m = message.toLowerCase();
  if (code === "invalid_credentials" || m.includes("invalid login credentials"))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (code === "email_not_confirmed" || m.includes("not confirmed"))
    return "이메일 인증이 완료되지 않았습니다. 메일을 확인해 주세요.";
  if (code === "over_request_rate_limit" || m.includes("rate limit"))
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (m.includes("fetch") || m.includes("network"))
    return "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.";
  return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const canSubmit = email.trim() !== "" && password !== "";

  async function signInWithKakao() {
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error)
      setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
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
        <h1 className="text-2xl font-bold">로그인</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          />
          <button
            disabled={!canSubmit || loading}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:border dark:border-zinc-600"
          >
            로그인
          </button>
        </form>
        <button
          type="button"
          onClick={signInWithKakao}
          className="rounded bg-[#FEE500] px-4 py-2 text-sm font-medium text-[#191919] hover:opacity-90"
        >
          카카오 계정으로 로그인
        </button>
        <p className="text-sm text-zinc-500">
          <Link href="/forgot-password" className="underline">
            비밀번호를 잊으셨나요?
          </Link>
        </p>
        <p className="text-sm text-zinc-500">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="underline">
            회원가입
          </Link>
        </p>
      </main>
    </>
  );
}
