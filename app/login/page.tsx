"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  AuthShell,
  Field,
  Separator,
  kakaoButton,
  linkClass,
  primaryButton,
  secondaryButton,
} from "../auth-ui";
import { UserIcon } from "../icons";

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
    <AuthShell
      title="로그인"
      icon={<UserIcon className="h-4 w-4" />}
      error={error}
      onDismissError={() => setError("")}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field
          label="이메일"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
        <Field
          label="비밀번호"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <button disabled={!canSubmit || loading} className={primaryButton}>
            로그인
          </button>
        </div>
      </form>
      <Separator />
      <button type="button" onClick={signInWithKakao} className={kakaoButton}>
        카카오 계정으로 로그인
      </button>
      <div className="flex flex-col gap-1 text-xs text-zinc-500">
        <Link href="/forgot-password" className={linkClass}>
          비밀번호를 잊으셨나요?
        </Link>
        <span>
          계정이 없으신가요?{" "}
          <Link href="/signup" className={linkClass}>
            회원가입
          </Link>
        </span>
      </div>
    </AuthShell>
  );
}
